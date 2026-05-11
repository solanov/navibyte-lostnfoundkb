import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const displayStatus = status === 'Reported' ? 'Lost' : status;
  const isLost = displayStatus.toLowerCase() === 'lost';
  
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
      isLost
        ? 'bg-[#ba1a1a]/10 text-[#ba1a1a]'
        : 'bg-[#006a63]/10 text-[#006a63]'
    }`}>
      {displayStatus}
    </span>
  );
}