import Link from 'next/link';

export default function BottomNavBar() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full h-20 flex justify-around items-center px-4 pb-safe bg-white/85 dark:bg-slate-950/85 backdrop-blur-lg rounded-t-xl z-50 shadow-[0_-4px_20px_rgba(0,36,51,0.04)] text-[#44afa9]">
      <Link href="/board" className="flex flex-col items-center justify-center bg-[#8df4ec]/20 text-[#002433] dark:text-[#8df4ec] rounded-xl px-5 py-1.5 active:scale-90 duration-150">
        <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
        <span className="font-label text-[11px] font-semibold uppercase tracking-widest">Home</span>
      </Link>
      <Link href="#" className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-[#44afa9] transition-all">
        <span className="material-symbols-outlined mb-1">inventory_2</span>
        <span className="font-label text-[11px] font-semibold uppercase tracking-widest">Archive</span>
      </Link>
      <Link href="#" className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-[#44afa9] transition-all">
        <span className="material-symbols-outlined mb-1">account_circle</span>
        <span className="font-label text-[11px] font-semibold uppercase tracking-widest">Profile</span>
      </Link>
    </nav>
  );
}
