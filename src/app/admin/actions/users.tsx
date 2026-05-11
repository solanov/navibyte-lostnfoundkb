"use server";

import { isAdminRole, verifyAdminAccess } from "./core";

export async function updateUserBlockAction(
  accessToken: string,
  targetUserId: string,
  targetUserBlockedStatus: boolean,
  blocked: boolean,
  reason: string
) {
  const { adminClient, profile } = await verifyAdminAccess(accessToken);

  const { data: targetUser, error: targetUserError } = await adminClient
    .from("users")
    .select("user_id, role, is_blocked")
    .eq("user_id", targetUserId)
    .single();

  if (targetUserError || !targetUser) {
    throw new Error(targetUserError?.message ?? "Target user not found.");
  }

  if (blocked && isAdminRole(targetUser.role)) {
    throw new Error("Admin accounts cannot be suspended.");
  }

  const { error: updateError } = await adminClient
    .from("users")
    .update({ is_blocked: blocked })
    .eq("user_id", targetUserId);

  if (updateError) throw new Error(updateError.message);

  await adminClient.from("audit_logs").insert({
    post_id: null,
    actor_id: profile.user_id,
    action: blocked ? "ACCOUNT_SUSPENDED" : "ACCOUNT_RESTORED",
    previous_state: {
      user_id: targetUserId,
      role: targetUser.role,
      is_blocked: targetUserBlockedStatus,
    },
    new_state: {
      user_id: targetUserId,
      role: targetUser.role,
      is_blocked: blocked,
      reason,
    },
  });

  return { success: true };
}
