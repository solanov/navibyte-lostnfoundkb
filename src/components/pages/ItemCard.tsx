import StatusBadge from './StatusBadge';

interface ItemCardProps {
  status: string;
  icon: string;
  title: string;
  location: string;
  reference: string;
  imageUrl?: string | null;
  dateLost?: string;
}

// Helper function to enforce clean Title Casing for user-submitted entries
function toTitleCase(str: string) {
  return str.replace(
    /\w\S*/g,
    (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

export default function ItemCard({ status, title, location, reference, imageUrl, dateLost }: ItemCardProps) {
  const displayStatus = status === 'Reported' ? 'Lost' : status;
  const isLost = displayStatus.toLowerCase() === 'lost';
  
  const placeholderIcon = !isLost ? 'lock' : 'visibility_off';
  const placeholderText = !isLost ? 'Media Redacted' : 'Verification Required';

  const formattedTitle = toTitleCase(title);

  return (
    <div className="bg-[#ffffff] rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,36,51,0.06)] transition-all duration-300 flex flex-col group h-full">
      
      {/* Image Area */}
      <div className="h-52 relative overflow-hidden bg-[#f5f3f3] shrink-0">
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={imageUrl} alt={formattedTitle} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#41484c]/50 gap-2">
            <span className="material-symbols-outlined text-4xl">{placeholderIcon}</span>
            <p className="text-[10px] font-black uppercase tracking-widest">{placeholderText}</p>
          </div>
        )}

        {/* Floating Reference ID - Top Right */}
        <span className="absolute top-3 right-3 px-2.5 py-1 bg-[#ffffff]/90 backdrop-blur-md rounded-md text-[9px] font-black uppercase tracking-widest text-[#002433] shadow-sm">
          ID: {reference}
        </span>
      </div>

      {/* Card Body - 1.5rem (24px) vertical spacing applied */}
      <div className="p-6 flex-1 flex flex-col">
        
        {/* Title & Status Badge Row */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <h3 className="text-lg font-black text-[#002433] leading-tight line-clamp-2">
            {formattedTitle}
          </h3>
          {/* Status Badge returned to high-visibility area */}
          <div className="shrink-0 pt-0.5">
            <StatusBadge status={displayStatus} />
          </div>
        </div>

        {/* Location & Date Footer */}
        <div className="space-y-2 mt-auto">
          <div className="flex items-center text-[#41484c]">
            <span className="material-symbols-outlined text-[18px] mr-2 text-[#44afa9]">location_on</span>
            <span className="text-xs font-semibold">{location}</span>
          </div>
          {dateLost && (
            <div className="flex items-center text-[#41484c]">
              <span className="material-symbols-outlined text-[18px] mr-2 text-[#44afa9]">calendar_today</span>
              <span className="text-xs font-semibold">
                {isLost ? 'Lost:' : 'Found:'} {dateLost}
              </span>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}