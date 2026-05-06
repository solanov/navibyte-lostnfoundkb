import React from 'react';

interface CategoryButtonProps {
  id: string;
  label: string;
  icon: string;
  isSelected: boolean;
  onClick: () => void;
}

export default function CategoryButton({ id, label, icon, isSelected, onClick }: CategoryButtonProps) {
  return (
    <button 
      type="button" 
      onClick={onClick}
      className={`group flex flex-col items-center justify-center p-4 bg-surface-container-low rounded-xl border-2 transition-all ${
        isSelected 
          ? 'border-secondary bg-secondary/10' 
          : 'border-transparent hover:border-secondary hover:bg-secondary/5'
      }`}
    >
      <span className={`material-symbols-outlined mb-2 transition-colors ${
        isSelected ? 'text-secondary' : 'text-outline group-hover:text-secondary'
      }`}>
        {icon}
      </span>
      <span className={`text-[10px] font-bold transition-colors ${
        isSelected ? 'text-secondary' : 'text-on-surface-variant group-hover:text-secondary'
      }`}>
        {label}
      </span>
    </button>
  );
}