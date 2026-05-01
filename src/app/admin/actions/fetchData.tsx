"use server";

import { verifyAdminAccess } from "./core";

export async function fetchAdminData(accessToken: string) {
  const { adminClient, profile } = await verifyAdminAccess(accessToken);

  const [usersResult, itemsResult, logsResult] = await Promise.all([
    adminClient
      .from("users")
      .select("user_id,email,full_name,role,is_blocked,created_at")
      .order("created_at", { ascending: false }),
    adminClient
      .from("lost_items")
      .select(`
        post_id,
        category_id,
        color,
        zone,
        general_description,
        hidden_note,
        bin_number,
        status,
        image_url,
        reported_by,
        last_handled_by,
        created_timestamp,
        last_edited_timestamp,
        categories (
          name,
          icon_identifier
        )
      `)
      .order("created_timestamp", { ascending: false }),
    adminClient
      .from("audit_logs")
      .select("log_id,post_id,staff_id,action,previous_state,new_state,created_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  if (usersResult.error) throw new Error(usersResult.error.message);
  if (itemsResult.error) throw new Error(itemsResult.error.message);
  if (logsResult.error) throw new Error(logsResult.error.message);

  return {
    profile,
    users: usersResult.data,
    items: itemsResult.data,
    auditLogs: logsResult.data,
  };
}
