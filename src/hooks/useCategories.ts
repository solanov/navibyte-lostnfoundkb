"use client";

import useSWR from "swr";
import { supabase } from "@/src/lib/supabase";
import { resolveIcon } from "@/src/lib/resolveIcon";

export type CategoryOption = {
  id: number;
  label: string;
  icon: string;
};

export const FALLBACK_CATEGORIES: CategoryOption[] = [
  { id: 1, label: "Wallet", icon: "account_balance_wallet" },
  { id: 2, label: "Keys", icon: "vpn_key" },
  { id: 3, label: "ID", icon: "badge" },
  { id: 4, label: "Tech", icon: "devices" },
  { id: 62, label: "Others", icon: "category" },
];

async function fetchActiveCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("category_id,name,icon_identifier,is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  const categories = (data || [])
    .map((category) => ({
      id: category.category_id,
      label: category.name,
      icon: resolveIcon(category.icon_identifier || undefined),
    }))
    .filter((category) => Boolean(category.id) && Boolean(category.label));

  return categories.length > 0 ? categories : FALLBACK_CATEGORIES;
}

export function useCategories() {
  return useSWR<CategoryOption[]>("active-categories", fetchActiveCategories, {
    fallbackData: FALLBACK_CATEGORIES,
    dedupingInterval: 60_000,
    revalidateOnFocus: false,
  });
}
