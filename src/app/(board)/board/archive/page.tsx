import Sidebar from '@/src/components/layout/SideNav';
import Link from 'next/link';
import ArchiveClient from './ArchiveClient';

export const dynamic = 'force-dynamic';

export default async function ArchivePage() {
  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar Navigation */}
      <Sidebar />
      
      <main className="flex-1 bg-[#fbf9f8] p-4 md:pt-16 md:pl-16 md:pr-12 pt-20 min-w-0 transition-all duration-300">
        
        {/* FIX: Removed 'mx-auto' so it aligns flush left with our custom padding! */}
        <div className="w-full max-w-7xl">
          
          {/* Feed Header - No bottom line! */}
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[#002433] font-headline">
                My Archive
              </h1>
              <p className="text-[#41484c] text-sm font-medium mt-1">
                History of your deleted and returned posts.
              </p>
            </div>
            <div className="flex gap-2">
              {/* Original Back to Board Button */}
              <Link 
                href="/board" 
                className="bg-surface-container-lowest text-primary border border-outline-variant/30 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-surface-container-high transition-all"
              >
                Back to Board
              </Link>
            </div>
          </div>

          {/* The Client Component that renders the actual items */}
          <ArchiveClient />

        </div>
      </main>
    </div>
  );
}