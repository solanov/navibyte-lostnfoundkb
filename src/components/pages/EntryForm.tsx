"use client";
import CategoryButton from './CategoryButton';
import ColorSwatch from './ColorSwatch';
import { useState, useRef, useEffect } from "react";
import { supabase } from '@/src/lib/supabase';

export default function EntryForm() {
  const [entryType, setEntryType] = useState<'lost' | 'found'>('lost');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  
  const [categories, setCategories] = useState<{id: number, label: string, icon: string}[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [zone, setZone] = useState('');
  const [hiddenNote, setHiddenNote] = useState('');
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchOrSeedCategories() {
      try {
        let { data, error } = await supabase.from('categories').select('*').eq('is_active', true);
        if (!error && (!data || data.length === 0)) {
          // Seed categories
          const defaultCats = [
            { name: 'Wallet', icon_identifier: 'account_balance_wallet', is_active: true },
            { name: 'Keys', icon_identifier: 'vpn_key', is_active: true },
            { name: 'ID', icon_identifier: 'badge', is_active: true },
            { name: 'Tech', icon_identifier: 'devices', is_active: true },
          ];
          await supabase.from('categories').insert(defaultCats);
          const res = await supabase.from('categories').select('*').eq('is_active', true);
          data = res.data;
        }
        if (data) {
          setCategories(data.map(c => ({ id: c.category_id, label: c.name, icon: c.icon_identifier })));
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    }
    fetchOrSeedCategories();
  }, []);

  const colorOptions = [
    { class: 'bg-[#303030]', value: 'Black' },
    { class: 'bg-white', value: 'White' },
    { class: 'bg-[#e0e0e0]', value: 'Silver' },
    { class: 'bg-[#ba1a1a]', value: 'Red' },
    { class: 'bg-[#002433]', value: 'Blue' },
    { class: 'bg-[#44afa9]', value: 'Green' },
    { class: 'bg-[#fbc02d]', value: 'Yellow' },
    { class: 'bg-gradient-to-br from-purple-500 to-orange-500', value: 'Other' }
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleFile = (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert("File is too large. Max 10MB");
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !selectedColor || !title || !description || !zone) {
      alert("Please fill in all required fields (including Category, Zone, and Color).");
      return;
    }
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let imageUrl = null;
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${user?.id || 'public'}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('item-images')
          .getPublicUrl(filePath);
          
        imageUrl = publicUrlData.publicUrl;
      }
      
      const status = entryType === 'lost' ? 'Reported' : 'Found';
      const general_description = `${title}\n\n${description}`;
      
      const { error: insertError } = await supabase.from('lost_items').insert({
        category_id: selectedCategory,
        color: selectedColor,
        zone,
        general_description,
        hidden_note: hiddenNote,
        status,
        image_url: imageUrl,
        reported_by: user?.id,
      });
      
      if (insertError) throw insertError;
      
      alert("Entry successfully added!");
      // Reset form
      setTitle('');
      setDescription('');
      setZone('');
      setHiddenNote('');
      setFile(null);
      setPreview(null);
      setSelectedCategory(null);
      setSelectedColor(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(0,36,51,0.06)] overflow-hidden">
      <div className="p-8 lg:p-12">
        <form className="space-y-8" onSubmit={handleSubmit}>
          
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Leather Wallet, Silver Keyring" 
                className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-tertiary text-on-surface transition-all placeholder:text-outline-variant" 
              />
            </div>
            <div>
              <label className="block font-headline font-bold text-primary mb-2 text-sm uppercase tracking-tight">
                Location (Zone) <span className="text-error">*</span>
              </label>
              <input 
                type="text" 
                required 
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="e.g. Library 3rd Floor, Cafeteria" 
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail any distinguishing marks, stickers, or brand names..." 
                className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-tertiary text-on-surface transition-all placeholder:text-outline-variant" 
              />
            </div>
          </div>

          {/* Category Icon Grid */}
          <div>
            <label className="block font-headline font-bold text-primary mb-4 text-sm uppercase tracking-tight">
              Category Selection <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-4 gap-4">
              {categories.map((cat) => (
                <CategoryButton 
                  key={cat.id}
                  id={cat.id.toString()}
                  label={cat.label}
                  icon={cat.icon}
                  isSelected={selectedCategory === cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  />
              ))}
              {categories.length === 0 && <p className="col-span-4 text-xs text-outline-variant italic">Loading categories...</p>}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block font-headline font-bold text-primary mb-2 text-sm uppercase tracking-tight">
              Visual Evidence
            </label>
            <div className="flex items-start gap-2 mb-3 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-300">
              <span className="material-symbols-outlined text-amber-500 text-base mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                warning
              </span>
              <p className="text-xs text-amber-700 font-medium leading-snug">
                <span className="font-bold uppercase tracking-wide">Note:</span> Keep confidential/sensitive information hidden before uploading (e.g. names, IDs, personal details).
              </p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/png, image/jpeg" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
              }}
            />
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer group overflow-hidden relative ${
                isDragging ? 'border-primary bg-primary/5' : 'border-outline-variant/50 hover:bg-surface-container-low bg-surface-container-lowest'
              }`}
            >
              {preview ? (
                <div className="absolute inset-0 w-full h-full">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-md backdrop-blur-sm">Click to change</span>
                  </div>
                </div>
              ) : (
                <>
                  <span className={`material-symbols-outlined text-4xl mb-2 transition-colors ${
                    isDragging ? 'text-primary' : 'text-outline group-hover:text-secondary'
                  }`}>
                    cloud_upload
                  </span>
                  <p className={`text-sm font-medium ${isDragging ? 'text-primary' : 'text-on-surface-variant'}`}>
                    Drag and drop images or <span className="text-secondary underline">browse</span>
                  </p>
                  <p className="text-[10px] mt-1 text-outline opacity-70">PNG, JPG up to 10MB</p>
                </>
              )}
            </div>
          </div>

          {/* Color Palette Selector */}
          <div>
            <label className="block font-headline font-bold text-primary mb-3 text-sm uppercase tracking-tight">
              Primary Object Color <span className="text-error">*</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {colorOptions.map((opt, idx) => (
              <ColorSwatch 
                key={idx}
                colorClass={opt.class}
                isSelected={selectedColor === opt.value}
                onClick={() => setSelectedColor(opt.value)}
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
              value={hiddenNote}
              onChange={(e) => setHiddenNote(e.target.value)}
              placeholder="Private details for admin verification only (e.g. serial number, specific internal markings)..." 
              className="w-full bg-surface-container-low border border-primary/20 rounded-lg p-4 focus:ring-1 focus:ring-primary text-on-surface transition-all text-sm italic placeholder:text-outline/60" 
            />
          </div>

          {/* Footer Action */}
          <div className="pt-6 border-t border-outline-variant/20">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full text-white font-headline font-black py-4 rounded-lg uppercase tracking-widest text-sm shadow-[0_8px_20px_rgba(68,175,169,0.3)] transition-all ${
                isSubmitting ? 'bg-outline opacity-70 cursor-not-allowed' : 'bg-[#44afa9] hover:brightness-110 active:scale-[0.98]'
              }`}
            >
              {isSubmitting ? 'Uploading to Archive...' : 'Post Entry to Archive'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}