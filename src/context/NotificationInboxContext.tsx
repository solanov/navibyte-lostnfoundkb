"use client";

import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import useSWR from "swr";
import { supabase } from "@/src/lib/supabase";
import { useAuthSession } from "@/src/hooks/useAuthSession";

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

const NotificationInboxContext = createContext<
  NotificationInboxContextValue | undefined
>(undefined);

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

function sortNotifications(notifications: NotificationFeedItem[]) {
  return [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

async function fetchNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("notification_id,type,title,content,link_to,is_read,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  return ((data || []) as NotificationRow[]).map(mapNotification);
}

function upsertNotification(
  notifications: NotificationFeedItem[],
  row: NotificationRow
) {
  const nextNotification = mapNotification(row);
  const existingIndex = notifications.findIndex(
    (notification) => notification.id === nextNotification.id
  );

  if (existingIndex === -1) {
    return sortNotifications([nextNotification, ...notifications]);
  }

  const nextNotifications = [...notifications];
  nextNotifications[existingIndex] = nextNotification;
  return sortNotifications(nextNotifications);
}

export function NotificationInboxProvider({ children }: { children: ReactNode }) {
  const { data: session, isLoading: authLoading } = useAuthSession();
  const currentUserId = session?.user?.id ?? null;
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: notifications = [],
    error,
    isLoading,
    mutate,
  } = useSWR(
    currentUserId ? ["notification-feed", currentUserId] : null,
    () => fetchNotifications(currentUserId as string),
    {
      fallbackData: [],
      keepPreviousData: true,
    }
  );

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
        (payload) => {
          if (payload.eventType === "DELETE") {
            const deletedNotificationId = (payload.old as NotificationRow).notification_id;
            void mutate(
              (current = []) =>
                current.filter(
                  (notification) => notification.id !== deletedNotificationId
                ),
              false
            );
            return;
          }

          const row = payload.new as NotificationRow;
          void mutate((current = []) => upsertNotification(current, row), false);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [currentUserId, mutate]);

  const refresh = useCallback(async () => {
    setActionError(null);
    if (!currentUserId) {
      return;
    }
    await mutate();
  }, [currentUserId, mutate]);

  const markAsRead = useCallback(
    async (id: string) => {
      const target = notifications.find((notification) => notification.id === id);

      if (!currentUserId || !target || target.isRead) {
        return;
      }

      setActionError(null);

      try {
        await mutate(
          async (current = []) => {
            const { error: updateError } = await supabase
              .from("notifications")
              .update({ is_read: true })
              .eq("notification_id", target.source.notificationId)
              .eq("user_id", currentUserId);

            if (updateError) {
              throw updateError;
            }

            return current.map((notification) =>
              notification.id === id
                ? { ...notification, isRead: true }
                : notification
            );
          },
          {
            optimisticData: (current: NotificationFeedItem[] = []) =>
              current.map((notification) =>
                notification.id === id
                  ? { ...notification, isRead: true }
                  : notification
              ),
            rollbackOnError: true,
            revalidate: false,
          }
        );
      } catch (err) {
        setActionError(
          err instanceof Error
            ? err.message
            : "Failed to update notification state."
        );
      }
    },
    [currentUserId, mutate, notifications]
  );

  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter((notification) => !notification.isRead);

    if (!currentUserId || unreadNotifications.length === 0) {
      return;
    }

    setActionError(null);

    try {
      await mutate(
        async (current = []) => {
          const { error: updateError } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", currentUserId)
            .eq("is_read", false);

          if (updateError) {
            throw updateError;
          }

          return current.map((notification) => ({
            ...notification,
            isRead: true,
          }));
        },
        {
          optimisticData: (current: NotificationFeedItem[] = []) =>
            current.map((notification) => ({
              ...notification,
              isRead: true,
            })),
          rollbackOnError: true,
          revalidate: false,
        }
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update notifications."
      );
    }
  }, [currentUserId, mutate, notifications]);

  const value = useMemo<NotificationInboxContextValue>(
    () => ({
      notifications,
      unreadCount: notifications.filter((notification) => !notification.isRead).length,
      loading: authLoading || (Boolean(currentUserId) && isLoading),
      error:
        actionError ||
        (error instanceof Error ? error.message : error ? String(error) : null),
      markAsRead,
      markAllAsRead,
      refresh,
    }),
    [
      actionError,
      authLoading,
      currentUserId,
      error,
      isLoading,
      markAllAsRead,
      markAsRead,
      notifications,
      refresh,
    ]
  );

  return (
    <NotificationInboxContext.Provider value={value}>
      {children}
    </NotificationInboxContext.Provider>
  );
}

export { NotificationInboxContext };
