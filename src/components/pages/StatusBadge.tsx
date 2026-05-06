import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const displayStatus = status === 'Reported' ? 'Lost' : status;
  const isFound = displayStatus === 'Found';
  
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
      isFound ? 'text-on-tertiary-container bg-tertiary-fixed' : 'text-white bg-[#ba1a1a]'
    }`}>
      {displayStatus}
    </span>
  );
}