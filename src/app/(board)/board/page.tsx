import Sidebar from '@/src/components/layout/SideNav';
import LostItemsSection from '@/src/components/pages/LostItemsSection';
import BottomNavBar from '@/src/components/layout/BottomNavBar';
import Link from 'next/link';
import { supabase } from '@/src/lib/supabase';

export const dynamic = 'force-dynamic';

interface LostItemWithCategory {
  post_id: string;
  general_description: string;
  date_lost?: string;
  zone: string;
  status: string;
  image_url?: string | null;
  reported_by: string;
  categories?: {
    name: string;
    icon_identifier: string;
  };
}

export default async function PublicBoard() {
  const { data: lostItems, error } = await supabase
    .from('public_lost_items')
    .select(`
      *,
      categories (
        name,
        icon_identifier
      )
    `)
    .not('status', 'in', '("Returned","Purged")')
    .order('created_timestamp', { ascending: false });

  if (error) {
    console.error("Error fetching board items:", error);
  }

  const items: LostItemWithCategory[] = lostItems || [];

  return (
    <div className="bg-background text-foreground min-h-screen font-body selection:bg-primary-fixed selection:text-primary pb-24 md:pb-0">
      
      {/* Sticky Mobile Search Bar */}
      <div className="md:hidden sticky top-[72px] z-40 px-4 py-3 bg-surface-container-low/90 backdrop-blur-md">
        <div className="relative w-full max-w-md mx-auto">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input 
            type="text" 
            placeholder="Search archive..." 
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest rounded-full text-sm text-on-surface placeholder:text-on-surface-variant border-none focus:ring-2 focus:ring-on-tertiary-container shadow-sm outline-none transition-all" 
          />
        </div>
      </div>

      <div className="flex min-h-screen">
        <Sidebar />
        
        <main className="flex-1 md:ml-72 bg-surface-container-low p-4 md:p-8 pt-6 md:pt-24">
          <div className="max-w-4xl mx-auto">
            
            {/* Feed Header */}
            <div className="mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tighter text-primary font-headline">
                  Public Board
                </h1>
                <p className="text-on-surface-variant font-medium mt-1">
                  Browse verified lost and found items across campus.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Live Updates
                </span>
              </div>
            </div>

            {/* Lost Items with Interactive Modal */}
            <LostItemsSection items={items} />

            {/* Pagination */}
            {items.length > 0 && (
              <div className="mt-12 text-center">
                <button className="bg-surface-container-lowest text-primary border border-outline-variant/30 px-12 py-4 rounded-xl font-bold text-sm tracking-tight hover:bg-outline-variant/10 transition-all">
                  Load More Archives
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Contextual FAB */}
      <Link href="/create" className="fixed bottom-24 right-6 md:bottom-8 md:right-8 bg-[#44afa9] text-white w-14 h-14 rounded-xl shadow-2xl flex items-center justify-center active:scale-95 transition-all z-40 hover:brightness-110">
        <span className="material-symbols-outlined">edit_square</span>
      </Link>

      <BottomNavBar />
    </div>
  );
}
