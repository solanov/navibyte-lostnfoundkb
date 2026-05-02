"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabase';

export default function SideNav() {
  const router = useRouter();
  
  const filters = [
    { label: 'Categories', icon: 'category', active: true },
    { label: 'Colors', icon: 'palette', active: false },
    { label: 'Buildings', icon: 'apartment', active: false },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="hidden md:flex fixed flex-col gap-6 p-6 overflow-y-auto bg-surface-container-lowest h-screen w-72 left-0 top-0 pt-24 border-r border-outline-variant/30">
      <div className="mb-2">
        <h2 className="font-body text-[11px] uppercase tracking-widest font-bold text-primary">
          Archive Filters
        </h2>
        <p className="text-xs text-outline opacity-70">New Era University</p>
      </div>
      
      <nav className="space-y-1">
        {filters.map((filter) => (
          <div 
            key={filter.label}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:translate-x-1 transition-transform duration-300 rounded-md ${
              filter.active 
                ? 'bg-primary-container text-on-primary-container shadow-sm' 
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined text-xl">{filter.icon}</span>
            <span className="font-body text-[11px] uppercase tracking-widest font-bold">
              {filter.label}
            </span>
          </div>
        ))}
      </nav>

      <div className="mt-auto pb-24 flex flex-col gap-3">
        <Link href="/create" className="flex items-center justify-center w-full btn-tertiary text-on-tertiary py-3 rounded-md font-bold text-sm tracking-wide shadow-lg hover:brightness-110 active:scale-95 transition-all">
          Create Entry
        </Link>
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-md font-bold text-sm tracking-wide text-error border border-error/30 hover:bg-error/10 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
}