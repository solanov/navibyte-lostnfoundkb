"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import BottomNavBar from "@/src/components/layout/BottomNavBar";
import { supabase } from "@/src/lib/supabase";
import {
  Message,
  buildOptimisticMessage,
  markMessageAsReadRequest,
  sendConversationMessage,
} from "@/src/lib/useConversation";
import {
  UserProfile,
  markConversationBundlesRead,
  replaceOptimisticMessageInConversationBundles,
  upsertMessageInConversationBundles,
  useMessagesInbox,
} from "@/src/lib/messagesInbox";

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
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [messageError, setMessageError] = useState<string | null>(null);
  const requestedConversationId = searchParams.get("conversation");
  const {
    data: bundles = [],
    error,
    isLoading: bundlesLoading,
    mutate: mutateBundles,
  } = useMessagesInbox(currentUserId);

  useEffect(() => {
    let isMounted = true;

    const syncCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      setCurrentUserId(user?.id ?? null);
      setAuthLoading(false);
    };

    void syncCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id ?? null);
      setAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`messages-inbox:${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          const nextMessage = payload.new as Message | undefined;
          const previousMessage = payload.old as Message | undefined;
          const relevantConversationId =
            nextMessage?.conversation_id || previousMessage?.conversation_id;

          if (!relevantConversationId) {
            return;
          }

          void mutateBundles((current = []) => {
            const hasConversation = current.some((bundle) =>
              bundle.conversationIds.includes(relevantConversationId)
            );

            if (!hasConversation) {
              return current;
            }

            if (payload.eventType === "INSERT" && nextMessage) {
              return upsertMessageInConversationBundles(
                current,
                nextMessage,
                currentUserId
              );
            }

            if (payload.eventType === "UPDATE" && nextMessage) {
              return upsertMessageInConversationBundles(
                current,
                nextMessage,
                currentUserId
              );
            }

            return current;
          }, false);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [currentUserId, mutateBundles]);

  useEffect(() => {
    if (!currentUserId) return;

    const conversationsChannel = supabase
      .channel(`conversation-membership:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `initiator_id=eq.${currentUserId}`,
        },
        () => {
          void mutateBundles();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        () => {
          void mutateBundles();
        }
      )
      .subscribe();

    return () => {
      conversationsChannel.unsubscribe();
    };
  }, [currentUserId, mutateBundles]);

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    const stillExists = bundles.some(
      (bundle) => bundle.activeConversationId === selectedConversationId
    );

    if (!stillExists) {
      const timer = window.setTimeout(() => {
        setSelectedConversationId(null);
      }, 0);

      return () => {
        window.clearTimeout(timer);
      };
    }
  }, [bundles, selectedConversationId]);

  useEffect(() => {
    if (!requestedConversationId) {
      return;
    }

    let selectionTimer: number | undefined;

    const matchingBundle = bundles.find(
      (bundle) =>
        bundle.activeConversationId === requestedConversationId ||
        bundle.conversationIds.includes(requestedConversationId)
    );

    if (!matchingBundle) {
      if (bundlesLoading) {
        return;
      }
    } else if (selectedConversationId !== matchingBundle.activeConversationId) {
      selectionTimer = window.setTimeout(() => {
        setSelectedConversationId(matchingBundle.activeConversationId);
      }, 0);
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("conversation");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });

    return () => {
      if (selectionTimer !== undefined) {
        window.clearTimeout(selectionTimer);
      }
    };
  }, [
    bundles,
    bundlesLoading,
    pathname,
    requestedConversationId,
    router,
    searchParams,
    selectedConversationId,
  ]);

  const selectedBundle = useMemo(
    () => bundles.find((bundle) => bundle.activeConversationId === selectedConversationId) || null,
    [bundles, selectedConversationId]
  );
  const messages = selectedBundle?.messages || [];
  const loading = authLoading || (Boolean(currentUserId) && bundlesLoading);
  const messagesLoading = loading && messages.length === 0;
  const messagesError =
    error instanceof Error ? error.message : error ? String(error) : null;

  useEffect(() => {
    if (!currentUserId || !selectedBundle) {
      return;
    }

    const unreadMessages = selectedBundle.messages.filter(
      (message) => !message.is_read && message.sender_id !== currentUserId
    );

    if (unreadMessages.length === 0) {
      return;
    }

    void mutateBundles((current = []) =>
      markConversationBundlesRead(
        current,
        selectedBundle.conversationIds,
        currentUserId
      ), false);

    unreadMessages.forEach((message) => {
      void markMessageAsReadRequest(message.message_id).catch(() => undefined);
    });
  }, [currentUserId, mutateBundles, selectedBundle]);

  const filteredBundles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return bundles;

    return bundles.filter((bundle) => {
      const otherName = getDisplayName(bundle.otherProfile, "User").toLowerCase();
      const snippet = (bundle.lastMessage?.content || "").toLowerCase();

      return otherName.includes(query) || snippet.includes(query);
    });
  }, [bundles, searchQuery]);

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = messageText.trim();
    if (!trimmed || !selectedBundle || !currentUserId) return;

    const optimisticMessage = buildOptimisticMessage(
      selectedBundle.activeConversationId,
      currentUserId,
      trimmed
    );
    const previousBundles = bundles;

    setMessageError(null);
    setMessageText("");
    void mutateBundles((current = []) =>
      upsertMessageInConversationBundles(current, optimisticMessage, currentUserId),
      false);

    try {
      const persistedMessage = await sendConversationMessage(
        selectedBundle.activeConversationId,
        trimmed,
        currentUserId
      );

      void mutateBundles((current = []) =>
        replaceOptimisticMessageInConversationBundles(
          current,
          optimisticMessage.message_id,
          persistedMessage,
          currentUserId
        ),
        false);
    } catch (sendError) {
      setMessageText(trimmed);
      setMessageError(
        sendError instanceof Error ? sendError.message : "Failed to send message"
      );
      void mutateBundles(previousBundles, false);
    }
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
              
              <div className="flex items-center gap-2">
                {/* SLEEK INLINE BACK BUTTON */}
                <Link
                  href="/board"
                  className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#41484c] transition-all hover:bg-[#002433]/5 hover:text-[#002433] active:scale-95"
                  aria-label="Back to Board"
                  title="Back to Board"
                >
                  <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                </Link>

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
                const conversationId = bundle.activeConversationId;
                const isActive = conversationId === selectedConversationId;
                const otherName = getDisplayName(bundle.otherProfile, "Item contact");
                const snippet = bundle.lastMessage?.content || `Direct Message`;

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
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full overflow-hidden bg-primary-container text-sm font-black uppercase text-white border border-outline-variant/10">
                      {bundle.otherProfile?.avatar_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={bundle.otherProfile.avatar_url} alt={otherName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        getInitials(otherName)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-baseline justify-between gap-3">
                        <p className="truncate text-sm font-bold text-on-surface">{otherName}</p>
                        <span className={`shrink-0 text-[11px] font-bold ${bundle.unreadCount ? "text-[#0d6682]" : "text-on-surface-variant"}`}>
                          {formatConversationTime(bundle.lastMessage?.created_at || bundle.createdAt)}
                        </span>
                      </div>
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden bg-primary-container text-sm font-black uppercase text-white border border-outline-variant/10">
                  {selectedBundle.otherProfile?.avatar_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={selectedBundle.otherProfile.avatar_url} alt={getDisplayName(selectedBundle.otherProfile, "Item contact")} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    getInitials(getDisplayName(selectedBundle.otherProfile, "Item contact"))
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-headline text-lg font-black text-primary md:text-2xl">
                    {getDisplayName(selectedBundle.otherProfile, "Item contact")}
                  </h2>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto bg-background px-4 py-5 md:px-6">
                <div className="mx-auto flex max-w-3xl flex-col gap-4">
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
                      const profile = isMine ? selectedBundle.myProfile : selectedBundle.otherProfile;
                      const displayName = getDisplayName(profile, isMine ? "You" : "Item contact");

                      return (
                        <div
                          key={message.message_id}
                          className={`flex gap-2.5 ${isMine ? "flex-row-reverse" : "flex-row"}`}
                        >
                          <div className="flex h-8 w-8 shrink-0 mt-auto mb-[22px] items-center justify-center rounded-full overflow-hidden bg-primary-container text-xs font-black uppercase text-white border border-outline-variant/10 hidden md:flex">
                            {profile?.avatar_url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={profile.avatar_url} alt={displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              getInitials(displayName)
                            )}
                          </div>
                          <div className={`flex flex-col gap-1 max-w-[85%] md:max-w-[70%] ${isMine ? "items-end" : "items-start"}`}>
                            <div
                              className={`w-full rounded-2xl px-4 py-3 shadow-sm ${
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
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {(messagesError || messageError) && (
                <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {messageError || messagesError}
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
    </div>
  );
}
