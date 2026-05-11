"use server";

import { createClient } from "@supabase/supabase-js";
import { getAdminClient, verifyAdminAccess } from "./core";
import {
  buildOwnedClaimOverview,
  ClaimOverviewEntry,
  ClaimOverviewItemRow,
  ClaimOverviewRequestRow,
} from "@/src/lib/claimOverview";

interface OwnedPostClaimsResult {
  post: {
    post_id: string;
    general_description: string;
    status: string;
    zone: string;
    reported_by: string;
    categories?: { name: string; icon_identifier: string } | null;
  };
  claims: Array<{
    claim_id: string;
    post_id: string;
    claimant_id: string | null;
    claimant_name: string;
    claimant_school_id: string;
    item_description_verification: string | null;
    flow_type: "P2P" | "Office";
    status: "Pending" | "Approved" | "Rejected" | "Released";
    admin_notes: string | null;
    created_at: string;
    updated_at: string;
  }>;
}

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

export async function fetchOwnedClaimsOverviewAction(
  accessToken: string
): Promise<ClaimOverviewEntry[]> {
  const user = await verifyUserSession(accessToken);
  const adminClient = getAdminClient();

  const { data: items, error: itemsError } = await adminClient
    .from("lost_items")
    .select(`
      post_id,
      general_description,
      status,
      zone,
      reported_by,
      created_timestamp,
      categories (
        name,
        icon_identifier
      )
    `)
    .eq("reported_by", user.id)
    .order("created_timestamp", { ascending: false });

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const postIds = (items || []).map((item) => item.post_id);
  if (postIds.length === 0) {
    return [];
  }

  const { data: claims, error: claimsError } = await adminClient
    .from("claim_requests")
    .select("claim_id,post_id,flow_type,status,created_at,updated_at")
    .in("post_id", postIds)
    .order("created_at", { ascending: false });

  if (claimsError) {
    throw new Error(claimsError.message);
  }

  return buildOwnedClaimOverview(
    (items || []) as ClaimOverviewItemRow[],
    (claims || []) as ClaimOverviewRequestRow[],
    user.id
  );
}

export async function fetchOwnedPostClaimsAction(
  accessToken: string,
  postId: string
): Promise<OwnedPostClaimsResult> {
  const user = await verifyUserSession(accessToken);
  const adminClient = getAdminClient();

  const { data: post, error: postError } = await adminClient
    .from("lost_items")
    .select(
      "post_id,general_description,status,zone,reported_by,categories(name,icon_identifier)"
    )
    .eq("post_id", postId)
    .single();

  if (postError || !post) {
    throw new Error("Item not found.");
  }

  if (post.reported_by !== user.id) {
    throw new Error("You don't have permission to view claims for this item.");
  }

  const { data: claims, error: claimsError } = await adminClient
    .from("claim_requests")
    .select(
      "claim_id,post_id,claimant_id,claimant_name,claimant_school_id,item_description_verification,flow_type,status,admin_notes,created_at,updated_at"
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (claimsError) {
    throw new Error("Failed to load claims.");
  }

  return {
    post: post as unknown as OwnedPostClaimsResult["post"],
    claims: (claims || []) as OwnedPostClaimsResult["claims"],
  };
}

export async function fetchAdminPostClaimsAction(
  accessToken: string,
  postId: string
) {
  const { adminClient } = await verifyAdminAccess(accessToken);

  const { data: post, error: postError } = await adminClient
    .from("lost_items")
    .select(
      "post_id,general_description,status,zone,reported_by,categories(name,icon_identifier)"
    )
    .eq("post_id", postId)
    .single();

  if (postError || !post) {
    console.error("fetchAdminPostClaimsAction error:", { postId, postError, post });
    throw new Error(postError ? postError.message : "Item not found.");
  }

  const { data: claims, error: claimsError } = await adminClient
    .from("claim_requests")
    .select(
      "claim_id,post_id,claimant_id,claimant_name,claimant_school_id,item_description_verification,flow_type,status,admin_notes,created_at,updated_at"
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (claimsError) {
    throw new Error("Failed to load claims.");
  }

  return {
    post,
    claims: claims || [],
  };
}
