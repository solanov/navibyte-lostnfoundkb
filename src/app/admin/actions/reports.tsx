"use server";

import { createClient } from "@supabase/supabase-js";
import { getAdminClient, verifyAdminAccess } from "./core";

// ── Shared: verify any authenticated user (not admin-only) ──────────────────
async function verifyUserSession(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const authClient = createClient(supabaseUrl, supabaseAnonKey);

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(accessToken);

  if (error || !user) throw new Error("Unauthorized: Invalid session.");
  return user;
}

// ── Types ────────────────────────────────────────────────────────────────────
export type ReportReason =
  | "Spam"
  | "Inappropriate Content"
  | "Fake/Scam"
  | "Duplicate"
  | "Other";

export type FlaggedPost = {
  post_id: string;
  general_description: string;
  item_status: string;
  original_poster_name: string | null;
  original_poster_email: string | null;
  total_reports: number;
  latest_report_date: string;
};

export type ReportDetail = {
  report_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reporter?: { full_name: string | null; email: string | null };
};

// ── USER ACTION: Submit a report on a post ───────────────────────────────────
/**
 * Any authenticated user can report a post they do NOT own.
 * The unique(post_id, reporter_id) constraint prevents duplicate reports.
 */
export async function submitReportAction(
  accessToken: string,
  postId: string,
  reason: ReportReason,
  details?: string
) {
  const user = await verifyUserSession(accessToken);
  const adminClient = getAdminClient();

  // Prevent self-reporting
  const { data: item } = await adminClient
    .from("lost_items")
    .select("reported_by")
    .eq("post_id", postId)
    .single();

  if (!item) return { success: false, error: "Post not found." };
  if (item.reported_by === user.id)
    return { success: false, error: "You cannot report your own post." };

  // Check for existing reports from this user
  const { data: existingReports, error: existingError } = await adminClient
    .from("item_reports")
    .select("report_id, status, created_at")
    .eq("post_id", postId)
    .eq("reporter_id", user.id)
    .order("created_at", { ascending: false });

  if (existingError) throw new Error(existingError.message);

  if (existingReports && existingReports.length > 0) {
    const latestReport = existingReports[0];

    if (latestReport.status === "Pending") {
      return { success: false, error: "You already have a pending report for this post." };
    }

    const lastReportTime = new Date(latestReport.created_at).getTime();
    const now = Date.now();
    const COOLDOWN_MS = 5 * 60 * 1000;

    if (now - lastReportTime < COOLDOWN_MS) {
      const remainingMinutes = Math.ceil((COOLDOWN_MS - (now - lastReportTime)) / 60000);
      return { success: false, error: `Please wait ${remainingMinutes} minute(s) before reporting this post again.` };
    }

    // Delete existing reports to allow a new one (bypasses unique constraint and UPDATE trigger bug)
    const reportIds = existingReports.map((r) => r.report_id);
    await adminClient.from("item_reports").delete().in("report_id", reportIds);
  }

  const { error: insertError } = await adminClient
    .from("item_reports")
    .insert({
      post_id: postId,
      reporter_id: user.id,
      reason,
      details: details?.trim() || null,
      status: "Pending",
    });

  if (insertError) throw new Error(insertError.message);

  return { success: true };
}

// ── ADMIN ACTIONS ─────────────────────────────────────────────────────────────

/**
 * Fetch all posts with pending reports, grouped via the admin_reported_items_summary view.
 */
export async function fetchFlaggedPostsAction(accessToken: string) {
  await verifyAdminAccess(accessToken);
  const adminClient = getAdminClient();

  const { data, error } = await adminClient
    .from("admin_reported_items_summary")
    .select("*");

  if (error) throw new Error(error.message);
  return (data ?? []) as FlaggedPost[];
}

/**
 * Fetch individual report rows for a specific post.
 */
export async function fetchPostReportDetailsAction(
  accessToken: string,
  postId: string
) {
  await verifyAdminAccess(accessToken);
  const adminClient = getAdminClient();

  const { data, error } = await adminClient
    .from("item_reports")
    .select(
      `
      report_id,
      reporter_id,
      reason,
      details,
      status,
      created_at,
      users:reporter_id (
        full_name,
        email
      )
    `
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ReportDetail[];
}

/**
 * Admin dismisses all pending reports for a post (false report).
 * Sets all Pending reports for that post to Dismissed.
 */
export async function dismissReportsAction(
  accessToken: string,
  postId: string
) {
  const { adminClient, profile } = await verifyAdminAccess(accessToken);

  // Workaround for DB trigger bug: "record 'new' has no field 'last_edited_timestamp'"
  // We delete and re-insert to bypass the broken UPDATE trigger on item_reports.
  const { data: pendingReports } = await adminClient
    .from("item_reports")
    .select("*")
    .eq("post_id", postId)
    .eq("status", "Pending");

  if (pendingReports && pendingReports.length > 0) {
    const reportIds = pendingReports.map((r) => r.report_id);
    await adminClient.from("item_reports").delete().in("report_id", reportIds);

    const dismissedReports = pendingReports.map((r) => ({
      ...r,
      status: "Dismissed",
      updated_at: new Date().toISOString(),
    }));

    const { error: insertError } = await adminClient
      .from("item_reports")
      .insert(dismissedReports);

    if (insertError) throw new Error(insertError.message);
  }

  await adminClient.from("audit_logs").insert({
    post_id: postId,
    actor_id: profile.user_id,
    action: "REPORTS_DISMISSED",
    new_state: { dismissed_by: profile.user_id },
  });

  return { success: true };
}

/**
 * Admin deletes the reported post (marks it Purged) and marks all reports Actioned.
 */
export async function actionReportDeletePostAction(
  accessToken: string,
  postId: string,
  deletionReason: string
) {
  const { adminClient, profile } = await verifyAdminAccess(accessToken);

  // Fetch current state for audit
  const { data: current } = await adminClient
    .from("lost_items")
    .select("status, reported_by")
    .eq("post_id", postId)
    .single();

  if (!current) throw new Error("Post not found.");

  // Purge the post
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

  // Mark all reports for this post as Actioned
  // Workaround for DB trigger bug: bypass UPDATE trigger via DELETE + INSERT
  const { data: reportsToUpdate } = await adminClient
    .from("item_reports")
    .select("*")
    .eq("post_id", postId)
    .in("status", ["Pending", "Reviewed"]);

  if (reportsToUpdate && reportsToUpdate.length > 0) {
    const reportIds = reportsToUpdate.map((r) => r.report_id);
    await adminClient.from("item_reports").delete().in("report_id", reportIds);

    const actionedReports = reportsToUpdate.map((r) => ({
      ...r,
      status: "Actioned",
      updated_at: new Date().toISOString(),
    }));

    await adminClient.from("item_reports").insert(actionedReports);
  }

  await adminClient.from("audit_logs").insert({
    post_id: postId,
    actor_id: profile.user_id,
    action: "POST_DELETED_VIA_REPORT",
    previous_state: { status: current.status },
    new_state: {
      status: "Purged",
      deleted_by: profile.user_id,
      deletion_reason: deletionReason,
    },
  });

  return { success: true };
}
