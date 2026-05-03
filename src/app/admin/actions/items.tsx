"use server";

import { verifyAdminAccess } from "./core";

export async function verifyClaimAction(
  accessToken: string,
  postId: string,
  claimantName: string,
  studentId: string,
  previousState: any
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
  previousState: any
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
