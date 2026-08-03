"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, MessageCircle, AlertCircle } from "lucide-react";
import ConversationListItem, { type ConversationSummary } from "./ConversationListItem";
import DMChatWindow from "./DMChatWindow";

interface CurrentUser {
  _id: string;
  name: string;
  avatar: string | null;
}

interface MessagesPanelProps {
  currentUser: CurrentUser;
  initialDmUserId: string | null;
  onDmParamConsumed: () => void;
}

export default function MessagesPanel({
  currentUser,
  initialDmUserId,
  onDmParamConsumed,
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
      if (d.success) setConversations(d.conversations ?? []);
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
          otherParticipant: conv.participants.find(
            (p: { _id: string }) => p._id !== userId
          ),
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
        c._id === conversationId && c._id !== selectedId
          ? { ...c, unreadCount: c.unreadCount + 1 }
          : c
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
    setConversations((prev) =>
      prev.map((c) => (c._id === id ? { ...c, unreadCount: 0 } : c))
    );
  }

  const selectedConversation = conversations.find((c) => c._id === selectedId) ?? null;

  if (resolvingDm) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={22} className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Conversation list — hidden on mobile once a chat is open */}
      <div
        className={`w-full shrink-0 overflow-y-auto border-r border-border p-2 md:block md:w-80 ${
          selectedConversation ? "hidden" : "block"
        }`}
      >
        {error && (
          <div className="mb-2 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-600">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 size={20} className="animate-spin text-muted" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <MessageCircle size={24} className="text-primary" />
            </div>
            <p className="font-bold">No messages yet</p>
            <p className="mt-1 text-sm text-muted">
              Visit someone&apos;s profile and hit &ldquo;Message&rdquo; to start a conversation.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <ConversationListItem
                key={conv._id}
                conversation={conv}
                isActive={conv._id === selectedId}
                currentUserId={currentUser._id}
                onClick={() => handleSelect(conv._id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Active conversation */}
      <div className={`min-w-0 flex-1 ${selectedConversation ? "block" : "hidden md:block"}`}>
        {selectedConversation?.otherParticipant ? (
          <DMChatWindow
            key={selectedConversation._id}
            conversationId={selectedConversation._id}
            otherParticipant={selectedConversation.otherParticipant}
            currentUser={currentUser}
            onBack={() => setSelectedId(null)}
            onMessageSent={handleNewIncomingMessage}
          />
        ) : (
          <div className="hidden h-full flex-col items-center justify-center text-center md:flex">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <MessageCircle size={24} className="text-primary" />
            </div>
            <p className="font-bold">Select a conversation</p>
            <p className="mt-1 text-sm text-muted">Pick someone from the list to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
