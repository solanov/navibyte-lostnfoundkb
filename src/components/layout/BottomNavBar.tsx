"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNavBar() {
  const pathname = usePathname();
  const isBoardActive = pathname === '/board' || pathname === '/';
  const isMessagesActive = pathname?.startsWith('/messages');

  const linkClass = (active: boolean) =>
    `flex flex-col items-center justify-center rounded-xl px-5 py-1.5 transition-all active:scale-90 duration-150 ${
      active
        ? 'bg-[#8df4ec]/20 text-[#002433] dark:text-[#8df4ec]'
        : 'text-slate-400 dark:text-slate-500 hover:text-[#44afa9]'
    }`;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full h-20 flex justify-around items-center px-4 pb-safe bg-white/85 dark:bg-slate-950/85 backdrop-blur-lg rounded-t-xl z-50 shadow-[0_-4px_20px_rgba(0,36,51,0.04)] text-[#44afa9]">
      <Link href="/board" className={linkClass(isBoardActive)}>
        <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: isBoardActive ? "'FILL' 1" : "'FILL' 0" }}>home</span>
        <span className="font-label text-[11px] font-semibold uppercase tracking-widest">Home</span>
      </Link>
      <Link href="/messages" className={linkClass(isMessagesActive)}>
        <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: isMessagesActive ? "'FILL' 1" : "'FILL' 0" }}>forum</span>
        <span className="font-label text-[11px] font-semibold uppercase tracking-widest">Messages</span>
      </Link>
      <Link href="#" className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-[#44afa9] transition-all">
        <span className="material-symbols-outlined mb-1">account_circle</span>
        <span className="font-label text-[11px] font-semibold uppercase tracking-widest">Profile</span>
      </Link>
    </nav>
  );
}
