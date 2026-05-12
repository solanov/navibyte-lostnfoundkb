"use client";
import { resolveIcon } from '@/src/lib/resolveIcon';

import { useState } from "react";
import ItemCard from "@/src/components/pages/ItemCard";
import ItemDetailModal from "@/src/components/pages/ItemDetailModal";
import { useNotification } from "@/src/hooks/useNotification";
import { useCurrentUserProfile } from "@/src/hooks/useAuthSession";
import { type ArchiveItem, useUserArchive } from "@/src/hooks/useUserItemLists";

export default function ArchiveClient() {
  const { notify } = useNotification();
  const {
    profile,
    accessToken,
    isLoading: authLoading,
  } = useCurrentUserProfile();
  const {
    data: items = [],
    error,
    isLoading: archiveLoading,
  } = useUserArchive(accessToken, profile?.userId);
  const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null);
  const loading = authLoading || (Boolean(accessToken) && archiveLoading && items.length === 0);
  const errorMessage =
    error instanceof Error
      ? error.message
      : error
        ? String(error)
        : !loading && !accessToken
          ? "You must be logged in to view your archive."
          : null;

  if (loading) {
    return <div className="py-12 text-center text-outline-variant font-medium">Loading archive...</div>;
  }

  if (errorMessage) {
    return <div className="py-12 text-center text-red-600 font-medium">{errorMessage}</div>;
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-outline-variant">
        <span className="material-symbols-outlined text-5xl mb-4 opacity-50">inventory_2</span>
        <p className="font-medium">Your archive is empty.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item) => {
          const [title] = (item.general_description || "").split("\n\n");
          const icon = resolveIcon(item.categories?.icon_identifier);
          const reference = `AC-${item.post_id.substring(0, 4).toUpperCase()}`;

          // Map archiveLabel to visual styling
          const isDeletedByAdmin = item.archiveLabel === "Deleted by Admin";
          const isDeletedByYou = item.archiveLabel === "Deleted by You";
          const isReturned = item.archiveLabel === "Marked as Returned";

          return (
            <div key={item.post_id} className="relative group">
              <button
                onClick={() => setSelectedItem(item)}
                className="w-full text-left bg-transparent border-none p-0 cursor-pointer hover:opacity-80 transition-opacity block"
                aria-label={`View details for ${title || "item"}`}
              >
                <div className="absolute -top-3 -right-3 z-10 pointer-events-none">
                  {isDeletedByAdmin && (
                    <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-1 rounded-full border border-red-200 shadow-sm">
                      Admin Deleted
                    </span>
                  )}
                  {isDeletedByYou && (
                    <span className="bg-surface-variant text-on-surface-variant text-[10px] font-bold px-2 py-1 rounded-full border border-outline-variant/50 shadow-sm">
                      Deleted
                    </span>
                  )}
                  {isReturned && (
                    <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded-full border border-green-200 shadow-sm">
                      Returned
                    </span>
                  )}
                </div>

                <ItemCard
                  status={item.status === "Reported" ? "Lost" : item.status}
                  icon={icon}
                  title={title || "Unknown Item"}
                  location={item.zone || "Unknown Location"}
                  reference={reference}
                  imageUrl={item.image_url}
                />
              </button>

              {isDeletedByAdmin && item.deletion_reason && (
                <div className="mt-2 text-xs bg-red-50 text-red-700 p-3 rounded-lg border border-red-100/50">
                  <span className="font-bold block mb-1">Admin Note:</span>
                  {item.deletion_reason}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ItemDetailModal
        isOpen={!!selectedItem}
        item={selectedItem}
        isOwner={true}
        onClaimClick={() => notify("Action disabled for archived items.", "warning")}
        onContactClick={() => notify("Action disabled for archived items.", "warning")}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
}
