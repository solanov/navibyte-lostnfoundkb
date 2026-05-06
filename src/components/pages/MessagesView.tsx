"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import BottomNavBar from "@/src/components/layout/BottomNavBar";
import ItemDetailModal from "@/src/components/pages/ItemDetailModal";
import { supabase } from "@/src/lib/supabase";
import { Message, useConversation } from "@/src/lib/useConversation";

interface UserProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface ConversationRow {
  conversation_id: string;
  post_id: string;
  initiator_id: string;
  receiver_id: string;
  created_at: string;
}

interface ItemSummary {
  post_id: string;
  general_description: string | null;
  zone: string | null;
  status: string | null;
  image_url: string | null;
  reported_by: string | null;
  categories?: {
    name: string | null;
    icon_identifier: string | null;
  } | null;
}

interface ConversationBundle {
  conversation: ConversationRow;
  otherProfile: UserProfile | null;
  item: ItemSummary | null;
  messages: Message[];
  lastMessage: Message | null;
  unreadCount: number;
}

function formatConversationTime(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isToday) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getItemTitle(item: ItemSummary | null) {
  const [title] = (item?.general_description || "").split("\n\n");
  return title || item?.categories?.name || "Lost item conversation";
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getDisplayName(profile: UserProfile | null, fallback: string) {
  return profile?.full_name || profile?.email || fallback;
}

export default function MessagesView() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [bundles, setBundles] = useState<ConversationBundle[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    sendMessage,
    markAsRead,
  } = useConversation(selectedConversationId);

  const loadInbox = useCallback(async (nextSelectedId?: string | null) => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setCurrentUserId(null);
        setBundles([]);
        setSelectedConversationId(null);
        return;
      }

      setCurrentUserId(user.id);

      const { data: conversations, error: conversationError } = await supabase
        .from("conversations")
        .select("*")
        .or(`initiator_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (conversationError) throw conversationError;

      const conversationRows = (conversations || []) as ConversationRow[];
      const conversationIds = conversationRows.map((conversation) => conversation.conversation_id);
      const postIds = Array.from(new Set(conversationRows.map((conversation) => conversation.post_id).filter(Boolean)));
      const participantIds = Array.from(
        new Set(
          conversationRows.flatMap((conversation) => [
            conversation.initiator_id,
            conversation.receiver_id,
          ])
        )
      );

      const [profilesResult, itemsResult, messagesResult] = await Promise.all([
        participantIds.length > 0
          ? supabase.from("users").select("user_id,full_name,email").in("user_id", participantIds)
          : Promise.resolve({ data: [], error: null }),
        postIds.length > 0
          ? supabase
              .from("public_lost_items")
              .select("post_id,general_description,zone,status,image_url,reported_by,categories(name,icon_identifier)")
              .in("post_id", postIds)
          : Promise.resolve({ data: [], error: null }),
        conversationIds.length > 0
          ? supabase
              .from("messages")
              .select("*")
              .in("conversation_id", conversationIds)
              .order("created_at", { ascending: true })
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (itemsResult.error) throw itemsResult.error;
      if (messagesResult.error) throw messagesResult.error;

      const profilesById = new Map(
        ((profilesResult.data || []) as UserProfile[]).map((profile) => [profile.user_id, profile])
      );
      const itemsById = new Map(
        ((itemsResult.data || []) as ItemSummary[]).map((item) => [item.post_id, item])
      );
      const messagesByConversation = new Map<string, Message[]>();

      ((messagesResult.data || []) as Message[]).forEach((message) => {
        const grouped = messagesByConversation.get(message.conversation_id) || [];
        grouped.push(message);
        messagesByConversation.set(message.conversation_id, grouped);
      });

      const nextBundles = conversationRows
        .map((conversation) => {
          const conversationMessages = messagesByConversation.get(conversation.conversation_id) || [];
          const otherUserId =
            conversation.initiator_id === user.id ? conversation.receiver_id : conversation.initiator_id;
          const lastMessage = conversationMessages[conversationMessages.length - 1] || null;

          return {
            conversation,
            otherProfile: profilesById.get(otherUserId) || null,
            item: itemsById.get(conversation.post_id) || null,
            messages: conversationMessages,
            lastMessage,
            unreadCount: conversationMessages.filter(
              (message) => !message.is_read && message.sender_id !== user.id
            ).length,
          };
        })
        // Only show conversations that have at least one message sent
        .filter((bundle) => bundle.messages.length > 0)
        .sort((a, b) => {
          const aTime = new Date(a.lastMessage?.created_at || a.conversation.created_at).getTime();
          const bTime = new Date(b.lastMessage?.created_at || b.conversation.created_at).getTime();
          return bTime - aTime;
        });

      setBundles(nextBundles);

      const selectedStillExists = nextBundles.some(
        (bundle) => bundle.conversation.conversation_id === nextSelectedId
      );
      const currentStillExists = nextBundles.some(
        (bundle) => bundle.conversation.conversation_id === selectedConversationId
      );

      if (nextSelectedId && selectedStillExists) {
        setSelectedConversationId(nextSelectedId);
      } else if (selectedConversationId && !currentStillExists) {
        setSelectedConversationId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [selectedConversationId]);

  useEffect(() => {
    loadInbox();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadInbox();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadInbox]);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`messages-inbox:${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          loadInbox(selectedConversationId);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [currentUserId, loadInbox, selectedConversationId]);

  useEffect(() => {
    if (!currentUserId) return;

    messages.forEach((message) => {
      if (!message.is_read && message.sender_id !== currentUserId) {
        markAsRead(message.message_id);
      }
    });
  }, [currentUserId, markAsRead, messages]);

  const selectedBundle = useMemo(
    () =>
      bundles.find((bundle) => bundle.conversation.conversation_id === selectedConversationId) ||
      null,
    [bundles, selectedConversationId]
  );

  const filteredBundles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return bundles;

    return bundles.filter((bundle) => {
      const otherName = getDisplayName(bundle.otherProfile, "User").toLowerCase();
      const itemTitle = getItemTitle(bundle.item).toLowerCase();
      const snippet = (bundle.lastMessage?.content || "").toLowerCase();

      return otherName.includes(query) || itemTitle.includes(query) || snippet.includes(query);
    });
  }, [bundles, searchQuery]);

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = messageText.trim();
    if (!trimmed || !selectedConversationId || !currentUserId) return;

    await sendMessage(trimmed, currentUserId);
    setMessageText("");
    loadInbox(selectedConversationId);
  };

  if (!loading && !currentUserId) {
    return (
      <div className="bg-background min-h-screen pt-24 px-4 pb-24 text-on-surface">
        <div className="mx-auto max-w-md rounded-lg bg-surface-container-lowest p-8 text-center shadow-sm border border-outline-variant/30">
          <span className="material-symbols-outlined text-5xl text-tertiary">forum</span>
          <h1 className="mt-4 text-2xl font-headline font-black text-primary">Messages</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Sign in to view your item conversations.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-[#44afa9] px-5 py-3 text-sm font-bold text-white hover:brightness-110"
          >
            Sign in
          </Link>
        </div>
        <BottomNavBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface pt-[72px] md:pt-20 md:h-screen md:overflow-hidden">
      <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-7xl md:h-[calc(100vh-80px)] md:min-h-0 md:px-6 md:pb-6">
        <aside
          className={`${
            selectedConversationId ? "hidden md:flex" : "flex"
          } w-full flex-col bg-surface-container-lowest md:mt-4 md:w-96 md:rounded-lg md:border md:border-outline-variant/30 md:shadow-sm`}
        >
          <div className="border-b border-outline-variant/30 px-4 py-5 md:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="font-headline text-3xl font-black tracking-tight text-primary">
                    Messages
                  </h1>
                  <p className="text-sm font-medium text-on-surface-variant">
                  Conversations about reported items
                </p>
              </div>
              </div>
              <span className="material-symbols-outlined rounded-full bg-[#8df4ec]/25 p-2 text-[#0d6682]">
                forum
              </span>
            </div>
            <div className="relative mt-4">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                type="text"
                placeholder="Search messages"
                className="w-full rounded-full border border-outline-variant/40 bg-surface-container-low py-2.5 pl-10 pr-4 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant focus:border-tertiary focus:ring-2 focus:ring-tertiary/20"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-24 md:pb-0">
            {loading ? (
              <div className="flex h-48 items-center justify-center text-sm font-medium text-on-surface-variant">
                Loading conversations...
              </div>
            ) : error ? (
              <div className="m-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : filteredBundles.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center px-8 text-center">
                <span className="material-symbols-outlined text-5xl text-outline-variant">
                  mark_unread_chat_alt
                </span>
                <p className="mt-3 font-bold text-primary">No conversations yet</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Start one from an item detail on the public board.
                </p>
              </div>
            ) : (
              filteredBundles.map((bundle) => {
                const conversationId = bundle.conversation.conversation_id;
                const isActive = conversationId === selectedConversationId;
                const otherName = getDisplayName(bundle.otherProfile, "Item contact");
                const itemTitle = getItemTitle(bundle.item);
                const snippet = bundle.lastMessage?.content || `Re: ${itemTitle}`;

                return (
                  <button
                    key={conversationId}
                    onClick={() => setSelectedConversationId(conversationId)}
                    className={`relative flex h-[78px] w-full items-center gap-3 px-4 text-left transition-colors md:px-5 ${
                      isActive ? "bg-[#8df4ec]/15" : "hover:bg-surface-container-low"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-10 w-1 -translate-y-1/2 rounded-r-full bg-[#44afa9]" />
                    )}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container text-sm font-black uppercase text-white">
                      {getInitials(otherName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-baseline justify-between gap-3">
                        <p className="truncate text-sm font-bold text-on-surface">{otherName}</p>
                        <span className={`shrink-0 text-[11px] font-bold ${bundle.unreadCount ? "text-[#0d6682]" : "text-on-surface-variant"}`}>
                          {formatConversationTime(bundle.lastMessage?.created_at || bundle.conversation.created_at)}
                        </span>
                      </div>
                      <p className="truncate text-xs font-semibold text-primary">Re: {itemTitle}</p>
                      <p className={`truncate text-sm ${bundle.unreadCount ? "font-bold text-on-surface" : "text-on-surface-variant"}`}>
                        {snippet}
                      </p>
                    </div>
                    {bundle.unreadCount > 0 && (
                      <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#44afa9] px-1.5 text-[10px] font-black text-white">
                        {bundle.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main
          className={`${
            selectedConversationId ? "flex" : "hidden md:flex"
          } min-w-0 flex-1 flex-col bg-surface-container-lowest md:ml-4 md:mt-4 md:rounded-lg md:border md:border-outline-variant/30 md:shadow-sm`}
        >
          {selectedBundle ? (
            <>
              <header className="flex h-16 shrink-0 items-center gap-3 border-b border-outline-variant/30 px-4 md:h-[72px] md:px-6">
                <button
                  onClick={() => setSelectedConversationId(null)}
                  className="rounded-full p-2 text-primary hover:bg-surface-container-low md:hidden"
                  aria-label="Back to conversations"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-sm font-black uppercase text-white">
                  {getInitials(getDisplayName(selectedBundle.otherProfile, "Item contact"))}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-headline text-lg font-black text-primary md:text-2xl">
                    {getDisplayName(selectedBundle.otherProfile, "Item contact")}
                  </h2>
                  <p className="truncate text-xs font-semibold text-on-surface-variant md:text-sm">
                    Re: {getItemTitle(selectedBundle.item)}
                  </p>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto bg-background px-4 py-5 md:px-6">
                <div className="mx-auto flex max-w-3xl flex-col gap-4">
                  {/* Product Reference Card */}
                  {selectedBundle.item && (
                    <button
                      onClick={() => setIsItemModalOpen(true)}
                      className="group flex w-full items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-3 text-left shadow-sm transition-all hover:border-[#44afa9]/40 hover:shadow-md active:scale-[0.99] md:p-4"
                    >
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-outline-variant/20 bg-surface-container-low md:h-16 md:w-16">
                        {selectedBundle.item.image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={selectedBundle.item.image_url}
                            alt={getItemTitle(selectedBundle.item)}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-outline-variant">
                            <span className="material-symbols-outlined text-2xl">
                              {selectedBundle.item.categories?.icon_identifier || "help_outline"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-on-surface group-hover:text-primary">
                          {getItemTitle(selectedBundle.item)}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                              (selectedBundle.item.status === "Found")
                                ? "bg-tertiary-fixed text-on-tertiary-container"
                                : "bg-[#ba1a1a] text-white"
                            }`}
                          >
                            {selectedBundle.item.status === "Reported" ? "Lost" : selectedBundle.item.status}
                          </span>
                          {selectedBundle.item.zone && (
                            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-on-surface-variant">
                              <span className="material-symbols-outlined text-[13px]">location_on</span>
                              {selectedBundle.item.zone}
                            </span>
                          )}
                          {selectedBundle.item.categories?.name && (
                            <span className="text-[11px] font-semibold text-on-surface-variant">
                              · {selectedBundle.item.categories.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="material-symbols-outlined shrink-0 text-lg text-outline-variant transition-colors group-hover:text-[#44afa9]">
                        chevron_right
                      </span>
                    </button>
                  )}
                  {messagesLoading && messages.length === 0 ? (
                    <div className="py-16 text-center text-sm font-medium text-on-surface-variant">
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="py-16 text-center">
                      <span className="material-symbols-outlined text-5xl text-outline-variant">
                        chat_bubble
                      </span>
                      <p className="mt-3 font-bold text-primary">No messages yet</p>
                      <p className="text-sm text-on-surface-variant">
                        Send the first update for this item.
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isMine = message.sender_id === currentUserId;

                      return (
                        <div
                          key={message.message_id}
                          className={`flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm md:max-w-[70%] ${
                              isMine
                                ? "rounded-br-sm bg-[#0d6682] text-white"
                                : "rounded-bl-sm border border-outline-variant/30 bg-surface-container-low text-on-surface"
                            }`}
                          >
                            <p className="break-words text-sm leading-6">{message.content}</p>
                          </div>
                          <div className="flex items-center gap-1 px-1 text-[11px] font-semibold text-on-surface-variant">
                            <span>{formatConversationTime(message.created_at)}</span>
                            {isMine && (
                              <span className="material-symbols-outlined text-[15px] text-[#44afa9]">
                                {message.is_read ? "done_all" : "check"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {(messagesError || error) && (
                <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {messagesError || error}
                </div>
              )}

              <form
                onSubmit={handleSendMessage}
                className="shrink-0 border-t border-outline-variant/30 bg-surface-container-lowest p-3 md:p-4"
              >
                <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-container-low px-3 py-2 focus-within:border-tertiary focus-within:ring-2 focus-within:ring-tertiary/20">
                  <input
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    placeholder="Type a message..."
                    maxLength={500}
                    disabled={messagesLoading}
                    className="min-w-0 flex-1 bg-transparent px-2 py-1 text-sm text-on-surface outline-none placeholder:text-on-surface-variant disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim() || messagesLoading}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#44afa9] text-white transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Send message"
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      send
                    </span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <span className="material-symbols-outlined text-6xl text-outline-variant">forum</span>
              <h2 className="mt-4 font-headline text-2xl font-black text-primary">
                Select a conversation
              </h2>
              <p className="mt-2 max-w-sm text-sm text-on-surface-variant">
                Choose a thread to review item details and continue the conversation.
              </p>
            </div>
          )}
        </main>
      </div>

      {!selectedConversationId && <BottomNavBar />}

      {/* Item Detail Modal */}
      <ItemDetailModal
        isOpen={isItemModalOpen}
        item={
          selectedBundle?.item
            ? {
                post_id: selectedBundle.item.post_id,
                general_description: selectedBundle.item.general_description || "",
                zone: selectedBundle.item.zone || "Unknown",
                status: selectedBundle.item.status || "Reported",
                image_url: selectedBundle.item.image_url,
                reported_by: selectedBundle.item.reported_by || undefined,
                categories: selectedBundle.item.categories
                  ? {
                      name: selectedBundle.item.categories.name || "Uncategorized",
                      icon_identifier: selectedBundle.item.categories.icon_identifier || "help_outline",
                    }
                  : undefined,
              }
            : null
        }
        onClose={() => setIsItemModalOpen(false)}
        onClaimClick={() => {
          setIsItemModalOpen(false);
        }}
        onContactClick={() => {
          setIsItemModalOpen(false);
        }}
      />
    </div>
  );
}
