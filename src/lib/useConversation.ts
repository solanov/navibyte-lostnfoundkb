'use client';

import { useCallback, useEffect, useState } from 'react';
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
  post_id: string;
  initiator_id: string;
  receiver_id: string;
  created_at: string;
}

export function useConversation(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
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
          .eq('conversation_id', conversationId)
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
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages((prev) => {
              const nextMessage = payload.new as Message;
              if (prev.some((message) => message.message_id === nextMessage.message_id)) {
                return prev;
              }

              return [...prev, nextMessage];
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
  }, [conversationId]);

  const sendMessage = useCallback(async (content: string, senderId: string) => {
    if (!conversationId) {
      throw new Error('Conversation is not ready yet');
    }

    try {
      setError(null);
      const { error: insertError } = await supabase.from('messages').insert([
        {
          conversation_id: conversationId,
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
  }, [conversationId]);

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

export async function getOrCreateConversation(
  postId: string,
  currentUserId: string,
  otherUserId: string
): Promise<Conversation> {
  if (currentUserId === otherUserId) {
    throw new Error('You cannot start a conversation with yourself.');
  }

  try {
    const { data: existingConversations, error: queryError } = await supabase
      .from('conversations')
      .select('*')
      .eq('post_id', postId)
      .or(`and(initiator_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(initiator_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
      .limit(1);

    if (queryError) throw queryError;

    if (existingConversations && existingConversations.length > 0) {
      return existingConversations[0];
    }

    const { data: newConversation, error: insertError } = await supabase
      .from('conversations')
      .insert([
        {
          post_id: postId,
          initiator_id: currentUserId,
          receiver_id: otherUserId,
        },
      ])
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        const { data: retryConversation, error: retryError } = await supabase
          .from('conversations')
          .select('*')
          .eq('post_id', postId)
          .or(`and(initiator_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(initiator_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
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
