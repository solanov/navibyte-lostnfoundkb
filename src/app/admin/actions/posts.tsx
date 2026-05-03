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
  const enriched = (items ?? []).map((item: any) => {
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
