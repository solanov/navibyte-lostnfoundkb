"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";

export default function TopNav() {
  const pathname = usePathname();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("Student");
  const isMessagesPage = pathname?.startsWith("/messages");

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!isMounted) return;
      if (user) {
        setAvatarUrl(
          user.user_metadata?.avatar_url || 
          user.user_metadata?.picture || 
          null
        );
        setUserName(
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          null
        );
      }

      // Try to get role from users table
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!isMounted) return;
        if (profile) {
          if (profile.full_name) setUserName(profile.full_name);
          if (profile.role) setUserRole(profile.role);
        }
      }
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      {/* Desktop TopBar — sits inside main content area (right of sidebar) */}
      <header
        className={`hidden md:flex fixed top-0 right-0 z-40 h-16 items-center justify-between border-b border-slate-200 bg-white px-8 ${
          isMessagesPage ? "left-0" : "left-72"
        }`}
      >
        {/* Search */}
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {isMessagesPage && (
            <Link
              href="/board"
              aria-label="Back to board"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#002632] transition-colors duration-200 hover:bg-slate-100 active:scale-95"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
          )}
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
            <input 
              type="text" 
              placeholder="Search for items, locations, or IDs..." 
              className="w-full max-w-xl bg-slate-50 border-none rounded-full py-2 pl-11 pr-4 text-sm focus:ring-2 focus:ring-[#006a63]/20 placeholder:text-slate-400 outline-none transition-all" 
            />
          </div>
        </div>

        {/* Right Section: Icons + User */}
        <div className="flex items-center gap-4">
          {/* Chat + Notifications in pill */}
          <div className="flex items-center gap-1 bg-slate-50 rounded-full px-2 py-1">
            <Link href="/messages" className="p-2 text-slate-500 hover:text-[#002632] transition-colors active:opacity-70">
              <span className="material-symbols-outlined">chat</span>
            </Link>
            <button className="p-2 text-slate-500 hover:text-[#002632] transition-colors relative active:opacity-70">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full border-2 border-white"></span>
            </button>
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-slate-200"></div>

          {/* User Info */}
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="text-right">
              <p className="text-sm font-semibold text-[#083d4d] leading-none">{userName || 'User'}</p>
              <p className="text-[10px] font-bold text-[#006a63] uppercase tracking-widest mt-1">{userRole}</p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-slate-50 group-hover:border-[#006a63]/30 transition-all overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
              {avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="material-symbols-outlined text-slate-400">account_circle</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile TopBar — full-width header with branding */}
      <header className="md:hidden fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white px-4 py-3">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
          {isMessagesPage ? (
            <Link
              href="/board"
              aria-label="Back to board"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#002632] transition-colors duration-200 hover:bg-slate-100 active:scale-95"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
          ) : (
            <button
              type="button"
              aria-label="Open navigation"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#002632] transition-colors duration-200 hover:bg-slate-100 active:scale-95"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          )}

          <h1 className="truncate text-center font-headline text-lg font-black tracking-tight text-[#083d4d]">
            {isMessagesPage ? "Messages" : "Navibyte KB"}
          </h1>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            {avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="material-symbols-outlined text-slate-400">account_circle</span>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
