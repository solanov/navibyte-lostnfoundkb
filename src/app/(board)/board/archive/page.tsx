import Sidebar from '@/src/components/layout/SideNav';
import BottomNavBar from '@/src/components/layout/BottomNavBar';
import Link from 'next/link';
import ArchiveClient from './ArchiveClient';

export const dynamic = 'force-dynamic';

export default async function ArchivePage() {
  return (
    <div className="bg-background text-foreground min-h-screen font-body selection:bg-primary-fixed selection:text-primary pb-24 md:pb-0">
      
      {/* Sticky Mobile Header */}
      <div className="md:hidden sticky top-[72px] z-40 px-4 py-3 bg-surface-container-low/90 backdrop-blur-md border-b border-outline-variant/20">
        <h1 className="text-xl font-bold text-primary font-headline">My Archive</h1>
      </div>

      <div className="flex min-h-screen">
        <Sidebar />
        
        <main className="flex-1 md:ml-72 bg-surface-container-low p-4 md:p-8 pt-6 md:pt-24">
          <div className="max-w-4xl mx-auto">
            
            {/* Feed Header */}
            <div className="mb-8 flex justify-between items-end">
              <div>
                <h1 className="hidden md:block text-4xl font-extrabold tracking-tighter text-primary font-headline">
                  My Archive
                </h1>
                <p className="text-on-surface-variant font-medium mt-1">
                  History of your deleted and returned posts.
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/board" className="bg-surface-container-lowest text-primary border border-outline-variant/30 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-surface-container-high transition-all">
                  Back to Board
                </Link>
              </div>
            </div>

            <ArchiveClient />

          </div>
        </main>
      </div>
      
      <BottomNavBar />
    </div>
  );
}
