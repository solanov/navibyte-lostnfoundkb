import Link from "next/link";

export default function TopNav() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#053B50] backdrop-blur-md bg-opacity-85 shadow-[0_20px_40px_rgba(0,36,51,0.06)] flex justify-between items-center px-8 py-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-white text-2xl">school</span>
        <span className="text-xl font-black text-white tracking-[-2%] font-headline">
          The Academic Curator
        </span>
      </div>
      
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-6">
          <Link href="#" className="font-headline tracking-tight font-bold text-lg text-white border-b-2 border-tertiary pb-1">
            Home
          </Link>
          <Link href="#" className="font-headline tracking-tight font-bold text-lg text-white/70 hover:text-white transition-colors">
            Archive
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/50">search</span>
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-white/10 text-white border-none rounded-full py-1.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-white/30 w-48 transition-all" 
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-white hover:bg-white/10 rounded-full transition-all duration-200 scale-95 active:scale-90">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 text-white hover:bg-white/10 rounded-full transition-all duration-200 scale-95 active:scale-90">
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}