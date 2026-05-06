import StatusBadge from './StatusBadge';

interface ItemCardProps {
  status: string;
  icon: string;
  title: string;
  location: string;
  reference: string;
  imageUrl?: string | null;
}

export default function ItemCard({ status, icon, title, location, reference, imageUrl }: ItemCardProps) {
  const isFound = status.toLowerCase() === 'found';
  const displayStatus = status === 'Reported' ? 'Lost' : status;
  
  const placeholderIcon = isFound ? 'lock' : 'visibility_off';
  const placeholderText = isFound ? 'Media Redacted for Privacy' : 'Verification Required';

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl group hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer">
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 bg-surface-container-low flex items-center justify-center rounded-lg">
          <span className="material-symbols-outlined text-primary-container">{icon}</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={displayStatus} />
          <span className="material-symbols-outlined text-on-surface-variant text-sm opacity-0 group-hover:opacity-100 transition-opacity">
            arrow_outward
          </span>
        </div>
      </div>
      
      <div className="space-y-4 mb-8">
        {imageUrl ? (
          <div className="h-48 rounded-lg overflow-hidden relative border border-outline-variant/15 group-hover:shadow-inner transition-all bg-surface-container">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-48 bg-surface-container-low rounded-lg flex flex-col items-center justify-center text-outline-variant gap-2 overflow-hidden relative border border-outline-variant/15">
            <span className="material-symbols-outlined text-4xl">{placeholderIcon}</span>
            <p className="text-xs font-medium uppercase tracking-tighter">{placeholderText}</p>
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low/50 to-transparent"></div>
          </div>
        )}
        
        <div>
          <h3 className="text-xl font-bold text-primary mb-1 line-clamp-1">{title}</h3>
          <div className="flex items-center gap-2 text-on-surface-variant text-sm">
            <span className="material-symbols-outlined text-sm">location_on</span>
            <span className="line-clamp-1">{location}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
        <span className="text-[11px] font-bold text-outline uppercase tracking-wider">
          Ref: {reference}
        </span>
        <span className="bg-secondary text-white px-5 py-2.5 rounded-md text-sm font-bold group-hover:brightness-110 transition-all">
          Contact {displayStatus === 'Lost' ? 'Curator' : 'User'}
        </span>
      </div>
    </div>
  );
}
