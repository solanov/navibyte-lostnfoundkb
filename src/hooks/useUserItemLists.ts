"use client";

import useSWR from "swr";
import {
  fetchUserArchiveAction,
  fetchUserPostsAction,
} from "@/src/app/admin/actions/posts";

export type UserPostCategory =
  | { name: string; icon_identifier: string }
  | { name: string; icon_identifier: string }[]
  | null;

export interface UserPost {
  post_id: string;
  general_description: string;
  zone: string;
  status: string;
  image_url?: string | null;
  created_timestamp: string;
  reported_by?: string;
  date_lost?: string;
  categories?: UserPostCategory;
}

export interface ArchiveItem {
  post_id: string;
  general_description: string;
  zone: string;
  status: string;
  image_url?: string | null;
  reported_by: string;
  deleted_by?: string | null;
  deletion_reason?: string | null;
  deleted_at?: string | null;
  returned_at?: string | null;
  categories?: {
    name: string;
    icon_identifier: string;
  };
  archiveLabel: string;
}

type RawArchiveCategory =
  | { name: string | null; icon_identifier: string | null }
  | { name: string | null; icon_identifier: string | null }[]
  | null;

type RawArchiveItem = Omit<ArchiveItem, "general_description" | "zone" | "reported_by" | "categories"> & {
  general_description: string | null;
  zone: string | null;
  reported_by: string | null;
  categories?: RawArchiveCategory;
};

function normalizeArchiveCategory(categories: RawArchiveCategory) {
  const category = Array.isArray(categories) ? categories[0] : categories;

  if (!category?.name || !category.icon_identifier) {
    return undefined;
  }

  return {
    name: category.name,
    icon_identifier: category.icon_identifier,
  };
}

async function fetchUserArchive(accessToken: string): Promise<ArchiveItem[]> {
  const items = (await fetchUserArchiveAction(accessToken)) as RawArchiveItem[];

  return items.map((item) => ({
    ...item,
    general_description: item.general_description ?? "",
    zone: item.zone ?? "Unknown Location",
    reported_by: item.reported_by ?? "",
    categories: normalizeArchiveCategory(item.categories ?? null),
  }));
}

export function useUserPosts(accessToken: string | null, userId?: string | null) {
  return useSWR<UserPost[]>(
    accessToken && userId ? ["user-posts", userId] : null,
    () => fetchUserPostsAction(accessToken as string),
    {
      fallbackData: [],
      keepPreviousData: true,
    }
  );
}

export function useUserArchive(accessToken: string | null, userId?: string | null) {
  return useSWR<ArchiveItem[]>(
    accessToken && userId ? ["user-archive", userId] : null,
    () => fetchUserArchive(accessToken as string),
    {
      fallbackData: [],
      keepPreviousData: true,
    }
  );
}
