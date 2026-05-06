import Sidebar from '@/src/components/layout/SideNav';
import LostItemsSection from '@/src/components/pages/LostItemsSection';
import BottomNavBar from '@/src/components/layout/BottomNavBar';
import CreateEntryOverlay from '@/src/components/pages/CreateEntryOverlay';
import Link from 'next/link';
import { supabase } from '@/src/lib/supabase';

export const dynamic = 'force-dynamic';

const fallbackCategoryOptions = ['Wallet', 'Keys', 'ID', 'Tech'];

interface SearchParamMap {
  [key: string]: string | string[] | undefined;
}

interface LostItemWithCategory {
  post_id: string;
  category?: string;
  general_description: string;
  date_lost?: string;
  zone: string;
  color?: string;
  status: string;
  image_url?: string | null;
  reported_by: string;
  created_timestamp?: string;
  categories?: {
    name: string;
    icon_identifier: string;
  } | {
    name: string;
    icon_identifier: string;
  }[];
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildFilterHref(
  searchParams: SearchParamMap,
  paramKeyToRemove?: 'category' | 'color' | 'building'
) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (!value || key === paramKeyToRemove) return;

    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry) params.append(key, entry);
      });
      return;
    }

    params.set(key, value);
  });

  const query = params.toString();
  return query ? `/board?${query}` : '/board';
}

function matchesFilter(value: string | undefined, selectedValue: string | undefined) {
  if (!selectedValue) return true;
  if (!value) return false;
  return value.trim().toLowerCase() === selectedValue.trim().toLowerCase();
}

function getCategoryName(
  item: LostItemWithCategory,
  categoryMap?: Map<string, string>
) {
  const mappedCategory = categoryMap?.get(item.post_id);
  if (mappedCategory) return mappedCategory;
  if (item.category) return item.category;

  const { categories } = item;
  if (!categories) return undefined;
  return Array.isArray(categories) ? categories[0]?.name : categories.name;
}

export default async function PublicBoard({
  searchParams,
}: {
  searchParams: Promise<SearchParamMap>;
}) {
  const resolvedSearchParams = await searchParams;
  const selectedCategory = getSingleParam(resolvedSearchParams.category);
  const selectedColor = getSingleParam(resolvedSearchParams.color);
  const selectedBuilding = getSingleParam(resolvedSearchParams.building);
  const clearCategoryHref = buildFilterHref(resolvedSearchParams, 'category');
  const clearColorHref = buildFilterHref(resolvedSearchParams, 'color');
  const clearBuildingHref = buildFilterHref(resolvedSearchParams, 'building');

  let categoryDiscoveryData: { post_id: string; category: string | null }[] = [];

  const [itemsResult, categoriesResult] = await Promise.all([
    supabase
      .from('public_lost_items')
      .select(`
        *,
        categories (
          name,
          icon_identifier
        )
      `)
      .not('status', 'in', '("Returned","Purged")')
      .order('created_timestamp', { ascending: false }),
    supabase
      .from('categories')
      .select('name')
      .eq('is_active', true)
      .order('name', { ascending: true }),
  ]);

  try {
    const { data } = await supabase
      .from('public_discovery_board')
      .select('post_id,category');

    if (data) {
      categoryDiscoveryData = data;
    }
  } catch {
    try {
      const { data } = await supabase
        .from('public_lost_items')
        .select('post_id,category');

      if (data) {
        categoryDiscoveryData = data;
      }
    } catch {
      categoryDiscoveryData = [];
    }
  }

  const { data: lostItems, error } = itemsResult;

  if (error) {
    console.error("Error fetching board items:", error);
  }

  const allItems: LostItemWithCategory[] = lostItems || [];
  const discoveredCategoryMap = new Map(
    categoryDiscoveryData
      .filter((item) => item.post_id && item.category)
      .map((item) => [item.post_id, item.category as string])
  );
  const categoryOptionsFromTable = (categoriesResult.data || [])
    .map((category) => category.name)
    .filter(Boolean);
  const derivedCategoryOptions = Array.from(
    new Set(allItems.map((item) => getCategoryName(item, discoveredCategoryMap)).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
  const categoryOptions = (
    categoryOptionsFromTable.length > 0
      ? categoryOptionsFromTable
      : derivedCategoryOptions.length > 0
        ? derivedCategoryOptions
        : fallbackCategoryOptions
  ).sort((a, b) => a.localeCompare(b));
  const colorOptions = Array.from(
    new Set(allItems.map((item) => item.color).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
  const buildingOptions = Array.from(
    new Set(allItems.map((item) => item.zone).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
  const items = allItems.filter((item) => {
    return (
      matchesFilter(getCategoryName(item, discoveredCategoryMap), selectedCategory) &&
      matchesFilter(item.color, selectedColor) &&
      matchesFilter(item.zone, selectedBuilding)
    );
  });

  return (
    <div className="bg-[#f8fafb] text-[#191c1d] min-h-screen font-body selection:bg-primary-fixed selection:text-primary pb-24 md:pb-0">
      
      {/* Sticky Mobile Search Bar */}
      <div className="md:hidden sticky top-[72px] z-40 px-4 py-3 bg-[#f2f4f5]/90 backdrop-blur-md">
        <div className="relative w-full max-w-md mx-auto">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
          <input 
            type="text" 
            placeholder="Search for items, locations, or IDs..." 
            className="w-full pl-11 pr-4 py-2.5 bg-white rounded-full text-sm text-[#191c1d] placeholder:text-slate-400 border border-slate-200 focus:ring-2 focus:ring-[#006a63]/20 shadow-sm outline-none transition-all" 
          />
        </div>
      </div>

      <div className="flex min-h-screen">
        <Sidebar
          categoryOptions={categoryOptions}
          colorOptions={colorOptions}
          buildingOptions={buildingOptions}
          selectedCategory={selectedCategory}
          selectedColor={selectedColor}
          selectedBuilding={selectedBuilding}
        />
        
        <main className="flex-1 md:ml-72 bg-[#f8fafb] p-4 md:p-8 pt-6 md:pt-24">
          <div className="max-w-7xl mx-auto">
            
            {/* Page Header */}
            <div className="mb-8">
              <div>
                <h1 className="text-[28px] font-bold tracking-[-0.02em] leading-[34px] text-[#002632] font-headline">
                  Campus Found Board
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Real-time listing of items recovered across campus facilities.
                </p>
                {(selectedCategory || selectedColor || selectedBuilding) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedCategory && (
                      <Link
                        href={clearCategoryHref}
                        className="inline-flex items-center gap-2 rounded-full bg-[#083d4d]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#083d4d] transition-colors hover:bg-[#083d4d]/15"
                        aria-label={`Remove category filter ${selectedCategory}`}
                      >
                        <span>Category: {selectedCategory}</span>
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </Link>
                    )}
                    {selectedColor && (
                      <Link
                        href={clearColorHref}
                        className="inline-flex items-center gap-2 rounded-full bg-[#006a63]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#006a63] transition-colors hover:bg-[#006a63]/15"
                        aria-label={`Remove color filter ${selectedColor}`}
                      >
                        <span>Color: {selectedColor}</span>
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </Link>
                    )}
                    {selectedBuilding && (
                      <Link
                        href={clearBuildingHref}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-slate-700 transition-colors hover:bg-slate-300"
                        aria-label={`Remove building filter ${selectedBuilding}`}
                      >
                        <span>Building: {selectedBuilding}</span>
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Lost Items with Interactive Modal */}
            <LostItemsSection items={items} />

            {/* Pagination */}
            {items.length > 0 && (
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-6 gap-4">
                <p className="text-[13px] text-slate-500">
                  Showing {items.length} recovered items
                </p>
                <div className="flex gap-2">
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors">
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#002632] text-white font-semibold text-sm">1</button>
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm transition-colors">2</button>
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm transition-colors">3</button>
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <CreateEntryOverlay />

      <BottomNavBar />
    </div>
  );
}
