"use client";
import CategoryButton from './CategoryButton';
import ColorSwatch from './ColorSwatch';
import { useState, useRef } from "react";
import { useSWRConfig } from "swr";
import { supabase } from '@/src/lib/supabase';
import { useNotification } from '@/src/hooks/useNotification';
import { createEntryAction } from '@/app/(board)/create/actions';
import { useCategories } from '@/src/hooks/useCategories';
import {
  CREATE_ENTRY_ALLOWED_COLORS,
  CREATE_ENTRY_ALLOWED_IMAGE_TYPES,
  CREATE_ENTRY_MAX_IMAGE_BYTES,
  getCreateEntryErrorMessage,
  normalizeCreateEntryText,
  type CreateEntryErrors,
  validateCreateEntryInput,
} from '@/lib/createEntrySecurity';

interface EntryFormProps {
  onSuccess?: () => void;
  variant?: 'page' | 'modal';
}

export default function EntryForm({ onSuccess, variant = 'page' }: EntryFormProps) {
  const { notify } = useNotification();
  const { mutate } = useSWRConfig();
  const { data: categories = [] } = useCategories();
  const [entryType, setEntryType] = useState<'lost' | 'found'>('lost');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [zone, setZone] = useState('');
  const [fieldErrors, setFieldErrors] = useState<CreateEntryErrors>({});
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acknowledgeNoExplicitContent, setAcknowledgeNoExplicitContent] = useState(false);
  const [acknowledgeNoConfidentialInfo, setAcknowledgeNoConfidentialInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colorOptions: Array<{ class: string; value: (typeof CREATE_ENTRY_ALLOWED_COLORS)[number] }> = [
    { class: 'bg-[#303030]', value: 'Black' },
    { class: 'bg-white', value: 'White' },
    { class: 'bg-[#e0e0e0]', value: 'Silver' },
    { class: 'bg-[#ba1a1a]', value: 'Red' },
    { class: 'bg-[#002433]', value: 'Blue' },
    { class: 'bg-[#44afa9]', value: 'Green' },
    { class: 'bg-[#fbc02d]', value: 'Yellow' },
    { class: 'bg-gradient-to-br from-purple-500 to-orange-500', value: 'Other' }
  ];

  const clearFieldError = (field: keyof CreateEntryErrors) => {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const buildDraftInput = (overrides?: Partial<{
    title: string;
    description: string;
    zone: string;
    selectedCategory: number | null;
    selectedColor: string | null;
  }>) => {
    const nextSelectedCategory = overrides?.selectedCategory ?? selectedCategory;

    return {
      entryType,
      selectedCategory: nextSelectedCategory,
      selectedCategoryName:
        categories.find((category) => category.id === nextSelectedCategory)?.label ?? null,
      selectedColor: overrides?.selectedColor ?? selectedColor,
      title: overrides?.title ?? title,
      description: overrides?.description ?? description,
      zone: overrides?.zone ?? zone,
      hiddenNote: "",
      imageUrl: null,
    };
  };

  const validateDraft = (overrides?: Parameters<typeof buildDraftInput>[0]) =>
    validateCreateEntryInput(buildDraftInput(overrides), { requireImage: false });

  const applyFieldValidation = (
    field: keyof CreateEntryErrors,
    override: Parameters<typeof buildDraftInput>[0]
  ) => {
    const validation = validateDraft(override);
    setFieldErrors((current) => {
      const nextErrors = { ...current };
      if (validation.ok || !validation.errors[field]) {
        delete nextErrors[field];
      } else {
        nextErrors[field] = validation.errors[field];
      }
      return nextErrors;
    });
  };

  const commitFieldValidation = () => {
    const sanitizedValues = {
      title: normalizeCreateEntryText(title),
      zone: normalizeCreateEntryText(zone),
      description: normalizeCreateEntryText(description, { multiline: true }),
    };

    setTitle(sanitizedValues.title);
    setZone(sanitizedValues.zone);
    setDescription(sanitizedValues.description);

    const validation = validateDraft(sanitizedValues);
    setFieldErrors(validation.ok ? {} : validation.errors);
    return validation;
  };
  
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
    if (!CREATE_ENTRY_ALLOWED_IMAGE_TYPES.includes(selectedFile.type as (typeof CREATE_ENTRY_ALLOWED_IMAGE_TYPES)[number])) {
      setFieldErrors((current) => ({ ...current, image: "Only PNG and JPEG files are allowed." }));
      notify("Only PNG and JPEG files are allowed.", "error");
      return;
    }

    if (selectedFile.size > CREATE_ENTRY_MAX_IMAGE_BYTES) {
      setFieldErrors((current) => ({ ...current, image: "File is too large. Maximum size is 10MB." }));
      notify("File is too large. Maximum size is 10MB.", "error");
      return;
    }

    clearFieldError("image");
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setFieldErrors((current) => ({
        ...current,
        image: "Upload at least one image before posting your entry.",
      }));
      notify("An image is required before posting your entry.", "warning");
      return;
    }

    if (!acknowledgeNoExplicitContent || !acknowledgeNoConfidentialInfo) {
      notify("Please confirm both posting acknowledgements before submitting.", "warning");
      return;
    }

    const validation = commitFieldValidation();
    if (!validation.ok) {
      notify(getCreateEntryErrorMessage(validation.errors), "warning");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!user || !accessToken) {
        throw new Error("Please sign in before posting a new entry.");
      }
      
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

      const result = await createEntryAction(accessToken, {
        ...validation.data,
        imageUrl,
      });

      if (!result.success) {
        setFieldErrors(result.fieldErrors ?? {});
        throw new Error(result.message);
      }
      
      notify("Entry successfully added!", "success");
      void mutate(
        (key) =>
          Array.isArray(key) &&
          (key[0] === "user-posts" || key[0] === "user-archive")
      );
      // Reset form
      setTitle('');
      setDescription('');
      setZone('');
      setFieldErrors({});
      setFile(null);
      setPreview(null);
      setSelectedCategory(null);
      setSelectedColor(null);
      setAcknowledgeNoExplicitContent(false);
      setAcknowledgeNoConfidentialInfo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onSuccess?.();
    } catch (err) {
      console.error(err);
      notify(err instanceof Error ? err.message : "An error occurred during submission.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={
        variant === 'modal'
          ? 'w-full bg-surface-container-lowest'
          : 'w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(0,36,51,0.06)] overflow-hidden'
      }
    >
      <div className={variant === 'modal' ? 'p-6' : 'p-8 lg:p-12'}>
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
                onChange={(e) => {
                  setTitle(e.target.value);
                  clearFieldError("title");
                }}
                onBlur={() => {
                  const normalizedValue = normalizeCreateEntryText(title);
                  setTitle(normalizedValue);
                  applyFieldValidation("title", { title: normalizedValue });
                }}
                placeholder="e.g. Leather Wallet, Silver Keyring" 
                aria-invalid={Boolean(fieldErrors.title)}
                className={`w-full border rounded-lg p-4 focus:ring-2 focus:ring-tertiary text-on-surface transition-all placeholder:text-outline-variant ${
                  fieldErrors.title
                    ? 'bg-red-50 border-red-300 focus:ring-red-200'
                    : 'bg-surface-container-low border-transparent'
                }`} 
              />
              {fieldErrors.title && <p className="mt-2 text-xs font-medium text-red-700">{fieldErrors.title}</p>}
            </div>
            <div>
              <label className="block font-headline font-bold text-primary mb-2 text-sm uppercase tracking-tight">
                Location (Zone) <span className="text-error">*</span>
              </label>
              <input 
                type="text" 
                required 
                value={zone}
                onChange={(e) => {
                  setZone(e.target.value);
                  clearFieldError("zone");
                }}
                onBlur={() => {
                  const normalizedValue = normalizeCreateEntryText(zone);
                  setZone(normalizedValue);
                  applyFieldValidation("zone", { zone: normalizedValue });
                }}
                placeholder="e.g. Library 3rd Floor, Cafeteria" 
                aria-invalid={Boolean(fieldErrors.zone)}
                className={`w-full border rounded-lg p-4 focus:ring-2 focus:ring-tertiary text-on-surface transition-all placeholder:text-outline-variant ${
                  fieldErrors.zone
                    ? 'bg-red-50 border-red-300 focus:ring-red-200'
                    : 'bg-surface-container-low border-transparent'
                }`} 
              />
              {fieldErrors.zone && <p className="mt-2 text-xs font-medium text-red-700">{fieldErrors.zone}</p>}
            </div>
            <div>
              <label className="block font-headline font-bold text-primary mb-2 text-sm uppercase tracking-tight">
                Description <span className="text-error">*</span>
              </label>
              <textarea 
                required 
                rows={3}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  clearFieldError("description");
                }}
                onBlur={() => {
                  const normalizedValue = normalizeCreateEntryText(description, { multiline: true });
                  setDescription(normalizedValue);
                  applyFieldValidation("description", { description: normalizedValue });
                }}
                placeholder="Detail any distinguishing marks, stickers, or brand names..." 
                aria-invalid={Boolean(fieldErrors.description)}
                className={`w-full border rounded-lg p-4 focus:ring-2 focus:ring-tertiary text-on-surface transition-all placeholder:text-outline-variant ${
                  fieldErrors.description
                    ? 'bg-red-50 border-red-300 focus:ring-red-200'
                    : 'bg-surface-container-low border-transparent'
                }`} 
              />
              {fieldErrors.description && <p className="mt-2 text-xs font-medium text-red-700">{fieldErrors.description}</p>}
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
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    clearFieldError("category");
                  }}
                  />
              ))}
              {categories.length === 0 && <p className="col-span-4 text-xs text-outline-variant italic">Loading categories...</p>}
            </div>
            {fieldErrors.category && <p className="mt-3 text-xs font-medium text-red-700">{fieldErrors.category}</p>}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block font-headline font-bold text-primary mb-2 text-sm uppercase tracking-tight">
              Visual Evidence <span className="text-error">*</span>
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
            {fieldErrors.image && <p className="mt-3 text-xs font-medium text-red-700">{fieldErrors.image}</p>}
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
                onClick={() => {
                  setSelectedColor(opt.value);
                  clearFieldError("color");
                }}
              />
              ))}
            </div>
            {fieldErrors.color && <p className="mt-3 text-xs font-medium text-red-700">{fieldErrors.color}</p>}
          </div>

          {/* Footer Action */}
          <div className="pt-6 border-t border-outline-variant/20">
            <div className="mb-5 rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
              <p className="text-sm font-bold uppercase tracking-tight text-primary">Posting Acknowledgement</p>
              <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                Review these rules before your post is published to the archive.
              </p>
              <label className="mt-4 flex items-start gap-3 text-sm text-on-surface-variant">
                <input
                  type="checkbox"
                  checked={acknowledgeNoExplicitContent}
                  onChange={(event) => setAcknowledgeNoExplicitContent(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-outline-variant text-[#44afa9]"
                />
                I confirm this post does not contain explicit, graphic, or inappropriate content.
              </label>
              <label className="mt-3 flex items-start gap-3 text-sm text-on-surface-variant">
                <input
                  type="checkbox"
                  checked={acknowledgeNoConfidentialInfo}
                  onChange={(event) => setAcknowledgeNoConfidentialInfo(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-outline-variant text-[#44afa9]"
                />
                I confirm no confidential or personally identifiable information is visible in the uploaded image or post details.
              </label>
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting || !acknowledgeNoExplicitContent || !acknowledgeNoConfidentialInfo}
              className={`w-full text-white font-headline font-black py-4 rounded-lg uppercase tracking-widest text-sm shadow-[0_8px_20px_rgba(68,175,169,0.3)] transition-all ${
                isSubmitting || !acknowledgeNoExplicitContent || !acknowledgeNoConfidentialInfo
                  ? 'bg-outline opacity-70 cursor-not-allowed'
                  : 'bg-[#44afa9] hover:brightness-110 active:scale-[0.98]'
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
