"use client";

import { useNotification } from '../../hooks/useNotification';
import Toast from './Toast';

export default function ToastContainer() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-[340px] sm:max-w-sm">
      {notifications.map((notification) => (
        <Toast key={notification.id} notification={notification} onClose={removeNotification} />
      ))}
    </div>
  );
}
