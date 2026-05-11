import { createClient } from "@supabase/supabase-js";

export type ClaimFlowType = "P2P" | "Office";

// We require the service role key to bypass the REVOKE SELECT on lost_items
export const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured in the environment variables.");
  }
  
  return createClient(url, key);
};

export function isAdminOrStaffRole(role: string | null | undefined) {
  return ["admin", "staff"].includes(String(role ?? "").toLowerCase());
}

export function resolveClaimFlowType({
  posterRole,
  currentPossession,
  storedFlowType,
}: {
  posterRole?: string | null;
  currentPossession?: string | null;
  storedFlowType?: ClaimFlowType | null;
}): ClaimFlowType {
  if (isAdminOrStaffRole(posterRole)) {
    return "Office";
  }

  if (currentPossession === "With_Finder") {
    return "P2P";
  }

  if (currentPossession) {
    return "Office";
  }

  return storedFlowType === "P2P" ? "P2P" : "Office";
}

export async function fetchUserRole(
  adminClient: ReturnType<typeof getAdminClient>,
  userId: string | null | undefined
) {
  if (!userId) {
    return null;
  }

  const { data: userProfile, error } = await adminClient
    .from("users")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return userProfile?.role ?? null;
}

export async function resolvePostClaimFlowType(
  adminClient: ReturnType<typeof getAdminClient>,
  post: {
    reported_by?: string | null;
    current_possession?: string | null;
  },
  storedFlowType?: ClaimFlowType | null
) {
  const posterRole = await fetchUserRole(adminClient, post.reported_by);

  return resolveClaimFlowType({
    posterRole,
    currentPossession: post.current_possession,
    storedFlowType,
  });
}

// Helper to verify the user is actually an admin/staff based on their access token
export async function verifyAdminAccess(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  
  // Use anon client just to verify the JWT token
  const authClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error: authError } = await authClient.auth.getUser(accessToken);
  
  if (authError || !user) {
    throw new Error("Unauthorized: Invalid session.");
  }

  // Now use admin client to check their role in the users table
  const adminClient = getAdminClient();
  const { data: profile } = await adminClient
    .from("users")
    .select("user_id, email, full_name, role, is_blocked")
    .eq("user_id", user.id)
    .single();

  if (!profile || !["admin", "staff"].includes(String(profile.role).toLowerCase())) {
    throw new Error("Forbidden: This action requires Admin or Staff privileges.");
  }

  return { adminClient, profile };
}
