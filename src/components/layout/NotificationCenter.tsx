"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  NotificationFeedItem,
  NotificationFeedType,
} from "@/src/context/NotificationInboxContext";
import { useNotificationInbox } from "@/src/hooks/useNotificationInbox";

interface NotificationCenterProps {
  isCollapsed?: boolean;
  variant?: "sidebar" | "mobile";
}

function formatNotificationTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getTypeStyles(type: NotificationFeedType) {
  switch (type) {
    case "message":
      return {
        icon: "mail",
        color: "text-[#0d6682]",
        bg: "bg-[#0d6682]/10",
      };
    case "status":
      return {
        icon: "update",
        color: "text-[#44afa9]",
        bg: "bg-[#44afa9]/10",
      };
    case "system":
      return {
        icon: "campaign",
        color: "text-[#ba1a1a]",
        bg: "bg-[#ba1a1a]/10",
      };
    default:
      return {
        icon: "notifications",
        color: "text-[#41484c]",
        bg: "bg-[#f5f3f3]",
      };
  }
}

function NotificationRow({
  notification,
  onRead,
  onNavigate,
}: {
  notification: NotificationFeedItem;
  onRead: (id: string) => Promise<void>;
  onNavigate: () => void;
}) {
  const style = getTypeStyles(notification.type);
  const content = (
    <>
      <div
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.bg}`}
      >
        <span className={`material-symbols-outlined text-[18px] ${style.color}`}>
          {style.icon}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={`truncate text-sm font-bold ${
                notification.isRead ? "text-[#41484c]" : "text-[#002433]"
              }`}
            >
              {notification.title}
            </p>
            <p
              className={`mt-1 text-xs leading-relaxed ${
                notification.isRead
                  ? "text-[#41484c]/75"
                  : "font-medium text-[#41484c]"
              }`}
            >
              {notification.message}
            </p>
          </div>
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-[#41484c]/60">
            {formatNotificationTime(notification.createdAt)}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-3">
          {notification.link && (
            <span className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-[#44afa9]">
              Open <span className="material-symbols-outlined ml-1 text-[13px]">arrow_forward</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-start gap-2">
        {!notification.isRead && (
          <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-[#44afa9]" aria-hidden="true" />
        )}
        {!notification.isRead && (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void onRead(notification.id);
            }}
            className="rounded-md p-1 text-[#41484c]/60 transition-colors hover:bg-[#002433]/5 hover:text-[#002433]"
            aria-label="Mark notification as read"
          >
            <span className="material-symbols-outlined text-[16px]">done</span>
          </button>
        )}
      </div>
    </>
  );

  const sharedClassName = `flex items-start gap-3 p-4 md:p-5 transition-colors ${
    notification.isRead ? "bg-white hover:bg-[#f5f3f3]/60" : "bg-[#f5f3f3]"
  }`;

  if (notification.link) {
    return (
      <Link
        href={notification.link}
        onClick={() => {
          void onRead(notification.id);
          onNavigate();
        }}
        className={sharedClassName}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        void onRead(notification.id);
      }}
      className={`${sharedClassName} w-full text-left`}
    >
      {content}
    </button>
  );
}

export default function NotificationCenter({
  isCollapsed = false,
  variant = "sidebar",
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotificationInbox();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = variant === "mobile";
  const canPortal = typeof document !== "undefined";
  const hasUnread = unreadCount > 0;

  useEffect(() => {
    if (searchParams.get("action") !== "notifs") {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("action");
    const nextQuery = params.toString();

    const timer = window.setTimeout(() => {
      setIsOpen(true);
    }, 0);

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });

    return () => {
      window.clearTimeout(timer);
    };
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (!isOpen) {
      return;
    }

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const triggerClassName = useMemo(() => {
    if (isMobile) {
      return "flex flex-col items-center justify-center px-5 py-1.5 text-slate-400 hover:text-[#44afa9] transition-all active:scale-90 duration-150";
    }

    return "relative flex-1 flex flex-col items-center justify-center rounded-xl py-3 text-[#41484c] transition-all hover:bg-[#ffffff]/60 hover:text-[#002433]";
  }, [isMobile]);

  const label = isMobile ? "Notifs" : "Notifications";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          void refresh();
        }}
        className={triggerClassName}
        aria-label="Open notifications"
      >
        <div className="relative mb-1 flex items-center justify-center">
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: isOpen ? "'FILL' 1" : "'FILL' 0" }}
          >
            notifications
          </span>
          {hasUnread && (
            <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#ba1a1a] px-1 text-[9px] font-black text-white ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        <span
          className={`font-label text-[11px] font-semibold uppercase tracking-widest ${
            !isMobile && isCollapsed ? "hidden" : ""
          }`}
        >
          {label}
        </span>
      </button>

      {canPortal &&
        isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
            <button
              type="button"
              aria-label="Close notifications"
              className="absolute inset-0 bg-[#002433]/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            <div className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_40px_rgba(0,36,51,0.2)]">
              <div className="flex items-center justify-between border-b border-[#002433]/10 bg-[#053b50] px-4 py-4 md:px-6 md:py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                    <span className="material-symbols-outlined text-xl text-[#8df4ec]">
                      notifications_active
                    </span>
                  </div>
                  <div>
                    <h2 className="font-headline text-base font-black tracking-tight text-white md:text-lg">
                      Notifications
                    </h2>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[#8df4ec]">
                      {unreadCount} unread
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-white/60 transition-all hover:bg-white/10 hover:text-white"
                  aria-label="Close notifications panel"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex items-center justify-between border-b border-[#002433]/5 bg-[#f5f3f3] px-4 py-2 md:px-6">
                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="text-[10px] font-bold uppercase tracking-widest text-[#41484c] transition-colors hover:text-[#002433]"
                >
                  Refresh
                </button>
                {hasUnread && (
                  <button
                    type="button"
                    onClick={() => void markAllAsRead()}
                    className="text-[10px] font-bold uppercase tracking-widest text-[#44afa9] transition-colors hover:text-[#002433]"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex h-48 flex-col items-center justify-center text-[#41484c]/60">
                    <span className="material-symbols-outlined mb-2 animate-pulse text-4xl">
                      notifications
                    </span>
                    <p className="text-[11px] font-bold uppercase tracking-widest">
                      Loading notifications
                    </p>
                  </div>
                ) : error ? (
                  <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center px-6 text-center text-[#41484c]/50">
                    <span className="material-symbols-outlined mb-2 text-4xl">
                      notifications_paused
                    </span>
                    <p className="text-[10px] font-black uppercase tracking-widest">
                      No active notifications
                    </p>
                    <p className="mt-2 text-xs">
                      You&apos;re all caught up for now.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#002433]/5">
                    {notifications.map((notification) => (
                      <NotificationRow
                        key={notification.id}
                        notification={notification}
                        onRead={markAsRead}
                        onNavigate={() => setIsOpen(false)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
