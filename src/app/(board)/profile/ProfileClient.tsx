'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import {
  fetchUserPostsAction,
  markAsReturnedAction,
  userDeletePostAction,
} from '@/src/app/admin/actions/posts';
import StatusBadge from '@/src/components/pages/StatusBadge';
import ItemDetailModal from '@/src/components/pages/ItemDetailModal';
import { useNotification } from '@/src/hooks/useNotification';
import { resolveIcon } from '@/src/lib/resolveIcon';

interface UserPost {
  post_id: string;
  general_description: string;
  zone: string;
  status: string;
  image_url?: string | null;
  created_timestamp: string;
  reported_by?: string;
  date_lost?: string;
  // Supabase join inference returns either a single object or an array;
  // we accept both here and normalise access via resolveCategory().
  categories?:
    | { name: string; icon_identifier: string }
    | { name: string; icon_identifier: string }[]
    | null;
}

interface UserProfile {
  full_name: string | null;
  email: string | null;
  role: string | null;
  avatar_url: string | null;
}

function toTitleCase(str: string) {
  return str.replace(
    /\w\S*/g,
    (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

/** Normalise Supabase's categories join — handles both object and array shapes. */
function resolveCategory(categories: UserPost['categories']) {
  if (!categories) return null;
  return Array.isArray(categories) ? (categories[0] ?? null) : categories;
}

const ROLE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  Admin:  { bg: 'bg-[#ba1a1a]/10',  text: 'text-[#ba1a1a]',  label: 'Admin'  },
  Staff:  { bg: 'bg-[#44afa9]/10',  text: 'text-[#006a63]',  label: 'Staff'  },
  Public: { bg: 'bg-[#002433]/8',   text: 'text-[#41484c]',  label: 'Public' },
};

export default function ProfileClient() {
  const { notify } = useNotification();

  const [profile,      setProfile]      = useState<UserProfile | null>(null);
  const [posts,        setPosts]         = useState<UserPost[]>([]);
  const [loading,      setLoading]       = useState(true);
  const [error,        setError]         = useState<string | null>(null);
  const [selectedItem, setSelectedItem]  = useState<UserPost | null>(null);
  const [isModalOpen,  setIsModalOpen]   = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) throw new Error('You must be signed in to view your profile.');

        // Pull profile record
        const { data: profileRow } = await supabase
          .from('users')
          .select('full_name, email, role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!isMounted) return;

        setProfile({
          full_name: profileRow?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || null,
          email:     profileRow?.email     || user.email || null,
          role:      profileRow?.role      || 'Public',
          avatar_url:
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture    ||
            null,
        });

        // Pull ALL posts by this user via server action (bypasses RLS)
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) throw new Error('Session token missing.');

        const postsData = await fetchUserPostsAction(accessToken);
        if (!isMounted) return;

        setPosts(postsData);
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load profile.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => { isMounted = false; };
  }, []);

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const handleItemClick = (post: UserPost) => {
    setSelectedItem(post);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedItem(null), 200);
  };

  const handleMarkAsReturned = async () => {
    if (!selectedItem) return;

    const confirmReturn = window.confirm(
      'Mark this item as returned? This will resolve the post and move it to your archive.'
    );
    if (!confirmReturn) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Authentication token missing.');

      await markAsReturnedAction(accessToken, selectedItem.post_id);
      notify('Item marked as returned. The post has been resolved.', 'success');
      setPosts((prev) =>
        prev.map((p) =>
          p.post_id === selectedItem.post_id ? { ...p, status: 'Returned' } : p
        )
      );
      handleCloseModal();
    } catch (err) {
      notify(`Error: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const handleDeletePost = async () => {
    if (!selectedItem) return;

    const confirmDelete = window.confirm(
      'Are you sure you want to delete this post? It will be moved to your archive.'
    );
    if (!confirmDelete) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Authentication token missing.');

      await userDeletePostAction(accessToken, selectedItem.post_id);
      notify('Post deleted successfully.', 'success');
      setPosts((prev) =>
        prev.map((p) =>
          p.post_id === selectedItem.post_id ? { ...p, status: 'Purged' } : p
        )
      );
      handleCloseModal();
    } catch (err) {
      notify(`Error: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="rounded-2xl bg-white h-48 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-2xl bg-white h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <span className="material-symbols-outlined text-5xl text-[#ba1a1a]/50 mb-4 block">error</span>
        <p className="text-[#ba1a1a] font-semibold">{error}</p>
      </div>
    );
  }

  // ── Derived display values ─────────────────────────────────────────────────
  const roleStyle   = ROLE_STYLES[profile?.role ?? 'Public'] ?? ROLE_STYLES.Public;
  const displayName = profile?.full_name || profile?.email || 'Anonymous';
  const initials    = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const totalPosts  = posts.length;
  const activePosts = posts.filter((p) => !['Purged', 'Returned', 'Released'].includes(p.status)).length;
  const lostPosts   = posts.filter((p) => p.status === 'Reported' || p.status === 'Lost').length;
  const foundPosts  = posts.filter((p) => p.status === 'Found').length;

  return (
    <div className="space-y-8">

      {/* ── Profile Hero Card ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,36,51,0.06)] overflow-hidden border border-[#002433]/5">
        {/* Teal gradient banner */}
        <div className="h-28 bg-gradient-to-br from-[#002433] via-[#006a63] to-[#44afa9] relative">
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          />
        </div>

        {/* Avatar + info row */}
        <div className="px-6 pb-6">
          <div className="flex flex-col gap-4 sm:grid sm:grid-cols-[auto,1fr] sm:items-end sm:gap-4">
            {/* Avatar */}
            <div className="-mt-12 relative z-10 w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-[#f5f3f3] shrink-0">
              {profile?.avatar_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#002433] text-white text-2xl font-black">
                  {initials}
                </div>
              )}
            </div>

            {/* Name + role */}
            <div className="flex-1 min-w-0 pt-1 sm:pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-[#002433] truncate">{displayName}</h2>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${roleStyle.bg} ${roleStyle.text}`}>
                  {roleStyle.label}
                </span>
              </div>
              {profile?.email && (
                <p className="text-xs text-[#41484c]/60 mt-1 font-medium">{profile.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[#002433]/5 border-t border-[#002433]/5">
          {[
            { label: 'Total Posts',   value: totalPosts,  icon: 'article'      },
            { label: 'Active',        value: activePosts, icon: 'check_circle' },
            { label: 'Lost Reports',  value: lostPosts,   icon: 'search'       },
            { label: 'Found Reports', value: foundPosts,  icon: 'inventory_2'  },
          ].map(({ label, value, icon }) => (
            <div key={label} className="flex flex-col items-center py-4 gap-1">
              <span className="material-symbols-outlined text-[#44afa9] text-[18px]">{icon}</span>
              <span className="text-xl font-black text-[#002433]">{value}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#41484c]/50">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── My Posts Section ──────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-[#002433] tracking-tight">My Posts</h3>
          <span className="text-xs font-bold text-[#41484c]/50 uppercase tracking-widest">{totalPosts} total</span>
        </div>

        {posts.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-[#002433]/5">
            <span className="material-symbols-outlined text-5xl text-[#41484c]/25 mb-3 block">inbox</span>
            <p className="font-bold text-[#41484c]/50 text-sm">You haven&apos;t posted anything yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => {
              const [title] = (post.general_description || '').split('\n\n');
              const displayStatus = post.status === 'Reported' ? 'Lost' : post.status;
              const isLost      = displayStatus === 'Lost';
              const isArchived  = ['Purged', 'Returned', 'Released'].includes(post.status);
              const category    = resolveCategory(post.categories);
              const icon        = resolveIcon(category?.icon_identifier);
              const reference   = `LF-${post.post_id.substring(0, 4).toUpperCase()}`;
              const formattedDate = new Date(post.created_timestamp).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              });

              return (
                <button
                  key={post.post_id}
                  onClick={() => handleItemClick(post)}
                  className={`text-left w-full bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,36,51,0.10)] active:scale-[0.99] cursor-pointer ${
                    isArchived ? 'border-[#002433]/5 opacity-60' : 'border-[#002433]/5'
                  }`}
                  aria-label={`View details for ${toTitleCase(title || 'item')}`}
                >
                  {/* Image / placeholder */}
                  <div className="h-36 relative overflow-hidden bg-[#f5f3f3]">
                    {post.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={post.image_url}
                        alt={toTitleCase(title || 'Item')}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[#41484c]/30 gap-1">
                        <span className="material-symbols-outlined text-3xl">
                          {isLost ? 'visibility_off' : 'lock'}
                        </span>
                        <p className="text-[9px] font-black uppercase tracking-widest">
                          {isLost ? 'Verification Required' : 'Media Redacted'}
                        </p>
                      </div>
                    )}

                    {/* Reference chip */}
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-white/90 backdrop-blur-md rounded text-[9px] font-black uppercase tracking-widest text-[#002433] shadow-sm">
                      {reference}
                    </span>

                    {/* Category icon chip */}
                    <span className="absolute top-2 left-2 w-7 h-7 bg-white/90 backdrop-blur-md rounded-lg flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[#44afa9] text-[15px]">{icon}</span>
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="text-sm font-black text-[#002433] line-clamp-2 leading-snug">
                        {toTitleCase(title || 'Unknown Item')}
                      </p>
                      <div className="shrink-0 pt-0.5">
                        <StatusBadge status={displayStatus} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[#41484c]">
                        <span className="material-symbols-outlined text-[14px] text-[#44afa9]">location_on</span>
                        <span className="text-xs font-semibold truncate">{post.zone || 'Unknown Location'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#41484c]">
                        <span className="material-symbols-outlined text-[14px] text-[#44afa9]">calendar_today</span>
                        <span className="text-xs font-semibold">{formattedDate}</span>
                      </div>
                    </div>

                    {isArchived && (
                      <div className="mt-3 pt-3 border-t border-[#002433]/5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#41484c]/40">
                          {post.status === 'Purged' ? 'Deleted' : 'Resolved'}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Item Detail Modal ─────────────────────────────────── */}
      <ItemDetailModal
        isOpen={isModalOpen}
        item={selectedItem ? {
          ...selectedItem,
          // Flatten categories from the wider UserPost union (object | array | null)
          // down to the single-object | undefined shape ItemDetailModal expects.
          categories: resolveCategory(selectedItem.categories) ?? undefined,
        } : null}
        isOwner={true}
        isLostItem={selectedItem?.status === 'Reported' || selectedItem?.status === 'Lost'}
        onClaimClick={() => {}}
        onContactClick={() => {}}
        onDeletePost={handleDeletePost}
        onMarkAsReturned={handleMarkAsReturned}
        onClose={handleCloseModal}
      />
    </div>
  );
}
