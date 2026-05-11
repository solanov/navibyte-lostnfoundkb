"use client";

import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "@/src/lib/supabase";

export type NotificationFeedType = "message" | "status" | "system";

type NotificationSource = {
  kind: "notification";
  notificationId: string;
};

export interface NotificationFeedItem {
  id: string;
  type: NotificationFeedType;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  link?: string;
  source: NotificationSource;
}

interface NotificationInboxContextValue {
  notifications: NotificationFeedItem[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

interface NotificationRow {
  notification_id: string;
  type: "Message" | "StatusUpdate" | "System";
  title: string;
  content: string;
  link_to: string | null;
  is_read: boolean | null;
  created_at: string;
}

const NotificationInboxContext = createContext<NotificationInboxContextValue | undefined>(
  undefined
);

const POLL_INTERVAL_MS = 45_000;

function normalizeNotificationType(type: NotificationRow["type"]): NotificationFeedType {
  switch (type) {
    case "Message":
      return "message";
    case "StatusUpdate":
      return "status";
    case "System":
    default:
      return "system";
  }
}

function normalizeNotificationLink(linkTo: string | null) {
  if (!linkTo) {
    return undefined;
  }

  if (linkTo.startsWith("/messages/")) {
    const conversationId = linkTo.slice("/messages/".length);
    return conversationId
      ? `/messages?conversation=${encodeURIComponent(conversationId)}`
      : "/messages";
  }

  if (linkTo.startsWith("/items/")) {
    return "/board/archive";
  }

  return linkTo;
}

function mapNotification(row: NotificationRow): NotificationFeedItem {
  return {
    id: row.notification_id,
    type: normalizeNotificationType(row.type),
    title: row.title,
    message: row.content,
    createdAt: row.created_at,
    isRead: Boolean(row.is_read),
    link: normalizeNotificationLink(row.link_to),
    source: {
      kind: "notification",
      notificationId: row.notification_id,
    },
  };
}

export function NotificationInboxProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        currentUserIdRef.current = null;
        setCurrentUserId(null);
        setNotifications([]);
        setLoading(false);
        return;
      }

      currentUserIdRef.current = user.id;
      setCurrentUserId(user.id);

      const { data, error: notificationError } = await supabase
        .from("notifications")
        .select("notification_id,type,title,content,link_to,is_read,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (notificationError) {
        throw notificationError;
      }

      setNotifications(((data || []) as NotificationRow[]).map(mapNotification));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refresh]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);

    const handleFocus = () => {
      void refresh();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refresh]);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const channel = supabase
      .channel(`notification-feed:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        () => {
          void refresh();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [currentUserId, refresh]);

  const markAsRead = useCallback(
    async (id: string) => {
      const userId = currentUserIdRef.current;
      const target = notifications.find((notification) => notification.id === id);

      if (!userId || !target || target.isRead) {
        return;
      }

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      );

      try {
        const { error: updateError } = await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("notification_id", target.source.notificationId)
          .eq("user_id", userId);

        if (updateError) {
          throw updateError;
        }
      } catch (err) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id ? { ...notification, isRead: false } : notification
          )
        );

        setError(err instanceof Error ? err.message : "Failed to update notification state.");
      }
    },
    [notifications]
  );

  const markAllAsRead = useCallback(async () => {
    const userId = currentUserIdRef.current;
    const unreadNotifications = notifications.filter((notification) => !notification.isRead);

    if (!userId || unreadNotifications.length === 0) {
      return;
    }

    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));

    try {
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (updateError) {
        throw updateError;
      }
    } catch (err) {
      setNotifications((prev) =>
        prev.map((notification) => {
          const wasUnread = unreadNotifications.some((candidate) => candidate.id === notification.id);
          return wasUnread ? { ...notification, isRead: false } : notification;
        })
      );

      setError(err instanceof Error ? err.message : "Failed to update notifications.");
    }
  }, [notifications]);

  const value = useMemo<NotificationInboxContextValue>(
    () => ({
      notifications,
      unreadCount: notifications.filter((notification) => !notification.isRead).length,
      loading,
      error,
      markAsRead,
      markAllAsRead,
      refresh,
    }),
    [error, loading, markAllAsRead, markAsRead, notifications, refresh]
  );

  return (
    <NotificationInboxContext.Provider value={value}>
      {children}
    </NotificationInboxContext.Provider>
  );
}

export { NotificationInboxContext };
