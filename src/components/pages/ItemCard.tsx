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

export default function ItemCard({ status, title, location, reference, imageUrl, dateLost }: ItemCardProps) {
  const displayStatus = status === 'Reported' ? 'Lost' : status;
  
  const placeholderIcon = displayStatus.toLowerCase() === 'found' ? 'lock' : 'visibility_off';
  const placeholderText = displayStatus.toLowerCase() === 'found' ? 'Media Redacted for Privacy' : 'Verification Required';

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-[#006a63]/30 transition-all duration-300 flex flex-col group">
      {/* Image Area */}
      <div className="h-48 relative overflow-hidden bg-slate-100">
        {imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50">
            <span className="material-symbols-outlined text-4xl">{placeholderIcon}</span>
            <p className="text-xs font-medium uppercase tracking-tighter">{placeholderText}</p>
          </div>
        )}
        {/* Floating Reference Badge */}
        <span className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold text-[#002632] shadow-sm">
          ID: #{reference}
        </span>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Title + Status */}
        <div className="flex items-start justify-between mb-2 gap-2">
          <h3 className="text-base font-semibold text-[#002632] truncate leading-snug">{title}</h3>
          <StatusBadge status={displayStatus} />
        </div>

        {/* Location & Date */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center text-slate-500">
            <span className="material-symbols-outlined text-lg mr-2">location_on</span>
            <span className="text-[13px] leading-[18px] truncate">{location}</span>
          </div>
          {dateLost && (
            <div className="flex items-center text-slate-500">
              <span className="material-symbols-outlined text-lg mr-2">calendar_today</span>
              <span className="text-[13px] leading-[18px]">Found: {dateLost}</span>
            </div>
          )}
        </div>

        {/* Visual CTA only; the full card wrapper handles the actual click */}
        <div
          aria-hidden="true"
          className="mt-auto w-full rounded-lg border border-[#002632] py-2.5 text-center text-sm font-semibold text-[#002632] transition-all group-hover:bg-[#002632] group-hover:text-white"
        >
          View More
        </div>
      </div>
    </div>
  );
}
