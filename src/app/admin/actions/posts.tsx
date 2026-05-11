"use server";

import { createClient } from "@supabase/supabase-js";
import { getAdminClient } from "./core";

/**
 * Verify a user's session and return their user ID.
 * This does NOT require admin/staff role — it's for any authenticated user.
 */
async function verifyUserSession(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  const authClient = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(accessToken);

  if (authError || !user) {
    throw new Error("Unauthorized: Invalid session.");
  }

  return user;
}

type ArchiveItemRow = {
  post_id: string;
  category_id: number | null;
  color: string | null;
  zone: string | null;
  general_description: string | null;
  status: string;
  image_url: string | null;
  reported_by: string | null;
  created_timestamp: string;
  deleted_by: string | null;
  deletion_reason: string | null;
  deleted_at: string | null;
  returned_at: string | null;
  categories: { name: string | null; icon_identifier: string | null } | { name: string | null; icon_identifier: string | null }[] | null;
};

/**
 * User soft-deletes their own post.
 * No deletion reason required — just moves to Purged status.
 */
export async function userDeletePostAction(
  accessToken: string,
  postId: string
) {
  const user = await verifyUserSession(accessToken);
  const adminClient = getAdminClient();

  // Verify ownership
  const { data: item } = await adminClient
    .from("lost_items")
    .select("post_id, reported_by, status")
    .eq("post_id", postId)
    .single();

  if (!item) throw new Error("Post not found.");
  if (item.reported_by !== user.id) throw new Error("You can only delete your own posts.");
  if (item.status === "Purged") throw new Error("This post is already deleted.");

  const { error: updateError } = await adminClient
    .from("lost_items")
    .update({
      status: "Purged",
      deleted_by: user.id,
      deleted_at: new Date().toISOString(),
    })
    .eq("post_id", postId);

  if (updateError) throw new Error(updateError.message);

  await adminClient.from("audit_logs").insert({
    post_id: postId,
    actor_id: null,
    action: "POST_DELETED_BY_USER",
    previous_state: { status: item.status, reported_by: item.reported_by },
    new_state: { status: "Purged", deleted_by: user.id },
  });

  return { success: true };
}

/**
 * Original poster marks their item as returned.
 */
export async function markAsReturnedAction(
  accessToken: string,
  postId: string
) {
  const user = await verifyUserSession(accessToken);
  const adminClient = getAdminClient();

  // Verify ownership
  const { data: item } = await adminClient
    .from("lost_items")
    .select("post_id, reported_by, status")
    .eq("post_id", postId)
    .single();

  if (!item) throw new Error("Post not found.");
  if (item.reported_by !== user.id) throw new Error("Only the original poster can mark as returned.");
  if (item.status === "Returned") throw new Error("This item is already marked as returned.");
  if (item.status === "Purged") throw new Error("Cannot mark a deleted post as returned.");

  const { error: updateError } = await adminClient
    .from("lost_items")
    .update({
      status: "Returned",
      returned_at: new Date().toISOString(),
    })
    .eq("post_id", postId);

  if (updateError) throw new Error(updateError.message);

  await adminClient.from("audit_logs").insert({
    post_id: postId,
    actor_id: null,
    action: "POST_MARKED_RETURNED",
    previous_state: { status: item.status, reported_by: item.reported_by },
    new_state: { status: "Returned", returned_at: new Date().toISOString() },
  });

  return { success: true };
}

/**
 * Fetch the user's archived items: deleted (by user or admin) + returned.
 */
export async function fetchUserArchiveAction(accessToken: string) {
  const user = await verifyUserSession(accessToken);
  const adminClient = getAdminClient();

  const { data: items, error } = await adminClient
    .from("lost_items")
    .select(`
      post_id,
      category_id,
      color,
      zone,
      general_description,
      status,
      image_url,
      reported_by,
      created_timestamp,
      deleted_by,
      deletion_reason,
      deleted_at,
      returned_at,
      categories (
        name,
        icon_identifier
      )
    `)
    .eq("reported_by", user.id)
    .in("status", ["Purged", "Returned"])
    .order("last_edited_timestamp", { ascending: false });

  if (error) throw new Error(error.message);

  // Resolve who deleted each item (admin vs self)
  const enriched = ((items ?? []) as ArchiveItemRow[]).map((item) => {
    let archiveLabel: string;
    if (item.status === "Returned") {
      archiveLabel = "Marked as Returned";
    } else if (item.deleted_by && item.deleted_by !== user.id) {
      archiveLabel = "Deleted by Admin";
    } else {
      archiveLabel = "Deleted by You";
    }
    return { ...item, archiveLabel };
  });

  return enriched;
}

// ---------------------------------------------------------------------------
// DUAL-PATH CLAIM SYSTEM — Student-Facing Actions
// ---------------------------------------------------------------------------

/**
 * Submit a claim request for a lost item.
 *
 * Automatically determines the flow type based on the item's current_possession:
 *   - 'With_Finder' → flow_type: 'P2P'  (student-to-student handoff)
 *   - 'In_Office'   → flow_type: 'Office' (pick-up from department office)
 *
 * An optional item description (for blind verification) can also be included.
 */
export async function submitClaimAction(
  accessToken: string,
  postId: string,
  claimantName: string,
  studentId: string,
  itemDescription?: string
) {
  const user = await verifyUserSession(accessToken);
  const adminClient = getAdminClient();
  const normalizedClaimantName = claimantName.trim();
  const normalizedStudentId = studentId.trim();
  const normalizedItemDescription = itemDescription?.trim() || null;

  if (!normalizedClaimantName) {
    throw new Error("Claimant name is required.");
  }

  if (!normalizedStudentId) {
    throw new Error("Student ID is required.");
  }

  // Fetch the item to determine possession state and current status
  const { data: item, error: itemError } = await adminClient
    .from("lost_items")
    .select("post_id, reported_by, status, current_possession")
    .eq("post_id", postId)
    .single();

  if (itemError || !item) throw new Error("Item not found.");
  if (item.reported_by === user.id) throw new Error("You cannot claim your own item.");
  if (["Returned", "Purged", "Released"].includes(item.status)) {
    throw new Error("This item is no longer available for claiming.");
  }

  // Prevent duplicate pending claims from the same claimant
  const { data: existingClaim } = await adminClient
    .from("claim_requests")
    .select("claim_id, status")
    .eq("post_id", postId)
    .eq("claimant_id", user.id)
    .in("status", ["Pending", "Approved"])
    .maybeSingle();

  if (existingClaim) {
    throw new Error("You already have an active claim request for this item.");
  }

  // Determine the claim flow from the item's possession state
  const flowType: "P2P" | "Office" =
    item.current_possession === "With_Finder" ? "P2P" : "Office";

  const { data: claim, error: claimError } = await adminClient
    .from("claim_requests")
    .insert({
      post_id: postId,
      claimant_id: user.id,
      claimant_name: normalizedClaimantName,
      claimant_school_id: normalizedStudentId,
      item_description_verification: normalizedItemDescription,
      flow_type: flowType,
      status: "Pending",
    })
    .select("claim_id")
    .single();

  if (claimError || !claim) throw new Error(claimError?.message ?? "Failed to submit claim.");

  const { error: auditError } = await adminClient.from("audit_logs").insert({
    post_id: postId,
    actor_id: user.id,
    action: "CLAIM_SUBMITTED",
    previous_state: { status: item.status },
    new_state: {
      claim_id: claim.claim_id,
      flow_type: flowType,
      claimant_name: normalizedClaimantName,
      claimant_school_id: normalizedStudentId,
      claim_status: "Pending",
    },
  });

  if (auditError) {
    await adminClient
      .from("claim_requests")
      .delete()
      .eq("claim_id", claim.claim_id);

    throw new Error(`Claim audit logging failed: ${auditError.message}`);
  }

  return { success: true, claimId: claim.claim_id, flowType };
}

/**
 * Finder confirms they have physically handed the item to the owner.
 * Only the original reporter (the finder) can call this action.
 *
 * Calls the finalize_item_handoff PostgreSQL function to atomically:
 *   - Mark the claim as 'Released'
 *   - Update the item status to 'Released'
 *   - Create a structured audit log entry
 */
export async function finalizeP2PReturnAction(
  accessToken: string,
  postId: string,
  claimId: string
) {
  const user = await verifyUserSession(accessToken);
  const adminClient = getAdminClient();

  // Verify the caller is the original finder
  const { data: item } = await adminClient
    .from("lost_items")
    .select("post_id, reported_by, status")
    .eq("post_id", postId)
    .single();

  if (!item) throw new Error("Item not found.");
  if (item.reported_by !== user.id) {
    throw new Error("Only the original finder can confirm a P2P handoff.");
  }
  if (["Returned", "Purged", "Released"].includes(item.status)) {
    throw new Error("This item has already been resolved.");
  }

  // Verify the claim is in the correct state
  const { data: claim } = await adminClient
    .from("claim_requests")
    .select("claim_id, status, flow_type, claimant_name, claimant_school_id")
    .eq("claim_id", claimId)
    .eq("post_id", postId)
    .single();

  if (!claim) throw new Error("Claim request not found.");
  if (claim.flow_type !== "P2P") throw new Error("This action is only valid for P2P claims.");
  if (claim.status !== "Approved") {
    throw new Error("The claim must be approved before the handoff can be confirmed.");
  }

  // Call the atomic database function to finalize the handoff
  const { error: rpcError } = await adminClient.rpc("finalize_item_handoff", {
    target_claim_id: claimId,
    actor_id: user.id,
  });

  if (rpcError) throw new Error(`Handoff finalization failed: ${rpcError.message}`);

  // Supplemental audit log with claimant identity details
  await adminClient.from("audit_logs").insert({
    post_id: postId,
    actor_id: user.id,
    action: "P2P_HANDOFF_CONFIRMED",
    previous_state: { status: item.status, claim_status: claim.status, flow_type: "P2P" },
    new_state: {
      status: "Released",
      claim_id: claimId,
      flow_type: "P2P",
      claimant_name: claim.claimant_name,
      claimant_school_id: claim.claimant_school_id,
      confirmed_by: user.id,
    },
  });

  return { success: true };
}

export async function markClaimReturnedByOwnerAction(
  accessToken: string,
  postId: string,
  claimId: string
) {
  const user = await verifyUserSession(accessToken);
  const adminClient = getAdminClient();
  const returnedAt = new Date().toISOString();
  const autoRejectedNote = "Item marked as returned to another claimant.";

  const { data: item, error: itemError } = await adminClient
    .from("lost_items")
    .select("post_id, reported_by, status")
    .eq("post_id", postId)
    .single();

  if (itemError || !item) throw new Error("Item not found.");
  if (item.reported_by !== user.id) {
    throw new Error("Only the original poster can mark this item as returned.");
  }
  if (["Returned", "Purged", "Released"].includes(item.status)) {
    throw new Error("This item has already been resolved.");
  }

  const { data: claim, error: claimError } = await adminClient
    .from("claim_requests")
    .select("claim_id, post_id, status, flow_type, claimant_name, claimant_school_id")
    .eq("claim_id", claimId)
    .eq("post_id", postId)
    .single();

  if (claimError || !claim) throw new Error("Claim request not found.");
  if (!["Pending", "Approved"].includes(claim.status)) {
    throw new Error("Only active claims can be marked as returned.");
  }

  const { error: itemUpdateError } = await adminClient
    .from("lost_items")
    .update({
      status: "Returned",
      returned_at: returnedAt,
    })
    .eq("post_id", postId);

  if (itemUpdateError) throw new Error(itemUpdateError.message);

  const { error: claimUpdateError } = await adminClient
    .from("claim_requests")
    .update({
      status: "Released",
      updated_at: returnedAt,
    })
    .eq("claim_id", claimId);

  if (claimUpdateError) throw new Error(claimUpdateError.message);

  const { error: otherClaimsError } = await adminClient
    .from("claim_requests")
    .update({
      status: "Rejected",
      admin_notes: autoRejectedNote,
      updated_at: returnedAt,
    })
    .eq("post_id", postId)
    .neq("claim_id", claimId)
    .in("status", ["Pending", "Approved"]);

  if (otherClaimsError) throw new Error(otherClaimsError.message);

  await adminClient.from("audit_logs").insert({
    post_id: postId,
    actor_id: user.id,
    action: "CLAIM_MARKED_RETURNED_BY_OWNER",
    previous_state: {
      status: item.status,
      claim_status: claim.status,
      flow_type: claim.flow_type,
    },
    new_state: {
      status: "Returned",
      claim_id: claimId,
      claim_status: "Released",
      flow_type: claim.flow_type,
      claimant_name: claim.claimant_name,
      claimant_school_id: claim.claimant_school_id,
      returned_at: returnedAt,
      resolved_by: user.id,
    },
  });

  return { success: true, returnedAt };
}
