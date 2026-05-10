"use client";

import { useEffect, useState } from 'react';
import { Notification } from '../../context/NotificationContext';

interface ToastProps {
  notification: Notification;
  onClose: (id: string) => void;
}

const typeStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-[#EEEEEE] border-outline-variant/30 text-on-surface',
};

const iconMap = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

const iconColorMap = {
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-amber-600',
  info: 'text-primary',
};

export default function Toast({ notification, onClose }: ToastProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 300);
  };

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 ease-in-out ${typeStyles[notification.type]} ${isClosing ? 'translate-x-8 opacity-0 scale-95' : 'translate-x-0 opacity-100 scale-100 animate-in slide-in-from-right-4 fade-in'}`}
      role="alert"
    >
      <span className={`material-symbols-outlined shrink-0 ${iconColorMap[notification.type]}`} style={{ fontVariationSettings: "'FILL' 1" }}>
        {iconMap[notification.type]}
      </span>
      <div className="flex-1 text-sm font-medium pt-0.5">{notification.message}</div>
      <button
        onClick={handleClose}
        className="shrink-0 rounded-md p-1 opacity-60 hover:opacity-100 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-current transition-all"
        aria-label="Close"
      >
        <span className="material-symbols-outlined text-base">close</span>
      </button>
    </div>
  );
}
