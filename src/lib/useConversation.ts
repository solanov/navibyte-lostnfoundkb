'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/src/lib/supabase';

export interface Message {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  conversation_id: string;
  post_id: string | null;
  initiator_id: string;
  receiver_id: string;
  created_at: string;
}

export function useConversation(
  conversationIds: string[],
  targetConversationId?: string | null
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationKey = useMemo(
    () => Array.from(new Set(conversationIds)).sort().join(","),
    [conversationIds]
  );
  const normalizedConversationIds = useMemo(
    () => (conversationKey ? conversationKey.split(",") : []),
    [conversationKey]
  );
  const targetId = targetConversationId || normalizedConversationIds[0] || null;

  useEffect(() => {
    if (normalizedConversationIds.length === 0) {
      setMessages([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchMessages = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('messages')
          .select('*')
          .in('conversation_id', normalizedConversationIds)
          .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;
        setMessages(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    const subscription = supabase
      .channel(`messages:${conversationKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const nextMessage = payload.new as Message;
          const previousMessage = payload.old as Message;
          const relevantConversationId =
            nextMessage?.conversation_id || previousMessage?.conversation_id;

          if (
            !relevantConversationId ||
            !normalizedConversationIds.includes(relevantConversationId)
          ) {
            return;
          }

          if (payload.eventType === 'INSERT') {
            setMessages((prev) => {
              if (prev.some((message) => message.message_id === nextMessage.message_id)) {
                return prev;
              }

              return [...prev, nextMessage].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            });
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.message_id === (payload.new as Message).message_id
                  ? (payload.new as Message)
                  : msg
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationKey, normalizedConversationIds]);

  const sendMessage = useCallback(async (content: string, senderId: string) => {
    if (!targetId) {
      throw new Error('Conversation is not ready yet');
    }

    try {
      setError(null);
      const { error: insertError } = await supabase.from('messages').insert([
        {
          conversation_id: targetId,
          sender_id: senderId,
          content,
          is_read: false,
        },
      ]);

      if (insertError) throw insertError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    }
  }, [targetId]);

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('message_id', messageId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Failed to mark message as read:', err);
    }
  }, []);

  return { messages, loading, error, sendMessage, markAsRead };
}

/**
 * Normalize participant pair by sorting UUIDs lexicographically.
 *
 * This guarantees that two users A and B always produce the same
 * (initiator_id, receiver_id) order, regardless of who initiates first.
 * Combined with the DB UNIQUE (post_id, initiator_id, receiver_id)
 * constraint, this prevents duplicate conversation threads between the
 * same pair of users for the same post.
 */
function normalizeParticipants(
  userA: string,
  userB: string
): { initiatorId: string; receiverId: string } {
  return userA < userB
    ? { initiatorId: userA, receiverId: userB }
    : { initiatorId: userB, receiverId: userA };
}

export function getConversationPairKey(userA: string, userB: string) {
  const { initiatorId, receiverId } = normalizeParticipants(userA, userB);
  return `${initiatorId}:${receiverId}`;
}

export async function getOrCreateConversation(
  postId: string,
  currentUserId: string,
  otherUserId: string
): Promise<Conversation> {
  if (currentUserId === otherUserId) {
    throw new Error('You cannot start a conversation with yourself.');
  }

  // Normalize so (A,B) and (B,A) always map to the same canonical row.
  const { initiatorId, receiverId } = normalizeParticipants(currentUserId, otherUserId);

  try {
    // Look for an existing one-on-one conversation between these two users
    // regardless of the specific post, using the canonical participant order.
    const { data: existingConversations, error: queryError } = await supabase
      .from('conversations')
      .select('*')
      .eq('initiator_id', initiatorId)
      .eq('receiver_id', receiverId)
      .order('created_at', { ascending: true })
      .limit(1);

    if (queryError) throw queryError;

    if (existingConversations && existingConversations.length > 0) {
      return existingConversations[0];
    }

    // No existing conversation — create one using the normalized pair.
    const { data: newConversation, error: insertError } = await supabase
      .from('conversations')
      .insert([
        {
          post_id: postId,
          initiator_id: initiatorId,
          receiver_id: receiverId,
        },
      ])
      .select()
      .single();

    if (insertError) {
      // Race condition: another insert won — re-fetch the canonical row.
      if (insertError.code === '23505') {
        const { data: retryConversation, error: retryError } = await supabase
          .from('conversations')
          .select('*')
          .eq('initiator_id', initiatorId)
          .eq('receiver_id', receiverId)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (retryError) throw retryError;
        return retryConversation;
      }

      throw insertError;
    }

    if (!newConversation) throw new Error('Failed to create conversation');

    return newConversation;
  } catch (err) {
    console.error('Error in getOrCreateConversation:', err);
    throw err;
  }
}

export async function getUserConversations(userId: string): Promise<Conversation[]> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`initiator_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching conversations:', err);
    return [];
  }
}
