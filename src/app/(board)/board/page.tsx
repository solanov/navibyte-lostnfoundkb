import Sidebar from '@/src/components/layout/SideNav';
import LostItemsSection from '@/src/components/pages/LostItemsSection';
import BottomNavBar from '@/src/components/layout/BottomNavBar';
import CreateEntryOverlay from '@/src/components/pages/CreateEntryOverlay';
import Link from 'next/link';
import { supabase } from '@/src/lib/supabase';
import SearchBar from '@/src/components/pages/SearchBar';
import FilterDetails from '@/src/components/pages/FilterDetails';

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
  };
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

// Helper to clear a parameter
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

// Helper to toggle a parameter (add it, or remove it if already active)
function buildToggleHref(searchParams: SearchParamMap, key: 'category' | 'color' | 'building', value: string) {
  const currentVal = getSingleParam(searchParams[key]);
  if (currentVal === value) {
    return buildFilterHref(searchParams, key); // Remove if already active
  }
  
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => {
    if (!v || k === key) return; // Skip empty or the key we are overriding
    if (Array.isArray(v)) {
      v.forEach((entry) => { if (entry) params.append(k, entry); });
    } else {
      params.set(k, v);
    }
  });
  params.set(key, value);
  return `/board?${params.toString()}`;
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

  return item.categories?.name;
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
  const searchQuery = getSingleParam(resolvedSearchParams.q);

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
    const { data } = await supabase.from('public_discovery_board').select('post_id,category');
    if (data) categoryDiscoveryData = data;
  } catch {
    try {
      const { data } = await supabase.from('public_lost_items').select('post_id,category');
      if (data) categoryDiscoveryData = data;
    } catch {
      categoryDiscoveryData = [];
    }
  }

  const { data: lostItems, error } = itemsResult;
  if (error) console.error("Error fetching board items:", error);

  const allItems: LostItemWithCategory[] = lostItems || [];
  const discoveredCategoryMap = new Map(
    categoryDiscoveryData
      .filter((item) => item.post_id && item.category)
      .map((item) => [item.post_id, item.category as string])
  );
  
const categoryOptionsFromTable = (categoriesResult.data || []).map((category) => category.name).filter(Boolean);
  
  // Added strict type guards so TypeScript knows these are 100% strings, not undefined
  const derivedCategoryOptions = Array.from(
    new Set(allItems.map((item) => getCategoryName(item, discoveredCategoryMap)).filter((val): val is string => Boolean(val)))
  ).sort((a, b) => a.localeCompare(b));
  
  const categoryOptions = (
    categoryOptionsFromTable.length > 0 ? categoryOptionsFromTable : derivedCategoryOptions.length > 0 ? derivedCategoryOptions : fallbackCategoryOptions
  ).sort((a, b) => a.localeCompare(b));
  
  const colorOptions = Array.from(
    new Set(allItems.map((item) => item.color).filter((val): val is string => Boolean(val)))
  ).sort((a, b) => a.localeCompare(b));
  
  const buildingOptions = Array.from(
    new Set(allItems.map((item) => item.zone).filter((val): val is string => Boolean(val)))
  ).sort((a, b) => a.localeCompare(b));
  
  const items = allItems.filter((item) => {
    // Check if the search query matches the title, description, zone, or ID
    const matchesSearch = !searchQuery || 
      item.general_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.zone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.post_id?.toLowerCase().includes(searchQuery.toLowerCase());

    return (
      matchesSearch && // <-- Add this line to the return statement
      matchesFilter(getCategoryName(item, discoveredCategoryMap), selectedCategory) &&
      matchesFilter(item.color, selectedColor) &&
      matchesFilter(item.zone, selectedBuilding)
    );
  });

  return (
    <div className="bg-[#fbf9f8] text-[#41484c] min-h-screen font-body selection:bg-[#8df4ec] selection:text-[#002433] pb-24 md:pb-0">
      
      <div className="flex min-h-screen">
        {/* Sidebar no longer needs filter props */}
        <Sidebar />
        
        {/* Main Feed with Asymmetrical Margins */}
        <main className="flex-1 bg-[#fbf9f8] p-4 md:pt-16 md:pl-16 md:pr-12 pt-20 min-w-0 transition-all duration-300">
          <div className="max-w-7xl mx-auto">
            
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-[32px] md:text-[40px] font-black tracking-[-0.02em] leading-tight text-[#002433] font-headline">
                Campus Lost & Found Board
              </h1>
              <p className="text-sm text-[#41484c] font-medium mt-2">
                Real-time listing of items recovered across campus facilities.
              </p>
            </div>

            {/* Glassmorphism Command Center (Search & Compact Filters) */}
            <div className="sticky top-[72px] md:top-6 z-30 mb-6 md:mb-10 rounded-xl md:rounded-2xl bg-[#ffffff]/85 p-3 md:p-5 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,36,51,0.04)] border border-[#002433]/5 flex flex-col gap-3 md:gap-4">
              
              {/* Search Bar */}
              {/* Search Bar Component */}
              <SearchBar />

              {/* Compact Filters Row */}
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 pt-1">
                
                {/* Header Group (Filters Title + Mobile Clear All) */}
                <div className="flex items-center justify-between w-full md:w-auto shrink-0 px-1 md:px-0">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#44afa9] text-[20px]">tune</span>
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#002433]">Filters</span>
                  </div>

                  {/* Mobile Clear Button */}
                  {(selectedCategory || selectedColor || selectedBuilding) && (
                    <Link 
                      href="/board" 
                      className="text-[10px] font-bold uppercase tracking-widest text-[#ba1a1a] hover:underline md:hidden"
                      scroll={false}
                    >
                      Clear All
                    </Link>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Category Dropdown */}
                  {categoryOptions.length > 0 && (
                    <FilterDetails name="board-filters" className="relative group shrink-0">
                      <summary className="list-none [&::-webkit-details-marker]:hidden flex w-full justify-between cursor-pointer items-center rounded-lg bg-[#f5f3f3] px-3 md:px-4 py-2 text-xs font-semibold text-[#41484c] hover:bg-[#002433]/10 transition-all select-none">
                        <div className="flex items-center gap-2">
                          Category
                        {selectedCategory && <span className="w-2 h-2 rounded-full bg-[#44afa9]"></span>}
                        </div>
                          <span className="material-symbols-outlined text-[16px] group-open:rotate-180 transition-transform">expand_more</span>
                      </summary>
                      <div className="absolute left-0 top-full mt-2 w-48 rounded-xl bg-[#ffffff] p-2 shadow-[0_20px_40px_rgba(0,36,51,0.1)] border border-[#002433]/5 z-50 max-h-64 overflow-y-auto">
                        <Link
                          href={buildFilterHref(resolvedSearchParams, 'category')}
                          scroll={false}
                          className={`block w-full rounded-md px-3 py-2 text-left text-xs font-semibold transition-all ${
                            !selectedCategory ? "bg-[#002433] text-white" : "text-[#41484c] hover:bg-[#f5f3f3]"
                          }`}
                        >
                          All Categories
                        </Link>
                        {categoryOptions.map((cat) => (
                          <Link
                            key={cat}
                            href={buildToggleHref(resolvedSearchParams, 'category', cat)}
                            scroll={false}
                            className={`block w-full rounded-md px-3 py-2 mt-1 text-left text-xs font-semibold transition-all ${
                              selectedCategory === cat ? "bg-[#002433] text-white" : "text-[#41484c] hover:bg-[#f5f3f3]"
                            }`}
                          >
                            {cat}
                          </Link>
                        ))}
                      </div>
                    </FilterDetails>
                  )}

                  {/* Color Dropdown */}
                  {colorOptions.length > 0 && (
                    <FilterDetails name="board-filters" className="relative group shrink-0">
                      <summary className="list-none [&::-webkit-details-marker]:hidden flex w-full justify-between cursor-pointer items-center rounded-lg bg-[#f5f3f3] px-3 md:px-4 py-2 text-xs font-semibold text-[#41484c] hover:bg-[#002433]/10 transition-all select-none">
                        <div className="flex items-center gap-2">
                          Color
                        {selectedColor && <span className="w-2 h-2 rounded-full bg-[#44afa9]"></span>}
                        </div>
                        <span className="material-symbols-outlined text-[16px] group-open:rotate-180 transition-transform">expand_more</span>
                      </summary>
                      <div className="absolute left-0 top-full mt-2 w-48 rounded-xl bg-[#ffffff] p-2 shadow-[0_20px_40px_rgba(0,36,51,0.1)] border border-[#002433]/5 z-50 max-h-64 overflow-y-auto">
                        <Link
                          href={buildFilterHref(resolvedSearchParams, 'color')}
                          scroll={false}
                          className={`block w-full rounded-md px-3 py-2 text-left text-xs font-semibold transition-all ${
                            !selectedColor ? "bg-[#44afa9] text-white" : "text-[#41484c] hover:bg-[#f5f3f3]"
                          }`}
                        >
                          All Colors
                        </Link>
                        {colorOptions.map((color) => (
                          <Link
                            key={color}
                            href={buildToggleHref(resolvedSearchParams, 'color', color)}
                            scroll={false}
                            className={`block w-full rounded-md px-3 py-2 mt-1 text-left text-xs font-semibold transition-all ${
                              selectedColor === color ? "bg-[#44afa9] text-white" : "text-[#41484c] hover:bg-[#f5f3f3]"
                            }`}
                          >
                            {color}
                          </Link>
                        ))}
                      </div>
                    </FilterDetails>
                  )}

                  {/* Location Dropdown */}
                  {buildingOptions.length > 0 && (
                    <FilterDetails name="board-filters" className="relative group shrink-0">
                      <summary className="list-none [&::-webkit-details-marker]:hidden flex w-full justify-between cursor-pointer items-center rounded-lg bg-[#f5f3f3] px-3 md:px-4 py-2 text-xs font-semibold text-[#41484c] hover:bg-[#002433]/10 transition-all select-none">
                        <div className="flex items-center gap-2">
                          Location
                          {selectedBuilding && <span className="w-2 h-2 rounded-full bg-[#44afa9]"></span>}
                        </div>
                        <span className="material-symbols-outlined text-[16px] group-open:rotate-180 transition-transform">expand_more</span>
                      </summary>
                      <div className="absolute left-0 top-full mt-2 w-48 rounded-xl bg-[#ffffff] p-2 shadow-[0_20px_40px_rgba(0,36,51,0.1)] border border-[#002433]/5 z-50 max-h-64 overflow-y-auto">
                        <Link
                          href={buildFilterHref(resolvedSearchParams, 'building')}
                          scroll={false}
                          className={`block w-full rounded-md px-3 py-2 text-left text-xs font-semibold transition-all ${
                            !selectedBuilding ? "bg-[#002433] text-white" : "text-[#41484c] hover:bg-[#f5f3f3]"
                          }`}
                        >
                          All Locations
                        </Link>
                        {buildingOptions.map((bldg) => (
                          <Link
                            key={bldg}
                            href={buildToggleHref(resolvedSearchParams, 'building', bldg)}
                            scroll={false}
                            className={`block w-full rounded-md px-3 py-2 mt-1 text-left text-xs font-semibold transition-all ${
                              selectedBuilding === bldg ? "bg-[#002433] text-white" : "text-[#41484c] hover:bg-[#f5f3f3]"
                            }`}
                          >
                            {bldg}
                          </Link>
                        ))}
                      </div>
                    </FilterDetails>
                  )}
                </div>

                {/* Desktop Clear Button */}
                {(selectedCategory || selectedColor || selectedBuilding) && (
                  <Link 
                    href="/board" 
                    className="hidden md:block ml-auto text-[10px] font-bold uppercase tracking-widest text-[#ba1a1a] hover:underline px-2 shrink-0"
                    scroll={false}
                  >
                    Clear All
                  </Link>
                )}
              </div>
            </div>

            {/* Lost Items Grid */}
            <LostItemsSection items={items as any} />

            {/* Pagination */}
            {items.length > 0 && (
              <div className="mt-16 flex flex-col sm:flex-row items-center justify-between pt-6 gap-4 border-t border-[#002433]/5">
                <p className="text-[13px] font-medium text-[#41484c]">
                  Showing {items.length} curated archive items
                </p>
                <div className="flex gap-2">
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#f5f3f3] text-[#41484c] hover:bg-[#002433]/10 transition-colors">
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#002433] text-white font-bold text-sm shadow-md">1</button>
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#f5f3f3] text-[#41484c] hover:bg-[#002433]/10 font-semibold text-sm transition-colors">2</button>
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#f5f3f3] text-[#41484c] hover:bg-[#002433]/10 font-semibold text-sm transition-colors">3</button>
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#f5f3f3] text-[#41484c] hover:bg-[#002433]/10 transition-colors">
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
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