"use client";

import { useContext } from "react";
import { NotificationInboxContext } from "@/src/context/NotificationInboxContext";

export function useNotificationInbox() {
  const context = useContext(NotificationInboxContext);

  if (!context) {
    throw new Error("useNotificationInbox must be used within a NotificationInboxProvider");
  }

  return context;
}
