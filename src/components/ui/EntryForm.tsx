"use client";
import CategoryButton from './CategoryButton';
import ColorSwatch from './ColorSwatch';
import { useState } from "react";

export default function EntryForm() {
  const [entryType, setEntryType] = useState<'lost' | 'found'>('lost');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const categories = [
    { id: 'wallet', label: 'Wallet', icon: 'account_balance_wallet' },
    { id: 'keys', label: 'Keys', icon: 'vpn_key' },
    { id: 'id', label: 'ID', icon: 'badge' },
    { id: 'tech', label: 'Tech', icon: 'devices' },
  ];

  const colors = [
    'bg-[#002433]', 'bg-[#ba1a1a]', 'bg-[#44afa9]', 
    'bg-white', 'bg-[#98defe]', 'bg-[#303030]'
  ];

  return (
    <div className="w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(0,36,51,0.06)] overflow-hidden">
      <div className="p-8 lg:p-12">
        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
          
          {/* Lost/Found Toggle */}
          <div className="flex p-1 bg-surface-container-low rounded-lg w-fit">
            <button 
              type="button" 
              onClick={() => setEntryType('lost')}
              className={`px-6 py-2 rounded-md font-bold text-xs uppercase tracking-widest transition-all ${
                entryType === 'lost' 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Lost
            </button>
            <button 
              type="button" 
              onClick={() => setEntryType('found')}
              className={`px-6 py-2 rounded-md font-bold text-xs uppercase tracking-widest transition-all ${
                entryType === 'found' 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Found
            </button>
          </div>

          {/* Primary Info */}
          <div className="space-y-6">
            <div>
              <label className="block font-headline font-bold text-primary mb-2 text-sm uppercase tracking-tight">
                Title <span className="text-error">*</span>
              </label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Leather Wallet, Silver Keyring" 
                className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-tertiary text-on-surface transition-all placeholder:text-outline-variant" 
              />
            </div>
            <div>
              <label className="block font-headline font-bold text-primary mb-2 text-sm uppercase tracking-tight">
                Description <span className="text-error">*</span>
              </label>
              <textarea 
                required 
                rows={3}
                placeholder="Detail any distinguishing marks, stickers, or brand names..." 
                className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-tertiary text-on-surface transition-all placeholder:text-outline-variant" 
              />
            </div>
          </div>

          {/* Category Icon Grid */}
          <div>
            <label className="block font-headline font-bold text-primary mb-4 text-sm uppercase tracking-tight">
              Category Selection
            </label>
            <div className="grid grid-cols-4 gap-4">
              {categories.map((cat) => (
                <CategoryButton 
                  key={cat.id}
                  id={cat.id}
                  label={cat.label}
                  icon={cat.icon}
                  isSelected={selectedCategory === cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  />
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block font-headline font-bold text-primary mb-2 text-sm uppercase tracking-tight">
              Visual Evidence
            </label>
            <div className="border-2 border-dashed border-outline-variant/50 rounded-xl p-8 flex flex-col items-center justify-center text-on-surface-variant bg-surface-container-lowest hover:bg-surface-container-low transition-colors cursor-pointer group">
              <span className="material-symbols-outlined text-4xl mb-2 text-outline group-hover:text-secondary transition-colors">
                cloud_upload
              </span>
              <p className="text-sm font-medium">
                Drag and drop images or <span className="text-secondary underline">browse</span>
              </p>
              <p className="text-[10px] mt-1 text-outline opacity-70">PNG, JPG up to 10MB</p>
            </div>
          </div>

          {/* Color Palette Selector */}
          <div>
            <label className="block font-headline font-bold text-primary mb-3 text-sm uppercase tracking-tight">
              Primary Object Color
            </label>
            <div className="flex flex-wrap gap-3">
              {colors.map((colorClass, idx) => (
              <ColorSwatch 
                key={idx}
                colorClass={colorClass}
                isSelected={selectedColor === colorClass}
                onClick={() => setSelectedColor(colorClass)}
              />
              ))}
            </div>
          </div>

          {/* Hidden Note */}
          <div>
            <label className="flex items-center gap-2 font-headline font-bold text-primary mb-2 text-sm uppercase tracking-tight">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                lock
              </span>
              Hidden Note
            </label>
            <textarea 
              rows={2}
              placeholder="Private details for admin verification only (e.g. serial number, specific internal markings)..." 
              className="w-full bg-surface-container-low border border-primary/20 rounded-lg p-4 focus:ring-1 focus:ring-primary text-on-surface transition-all text-sm italic placeholder:text-outline/60" 
            />
          </div>

          {/* Footer Action */}
          <div className="pt-6 border-t border-outline-variant/20">
            <button 
              type="submit" 
              className="w-full bg-[#44afa9] text-white font-headline font-black py-4 rounded-lg uppercase tracking-widest text-sm shadow-[0_8px_20px_rgba(68,175,169,0.3)] hover:brightness-110 active:scale-[0.98] transition-all"
            >
              Post Entry to Archive
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}