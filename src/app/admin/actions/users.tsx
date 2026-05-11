"use server";

import { verifyAdminAccess } from "./core";

export async function updateUserBlockAction(
  accessToken: string,
  targetUserId: string,
  targetUserBlockedStatus: boolean,
  blocked: boolean,
  reason: string
) {
  const { adminClient, profile } = await verifyAdminAccess(accessToken);

  const { error: updateError } = await adminClient
    .from("users")
    .update({ is_blocked: blocked })
    .eq("user_id", targetUserId);

  if (updateError) throw new Error(updateError.message);

  await adminClient.from("audit_logs").insert({
    post_id: null,
    actor_id: profile.user_id,
    action: blocked ? "ACCOUNT_SUSPENDED" : "ACCOUNT_RESTORED",
    previous_state: { user_id: targetUserId, is_blocked: targetUserBlockedStatus },
    new_state: { user_id: targetUserId, is_blocked: blocked, reason },
  });

  return { success: true };
}
