import Link from "next/link";

export default function TopNav() {
  return (
    <header className="fixed top-0 w-full z-50 bg-[#053B50] backdrop-blur-md bg-opacity-85 shadow-[0_20px_40px_rgba(0,36,51,0.06)] flex justify-between items-center px-4 md:px-8 py-4">
      {/* Mobile Hamburger Menu */}
      <button className="md:hidden flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-colors active:scale-95 duration-200 text-white">
        <span className="material-symbols-outlined">menu</span>
      </button>

      {/* Desktop Logo & Title */}
      <div className="hidden md:flex items-center gap-2">
        <span className="material-symbols-outlined text-white text-2xl">school</span>
        <span className="text-xl font-black text-white tracking-[-2%] font-headline">
          The Academic Curator
        </span>
      </div>

      {/* Mobile Centered Title */}
      <h1 className="md:hidden font-headline tracking-tight font-black uppercase tracking-wider text-center flex-grow text-xl text-white">
        The Academic Curator
      </h1>

      {/* Mobile Profile Image */}
      <div className="md:hidden w-10 h-10 rounded-full overflow-hidden bg-surface-container flex items-center justify-center border border-white/20">
        <span className="material-symbols-outlined text-white">account_circle</span>
      </div>
      
      {/* Desktop Navigation Links & Search */}
      <div className="hidden md:flex items-center gap-8">
        <div className="flex items-center gap-6">
          <Link href="/board" className="font-headline tracking-tight font-bold text-lg text-white border-b-2 border-tertiary pb-1">
            Home
          </Link>
          <Link href="#" className="font-headline tracking-tight font-bold text-lg text-white/70 hover:text-white transition-colors">
            Archive
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">search</span>
            <input 
              type="text" 
              placeholder="Search the archives..." 
              className="bg-white/10 text-white border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-[#44afa9] w-48 transition-all placeholder:text-white/50" 
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
    </header>
  );
}