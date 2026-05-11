import useSWR from "swr";
import { supabase } from "@/src/lib/supabase";
import {
  Conversation,
  Message,
  getConversationPairKey,
} from "@/src/lib/useConversation";

export interface UserProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface ConversationRow extends Conversation {
  post_id: string;
}

export interface ConversationBundle {
  activeConversationId: string;
  conversationIds: string[];
  createdAt: string;
  otherUserId: string;
  myProfile: UserProfile | null;
  otherProfile: UserProfile | null;
  messages: Message[];
  lastMessage: Message | null;
  unreadCount: number;
}

function sortMessages(messages: Message[]) {
  return [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

function sortBundles(bundles: ConversationBundle[]) {
  return [...bundles].sort((a, b) => {
    const aTime = new Date(a.lastMessage?.created_at || a.createdAt).getTime();
    const bTime = new Date(b.lastMessage?.created_at || b.createdAt).getTime();
    return bTime - aTime;
  });
}

function rebuildBundle(
  bundle: ConversationBundle,
  currentUserId: string | null,
  nextMessages: Message[]
): ConversationBundle {
  const sortedMessages = sortMessages(nextMessages);
  const lastMessage = sortedMessages[sortedMessages.length - 1] || null;
  const unreadCount = sortedMessages.filter(
    (message) => !message.is_read && message.sender_id !== currentUserId
  ).length;

  return {
    ...bundle,
    messages: sortedMessages,
    lastMessage,
    unreadCount,
  };
}

export function buildConversationBundles(
  userId: string,
  conversationRows: ConversationRow[],
  profiles: UserProfile[],
  messages: Message[]
) {
  const profilesById = new Map(
    profiles.map((profile) => [profile.user_id, profile] as const)
  );
  const messagesByConversation = new Map<string, Message[]>();

  messages.forEach((message) => {
    const grouped = messagesByConversation.get(message.conversation_id) || [];
    grouped.push(message);
    messagesByConversation.set(message.conversation_id, grouped);
  });

  const groupedConversations = new Map<string, ConversationRow[]>();

  conversationRows.forEach((conversation) => {
    const otherUserId =
      conversation.initiator_id === userId
        ? conversation.receiver_id
        : conversation.initiator_id;
    const pairKey = getConversationPairKey(userId, otherUserId);
    const existing = groupedConversations.get(pairKey) || [];
    existing.push(conversation);
    groupedConversations.set(pairKey, existing);
  });

  return sortBundles(
    Array.from(groupedConversations.values())
      .map((group) => {
        const sortedGroup = [...group].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const canonicalConversation = sortedGroup[0];
        const otherUserId =
          canonicalConversation.initiator_id === userId
            ? canonicalConversation.receiver_id
            : canonicalConversation.initiator_id;
        const mergedMessages = sortMessages(
          sortedGroup.flatMap(
            (conversation) => messagesByConversation.get(conversation.conversation_id) || []
          )
        );

        return rebuildBundle(
          {
            activeConversationId: canonicalConversation.conversation_id,
            conversationIds: sortedGroup.map((conversation) => conversation.conversation_id),
            createdAt: canonicalConversation.created_at,
            otherUserId,
            myProfile: profilesById.get(userId) || null,
            otherProfile: profilesById.get(otherUserId) || null,
            messages: mergedMessages,
            lastMessage: null,
            unreadCount: 0,
          },
          userId,
          mergedMessages
        );
      })
      .filter((bundle) => bundle.messages.length > 0)
  );
}

export async function fetchConversationInbox(userId: string) {
  const { data: conversations, error: conversationError } = await supabase
    .from("conversations")
    .select("*")
    .or(`initiator_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (conversationError) {
    throw conversationError;
  }

  const conversationRows = (conversations || []) as ConversationRow[];
  if (conversationRows.length === 0) {
    return [] as ConversationBundle[];
  }

  const conversationIds = conversationRows.map(
    (conversation) => conversation.conversation_id
  );
  const participantIds = Array.from(
    new Set(
      conversationRows.flatMap((conversation) => [
        conversation.initiator_id,
        conversation.receiver_id,
      ])
    )
  );

  const [profilesResult, messagesResult] = await Promise.all([
    participantIds.length > 0
      ? supabase
          .from("users")
          .select("user_id,full_name,email,avatar_url")
          .in("user_id", participantIds)
      : Promise.resolve({ data: [], error: null }),
    conversationIds.length > 0
      ? supabase
          .from("messages")
          .select("*")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (profilesResult.error) {
    throw profilesResult.error;
  }

  if (messagesResult.error) {
    throw messagesResult.error;
  }

  return buildConversationBundles(
    userId,
    conversationRows,
    (profilesResult.data || []) as UserProfile[],
    (messagesResult.data || []) as Message[]
  );
}

export function upsertMessageInConversationBundles(
  bundles: ConversationBundle[],
  message: Message,
  currentUserId: string | null
) {
  let didUpdate = false;

  const nextBundles = bundles.map((bundle) => {
    if (!bundle.conversationIds.includes(message.conversation_id)) {
      return bundle;
    }

    didUpdate = true;

    const nextMessages = bundle.messages.some(
      (entry) => entry.message_id === message.message_id
    )
      ? bundle.messages.map((entry) =>
          entry.message_id === message.message_id ? message : entry
        )
      : [...bundle.messages, message];

    return rebuildBundle(bundle, currentUserId, nextMessages);
  });

  return didUpdate ? sortBundles(nextBundles) : bundles;
}

export function replaceOptimisticMessageInConversationBundles(
  bundles: ConversationBundle[],
  optimisticMessageId: string,
  persistedMessage: Message,
  currentUserId: string | null
) {
  const nextBundles = bundles.map((bundle) => {
    if (!bundle.conversationIds.includes(persistedMessage.conversation_id)) {
      return bundle;
    }

    const nextMessages = bundle.messages.map((message) =>
      message.message_id === optimisticMessageId ? persistedMessage : message
    );

    return rebuildBundle(bundle, currentUserId, nextMessages);
  });

  return sortBundles(nextBundles);
}

export function markConversationBundlesRead(
  bundles: ConversationBundle[],
  conversationIds: string[],
  currentUserId: string
) {
  return sortBundles(
    bundles.map((bundle) => {
      if (!bundle.conversationIds.some((id) => conversationIds.includes(id))) {
        return bundle;
      }

      const nextMessages = bundle.messages.map((message) => {
        if (message.sender_id === currentUserId || message.is_read) {
          return message;
        }

        return { ...message, is_read: true };
      });

      return rebuildBundle(bundle, currentUserId, nextMessages);
    })
  );
}

export function useMessagesInbox(userId: string | null) {
  return useSWR(
    userId ? ["messages-inbox", userId] : null,
    () => fetchConversationInbox(userId as string),
    {
      fallbackData: [],
      keepPreviousData: true,
    }
  );
}
