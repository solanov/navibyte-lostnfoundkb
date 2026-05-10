"use server";

import { createClient } from "@supabase/supabase-js";
import { getAdminClient } from "@/app/admin/actions/core";
import {
  getCreateEntryErrorMessage,
  type CreateEntryErrors,
  type CreateEntryInput,
  validateCreateEntryInput,
} from "@/lib/createEntrySecurity";

type CreateEntryActionResult =
  | { success: true }
  | { success: false; message: string; fieldErrors?: CreateEntryErrors };

export async function createEntryAction(
  accessToken: string,
  input: CreateEntryInput
): Promise<CreateEntryActionResult> {
  const validation = validateCreateEntryInput(input);
  if (!validation.ok) {
    return {
      success: false,
      message: getCreateEntryErrorMessage(validation.errors),
      fieldErrors: validation.errors,
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      success: false,
      message: "The application is missing its authentication configuration.",
    };
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(accessToken);

  if (authError || !user) {
    return {
      success: false,
      message: "Your session has expired. Please sign in again before posting.",
    };
  }

  const adminClient = getAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("users")
    .select("user_id,is_blocked")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      success: false,
      message: "We couldn't verify your account right now. Please try again.",
    };
  }

  if (profile?.is_blocked) {
    return {
      success: false,
      message: "Your account is currently suspended and cannot create new entries.",
    };
  }

  const { data, error: insertError } = await adminClient
    .from("lost_items")
    .insert({
      category_id: validation.data.selectedCategory,
      color: validation.data.selectedColor,
      zone: validation.data.zone,
      general_description: `${validation.data.title}\n\n${validation.data.description}`,
      hidden_note: validation.data.hiddenNote || null,
      status: validation.data.entryType === "lost" ? "Reported" : "Found",
      image_url: validation.data.imageUrl,
      reported_by: user.id,
    })
    .select("post_id")
    .single();

  if (insertError || !data) {
    return {
      success: false,
      message: "We couldn't save your entry. Please review the form and try again.",
    };
  }

  return { success: true };
}
