interface ItemCardProps {
  status: 'Found' | 'Lost';
  icon: string;
  placeholderIcon: string;
  placeholderText: string;
  title: string;
  location: string;
  reference: string;
}

export default function ItemCard({ status, icon, placeholderIcon, placeholderText, title, location, reference }: ItemCardProps) {
  const isFound = status === 'Found';

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl group hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-md">
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 bg-surface-container-low flex items-center justify-center rounded-lg">
          <span className="material-symbols-outlined text-primary-container">{icon}</span>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
          isFound ? 'text-on-tertiary-container bg-tertiary-fixed' : 'text-white bg-[#ba1a1a]' // Used standard red/error for lost
        }`}>
          {status}
        </span>
      </div>
      
      <div className="space-y-4 mb-8">
        <div className="h-48 bg-surface-container-low rounded-lg flex flex-col items-center justify-center text-outline-variant gap-2 overflow-hidden relative">
          <span className="material-symbols-outlined text-4xl">{placeholderIcon}</span>
          <p className="text-xs font-medium uppercase tracking-tighter">{placeholderText}</p>
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low/50 to-transparent"></div>
        </div>
        <div>
          <h3 className="text-xl font-bold text-primary mb-1">{title}</h3>
          <div className="flex items-center gap-2 text-on-surface-variant text-sm">
            <span className="material-symbols-outlined text-sm">location_on</span>
            <span>{location}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
        <span className="text-[11px] font-bold text-outline uppercase tracking-wider">
          Ref: {reference}
        </span>
        <button className="bg-secondary text-white px-5 py-2.5 rounded-md text-sm font-bold hover:brightness-110 transition-all">
          Contact User
        </button>
      </div>
    </div>
  );
}