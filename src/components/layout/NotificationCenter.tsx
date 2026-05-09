"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// Mock data structure - replace with your Supabase fetch logic later
interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "match" | "system" | "message";
  isRead: boolean;
  timestamp: string;
  link?: string;
}

const mockNotifications: AppNotification[] = [
  {
    id: "1",
    title: "Potential Match Found",
    message: "A newly recovered item closely matches your reported missing Leather Wallet.",
    type: "match",
    isRead: false,
    timestamp: "10 minutes ago",
    link: "/board",
  },
  {
    id: "2",
    title: "Institutional Update",
    message: "Your archive entry #LF-855F has been verified by the system curator.",
    type: "system",
    isRead: false,
    timestamp: "2 hours ago",
  },
  {
    id: "3",
    title: "New Message",
    message: "Vinz Solano has replied to your inquiry regarding ID #LF-C434.",
    type: "message",
    isRead: true,
    timestamp: "Yesterday",
    link: "/messages",
  },
];

export default function NotificationCenter({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications);
  const modalRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();


  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen for the URL parameter from the mobile bottom nav
  useEffect(() => {
    if (searchParams.get("action") === "notifs") {
      setIsOpen(true);
      
      // Clean up the URL silently so if they close the modal, 
      // clicking the button again will still trigger a change.
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Handle Escape key and body scroll lock
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent scrolling behind modal
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) setIsOpen(false);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "match": return { icon: "travel_explore", color: "text-[#44afa9]", bg: "bg-[#44afa9]/10" };
      case "system": return { icon: "admin_panel_settings", color: "text-[#ba1a1a]", bg: "bg-[#ba1a1a]/10" };
      case "message": return { icon: "mail", color: "text-[#002433]", bg: "bg-[#002433]/10" };
      default: return { icon: "notifications", color: "text-[#41484c]", bg: "bg-[#f5f3f3]" };
    }
  };

  return (
    <>
      {/* The Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all text-[#41484c] hover:bg-[#002433]/5"
        aria-label="Open notifications"
      >
        <div className="relative">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isOpen ? "'FILL' 1" : "'FILL' 0" }}>
            notifications
          </span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-[#ba1a1a] ring-2 ring-[#f5f3f3]">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ba1a1a] opacity-75"></span>
            </span>
          )}
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isCollapsed ? 'hidden' : 'hidden md:block'} whitespace-nowrap`}>Notifications</span>
      </button>

      {/* The Modal - Teleported to document.body */}
      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          
          {/* Dark Blurred Backdrop */}
          <div 
            className="absolute inset-0 bg-[#002433]/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Modal Content Box */}
          <div 
            ref={modalRef}
            className="relative z-10 bg-[#ffffff] rounded-2xl shadow-[0_20px_40px_rgba(0,36,51,0.2)] max-h-[85vh] w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            
            {/* Header - Institutional Intake Style (#053b50) */}
            <div className="bg-[#053b50] px-4 md:px-6 py-4 md:py-5 flex items-center justify-between border-b border-[#002433]/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#ffffff]/10 flex items-center justify-center rounded-xl backdrop-blur-sm border border-[#ffffff]/10">
                  <span className="material-symbols-outlined text-[#8df4ec] text-xl">notifications_active</span>
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-black text-white font-headline tracking-tight">Notifications</h2>
                  <p className="text-[10px] font-bold text-[#8df4ec] uppercase tracking-widest mt-0.5">
                    {unreadCount} Unread Notification
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white hover:bg-white/10 transition-all p-2 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Quick Actions */}
            {unreadCount > 0 && (
              <div className="bg-[#f5f3f3] px-4 md:px-6 py-2 border-b border-[#002433]/5 flex justify-end shrink-0">
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold uppercase tracking-widest text-[#44afa9] hover:text-[#002433] transition-colors"
                >
                  Mark all as reviewed
                </button>
              </div>
            )}

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {/* NOTE: Paste your existing 'notifications.length === 0 ? (...) : (...)' list mapping logic here! Keep it exactly as it was. */}
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-[#41484c]/50">
                  <span className="material-symbols-outlined text-4xl mb-2">notifications_paused</span>
                  <p className="text-[10px] font-black uppercase tracking-widest">No Active Alerts</p>
                </div>
              ) : (
                <div className="divide-y divide-[#002433]/5">
                  {notifications.map((notif) => {
                    const style = getIconForType(notif.type);
                    return (
                      <div 
                        key={notif.id} 
                        className={`p-4 md:p-5 transition-colors flex gap-3 md:gap-4 ${
                          notif.isRead ? 'bg-[#ffffff] hover:bg-[#f5f3f3]/50' : 'bg-[#f5f3f3]'
                        }`}
                      >
                        {/* Icon */}
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 ${style.bg}`}>
                          <span className={`material-symbols-outlined text-[18px] md:text-[20px] ${style.color}`}>
                            {style.icon}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className={`text-sm font-bold ${notif.isRead ? 'text-[#41484c]' : 'text-[#002433]'}`}>
                              {notif.title}
                            </h3>
                            <span className="text-[9px] md:text-[10px] font-bold text-[#41484c]/60 whitespace-nowrap pt-0.5">
                              {notif.timestamp}
                            </span>
                          </div>
                          <p className={`text-xs leading-relaxed mb-2 ${notif.isRead ? 'text-[#41484c]/80' : 'text-[#41484c] font-medium'}`}>
                            {notif.message}
                          </p>
                          
                          {/* Action Link (if applicable) */}
                          {notif.link && (
                            <Link 
                              href={notif.link}
                              onClick={() => setIsOpen(false)}
                              className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-[#44afa9] hover:text-[#002433] transition-colors"
                            >
                              View Notification <span className="material-symbols-outlined text-[14px] ml-1">arrow_forward</span>
                            </Link>
                          )}
                        </div>
                        
                        {/* Unread Indicator Dot */}
                        {!notif.isRead && (
                          <div className="w-2 h-2 rounded-full bg-[#44afa9] shrink-0 mt-1.5"></div>
                        )}
                      </div>
                    );
                  })}
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