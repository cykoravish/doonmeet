"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Loader2, MessageCircle, Users } from "lucide-react";
import ConversationListItem, { type ConversationSummary } from "./ConversationListItem";
import DMChatWindow from "./DMChatWindow";
import Alert from "@/components/ui/Alert";
import { buttonClasses } from "@/components/ui/Button";
import { onConnected, useSocket } from "@/lib/socket-client";
import type { PresenceInfo } from "./dmTypes";

interface CurrentUser {
  _id: string;
  name: string;
  avatar: string | null;
}

interface MessagesPanelProps {
  currentUser: CurrentUser;
  initialDmUserId: string | null;
  onDmParamConsumed: () => void;
  /** Lets ChatTabs hide its header on mobile while a conversation is full-screen. */
  onConversationOpenChange?: (open: boolean) => void;
}

export default function MessagesPanel({
  currentUser,
  initialDmUserId,
  onDmParamConsumed,
  onConversationOpenChange,
}: MessagesPanelProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resolvingDm, setResolvingDm] = useState(!!initialDmUserId);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      const d = await res.json();
      if (d.success) {
        const fetched: ConversationSummary[] = d.conversations ?? [];
        // Merge, don't overwrite: a conversation created locally (deep-link /
        // "Message" button) may not be in this response if the GET raced it.
        setConversations((prev) => {
          const fetchedIds = new Set(fetched.map((c) => c._id));
          const localOnly = prev.filter((c) => !fetchedIds.has(c._id));
          return [...localOnly, ...fetched];
        });
      }
    } catch {
      setError("Couldn't load your messages. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversations();
  }, [loadConversations]);

  // Deep link — someone opened /chat?dm=<userId> (e.g. from a profile page).
  // Resolve/create the conversation, then select it.
  useEffect(() => {
    if (!initialDmUserId) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResolvingDm(true);
    setError(null);

    fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId: initialDmUserId }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (!d.success) {
          setError(d.message || "Couldn't start this conversation.");
          return;
        }
        const conv = d.conversation;
        const userId = currentUser._id;
        const shaped: ConversationSummary = {
          _id: conv._id,
          lastMessage: conv.lastMessage,
          unreadCount: 0,
          otherParticipant: conv.participants.find((p: { _id: string }) => p._id !== userId),
        };
        setConversations((prev) => {
          const exists = prev.some((c) => c._id === shaped._id);
          return exists ? prev : [shaped, ...prev];
        });
        setSelectedId(shaped._id);
      })
      .catch(() => !cancelled && setError("Couldn't start this conversation."))
      .finally(() => {
        if (!cancelled) {
          setResolvingDm(false);
          onDmParamConsumed();
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDmUserId]);

  function handleNewIncomingMessage(conversationId: string) {
    // Bump unread count for conversations not currently open, and re-sort by recency.
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c._id === conversationId && c._id !== selectedId ? { ...c, unreadCount: c.unreadCount + 1 } : c
      );
      return [...updated].sort((a, b) => {
        const aTime = a.lastMessage.sentAt ? new Date(a.lastMessage.sentAt).getTime() : 0;
        const bTime = b.lastMessage.sentAt ? new Date(b.lastMessage.sentAt).getTime() : 0;
        return bTime - aTime;
      });
    });
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    setConversations((prev) => prev.map((c) => (c._id === id ? { ...c, unreadCount: 0 } : c)));
  }

  // ---- Online status of everyone in the list (dots + the open chat's header) ----
  // This panel is the ONLY place that watches — the open chat reads from here —
  // so two components can never unwatch each other's people.
  const socket = useSocket(currentUser._id);
  const [presence, setPresence] = useState<Record<string, PresenceInfo>>({});

  // Stable key: only re-watch when the set of people changes, not on every re-sort.
  const watchKey = useMemo(
    () =>
      [...new Set(conversations.map((c) => c.otherParticipant?._id).filter((id): id is string => !!id))]
        .sort()
        .join(","),
    [conversations]
  );

  useEffect(() => {
    if (!socket || !watchKey) return;
    const userIds = watchKey.split(",");

    function handleUpdate(data: { userId: string; isOnline: boolean; lastSeenAt: string | null }) {
      if (!userIds.includes(data.userId)) return;
      setPresence((prev) => ({
        ...prev,
        [data.userId]: {
          isOnline: data.isOnline,
          // "Came online" events carry no lastSeenAt — keep the one we had.
          lastSeenAt: data.lastSeenAt ?? prev[data.userId]?.lastSeenAt ?? null,
        },
      }));
    }

    socket.on("presence:update", handleUpdate);
    // Watch now and after every reconnect; the ack carries everyone's current state.
    const stop = onConnected(socket, () => {
      socket.emit(
        "presence:watch",
        { userIds },
        (res?: { ok: boolean; presence?: Record<string, PresenceInfo> }) => {
          if (res?.ok && res.presence) setPresence((prev) => ({ ...prev, ...res.presence }));
        }
      );
    });

    return () => {
      stop();
      socket.off("presence:update", handleUpdate);
      socket.emit("presence:unwatch", { userIds });
    };
  }, [socket, watchKey]);

  /** Live state if we have it, else what the conversations API said at load. */
  function presenceOf(conv: ConversationSummary): PresenceInfo | null {
    const other = conv.otherParticipant;
    if (!other) return null;
    return (
      presence[other._id] ?? {
        isOnline: !!other.isOnline,
        lastSeenAt: other.lastSeenAt ?? null,
      }
    );
  }

  const selectedConversation = conversations.find((c) => c._id === selectedId) ?? null;
  const conversationOpen = !!selectedConversation?.otherParticipant;

  useEffect(() => {
    onConversationOpenChange?.(conversationOpen);
  }, [conversationOpen, onConversationOpenChange]);

  // Leaving the Messages tab shouldn't leave the header hidden.
  useEffect(() => () => onConversationOpenChange?.(false), [onConversationOpenChange]);

  if (resolvingDm) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={22} className="animate-spin text-muted" aria-label="Opening conversation" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Conversation list — hidden on mobile once a chat is open */}
      <div
        className={`w-full shrink-0 overflow-y-auto overscroll-contain border-r border-border p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:block md:w-80 ${
          conversationOpen ? "hidden" : "block"
        }`}
      >
        {error && (
          <div className="mb-2">
            <Alert type="error" message={error} />
          </div>
        )}

        {loading ? (
          // Static skeleton rows — no shimmer animation
          <div className="flex flex-col gap-1" aria-label="Loading conversations">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <div className="h-[52px] w-[52px] shrink-0 rounded-full bg-surface-2" />
                <div className="flex-1">
                  <div className="h-3.5 w-2/5 rounded bg-surface-2" />
                  <div className="mt-2 h-3 w-3/4 rounded bg-surface-2" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary-soft text-primary-fg">
              <MessageCircle size={26} aria-hidden="true" />
            </span>
            <p className="font-bold">No messages yet</p>
            <p className="mt-1 max-w-xs text-[15px] text-muted">
              Find someone from Dehradun and say hi — your conversations will show up here.
            </p>
            <Link href="/chat?members=1" scroll={false} className={buttonClasses("primary", "md", "mt-4")}>
              <Users size={18} aria-hidden="true" />
              Find people
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {conversations.map((conv) => (
              <li key={conv._id}>
                <ConversationListItem
                  conversation={conv}
                  isActive={conv._id === selectedId}
                  currentUserId={currentUser._id}
                  isOnline={!!presenceOf(conv)?.isOnline}
                  onClick={() => handleSelect(conv._id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Active conversation */}
      <div className={`min-w-0 flex-1 ${conversationOpen ? "block" : "hidden md:block"}`}>
        {conversationOpen ? (
          <DMChatWindow
            key={selectedConversation!._id}
            conversationId={selectedConversation!._id}
            otherParticipant={selectedConversation!.otherParticipant!}
            currentUser={currentUser}
            presence={presenceOf(selectedConversation!)}
            onBack={() => setSelectedId(null)}
            onMessageSent={handleNewIncomingMessage}
          />
        ) : (
          <div className="hidden h-full flex-col items-center justify-center text-center md:flex">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary-soft text-primary-fg">
              <MessageCircle size={26} aria-hidden="true" />
            </span>
            <p className="font-bold">Select a conversation</p>
            <p className="mt-1 text-[15px] text-muted">Pick someone from the list to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
