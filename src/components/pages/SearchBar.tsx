"use client";

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, useTransition } from 'react';

export default function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentUrlQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(currentUrlQuery);

  // FIX 1: Sync local state if the URL is cleared externally (e.g., clicking "Clear All")
  useEffect(() => {
    setQuery(currentUrlQuery);
  }, [currentUrlQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const urlQuery = searchParams.get('q') || '';
      
      if (query === urlQuery) {
        return; 
      }

      const params = new URLSearchParams(searchParams.toString());
      
      if (query) {
        params.set('q', query);
      } else {
        params.delete('q');
      }

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query, pathname, router, searchParams]);

  return (
    <div className="relative w-full">
      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#41484c]/60">
        search
      </span>
      
      {/* Notice we increased pr-12 so text doesn't type under the new 'x' button */}
      <input 
        type="text" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for items, locations, or IDs..." 
        className="w-full pl-12 pr-12 py-3 bg-[#f5f3f3] rounded-xl text-sm text-[#002433] placeholder:text-[#41484c]/60 focus:bg-[#ffffff] focus:ring-2 focus:ring-[#44afa9]/30 outline-none transition-all" 
      />
      
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8">
        {isPending ? (
          <span className="w-4 h-4 border-2 border-[#44afa9]/30 border-t-[#44afa9] rounded-full animate-spin"></span>
        ) : query ? (
          <button
            onClick={() => setQuery('')}
            className="flex items-center justify-center text-[#41484c]/60 hover:text-[#ba1a1a] hover:bg-[#ba1a1a]/10 transition-colors rounded-full p-1"
            aria-label="Clear search"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}