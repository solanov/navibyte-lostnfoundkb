export default function PriorityCard() {
  return (
    <div className="md:col-span-2 bg-surface-container-lowest p-8 rounded-xl group hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row gap-8 shadow-sm hover:shadow-md">
      <div className="md:w-1/3">
        <div className="h-full min-h-[200px] bg-primary-container rounded-lg flex flex-col items-center justify-center text-on-primary-container gap-3 overflow-hidden relative">
          <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            encrypted
          </span>
          <p className="text-[10px] font-bold uppercase tracking-widest px-4 text-center">
            Institutional Protection Active
          </p>
          <div className="absolute top-2 right-2">
            <span className="material-symbols-outlined text-sm opacity-50">info</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-on-tertiary-container text-on-tertiary text-[10px] font-black px-2 py-1 rounded">
              HIGH PRIORITY
            </span>
            <span className="text-on-surface-variant text-xs font-medium italic">
              Reported 2 hours ago
            </span>
          </div>
          <h3 className="text-3xl font-black text-primary tracking-tighter mb-2 font-headline">
            Prescription Eyewear (Black)
          </h3>
          <p className="text-on-surface-variant leading-relaxed mb-6">
            Found in the Auditorium after the morning lecture. Item is currently stored in <span className="font-bold text-primary">Storage Bin A-12</span>. Claimant must describe the brand and case details.
          </p>
        </div>
        
        <div className="flex items-center justify-between pt-6 border-t border-outline-variant/20">
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-outline font-label">Category</span>
              <span className="text-sm font-bold text-primary">Accessories</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-outline font-label">Location</span>
              <span className="text-sm font-bold text-primary">Auditorium Main</span>
            </div>
          </div>
          <button className="bg-secondary text-white px-8 py-3 rounded-md text-sm font-extrabold uppercase tracking-widest hover:brightness-110 shadow-lg shadow-secondary/20 transition-all active:scale-95">
            Contact Curator
          </button>
        </div>
      </div>
    </div>
  );
}