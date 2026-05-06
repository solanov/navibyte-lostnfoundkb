"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import EntryForm from "./EntryForm";

export default function CreateEntryOverlay() {
  const modalRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOpen = searchParams.get("create") === "1";

  const closeOverlay = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("create");
    const query = nextParams.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        closeOverlay();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [closeOverlay, isOpen]);

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === modalRef.current) {
      closeOverlay();
    }
  };

  const handleSuccess = () => {
    closeOverlay();
    router.refresh();
  };

  return (
    <>
      <Link
        href="/board?create=1"
        scroll={false}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 bg-[#006a63] text-white w-14 h-14 rounded-full shadow-[0_10px_25px_-5px_rgba(0,106,99,0.4)] flex items-center justify-center active:scale-95 hover:scale-110 transition-all z-40"
        aria-label="Create entry"
      >
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 600" }}>
          add
        </span>
      </Link>

      {isOpen && (
        <div
          ref={modalRef}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-outline-variant/20 bg-surface-container-lowest px-6 py-4">
              <div className="min-w-0">
                <h2 className="font-headline text-xl font-black text-primary">Create Entry</h2>
                <p className="text-xs font-semibold text-on-surface-variant">Report a lost or found item</p>
              </div>
              <button
                type="button"
                onClick={closeOverlay}
                className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
                aria-label="Close create entry"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <EntryForm variant="modal" onSuccess={handleSuccess} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
