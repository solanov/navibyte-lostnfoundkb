"use server";

import { verifyAdminAccess } from "./core";

type AuditState = Record<string, unknown>;

export async function verifyClaimAction(
  accessToken: string,
  postId: string,
  claimantName: string,
  studentId: string,
  previousState: AuditState
) {
  const { adminClient, profile } = await verifyAdminAccess(accessToken);

  const { error: updateError } = await adminClient
    .from("lost_items")
    .update({ status: "Returned", last_handled_by: profile.user_id })
    .eq("post_id", postId);

  if (updateError) throw new Error(updateError.message);

  const newState = { status: "Returned", last_handled_by: profile.user_id, claimantName, studentId };
  
  await adminClient.from("audit_logs").insert({
    post_id: postId,
    actor_id: profile.user_id,
    action: "CLAIM_VERIFIED",
    previous_state: previousState,
    new_state: newState,
  });

  return { success: true };
}

export async function disposeItemAction(
  accessToken: string,
  postId: string,
  method: string,
  reason: string,
  previousState: AuditState
) {
  const { adminClient, profile } = await verifyAdminAccess(accessToken);

  const { error: updateError } = await adminClient
    .from("lost_items")
    .update({ status: "Purged", last_handled_by: profile.user_id })
    .eq("post_id", postId);

  if (updateError) throw new Error(updateError.message);

  const newState = { status: "Purged", last_handled_by: profile.user_id, method, reason };

  await adminClient.from("audit_logs").insert({
    post_id: postId,
    actor_id: profile.user_id,
    action: "DISPOSAL_APPROVED",
    previous_state: previousState,
    new_state: newState,
  });

  return { success: true };
}

export async function adminDeletePostAction(
  accessToken: string,
  postId: string,
  deletionReason: string
) {
  const { adminClient, profile } = await verifyAdminAccess(accessToken);

  // Fetch current state for audit trail
  const { data: current } = await adminClient
    .from("lost_items")
    .select("status, last_handled_by, deleted_by, deletion_reason")
    .eq("post_id", postId)
    .single();

  const previousState = current ?? { status: "unknown" };

  const { error: updateError } = await adminClient
    .from("lost_items")
    .update({
      status: "Purged",
      deleted_by: profile.user_id,
      deletion_reason: deletionReason,
      deleted_at: new Date().toISOString(),
      last_handled_by: profile.user_id,
    })
    .eq("post_id", postId);

  if (updateError) throw new Error(updateError.message);

  await adminClient.from("audit_logs").insert({
    post_id: postId,
    actor_id: profile.user_id,
    action: "POST_DELETED_BY_ADMIN",
    previous_state: previousState,
    new_state: {
      status: "Purged",
      deleted_by: profile.user_id,
      deletion_reason: deletionReason,
    },
  });

  return { success: true };
}

// ---------------------------------------------------------------------------
// DUAL-PATH CLAIM SYSTEM — Admin / Staff Actions
// ---------------------------------------------------------------------------

/**
 * Staff approves a pending claim request for an item stored In_Office.
 * Sets claim status to 'Approved' so the student can come to collect it.
 */
export async function approveOfficeClaimAction(
  accessToken: string,
  claimId: string
) {
  const { adminClient, profile } = await verifyAdminAccess(accessToken);

  // Fetch the claim and its linked item in one go
  const { data: claim, error: claimError } = await adminClient
    .from("claim_requests")
    .select("claim_id, post_id, status, flow_type, claimant_name, claimant_school_id")
    .eq("claim_id", claimId)
    .single();

  if (claimError || !claim) throw new Error("Claim request not found.");
  if (claim.flow_type !== "Office") {
    throw new Error("This action is only valid for Office (In_Office) claims.");
  }
  if (claim.status !== "Pending") {
    throw new Error(`Cannot approve a claim that is currently '${claim.status}'.`);
  }

  // Fetch the linked item's current status for the audit trail
  const { data: item } = await adminClient
    .from("lost_items")
    .select("status")
    .eq("post_id", claim.post_id)
    .single();

  const { error: updateError } = await adminClient
    .from("claim_requests")
    .update({
      status: "Approved",
      updated_at: new Date().toISOString(),
    })
    .eq("claim_id", claimId);

  if (updateError) throw new Error(updateError.message);

  await adminClient.from("audit_logs").insert({
    post_id: claim.post_id,
    actor_id: profile.user_id,
    action: "OFFICE_CLAIM_APPROVED",
    previous_state: {
      claim_status: "Pending",
      item_status: item?.status ?? "unknown",
    },
    new_state: {
      claim_id: claimId,
      flow_type: "Office",
      claim_status: "Approved",
      approved_by: profile.user_id,
      claimant_name: claim.claimant_name,
      claimant_school_id: claim.claimant_school_id,
    },
  });

  return { success: true };
}

/**
 * Staff confirms the student has physically picked up the item at the office.
 * Calls the finalize_item_handoff RPC to atomically update all statuses.
 */
export async function finalizeOfficeReleaseAction(
  accessToken: string,
  claimId: string
) {
  const { adminClient, profile } = await verifyAdminAccess(accessToken);

  // Fetch the claim to validate its state
  const { data: claim, error: claimError } = await adminClient
    .from("claim_requests")
    .select("claim_id, post_id, status, flow_type, claimant_name, claimant_school_id")
    .eq("claim_id", claimId)
    .single();

  if (claimError || !claim) throw new Error("Claim request not found.");
  if (claim.flow_type !== "Office") {
    throw new Error("This action is only valid for Office (In_Office) claims.");
  }
  if (claim.status !== "Approved") {
    throw new Error("The claim must be approved before the office release can be confirmed.");
  }

  // Fetch current item state for audit trail
  const { data: item } = await adminClient
    .from("lost_items")
    .select("status")
    .eq("post_id", claim.post_id)
    .single();

  // Call the atomic database function to finalize the handoff
  const { error: rpcError } = await adminClient.rpc("finalize_item_handoff", {
    target_claim_id: claimId,
    actor_id: profile.user_id,
  });

  if (rpcError) throw new Error(`Office release finalization failed: ${rpcError.message}`);

  // Supplemental audit entry with full staff + claimant identity context
  await adminClient.from("audit_logs").insert({
    post_id: claim.post_id,
    actor_id: profile.user_id,
    action: "OFFICE_RELEASE_CONFIRMED",
    previous_state: {
      claim_status: claim.status,
      item_status: item?.status ?? "unknown",
    },
    new_state: {
      status: "Released",
      claim_id: claimId,
      flow_type: "Office",
      claimant_name: claim.claimant_name,
      claimant_school_id: claim.claimant_school_id,
      released_by: profile.user_id,
      released_at: new Date().toISOString(),
    },
  });

  return { success: true };
}

/**
 * Staff rejects a pending or approved claim request with a reason.
 * The rejection_reason is stored in admin_notes so the claimant can see why.
 */
export async function rejectClaimAction(
  accessToken: string,
  claimId: string,
  rejectionReason: string
) {
  const { adminClient, profile } = await verifyAdminAccess(accessToken);

  if (!rejectionReason?.trim()) {
    throw new Error("A rejection reason is required.");
  }

  const { data: claim, error: claimError } = await adminClient
    .from("claim_requests")
    .select("claim_id, post_id, status, flow_type, claimant_name, claimant_school_id")
    .eq("claim_id", claimId)
    .single();

  if (claimError || !claim) throw new Error("Claim request not found.");
  if (!["Pending", "Approved"].includes(claim.status)) {
    throw new Error(`Cannot reject a claim that is already '${claim.status}'.`);
  }

  const { error: updateError } = await adminClient
    .from("claim_requests")
    .update({
      status: "Rejected",
      admin_notes: rejectionReason.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("claim_id", claimId);

  if (updateError) throw new Error(updateError.message);

  await adminClient.from("audit_logs").insert({
    post_id: claim.post_id,
    actor_id: profile.user_id,
    action: "CLAIM_REJECTED",
    previous_state: { claim_status: claim.status, flow_type: claim.flow_type },
    new_state: {
      claim_id: claimId,
      flow_type: claim.flow_type,
      claim_status: "Rejected",
      rejection_reason: rejectionReason.trim(),
      rejected_by: profile.user_id,
      claimant_name: claim.claimant_name,
      claimant_school_id: claim.claimant_school_id,
    },
  });

  return { success: true };
}

/**
 * Staff manually resolves a claim as returned from the claim review screen.
 * This removes the item from the public board and records which claimant received it.
 */
export async function markClaimReturnedByAdminAction(
  accessToken: string,
  postId: string,
  claimId: string
) {
  const { adminClient, profile } = await verifyAdminAccess(accessToken);
  const returnedAt = new Date().toISOString();
  const autoRejectedNote = "Item marked as returned to another claimant.";

  const { data: item, error: itemError } = await adminClient
    .from("lost_items")
    .select("post_id, status")
    .eq("post_id", postId)
    .single();

  if (itemError || !item) {
    throw new Error("Item not found.");
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

  if (claimError || !claim) {
    throw new Error("Claim request not found.");
  }

  if (!["Pending", "Approved"].includes(claim.status)) {
    throw new Error("Only active claims can be marked as returned.");
  }

  const { error: selectedClaimError } = await adminClient
    .from("claim_requests")
    .update({
      status: "Released",
      updated_at: returnedAt,
    })
    .eq("claim_id", claimId);

  if (selectedClaimError) {
    throw new Error(selectedClaimError.message);
  }

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

  if (otherClaimsError) {
    throw new Error(otherClaimsError.message);
  }

  const { error: itemUpdateError } = await adminClient
    .from("lost_items")
    .update({
      status: "Returned",
      returned_at: returnedAt,
      last_handled_by: profile.user_id,
    })
    .eq("post_id", postId);

  if (itemUpdateError) {
    throw new Error(itemUpdateError.message);
  }

  await adminClient.from("audit_logs").insert({
    post_id: postId,
    actor_id: profile.user_id,
    action: "CLAIM_MARKED_RETURNED_BY_ADMIN",
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
      resolved_by: profile.user_id,
    },
  });

  return { success: true, returnedAt };
}
