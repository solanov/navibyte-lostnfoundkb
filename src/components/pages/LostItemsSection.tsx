'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import ItemCard from './ItemCard';
import ConversationModal from './ConversationModal';
import ItemDetailModal from './ItemDetailModal';

interface LostItem {
  post_id: string;
  general_description: string;
  date_lost?: string;
  zone: string;
  status: string;
  image_url?: string | null;
  reported_by: string;
  categories?: {
    name: string;
    icon_identifier: string;
  };
}

interface LostItemsSectionProps {
  items: LostItem[];
}

export default function LostItemsSection({ items }: LostItemsSectionProps) {
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);
  const [conversationItem, setConversationItem] = useState<LostItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConversationOpen, setIsConversationOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState('You');

  useEffect(() => {
    let isMounted = true;

    const loadCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (!user) {
        setCurrentUserId(null);
        setCurrentUserName('You');
        return;
      }

      setCurrentUserId(user.id);
      setCurrentUserName(
        user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email ||
          'You'
      );

      const { data: profile } = await supabase
        .from('users')
        .select('full_name,email')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!isMounted || !profile) return;

      setCurrentUserName(profile.full_name || profile.email || 'You');
    };

    loadCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadCurrentUser();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
    console.log('Claim item:', selectedItem.post_id);
    // TODO: Implement claim logic - redirect to claim form or open claim modal
    // For now, just close the modal
    alert(`Claim initiated for item: ${selectedItem.post_id}`);
    handleCloseModal();
  };

  const handleContactPoster = () => {
    if (!selectedItem) return;

    if (!currentUserId) {
      alert('Please sign in to contact the poster.');
      return;
    }

    if (!selectedItem.reported_by) {
      alert('This item does not have a poster account attached.');
      return;
    }

    if (selectedItem.reported_by === currentUserId) {
      alert('This item is linked to your account.');
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

  return (
    <>
      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.length === 0 ? (
          <div className="col-span-1 md:col-span-2 py-12 text-center text-outline-variant">
            <span className="material-symbols-outlined text-5xl mb-4 opacity-50">inbox</span>
            <p className="font-medium">No items found.</p>
          </div>
        ) : (
          items.map((item) => {
            const [title] = (item.general_description || '').split('\n\n');
            const icon = item.categories?.icon_identifier || 'help_outline';
            const reference = `AC-${item.post_id.substring(0, 4).toUpperCase()}`;
            const displayStatus = item.status === 'Reported' ? 'Lost' : item.status;

            return (
              <button
                key={item.post_id}
                onClick={() => handleItemClick(item)}
                className="text-left bg-transparent border-none p-0 cursor-pointer hover:opacity-80 transition-opacity"
                aria-label={`View details for ${title || 'item'}`}
              >
                <ItemCard
                  status={displayStatus}
                  icon={icon}
                  title={title || 'Unknown Item'}
                  location={item.zone || 'Unknown Location'}
                  reference={reference}
                  imageUrl={item.image_url}
                />
              </button>
            );
          })
        )}
      </div>

      {/* Modal */}
      <ItemDetailModal
        isOpen={isModalOpen}
        item={selectedItem}
        onClaimClick={handleClaimItem}
        onContactClick={handleContactPoster}
        onClose={handleCloseModal}
      />

      {conversationItem && (
        <ConversationModal
          isOpen={isConversationOpen}
          itemPostId={conversationItem.post_id}
          itemTitle={(conversationItem.general_description || '').split('\n\n')[0] || 'Item'}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          otherUserId={conversationItem.reported_by}
          otherUserName="Poster"
          onClose={handleCloseConversation}
        />
      )}
    </>
  );
}
