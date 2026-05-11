import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f5f3f3] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-[#002433] rounded-2xl flex items-center justify-center shadow-[0_10px_20px_rgba(0,36,51,0.15)] mb-8">
        <span className="material-symbols-outlined text-4xl text-white">location_off</span>
      </div>
      
      <h1 className="text-4xl md:text-5xl font-black text-[#002433] mb-4 tracking-tight">404</h1>
      <h2 className="text-xl md:text-2xl font-bold text-[#002433] mb-4">Page Not Found</h2>
      
      <p className="text-[#41484c] max-w-md mb-8 leading-relaxed">
        We couldn't find the page you're looking for. It might have been moved, deleted, or never existed in the first place.
      </p>
      
      <Link 
        href="/board"
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#44afa9] text-white font-bold rounded-xl shadow-md hover:bg-[#3b9691] hover:shadow-lg transition-all focus:ring-2 focus:ring-[#44afa9] focus:ring-offset-2"
      >
        <span className="material-symbols-outlined text-[20px]">home</span>
        Return Home
      </Link>
    </div>
  );
}
