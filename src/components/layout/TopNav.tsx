"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/src/lib/supabase";

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const isMessagesPage = pathname?.startsWith("/messages");

  // User States
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  // Popover States
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside the menu to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch complete user data
  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!isMounted) return;
      if (user) {
        setAvatarUrl(user.user_metadata?.avatar_url || user.user_metadata?.picture || null);
        setUserName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || null);

        const { data: profile } = await supabase.from('users').select('full_name, role').eq('user_id', user.id).maybeSingle();
        if (profile) {
          if (profile.full_name) setUserName(profile.full_name);
          if (profile.role) setUserRole(profile.role);
        }
      }
    };
    
    fetchUser();
    return () => { isMounted = false; };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

return (
    <header className="md:hidden fixed inset-x-0 top-0 z-50 bg-[#fbf9f8]/85 backdrop-blur-md px-4 py-3 shadow-[0_20px_40px_rgba(0,36,51,0.06)]">
      <div className="flex items-center justify-between">
        
        {/* Left Side: Contextual Action & Title */}
        <div className="flex items-center gap-1">
          {isMessagesPage && (
            <Link
              href="/board"
              aria-label="Back to board"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#002433] transition-colors duration-200 hover:bg-[#002433]/5 active:scale-95"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
          )}
          <h1 className={`truncate font-headline font-black tracking-tight text-[#002433] ${isMessagesPage ? 'text-lg' : 'text-[26px] pl-1'}`}>
            {isMessagesPage ? "Messages" : "NEUvigate"}
          </h1>
        </div>

        {/* Right Side: Profile Popover */}
        <div className="relative shrink-0" ref={profileMenuRef}>
          
          {/* The Clickable Profile Button */}
          <button 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#002433]/10 bg-white transition-transform active:scale-95 shadow-sm"
            aria-expanded={isProfileMenuOpen}
          >
            {avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="material-symbols-outlined text-[#41484c]">account_circle</span>
            )}
          </button>

          {/* The Floating Menu */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 top-full mt-3 w-60 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,36,51,0.15)] border border-[#002433]/5 overflow-visible z-50 flex flex-col origin-top-right animate-in fade-in zoom-in-95 duration-200">
              
              {/* Upward Arrow pointing to profile picture */}
              <div className="absolute -top-1.5 right-4 w-3 h-3 bg-white border-l border-t border-[#002433]/5 rotate-45"></div>

              {/* Header */}
              <div className="p-4 border-b border-[#002433]/5 bg-white rounded-t-2xl relative z-10">
                <p className="text-sm font-bold text-[#002433] truncate">{userName || '...'}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 bg-[#44afa9]/10 text-[#44afa9] text-[9px] font-black uppercase tracking-widest rounded">{userRole || 'USER'}</span>
              </div>

              {/* Action Links */}
              <div className="p-2 flex flex-col bg-white relative z-10">
                <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f5f3f3] transition-colors text-[#41484c]" onClick={() => setIsProfileMenuOpen(false)}>
                  <span className="material-symbols-outlined text-[18px]">person</span>
                  <span className="text-xs font-bold">View Profile</span>
                </Link>

                {(userRole === 'Admin' || userRole === 'Staff') && (
                  <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#002433]/5 transition-colors text-[#002433]" onClick={() => setIsProfileMenuOpen(false)}>
                    <span className="material-symbols-outlined text-[18px] text-[#44afa9]">admin_panel_settings</span>
                    <span className="text-xs font-bold">Admin Dashboard</span>
                  </Link>
                )}

                <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f5f3f3] transition-colors text-[#41484c]" onClick={() => setIsProfileMenuOpen(false)}>
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                  <span className="text-xs font-bold">Account Settings</span>
                </Link>
              </div>

              {/* Footer / Sign Out */}
              <div className="p-2 bg-[#f5f3f3]/50 rounded-b-2xl relative z-10">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#ba1a1a] hover:text-white transition-all text-[#41484c]"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span className="text-xs font-bold">Sign Out</span>
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </header>
  );
}
