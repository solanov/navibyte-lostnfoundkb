'use client';

import { useEffect, useRef, useState } from 'react';
import { useConversation, getOrCreateConversation } from '@/src/lib/useConversation';
import { supabase } from '@/src/lib/supabase';

interface ConversationModalProps {
  isOpen: boolean;
  itemPostId: string;
  itemTitle: string;
  currentUserId: string | null;
  currentUserName: string;
  otherUserId: string;
  otherUserName: string;
  onClose: () => void;
}

export default function ConversationModal({
  isOpen,
  itemPostId,
  itemTitle,
  currentUserId,
  currentUserName,
  otherUserId,
  otherUserName,
  onClose,
}: ConversationModalProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [otherAvatar, setOtherAvatar] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    sendMessage,
    markAsRead,
  } = useConversation(conversationId);

  useEffect(() => {
    if (!isOpen) {
      setConversationId(null);
      setMessageText('');
      setError(null);
      return;
    }

    if (!currentUserId) {
      setError('Please sign in to start a conversation.');
      return;
    }

    const initializeConversation = async () => {
      try {
        setIsLoading(true);
        const conversation = await getOrCreateConversation(itemPostId, currentUserId, otherUserId);
        setConversationId(conversation.conversation_id);

        const { data } = await supabase
          .from('users')
          .select('user_id, avatar_url')
          .in('user_id', [currentUserId, otherUserId]);
          
        if (data) {
          const current = data.find((u) => u.user_id === currentUserId);
          const other = data.find((u) => u.user_id === otherUserId);
          if (current?.avatar_url) setCurrentAvatar(current.avatar_url);
          if (other?.avatar_url) setOtherAvatar(other.avatar_url);
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize conversation');
      } finally {
        setIsLoading(false);
      }
    };

    initializeConversation();
  }, [isOpen, currentUserId, itemPostId, otherUserId]);

  useEffect(() => {
    messages.forEach((msg) => {
      if (!msg.is_read && msg.sender_id !== currentUserId) {
        markAsRead(msg.message_id);
      }
    });
  }, [messages, currentUserId, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || !conversationId || !currentUserId) return;

    try {
      setIsLoading(true);
      await sendMessage(trimmedMessage, currentUserId);
      setMessageText('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = error || messagesError;
  const isBusy = isLoading || messagesLoading;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-200"
    >
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-h-[90vh] w-full max-w-2xl flex flex-col overflow-hidden">
        {/* Header - Fixed */}
        <div className="sticky top-0 z-10 bg-surface-container-lowest border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {otherUserName && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden bg-primary-container text-sm font-black uppercase text-white border border-outline-variant/10">
                {otherAvatar ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={otherAvatar} alt={otherUserName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  otherUserName.charAt(0).toUpperCase()
                )}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-on-surface">Message</h2>
              <p className="text-xs text-on-surface-variant">
                {otherUserName ? `${otherUserName} - ` : ''}Re: {itemTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-2 hover:bg-surface-container-low rounded-lg"
            aria-label="Close conversation"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Messages Area - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-[300px] max-h-[calc(90vh-220px)]">
          {isBusy && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-outline-variant border-t-primary rounded-full"></div>
                <p className="text-on-surface-variant mt-3">Loading conversation...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <span className="material-symbols-outlined text-5xl text-outline-variant opacity-50 block mb-2">
                  mail_outline
                </span>
                <p className="text-on-surface-variant">No messages yet. Start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === currentUserId;
              const displayName = isMine ? currentUserName : otherUserName;
              const avatarUrl = isMine ? currentAvatar : otherAvatar;

              return (
                <div
                  key={msg.message_id}
                  className={`flex gap-2.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className="flex h-8 w-8 shrink-0 mt-auto items-center justify-center rounded-full overflow-hidden bg-primary-container text-xs font-black uppercase text-white border border-outline-variant/10 hidden sm:flex">
                    {avatarUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      isMine
                        ? 'bg-secondary text-white'
                        : 'bg-surface-container-low text-on-surface'
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">
                      {displayName}
                    </p>
                    <p className="text-sm break-words">{msg.content}</p>
                    <p className={`text-xs mt-1 ${isMine ? 'text-white/70' : 'text-on-surface-variant'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Message */}
        {displayError && (
          <div className="px-6 py-2 bg-red-50/90 border-t border-red-200 text-red-700 text-sm">
            {displayError}
          </div>
        )}

        {/* Input Area - Fixed Footer */}
        <form onSubmit={handleSendMessage} className="sticky bottom-0 bg-surface-container-lowest border-t border-outline-variant/20 px-6 py-4 flex gap-3">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message..."
            maxLength={500}
            disabled={isBusy || !conversationId}
            className="flex-1 px-4 py-2.5 bg-surface-container-low rounded-lg text-sm text-on-surface placeholder:text-on-surface-variant border border-outline-variant/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!messageText.trim() || isBusy || !conversationId}
            className="bg-secondary text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            aria-label="Send message"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
