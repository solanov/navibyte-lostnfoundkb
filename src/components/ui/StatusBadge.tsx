import React from 'react';

interface StatusBadgeProps {
  status: 'Found' | 'Lost';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const isFound = status === 'Found';
  
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
      isFound ? 'text-on-tertiary-container bg-tertiary-fixed' : 'text-white bg-[#ba1a1a]'
    }`}>
      {status}
    </span>
  );
}