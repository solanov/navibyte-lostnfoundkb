import React from 'react';

interface ColorSwatchProps {
  colorClass: string;
  isSelected: boolean;
  onClick: () => void;
}

export default function ColorSwatch({ colorClass, isSelected, onClick }: ColorSwatchProps) {
  return (
    <div 
      onClick={onClick}
      className={`w-8 h-8 rounded-full ${colorClass} cursor-pointer transition-all ${
        colorClass === 'bg-white' ? 'border border-outline-variant' : ''
      } ${
        isSelected 
          ? 'ring-2 ring-offset-2 ring-primary scale-110' 
          : 'ring-2 ring-offset-2 ring-transparent hover:ring-outline-variant'
      }`}
    />
  );
}