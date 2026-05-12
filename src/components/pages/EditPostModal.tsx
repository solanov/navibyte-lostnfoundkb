'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { editPostAction, fetchPostEditDataAction } from '@/src/app/admin/actions/posts';
import CategoryButton from './CategoryButton';
import ColorSwatch from './ColorSwatch';
import { useNotification } from '@/src/hooks/useNotification';
import {
  CREATE_ENTRY_ALLOWED_COLORS,
  getCreateEntryErrorMessage,
  normalizeCreateEntryText,
  type CreateEntryErrors,
  validateCreateEntryInput,
} from '@/lib/createEntrySecurity';
import { resolveIcon } from '@/src/lib/resolveIcon';

export type EditPostSuccessPayload = {
  post_id: string;
  general_description: string;
  zone: string;
  categories?: { name: string; icon_identifier: string };
};

interface EditPostModalProps {
  isOpen: boolean;
  postId: string | null;
  onClose: () => void;
  onSuccess: (updated: EditPostSuccessPayload) => void;
}

const fallbackCategories = [
  { id: 1, label: 'Wallet', icon: 'account_balance_wallet' },
  { id: 2, label: 'Keys', icon: 'vpn_key' },
  { id: 3, label: 'ID', icon: 'badge' },
  { id: 4, label: 'Tech', icon: 'devices' },
  { id: 62, label: 'Others', icon: 'category' },
];

const colorOptions: Array<{ class: string; value: (typeof CREATE_ENTRY_ALLOWED_COLORS)[number] }> = [
  { class: 'bg-[#303030]', value: 'Black' },
  { class: 'bg-white', value: 'White' },
  { class: 'bg-[#e0e0e0]', value: 'Silver' },
  { class: 'bg-[#ba1a1a]', value: 'Red' },
  { class: 'bg-[#002433]', value: 'Blue' },
  { class: 'bg-[#44afa9]', value: 'Green' },
  { class: 'bg-[#fbc02d]', value: 'Yellow' },
  { class: 'bg-gradient-to-br from-purple-500 to-orange-500', value: 'Other' },
];

export default function EditPostModal({ isOpen, postId, onClose, onSuccess }: EditPostModalProps) {
  const { notify } = useNotification();
  const backdropRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [zone, setZone] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [hiddenNote, setHiddenNote] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: number; label: string; icon: string }[]>([]);
  const [fieldErrors, setFieldErrors] = useState<CreateEntryErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset + load data when modal opens
  useEffect(() => {
    if (!isOpen || !postId) return;

    let isMounted = true;
    setIsLoading(true);
    setFieldErrors({});

    const load = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) throw new Error('Please sign in to edit this post.');

        const [catResult, postData] = await Promise.all([
          supabase
            .from('categories')
            .select('category_id,name,icon_identifier')
            .eq('is_active', true)
            .order('name', { ascending: true }),
          fetchPostEditDataAction(accessToken, postId),
        ]);

        if (!isMounted) return;

        const mapped = (catResult.data ?? [])
          .map((c) => ({ id: c.category_id, label: c.name, icon: resolveIcon(c.icon_identifier ?? undefined) }))
          .filter((c) => c.id && c.label);
        setCategories(mapped.length > 0 ? mapped : fallbackCategories);

        const [postTitle, ...rest] = (postData.general_description ?? '').split('\n\n');
        setTitle(postTitle ?? '');
        setDescription(rest.join('\n\n'));
        setZone(postData.zone ?? '');
        setSelectedCategory(postData.category_id ?? null);
        setSelectedColor(postData.color ?? null);
        setHiddenNote(postData.hidden_note ?? '');
        setImageUrl(postData.image_url ?? null);
      } catch (err) {
        if (!isMounted) return;
        notify(err instanceof Error ? err.message : 'Failed to load post data.', 'error');
        onClose();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [isOpen, postId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isSubmitting) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, isSubmitting, onClose]);

  const clearFieldError = (field: keyof CreateEntryErrors) =>
    setFieldErrors((cur) => {
      if (!cur[field]) return cur;
      const next = { ...cur };
      delete next[field];
      return next;
    });

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current && !isSubmitting) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normTitle = normalizeCreateEntryText(title);
    const normDesc = normalizeCreateEntryText(description, { multiline: true });
    const normZone = normalizeCreateEntryText(zone);
    const normNote = normalizeCreateEntryText(hiddenNote, { multiline: true });

    const validation = validateCreateEntryInput(
      {
        entryType: 'lost',
        selectedCategory,
        selectedCategoryName: categories.find((c) => c.id === selectedCategory)?.label ?? null,
        selectedColor,
        title: normTitle,
        description: normDesc,
        zone: normZone,
        hiddenNote: normNote,
        imageUrl: null,
      },
      { requireImage: false }
    );

    if (!validation.ok) {
      setFieldErrors(validation.errors);
      notify(getCreateEntryErrorMessage(validation.errors), 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken || !postId) throw new Error('Authentication required.');

      const result = await editPostAction(accessToken, postId, {
        title: validation.data.title,
        description: validation.data.description,
        zone: validation.data.zone,
        selectedCategory: validation.data.selectedCategory,
        selectedCategoryName: validation.data.selectedCategoryName,
        selectedColor: validation.data.selectedColor,
        hiddenNote: validation.data.hiddenNote,
      });

      if (!result.success) {
        setFieldErrors(result.fieldErrors ?? {});
        throw new Error(result.message);
      }

      const newCategory = categories.find((c) => c.id === validation.data.selectedCategory);
      notify('Post updated successfully.', 'success');
      onSuccess({
        post_id: postId,
        general_description: `${validation.data.title}\n\n${validation.data.description}`,
        zone: validation.data.zone,
        categories: newCategory
          ? { name: newCategory.label, icon_identifier: newCategory.icon }
          : undefined,
      });
      onClose();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to update post.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-[#002433]/40 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-[0_20px_40px_rgba(0,36,51,0.2)] flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between bg-primary-container px-6 py-5 shrink-0">
          <div>
            <h2 className="font-headline text-2xl font-bold text-white">Edit Post</h2>
            <p className="mt-0.5 text-sm text-on-primary-container opacity-80">
              Changes are saved immediately and logged for moderation.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-on-primary-container hover:text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close edit modal"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-on-surface-variant gap-3">
              <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
              <span className="text-sm font-medium">Loading post data…</span>
            </div>
          ) : (
            <form id="edit-post-form" onSubmit={handleSubmit} className="space-y-6">

              {/* Read-only image */}
              {imageUrl && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-tight text-on-surface-variant mb-2">
                    Current Image <span className="font-normal text-outline">(not editable)</span>
                  </p>
                  <div className="relative h-48 rounded-xl overflow-hidden border border-outline-variant/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt="Current post image" className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                      <div className="flex items-center gap-2 rounded-lg bg-black/50 px-3 py-1.5">
                        <span className="material-symbols-outlined text-white text-base">lock</span>
                        <span className="text-xs font-bold text-white">Image locked</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-tight text-on-surface-variant mb-2">
                  Title <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); clearFieldError('title'); }}
                  onBlur={() => setTitle(normalizeCreateEntryText(title))}
                  placeholder="e.g. Leather Wallet, Silver Keyring"
                  aria-invalid={Boolean(fieldErrors.title)}
                  className={`w-full border rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-tertiary text-on-surface transition-all placeholder:text-outline-variant ${
                    fieldErrors.title
                      ? 'bg-red-50 border-red-300 focus:ring-red-200'
                      : 'bg-surface-container-low border-transparent'
                  }`}
                />
                {fieldErrors.title && <p className="mt-1.5 text-xs font-medium text-red-700">{fieldErrors.title}</p>}
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-tight text-on-surface-variant mb-2">
                  Location (Zone) <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={zone}
                  onChange={(e) => { setZone(e.target.value); clearFieldError('zone'); }}
                  onBlur={() => setZone(normalizeCreateEntryText(zone))}
                  placeholder="e.g. Library 3rd Floor, Cafeteria"
                  aria-invalid={Boolean(fieldErrors.zone)}
                  className={`w-full border rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-tertiary text-on-surface transition-all placeholder:text-outline-variant ${
                    fieldErrors.zone
                      ? 'bg-red-50 border-red-300 focus:ring-red-200'
                      : 'bg-surface-container-low border-transparent'
                  }`}
                />
                {fieldErrors.zone && <p className="mt-1.5 text-xs font-medium text-red-700">{fieldErrors.zone}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-tight text-on-surface-variant mb-2">
                  Description <span className="text-error">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); clearFieldError('description'); }}
                  onBlur={() => setDescription(normalizeCreateEntryText(description, { multiline: true }))}
                  placeholder="Detail any distinguishing marks, stickers, or brand names…"
                  aria-invalid={Boolean(fieldErrors.description)}
                  className={`w-full border rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-tertiary text-on-surface transition-all placeholder:text-outline-variant resize-none ${
                    fieldErrors.description
                      ? 'bg-red-50 border-red-300 focus:ring-red-200'
                      : 'bg-surface-container-low border-transparent'
                  }`}
                />
                {fieldErrors.description && <p className="mt-1.5 text-xs font-medium text-red-700">{fieldErrors.description}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-tight text-on-surface-variant mb-3">
                  Category <span className="text-error">*</span>
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {categories.map((cat) => (
                    <CategoryButton
                      key={cat.id}
                      id={cat.id.toString()}
                      label={cat.label}
                      icon={cat.icon}
                      isSelected={selectedCategory === cat.id}
                      onClick={() => { setSelectedCategory(cat.id); clearFieldError('category'); }}
                    />
                  ))}
                </div>
                {fieldErrors.category && <p className="mt-1.5 text-xs font-medium text-red-700">{fieldErrors.category}</p>}
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-tight text-on-surface-variant mb-3">
                  Primary Object Color <span className="text-error">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {colorOptions.map((opt, idx) => (
                    <ColorSwatch
                      key={idx}
                      colorClass={opt.class}
                      isSelected={selectedColor === opt.value}
                      onClick={() => { setSelectedColor(opt.value); clearFieldError('color'); }}
                    />
                  ))}
                </div>
                {fieldErrors.color && <p className="mt-1.5 text-xs font-medium text-red-700">{fieldErrors.color}</p>}
              </div>

              {/* Message to Admin (hidden_note) */}
              <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
                <label className="block text-xs font-bold uppercase tracking-tight text-on-surface-variant mb-1">
                  Message to Admin
                  <span className="ml-2 text-xs font-normal normal-case text-outline">(optional — only visible to staff)</span>
                </label>
                <p className="text-xs text-on-surface-variant mb-3">
                  Use this to share additional context with our moderation team, such as contact preferences or follow-up notes.
                </p>
                <textarea
                  rows={3}
                  value={hiddenNote}
                  onChange={(e) => setHiddenNote(e.target.value)}
                  onBlur={() => setHiddenNote(normalizeCreateEntryText(hiddenNote, { multiline: true }))}
                  placeholder="e.g. I can be reached at Room 204 after 3 PM…"
                  className="w-full border border-outline-variant/30 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-tertiary text-on-surface text-sm transition-all placeholder:text-outline-variant bg-white resize-none"
                />
              </div>

            </form>
          )}
        </div>

        {/* Footer */}
        {!isLoading && (
          <div className="shrink-0 border-t border-outline-variant/20 px-6 py-4 flex gap-3 justify-end bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-outline-variant/30 px-5 py-3 text-sm font-bold text-on-surface hover:bg-surface-container-low transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-post-form"
              disabled={isSubmitting || isLoading}
              className="rounded-lg bg-primary-container px-5 py-3 text-sm font-bold text-white hover:brightness-110 transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                  Saving…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">save</span>
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
