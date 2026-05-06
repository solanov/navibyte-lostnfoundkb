"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";

export default function TopNav() {
  const pathname = usePathname();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const isBoardActive = pathname === "/board" || pathname === "/";
  const isMessagesActive = pathname?.startsWith("/messages");

  useEffect(() => {
    let isMounted = true;
    const fetchAvatar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!isMounted) return;
      if (user) {
        setAvatarUrl(
          user.user_metadata?.avatar_url || 
          user.user_metadata?.picture || 
          null
        );
      }
    };

    fetchAvatar();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchAvatar();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const linkClass = (active: boolean) =>
    `font-headline tracking-tight font-bold text-lg pb-1 transition-colors ${
      active
        ? "text-white border-b-2 border-tertiary"
        : "text-white/70 hover:text-white"
    }`;

  return (
    <header className="fixed top-0 w-full z-50 bg-[#053B50] backdrop-blur-md bg-opacity-85 shadow-[0_20px_40px_rgba(0,36,51,0.06)] flex justify-between items-center px-4 md:px-8 py-4">
      {/* Mobile Hamburger Menu */}
      <button className="md:hidden flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-colors active:scale-95 duration-200 text-white">
        <span className="material-symbols-outlined">menu</span>
      </button>

      {/* Desktop Logo & Title */}
      <div className="hidden md:flex items-center gap-3">
        <Image src="/navibyte-logo-v2.svg" alt="Navibyte Logo" width={40} height={40} className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transform hover:scale-110 transition-all duration-300 will-change-transform" />
        <span className="text-xl font-black text-white tracking-[-2%] font-headline drop-shadow-md">
          Navibyte KB
        </span>
      </div>

      {/* Mobile Centered Title */}
      <h1 className="md:hidden font-headline tracking-tight font-black uppercase tracking-wider text-center flex-grow text-xl text-white drop-shadow-md">
        Navibyte KB
      </h1>

      {/* Mobile Profile Image */}
      <div className="md:hidden w-10 h-10 rounded-full overflow-hidden bg-surface-container flex items-center justify-center border border-white/20 shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="material-symbols-outlined text-white">account_circle</span>
        )}
      </div>
      
      {/* Desktop Navigation Links & Search */}
      <div className="hidden md:flex items-center gap-8">
        <div className="flex items-center gap-6">
          <Link href="/board" className={linkClass(isBoardActive)}>
            Home
          </Link>
          <Link href="/messages" className={linkClass(isMessagesActive)}>
            Messages
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">search</span>
            <input 
              type="text" 
              placeholder="Search the archives..." 
              className="bg-white/10 text-white border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-[#44afa9] w-48 transition-all placeholder:text-white/50" 
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-white hover:bg-white/10 rounded-full transition-all duration-200 scale-95 active:scale-90">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-1 text-white hover:bg-white/10 rounded-full transition-all duration-200 scale-95 active:scale-90 flex items-center justify-center h-10 w-10 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="material-symbols-outlined">account_circle</span>
                )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
