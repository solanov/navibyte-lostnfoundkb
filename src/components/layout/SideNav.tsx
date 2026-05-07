"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { supabase } from '@/src/lib/supabase';

interface SideNavProps {
  categoryOptions?: string[];
  colorOptions?: string[];
  buildingOptions?: string[];
  selectedCategory?: string;
  selectedColor?: string;
  selectedBuilding?: string;
}

interface FilterGroupProps {
  icon: string;
  label: string;
  paramKey: 'category' | 'color' | 'building';
  options: string[];
  selectedValue?: string;
  isOpen: boolean;
  onToggle: () => void;
  createHref: (paramKey: 'category' | 'color' | 'building', value?: string) => string;
}

function FilterGroup({
  icon,
  label,
  paramKey,
  options,
  selectedValue,
  isOpen,
  onToggle,
  createHref,
}: FilterGroupProps) {
  const hasOptions = options.length > 0;

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70">
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between px-4 py-3 text-left transition-all duration-200 ${
          selectedValue ? 'text-[#083d4d]' : 'text-slate-600 hover:bg-slate-100/70'
        }`}
      >
        <span className="flex items-center">
          <span className="material-symbols-outlined mr-3">{icon}</span>
          <span className="text-sm font-medium">{label}</span>
        </span>
        <span className="flex items-center gap-2">
          {selectedValue && (
            <span className="max-w-24 truncate rounded-full bg-[#083d4d]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#083d4d]">
              {selectedValue}
            </span>
          )}
          <span className="material-symbols-outlined text-lg text-slate-400">
            {isOpen ? 'expand_less' : 'expand_more'}
          </span>
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 px-3 py-2">
          <div className="space-y-1">
            {hasOptions ? (
              options.map((option) => (
                <Link
                  key={`${paramKey}-${option}`}
                  href={createHref(paramKey, option)}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                    selectedValue === option
                      ? 'bg-white font-semibold text-[#083d4d] shadow-sm'
                      : 'text-slate-500 hover:bg-white hover:text-[#083d4d]'
                  }`}
                >
                  {option}
                </Link>
              ))
            ) : (
              <p className="px-3 py-2 text-xs italic text-slate-400">No values available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SideNav({
  categoryOptions = [],
  colorOptions = [],
  buildingOptions = [],
  selectedCategory,
  selectedColor,
  selectedBuilding,
}: SideNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [openGroup, setOpenGroup] = useState<string | null | undefined>(undefined);
  
  const isBoardActive = pathname === '/board' || pathname === '/';

  const initialOpenGroup = useMemo(() => {
    if (selectedCategory) return 'Categories';
    if (selectedColor) return 'Colors';
    if (selectedBuilding) return 'Buildings';
    return null;
  }, [selectedBuilding, selectedCategory, selectedColor]);

  const resolvedOpenGroup = openGroup === undefined ? initialOpenGroup : openGroup;

  const createFilterHref = (paramKey: 'category' | 'color' | 'building', value?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(paramKey, value);
    } else {
      params.delete(paramKey);
    }

    const nextQuery = params.toString();
    return nextQuery ? `/board?${nextQuery}` : '/board';
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-72 border-r border-slate-100 bg-white flex-col py-6 px-4 space-y-2 z-50">
      {/* Logo & Branding */}
      <div className="px-4 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#083d4d] rounded-lg flex items-center justify-center overflow-hidden shrink-0">
          <Image src="/navibyte-logo-v2.svg" alt="Navibyte Logo" width={28} height={28} className="drop-shadow-sm" />
        </div>
        <div>
          <h1 className="text-[#083d4d] font-black text-lg leading-tight font-headline">Navibyte KB</h1>
          <p className="text-slate-500 text-xs font-medium">Lost &amp; Found Community</p>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1">
        <Link 
          href="/board"
          className={`flex items-center px-4 py-3 rounded-r-md cursor-pointer transition-all duration-200 ${
            isBoardActive && !selectedCategory && !selectedColor && !selectedBuilding
              ? 'bg-[#083d4d]/10 text-[#083d4d] border-l-4 border-[#083d4d] font-semibold'
              : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent'
          }`}
        >
          <span className="material-symbols-outlined mr-3">grid_view</span>
          <span className="text-sm">Items</span>
        </Link>

        <FilterGroup
          icon="category"
          label="Categories"
          paramKey="category"
          options={categoryOptions}
          selectedValue={selectedCategory}
          isOpen={resolvedOpenGroup === 'Categories'}
          onToggle={() => setOpenGroup((current) => (current === 'Categories' ? null : 'Categories'))}
          createHref={createFilterHref}
        />

        <FilterGroup
          icon="palette"
          label="Colors"
          paramKey="color"
          options={colorOptions}
          selectedValue={selectedColor}
          isOpen={resolvedOpenGroup === 'Colors'}
          onToggle={() => setOpenGroup((current) => (current === 'Colors' ? null : 'Colors'))}
          createHref={createFilterHref}
        />

        <FilterGroup
          icon="apartment"
          label="Buildings"
          paramKey="building"
          options={buildingOptions}
          selectedValue={selectedBuilding}
          isOpen={resolvedOpenGroup === 'Buildings'}
          onToggle={() => setOpenGroup((current) => (current === 'Buildings' ? null : 'Buildings'))}
          createHref={createFilterHref}
        />
      </nav>

      {/* Bottom Section */}
      <div className="pt-4 border-t border-slate-100 space-y-1">
        {/* My Archive */}
        <Link 
          href="/board/archive"
          className="flex items-center px-4 py-3 rounded-r-md cursor-pointer transition-all duration-200 text-slate-600 hover:bg-slate-50"
        >
          <span className="material-symbols-outlined mr-3">inventory_2</span>
          <span className="text-sm">My Archive</span>
        </Link>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 rounded-r-md cursor-pointer transition-all duration-200 text-red-600 hover:bg-red-50"
        >
          <span className="material-symbols-outlined mr-3 text-red-600">logout</span>
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
