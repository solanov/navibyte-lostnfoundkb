import { createClient } from "@supabase/supabase-js";

// We require the service role key to bypass the REVOKE SELECT on lost_items
export const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured in the environment variables.");
  }
  
  return createClient(url, key);
};

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
