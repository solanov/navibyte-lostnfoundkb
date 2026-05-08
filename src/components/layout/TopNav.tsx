"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";

export default function TopNav() {
  const pathname = usePathname();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const isMessagesPage = pathname?.startsWith("/messages");

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!isMounted) return;
      if (user) {
        setAvatarUrl(user.user_metadata?.avatar_url || user.user_metadata?.picture || null);
      }
    };
    
    fetchUser();
    return () => { isMounted = false; };
  }, []);

  return (
    <header className="md:hidden fixed inset-x-0 top-0 z-50 bg-[#fbf9f8]/85 backdrop-blur-md px-4 py-3 shadow-[0_20px_40px_rgba(0,36,51,0.06)]">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
        {isMessagesPage ? (
          <Link
            href="/board"
            aria-label="Back to board"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#002433] transition-colors duration-200 hover:bg-[#f5f3f3] active:scale-95"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
        ) : (
          <button
            type="button"
            aria-label="Open navigation"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#002433] transition-colors duration-200 hover:bg-[#f5f3f3] active:scale-95"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        )}

        <h1 className="truncate text-center font-headline text-lg font-black tracking-tight text-[#002433]">
          {isMessagesPage ? "Messages" : "Navibyte KB"}
        </h1>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#002433]/10 bg-white">
          {avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="material-symbols-outlined text-[#41484c]">account_circle</span>
          )}
        </div>
      </div>
    </header>
  );
}