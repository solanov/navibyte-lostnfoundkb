import TopNav from '@/src/components/layout/TopNav';
import Sidebar from '@/src/components/layout/SideNav';
import ItemCard from '@/src/components/ui/ItemCard';
import PriorityCard from '@/src/components/ui/PriorityCard';
import BottomNavBar from '@/src/components/layout/BottomNavBar';
import Link from 'next/link';

export default function PublicBoard() {
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

            {/* Bento-Style Grid Feed */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ItemCard 
                status="Found"
                icon="laptop_mac"
                placeholderIcon="lock"
                placeholderText="Media Redacted for Privacy"
                title="Silver Portable Device"
                location="Engineering Building - Hallway B"
                reference="AC-9921"
              />
              
              <ItemCard 
                status="Lost"
                icon="account_balance_wallet"
                placeholderIcon="visibility_off"
                placeholderText="Verification Required"
                title="Leather Document Holder"
                location="University Library - 3rd Floor"
                reference="AC-8442"
              />

              <PriorityCard />

              <ItemCard 
                status="Found"
                icon="phone_iphone"
                placeholderIcon="lock_clock"
                placeholderText="Locked Placeholder"
                title="Mobile Device (Locked)"
                location="Cafeteria Terrace"
                reference="AC-1102"
              />
            </div>

            {/* Pagination */}
            <div className="mt-12 text-center">
              <button className="bg-surface-container-lowest text-primary border border-outline-variant/30 px-12 py-4 rounded-xl font-bold text-sm tracking-tight hover:bg-outline-variant/10 transition-all">
                Load More Archives
              </button>
            </div>
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