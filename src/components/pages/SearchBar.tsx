"use client";

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, useTransition } from 'react';

export default function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Initialize with the current URL parameter if it exists
  const [query, setQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    // Debounce: Wait 300ms after the user stops typing to update the URL
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      
      if (query) {
        params.set('q', query);
      } else {
        params.delete('q');
      }

      // startTransition prevents the page from freezing while fetching new data
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query, pathname, router, searchParams]);

  return (
    <div className="relative w-full">
      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#41484c]/60">
        search
      </span>
      <input 
        type="text" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for items, locations, or IDs..." 
        className="w-full pl-12 pr-4 py-3 bg-[#f5f3f3] rounded-xl text-sm text-[#002433] placeholder:text-[#41484c]/60 focus:bg-[#ffffff] focus:ring-2 focus:ring-[#44afa9]/30 outline-none transition-all" 
      />
      {/* Optional loading spinner while server fetches */}
      {isPending && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#44afa9]/30 border-t-[#44afa9] rounded-full animate-spin"></span>
      )}
    </div>
  );
}