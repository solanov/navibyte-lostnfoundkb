"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState, useRef } from 'react';
import { supabase } from '@/src/lib/supabase';
import NotificationCenter from './NotificationCenter';

export default function SideNav() {
  const router = useRouter();
  const pathname = usePathname();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  // The Toggle State
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Profile Popover State
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isBoardActive = pathname === '/board' || pathname === '/';
  const isMessagesActive = pathname?.startsWith('/messages');
  const isArchiveActive = pathname === '/board/archive';
  const isClaimsActive = pathname?.startsWith('/board/claims');

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
    // Changed from "fixed" to "sticky top-0 h-screen shrink-0" for natural flex layout
    <aside className={`hidden md:flex sticky top-0 h-screen shrink-0 ${isCollapsed ? 'w-[90px] px-3' : 'w-[280px] px-5'} bg-[#f5f3f3] flex-col py-8 z-40 transition-all duration-300 ease-in-out border-r border-[#002433]/5`}>

      {/* Toggle Button - Centered on the right edge */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#002433] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#44afa9] transition-colors z-50"
        aria-label="Toggle Sidebar"
      >
        <span className="material-symbols-outlined text-[16px]">
          {isCollapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>

      {/* Logo & Branding */}
      <div className={`mb-10 flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-2 gap-4'}`}>
        <div className="w-10 h-10 bg-[#002433] rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-[0_10px_20px_rgba(0,36,51,0.15)]">
          <Image src="/navibyte-logo-v2.svg" alt="Navibyte Logo" width={24} height={24} />
        </div>
        {!isCollapsed && (
          <div className="whitespace-nowrap overflow-hidden transition-all duration-300">
            <h1 className="text-[#002433] font-black text-xl leading-tight font-headline tracking-tight">NEUvigate</h1>
            <p className="text-[#41484c] text-xs font-medium uppercase tracking-widest mt-0.5">Lost &amp; Found</p>
          </div>
        )}
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 space-y-2">
        <Link
          href="/board"
          title="Central Feed"
          className={`flex items-center py-3 rounded-xl transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-4'} ${
            isBoardActive
              ? 'bg-[#ffffff] text-[#002433] font-bold shadow-[0_8px_16px_rgba(0,36,51,0.04)]'
              : 'text-[#41484c] hover:bg-[#ffffff]/60 hover:text-[#002433]'
          }`}
        >
          <span className={`material-symbols-outlined ${isCollapsed ? 'mr-0' : 'mr-4'}`} style={{ fontVariationSettings: isBoardActive ? "'FILL' 1" : "'FILL' 0" }}>grid_view</span>
          {!isCollapsed && <span className="text-sm tracking-wide whitespace-nowrap">Home</span>}
        </Link>

        <Link
          href="/board/archive"
          title="My Archive"
          className={`flex items-center py-3 rounded-xl transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-4'} ${
            isArchiveActive
              ? 'bg-[#ffffff] text-[#002433] font-bold shadow-[0_8px_16px_rgba(0,36,51,0.04)]'
              : 'text-[#41484c] hover:bg-[#ffffff]/60 hover:text-[#002433]'
          }`}
        >
          <span className={`material-symbols-outlined ${isCollapsed ? 'mr-0' : 'mr-4'}`} style={{ fontVariationSettings: isArchiveActive ? "'FILL' 1" : "'FILL' 0" }}>inventory_2</span>
          {!isCollapsed && <span className="text-sm tracking-wide whitespace-nowrap">My Archive</span>}
        </Link>

        {userRole === 'Public' && (
          <Link
            href="/board/claims"
            title="Claims On My Posts"
            className={`flex items-center py-3 rounded-xl transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-4'} ${
              isClaimsActive
                ? 'bg-[#ffffff] text-[#002433] font-bold shadow-[0_8px_16px_rgba(0,36,51,0.04)]'
                : 'text-[#41484c] hover:bg-[#ffffff]/60 hover:text-[#002433]'
            }`}
          >
            <span className={`material-symbols-outlined ${isCollapsed ? 'mr-0' : 'mr-4'}`} style={{ fontVariationSettings: isClaimsActive ? "'FILL' 1" : "'FILL' 0" }}>assignment</span>
            {!isCollapsed && <span className="text-sm tracking-wide whitespace-nowrap">My Claims</span>}
          </Link>
        )}
      </nav>

      {/* Bottom Pinned User Dock */}
      <div className="mt-auto space-y-2">

        {/* App Controls */}
        <div className={`flex ${isCollapsed ? 'flex-col gap-3' : 'gap-2'} mb-4`}>
          <Link
            href="/messages"
            title="Inbox"
            className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all ${
              isMessagesActive ? 'bg-[#ffffff] text-[#44afa9] shadow-sm' : 'text-[#41484c] hover:bg-[#ffffff]/60 hover:bg-[#002433]/5'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: isMessagesActive ? "'FILL' 1" : "'FILL' 0" }}>forum</span>
            {!isCollapsed && <span className="text-[10px] font-bold uppercase tracking-widest mt-1 whitespace-nowrap">Inbox</span>}
          </Link>

          <Suspense fallback={<NotificationCenterFallback isCollapsed={isCollapsed} />}>
            <NotificationCenter isCollapsed={isCollapsed} variant="sidebar" />
          </Suspense>
        </div>

        {/* Profile Popover Toggle */}
        <div className="relative" ref={profileMenuRef}>
          {isProfileMenuOpen && (
            <div className={`absolute bottom-full mb-3 left-0 w-64 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,36,51,0.12)] border border-[#002433]/5 overflow-visible z-50 flex flex-col ${isCollapsed ? 'left-2' : ''}`}>
              {/* Arrow */}
              <div className={`absolute -bottom-1.5 w-3 h-3 bg-white border-r border-b border-[#002433]/5 rotate-45 ${isCollapsed ? 'left-[14px]' : 'left-7'}`}></div>

              {/* Header */}
              <div className="p-4 border-b border-[#002433]/5 bg-white rounded-t-2xl relative z-10">
                <p className="text-sm font-bold text-[#002433] truncate" title={userName || ''}>{userName || '...'}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 bg-[#44afa9]/10 text-[#44afa9] text-[9px] font-black uppercase tracking-widest rounded">{userRole || 'USER'}</span>
              </div>

              {/* Actions */}
              <div className="p-2 flex flex-col bg-white relative z-10">
                <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f5f3f3] transition-colors text-[#41484c] group" onClick={() => setIsProfileMenuOpen(false)}>
                  <span className="material-symbols-outlined text-[18px] group-hover:text-[#002433]">person</span>
                  <span className="text-xs font-bold">View Profile</span>
                </Link>

                {(userRole === 'Admin' || userRole === 'Staff') && (
                  <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#002433]/5 transition-colors text-[#002433] group" onClick={() => setIsProfileMenuOpen(false)}>
                    <span className="material-symbols-outlined text-[18px] text-[#44afa9]">admin_panel_settings</span>
                    <span className="text-xs font-bold">Admin Dashboard</span>
                  </Link>
                )}
              </div>


              {/* Footer / Sign Out */}
              <div className="p-2 bg-[#f5f3f3]/50 rounded-b-2xl relative z-10">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#ba1a1a] hover:text-white transition-all text-[#41484c] group"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span className="text-xs font-bold">Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* Trigger Button */}
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={`w-full bg-[#ffffff] rounded-2xl shadow-[0_10px_30px_rgba(0,36,51,0.03)] hover:shadow-[0_10px_30px_rgba(0,36,51,0.08)] group transition-all duration-300 flex items-center border border-transparent hover:border-[#002433]/5 focus:outline-none focus:ring-2 focus:ring-[#44afa9]/20 ${isCollapsed ? 'p-2 justify-center' : 'p-3 gap-3'}`}
            aria-label="User Profile Menu"
            aria-expanded={isProfileMenuOpen}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#f5f3f3] shrink-0 border border-black/5">
              {avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="material-symbols-outlined text-[#41484c] w-full h-full flex items-center justify-center">account_circle</span>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 text-left transition-opacity duration-300 flex justify-between items-center">
                <div className="min-w-0 pr-2">
                  <p className="text-sm font-bold text-[#002433] truncate">{userName || '...'}</p>
                  <p className="text-[10px] font-black text-[#44afa9] uppercase tracking-widest mt-0.5">{userRole || 'User'}</p>
                </div>
                <span className={`material-symbols-outlined text-[#41484c]/40 group-hover:text-[#41484c] transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`}>
                  expand_less
                </span>
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

function NotificationCenterFallback({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <div
      className="relative flex-1 flex flex-col items-center justify-center rounded-xl py-3 text-[#41484c]"
      aria-hidden="true"
    >
      <div className="relative mb-1 flex items-center justify-center">
        <span className="material-symbols-outlined">notifications</span>
      </div>
      {!isCollapsed && <span className="text-[10px] font-bold uppercase tracking-widest">Notifications</span>}
    </div>
  );
}
