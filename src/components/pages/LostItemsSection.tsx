'use client';

import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import ItemCard from './ItemCard';
import ConversationModal from './ConversationModal';
import ItemDetailModal from './ItemDetailModal';
import EditPostModal, { type EditPostSuccessPayload } from './EditPostModal';
import { submitClaimAction, userDeletePostAction, markAsReturnedAction } from '@/src/app/admin/actions/posts';
import { submitReportAction, ReportReason } from '@/src/app/admin/actions/reports';
import { useNotification } from '@/src/hooks/useNotification';
import { resolveIcon } from '@/src/lib/resolveIcon';
import { useCurrentUserProfile } from '@/src/hooks/useAuthSession';

interface LostItem {
  post_id: string;
  general_description: string;
  date_lost?: string;
  zone: string;
  status: string;
  image_url?: string | null;
  reported_by: string;
  created_timestamp?: string;
  categories?: {
    name: string;
    icon_identifier: string;
  };
}

interface LostItemsSectionProps {
  items: LostItem[];
}

export default function LostItemsSection({ items }: LostItemsSectionProps) {
  const { notify } = useNotification();
  const { profile } = useCurrentUserProfile();
  const currentUserId = profile?.userId ?? null;
  const currentUserName = profile?.fullName || profile?.email || 'You';
  const currentUserRole = profile?.role || 'Public';
  const [visibleItems, setVisibleItems] = useState(items);
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);
  const [claimItem, setClaimItem] = useState<LostItem | null>(null);
  const [reportItem, setReportItem] = useState<LostItem | null>(null);
  const [conversationItem, setConversationItem] = useState<LostItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isConversationOpen, setIsConversationOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPostId, setEditPostId] = useState<string | null>(null);
  const [claimantName, setClaimantName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  useEffect(() => {
    setVisibleItems(items);
  }, [items]);

  const handleItemClick = (item: LostItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Small delay before clearing selected item to allow animation
    setTimeout(() => {
      setSelectedItem(null);
    }, 200);
  };

  const handleClaimItem = () => {
    if (!selectedItem) return;

    if (!currentUserId) {
      notify('Please sign in to submit a claim.', 'warning');
      return;
    }

    if (selectedItem.reported_by === currentUserId) {
      notify('You cannot claim your own item.', 'warning');
      return;
    }

    setClaimItem(selectedItem);
    setClaimantName(currentUserName === 'You' ? '' : currentUserName);
    setStudentId('');
    setItemDescription('');
    setIsClaimModalOpen(true);
    setIsModalOpen(false);
  };

  const handleCloseClaimModal = () => {
    setIsClaimModalOpen(false);
    setClaimItem(null);
    setClaimantName('');
    setStudentId('');
    setItemDescription('');
  };

  const handleSubmitClaim = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!claimItem || !currentUserId) {
      notify('Please sign in to submit a claim.', 'warning');
      return;
    }

    setIsSubmittingClaim(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error('Authentication token missing.');
      }

      const result = await submitClaimAction(
        accessToken,
        claimItem.post_id,
        claimantName,
        studentId,
        itemDescription
      );

      notify(
        result.flowType === 'Office'
          ? 'Claim submitted and recorded for office review.'
          : 'Claim submitted and recorded. Coordinate with the finder through chat for verification.',
        'success'
      );

      handleCloseClaimModal();
      handleCloseModal();
    } catch (err) {
      notify(
        `Error submitting claim: ${err instanceof Error ? err.message : String(err)}`,
        'error'
      );
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const handleContactPoster = () => {
    if (!selectedItem) return;

    if (!currentUserId) {
      notify('Please sign in to contact the poster.', 'warning');
      return;
    }

    if (!selectedItem.reported_by) {
      notify('This item does not have a poster account attached.', 'error');
      return;
    }

    if (selectedItem.reported_by === currentUserId) {
      notify('This item is linked to your account.', 'warning');
      return;
    }

    setConversationItem(selectedItem);
    setIsConversationOpen(true);
    handleCloseModal();
  };

  const handleCloseConversation = () => {
    setIsConversationOpen(false);
    setConversationItem(null);
  };

  const handleDeletePost = async () => {
    if (!selectedItem || !currentUserId) return;
    
    const confirmDelete = window.confirm("Are you sure you want to delete this post? It will be moved to your archive.");
    if (!confirmDelete) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      if (!accessToken) throw new Error("Authentication token missing.");

      await userDeletePostAction(accessToken, selectedItem.post_id);
      notify("Post deleted successfully.", "success");
      setVisibleItems((currentItems) =>
        currentItems.filter((item) => item.post_id !== selectedItem.post_id)
      );
      handleCloseModal();
    } catch (err) {
      notify(`Error deleting post: ${err instanceof Error ? err.message : String(err)}`, "error");
    }
  };

  const handleMarkAsReturned = async () => {
    if (!selectedItem || !currentUserId) return;

    const confirmReturn = window.confirm("Mark this item as returned? This will resolve the post and move it to your archive.");
    if (!confirmReturn) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) throw new Error("Authentication token missing.");

      await markAsReturnedAction(accessToken, selectedItem.post_id);
      notify("Item marked as returned. The post has been resolved.", "success");
      setVisibleItems((currentItems) =>
        currentItems.filter((item) => item.post_id !== selectedItem.post_id)
      );
      handleCloseModal();
    } catch (err) {
      notify(`Error marking item as returned: ${err instanceof Error ? err.message : String(err)}`, "error");
    }
  };

  // ── Edit handlers ─────────────────────────────────────────────────
  const handleEditPost = () => {
    if (!selectedItem || !currentUserId) return;
    setEditPostId(selectedItem.post_id);
    setIsModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (updated: EditPostSuccessPayload) => {
    setVisibleItems((current) =>
      current.map((item) =>
        item.post_id === updated.post_id
          ? {
              ...item,
              general_description: updated.general_description,
              zone: updated.zone,
              ...(updated.categories ? { categories: updated.categories } : {}),
            }
          : item
      )
    );
  };

  // ── Report handlers ─────────────────────────────────────────────────
  const handleOpenReport = () => {
    if (!selectedItem) return;
    setReportItem(selectedItem);
    setIsModalOpen(false);
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = async (reason: ReportReason, details: string) => {
    if (!reportItem) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Authentication token missing.');
      const result = await submitReportAction(accessToken, reportItem.post_id, reason, details);
      if (result && 'error' in result && result.error) {
        throw new Error(result.error);
      }
      notify('Report submitted. Our team will review it shortly.', 'success');
      setIsReportModalOpen(false);
      setReportItem(null);
    } catch (err) {
      notify(`Error: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  return (
    <>
      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {visibleItems.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-4 opacity-50">inbox</span>
            <p className="font-medium">No items found.</p>
          </div>
        ) : (
          visibleItems.map((item) => {
            const [title] = (item.general_description || '').split('\n\n');
            const icon = resolveIcon(item.categories?.icon_identifier);
            const reference = `LF-${item.post_id.substring(0, 4).toUpperCase()}`;
            const displayStatus = item.status === 'Reported' ? 'Lost' : item.status;

            // Format date
            const rawDate = item.date_lost || item.created_timestamp;
            const dateLost = rawDate
              ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : undefined;

            return (
              <button
                key={item.post_id}
                onClick={() => handleItemClick(item)}
                className="text-left bg-transparent border-none p-0 cursor-pointer w-full"
                aria-label={`View details for ${title || 'item'}`}
              >
                <ItemCard
                  status={displayStatus}
                  icon={icon}
                  title={title || 'Unknown Item'}
                  location={item.zone || 'Unknown Location'}
                  reference={reference}
                  imageUrl={item.image_url}
                  dateLost={dateLost}
                />
              </button>
            );
          })
        )}
      </div>

      <ItemDetailModal
        isOpen={isModalOpen}
        item={selectedItem}
        isOwner={!!currentUserId && currentUserId === selectedItem?.reported_by}
        isLostItem={selectedItem?.status === 'Reported' || selectedItem?.status === 'Lost'}
        claimsHref={
          selectedItem
            ? currentUserRole === 'Admin' || currentUserRole === 'Staff'
              ? `/admin/claims/${selectedItem.post_id}`
              : `/board/claims/${selectedItem.post_id}`
            : undefined
        }
        onClaimClick={handleClaimItem}
        onContactClick={handleContactPoster}
        onDeletePost={handleDeletePost}
        onMarkAsReturned={handleMarkAsReturned}
        onEditPost={currentUserId && currentUserId === selectedItem?.reported_by ? handleEditPost : undefined}
        onReportClick={currentUserId && currentUserId !== selectedItem?.reported_by ? handleOpenReport : undefined}
        onClose={handleCloseModal}
      />

      {conversationItem && (
        <ConversationModal
          isOpen={isConversationOpen}
          itemPostId={conversationItem.post_id}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          otherUserId={conversationItem.reported_by}
          otherUserName="Poster"
          onClose={handleCloseConversation}
        />
      )}

      {isClaimModalOpen && claimItem && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#002433]/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-[0_20px_40px_rgba(0,36,51,0.2)]">
            <div className="flex items-center justify-between bg-primary-container px-6 py-5">
              <div>
                <h2 className="font-headline text-2xl font-bold text-white">Submit Claim</h2>
                <p className="mt-1 text-sm text-on-primary-container">
                  Reference: LF-{claimItem.post_id.substring(0, 4).toUpperCase()}
                </p>
              </div>
              <button
                onClick={handleCloseClaimModal}
                disabled={isSubmittingClaim}
                className="text-on-primary-container transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close claim form"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitClaim} className="space-y-5 p-6">
              <div className="rounded-xl bg-surface-container-low p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Claiming Item
                </p>
                <p className="mt-2 text-lg font-bold text-primary">
                  {(claimItem.general_description || '').split('\n\n')[0] || 'Selected Item'}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Add your identity details and a short ownership description so the request can be reviewed and stored in the claim log.
                </p>
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Claimant Name
                </span>
                <input
                  value={claimantName}
                  onChange={(event) => setClaimantName(event.target.value)}
                  required
                  disabled={isSubmittingClaim}
                  className="w-full rounded-md border border-outline-variant/30 bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-[#44afa9] disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Student ID
                </span>
                <input
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                  required
                  disabled={isSubmittingClaim}
                  className="w-full rounded-md border border-outline-variant/30 bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-[#44afa9] disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Ownership Description
                </span>
                <textarea
                  value={itemDescription}
                  onChange={(event) => setItemDescription(event.target.value)}
                  rows={5}
                  disabled={isSubmittingClaim}
                  placeholder="Describe a detail that helps verify the item is yours."
                  className="w-full rounded-md border border-outline-variant/30 bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-[#44afa9] disabled:opacity-60"
                />
              </label>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseClaimModal}
                  disabled={isSubmittingClaim}
                  className="rounded-md border border-outline-variant/30 px-5 py-3 font-bold text-on-surface transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClaim || !claimantName.trim() || !studentId.trim()}
                  className="btn-claim rounded-md px-5 py-3 font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmittingClaim ? 'Submitting Claim...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Post Modal ───────────────────────────────────── */}
      <EditPostModal
        isOpen={isEditModalOpen}
        postId={editPostId}
        onClose={() => { setIsEditModalOpen(false); setEditPostId(null); }}
        onSuccess={handleEditSuccess}
      />

      {/* ── Report Post Modal ─────────────────────────────────── */}
      {isReportModalOpen && reportItem && (
        <ReportModal
          item={reportItem}
          onClose={() => { setIsReportModalOpen(false); setReportItem(null); }}
          onSubmit={handleSubmitReport}
        />
      )}
    </>
  );
}

// ── ReportModal ──────────────────────────────────────────────────────────────
const REPORT_REASONS: ReportReason[] = [
  'Spam',
  'Inappropriate Content',
  'Fake/Scam',
  'Duplicate',
  'Other',
];

function ReportModal({
  item,
  onClose,
  onSubmit,
}: {
  item: { post_id: string; general_description: string };
  onClose: () => void;
  onSubmit: (reason: ReportReason, details: string) => Promise<void>;
}) {
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [title] = (item.general_description || '').split('\n\n');
  const reference = `LF-${item.post_id.substring(0, 4).toUpperCase()}`;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reason) return;
    setBusy(true);
    await onSubmit(reason as ReportReason, details);
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#002433]/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-[0_20px_40px_rgba(0,36,51,0.2)]">
        <div className="flex items-center justify-between bg-[#ba1a1a] px-6 py-5">
          <div>
            <h2 className="font-headline text-xl font-bold text-white">Report Post</h2>
            <p className="mt-0.5 text-sm text-red-100">Ref: {reference}</p>
          </div>
          <button onClick={onClose} disabled={busy} className="text-red-100 transition hover:text-white disabled:opacity-60" aria-label="Close">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="rounded-xl bg-[#f5f3f3] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#41484c]/60">Reporting</p>
            <p className="mt-1 text-sm font-bold text-[#002433] line-clamp-2">{title || 'Unknown Item'}</p>
          </div>
          <fieldset>
            <legend className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#41484c]">
              Reason <span className="text-[#ba1a1a]">*</span>
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {REPORT_REASONS.map((r) => (
                <label key={r} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all ${reason === r ? 'border-[#ba1a1a] bg-red-50 text-[#ba1a1a]' : 'border-[#002433]/10 hover:border-[#ba1a1a]/40 hover:bg-red-50/50 text-[#41484c]'}`}>
                  <input type="radio" name="report-reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="sr-only" />
                  <span className="text-sm font-semibold">{r}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#41484c]">
              Additional Details <span className="font-normal text-[#41484c]/50">(optional)</span>
            </span>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} disabled={busy} placeholder="Any extra context for our review team." className="w-full rounded-md border border-[#002433]/10 bg-[#f5f3f3] px-4 py-3 text-sm outline-none transition focus:border-[#ba1a1a] focus:ring-1 focus:ring-[#ba1a1a] disabled:opacity-60" />
          </label>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={busy} className="rounded-md border border-[#002433]/10 px-5 py-3 text-sm font-bold text-[#41484c] transition hover:bg-[#f5f3f3] disabled:opacity-60">Cancel</button>
            <button type="submit" disabled={busy || !reason} className="rounded-md bg-[#ba1a1a] px-5 py-3 text-sm font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Submitting...' : 'Submit Report'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
