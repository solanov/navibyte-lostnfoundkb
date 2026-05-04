'use client';

import { useEffect, useRef } from 'react';
import StatusBadge from './StatusBadge';

interface ItemDetailModalProps {
  isOpen: boolean;
  item: {
    post_id: string;
    general_description: string;
    date_lost?: string;
    zone: string;
    status: string;
    image_url?: string | null;
    reported_by?: string;
    categories?: {
      name: string;
      icon_identifier: string;
    };
  } | null;
  onClose: () => void;
  onClaimClick: () => void;
  onContactClick: () => void;
  isOwner?: boolean;
  onDeletePost?: () => void;
  onMarkReturned?: () => void;
}

export default function ItemDetailModal({
  isOpen,
  item,
  onClose,
  onClaimClick,
  onContactClick,
  isOwner,
  onDeletePost,
  onMarkReturned,
}: ItemDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  if (!isOpen || !item) return null;

  const [title] = (item.general_description || '').split('\n\n');
  const description = (item.general_description || '').split('\n\n').slice(1).join('\n\n');
  const icon = item.categories?.icon_identifier || 'help_outline';
  const reference = `AC-${item.post_id.substring(0, 4).toUpperCase()}`;
  const displayStatus = item.status === 'Reported' ? 'Lost' : item.status;
  const placeholderIcon = item.status.toLowerCase() === 'found' ? 'lock' : 'visibility_off';
  const placeholderText =
    item.status.toLowerCase() === 'found' ? 'Media Redacted for Privacy' : 'Verification Required';

  return (
    <div
      ref={modalRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-200"
    >
      {/* Modal Content */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-h-[90vh] w-full max-w-2xl flex flex-col overflow-hidden">
        {/* Header - Fixed */}
        <div className="sticky top-0 z-10 bg-surface-container-lowest border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-container-low flex items-center justify-center rounded-lg">
              <span className="material-symbols-outlined text-primary-container text-lg">{icon}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface line-clamp-1">{title || 'Item Details'}</h2>
              <p className="text-xs text-on-surface-variant">Ref: {reference}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-2 hover:bg-surface-container-low rounded-lg"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
          style={{
            scrollBehavior: 'smooth',
          }}
        >
          {/* Image Section */}
          <div>
            {item.image_url ? (
              <div className="h-80 rounded-xl overflow-hidden border border-outline-variant/15 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image_url}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-80 bg-surface-container-low rounded-xl flex flex-col items-center justify-center text-outline-variant border border-outline-variant/15">
                <span className="material-symbols-outlined text-6xl mb-3">{placeholderIcon}</span>
                <p className="text-sm font-medium uppercase tracking-tighter">{placeholderText}</p>
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low/50 to-transparent"></div>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
              Status
            </span>
            <StatusBadge status={displayStatus} />
          </div>

          {/* Item Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Location */}
            <div className="bg-surface-container-low rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary-container text-lg">
                  location_on
                </span>
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Location
                </p>
              </div>
              <p className="text-sm font-semibold text-on-surface">{item.zone || 'Unknown'}</p>
            </div>

            {/* Date Lost */}
            {item.date_lost && (
              <div className="bg-surface-container-low rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary-container text-lg">
                    calendar_today
                  </span>
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Date Lost
                  </p>
                </div>
                <p className="text-sm font-semibold text-on-surface">
                  {new Date(item.date_lost).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}

            {/* Category */}
            {item.categories?.name && (
              <div className="bg-surface-container-low rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary-container text-lg">
                    category
                  </span>
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Category
                  </p>
                </div>
                <p className="text-sm font-semibold text-on-surface">{item.categories.name}</p>
              </div>
            )}

            {/* Reference ID */}
            <div className="bg-surface-container-low rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary-container text-lg">
                  fingerprint
                </span>
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Reference
                </p>
              </div>
              <p className="text-sm font-semibold text-on-surface font-mono">{reference}</p>
            </div>
          </div>

          {/* Description Section */}
          {description && (
            <div>
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">
                Details
              </h3>
              <div className="bg-surface-container-low rounded-lg p-4 text-on-surface leading-relaxed whitespace-pre-wrap text-sm">
                {description.trim()}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="bg-tertiary-fixed/30 border border-on-tertiary-container/20 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-on-tertiary-container flex-shrink-0">
                info
              </span>
              <div className="text-sm text-on-surface">
                <p className="font-semibold mb-1">Need help?</p>
                <p className="text-on-surface-variant">
                  Contact the item curator or use the buttons below to claim this item or get in touch
                  with the poster.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed Footer */}
        <div className="sticky bottom-0 bg-surface-container-lowest border-t border-outline-variant/20 px-6 py-4 flex gap-3">
          {isOwner ? (
            <>
              {item.status !== 'Returned' && item.status !== 'Purged' && onMarkReturned && (
                <button
                  onClick={onMarkReturned}
                  className="flex-1 bg-surface-container-low text-primary border border-outline-variant/30 px-6 py-3 rounded-lg font-bold text-sm tracking-tight hover:bg-outline-variant/10 transition-all active:scale-95"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-lg">verified</span>
                    Mark as Returned
                  </span>
                </button>
              )}
              {onDeletePost && (
                <button
                  onClick={onDeletePost}
                  className="flex-1 bg-red-50 text-red-600 border border-red-200 px-6 py-3 rounded-lg font-bold text-sm tracking-tight hover:bg-red-100 transition-all active:scale-95"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-lg">delete</span>
                    Delete Post
                  </span>
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={onContactClick}
                className="flex-1 bg-surface-container-low text-primary border border-outline-variant/30 px-6 py-3 rounded-lg font-bold text-sm tracking-tight hover:bg-outline-variant/10 transition-all active:scale-95"
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg">mail</span>
                  Contact
                </span>
              </button>
              <button
                onClick={onClaimClick}
                className="flex-1 bg-secondary text-white px-6 py-3 rounded-lg font-bold text-sm tracking-tight hover:brightness-110 transition-all active:scale-95"
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  Claim Item
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
