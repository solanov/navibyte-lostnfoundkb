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

type CategoryResolutionResult =
  | { success: true; categoryId: number }
  | { success: false; message: string };

const FALLBACK_CATEGORY_SEEDS = new Map<string, { name: string; icon_identifier: string }>([
  ["wallet", { name: "Wallet", icon_identifier: "account_balance_wallet" }],
  ["keys", { name: "Keys", icon_identifier: "vpn_key" }],
  ["id", { name: "ID", icon_identifier: "badge" }],
  ["tech", { name: "Tech", icon_identifier: "devices" }],
  ["other", { name: "Others", icon_identifier: "other" }],
  ["others", { name: "Others", icon_identifier: "other" }],
]);

function normalizeCategoryName(categoryName: string | null) {
  return categoryName?.trim().toLowerCase() ?? "";
}

async function resolveCategoryId(
  adminClient: ReturnType<typeof getAdminClient>,
  selectedCategory: number,
  selectedCategoryName: string | null
): Promise<CategoryResolutionResult> {
  const { data: categoryById, error: categoryLookupError } = await adminClient
    .from("categories")
    .select("category_id")
    .eq("category_id", selectedCategory)
    .eq("is_active", true)
    .maybeSingle();

  if (categoryLookupError) {
    return {
      success: false,
      message: "We couldn't verify the selected category right now. Please try again.",
    };
  }

  if (categoryById?.category_id) {
    return { success: true, categoryId: categoryById.category_id };
  }

  const normalizedSelectedCategoryName = normalizeCategoryName(selectedCategoryName);
  const { data: categoriesByName, error: categoryNameLookupError } = await adminClient
    .from("categories")
    .select("category_id,name")
    .eq("is_active", true);

  if (categoryNameLookupError) {
    return {
      success: false,
      message: "We couldn't verify the selected category right now. Please try again.",
    };
  }

  const categoryByName = categoriesByName?.find(
    (category) => normalizeCategoryName(category.name) === normalizedSelectedCategoryName
  );

  if (categoryByName?.category_id) {
    return { success: true, categoryId: categoryByName.category_id };
  }

  const fallbackCategory = FALLBACK_CATEGORY_SEEDS.get(normalizedSelectedCategoryName);

  if (!fallbackCategory) {
    return {
      success: false,
      message: "Choose a valid category before posting your entry.",
    };
  }

  const { data: seededCategory, error: seedCategoryError } = await adminClient
    .from("categories")
    .upsert(
      { ...fallbackCategory, is_active: true },
      { onConflict: "name" }
    )
    .select("category_id")
    .single();

  if (seedCategoryError || !seededCategory?.category_id) {
    return {
      success: false,
      message: "We couldn't prepare the selected category right now. Please try again.",
    };
  }

  return { success: true, categoryId: seededCategory.category_id };
}

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

  const resolvedCategory = await resolveCategoryId(
    adminClient,
    validation.data.selectedCategory,
    validation.data.selectedCategoryName
  );

  if (!resolvedCategory.success) {
    return {
      success: false,
      message: resolvedCategory.message,
      fieldErrors: {
        category: resolvedCategory.message,
      },
    };
  }

  const { data, error: insertError } = await adminClient
    .from("lost_items")
    .insert({
      category_id: resolvedCategory.categoryId,
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
