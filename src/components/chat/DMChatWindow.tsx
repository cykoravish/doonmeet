"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { ArrowLeft, Send, Loader2, ChevronUp } from "lucide-react";
import Image from "next/image";
import ChatMessage from "./ChatMessage";

interface DMMessage {
  _id: string;
  conversationId: string;
  content: string;
  createdAt: string;
  sender: {
    _id: string;
    name: string;
    avatar: string | null;
  };
}

interface OtherParticipant {
  _id: string;
  name: string;
  avatar: string | null;
}

interface CurrentUser {
  _id: string;
  name: string;
  avatar: string | null;
}

interface DMChatWindowProps {
  conversationId: string;
  otherParticipant: OtherParticipant;
  currentUser: CurrentUser;
  onBack?: () => void;
  onMessageSent?: (conversationId: string, message: DMMessage) => void;
}

export default function DMChatWindow({
  conversationId,
  otherParticipant,
  currentUser,
  onBack,
  onMessageSent,
}: DMChatWindowProps) {
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [sending, setSending] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scrolls the message list container directly rather than scrollIntoView,
  // which can otherwise walk up and scroll an unintended ancestor.
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollAreaRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  // Load message history for this conversation
  useEffect(() => {
    let cancelled = false;

    fetch(`/api/conversations/${conversationId}/messages?limit=30`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setMessages(d.messages ?? []);
        setHasMore(!!d.hasMore);
        setNextCursor(d.nextCursor ?? null);
        setLoading(false);
        requestAnimationFrame(() => scrollToBottom("auto"));
      })
      .catch(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [conversationId, scrollToBottom]);

  // Socket connection scoped to this conversation
  useEffect(() => {
    const socket = io({ withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("dm:join", { conversationId });
    });

    socket.on("dm:message", (message: DMMessage) => {
      if (message.conversationId !== conversationId) return;
      setMessages((prev) => [...prev, message]);
      if (message.sender._id !== currentUser._id) {
        onMessageSent?.(conversationId, message);
      }
    });

    socket.on("typing:start", () => setOtherTyping(true));
    socket.on("typing:stop", () => setOtherTyping(false));

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Auto-scroll on new messages (unless user is reading older history)
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  async function loadOlder() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const container = scrollAreaRef.current;
    const prevHeight = container?.scrollHeight ?? 0;

    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages?limit=30&cursor=${nextCursor}`
      );
      const d = await res.json();
      setMessages((prev) => [...(d.messages ?? []), ...prev]);
      setHasMore(!!d.hasMore);
      setNextCursor(d.nextCursor ?? null);

      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevHeight;
        }
      });
    } finally {
      setLoadingMore(false);
    }
  }

  function handleTyping() {
    if (!socketRef.current) return;
    socketRef.current.emit("typing:start", { conversationId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("typing:stop", { conversationId });
    }, 1500);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setContent("");
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current?.emit("typing:stop", { conversationId });

    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit("dm:message", { conversationId, content: trimmed });
      } else {
        // REST fallback if the socket connection is down
        const res = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: trimmed }),
        });
        const d = await res.json();
        if (d.success) setMessages((prev) => [...prev, d.message]);
      }
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-2.5">
        {onBack && (
          <button
            onClick={onBack}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-primary/10 md:hidden"
            aria-label="Back to messages"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        {otherParticipant.avatar ? (
          <Image
            src={otherParticipant.avatar}
            alt={otherParticipant.name}
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            {otherParticipant.name[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{otherParticipant.name}</p>
          <p className="text-xs text-muted">{otherTyping ? "typing..." : "Direct message"}</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 sm:px-6">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 size={22} className="animate-spin text-muted" />
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="flex justify-center pb-2">
                <button
                  onClick={loadOlder}
                  disabled={loadingMore}
                  className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:bg-primary/5 disabled:opacity-50"
                >
                  {loadingMore ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <ChevronUp size={12} />
                  )}
                  Load earlier messages
                </button>
              </div>
            )}

            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="mb-3 text-5xl">💬</span>
                <p className="font-bold">Say hi to {otherParticipant.name.split(" ")[0]}!</p>
                <p className="mt-1 text-sm text-muted">
                  This is the start of your conversation.
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <ChatMessage
                  key={msg._id}
                  content={msg.content}
                  senderId={msg.sender._id}
                  senderName={msg.sender.name}
                  senderAvatar={msg.sender.avatar}
                  isOwn={msg.sender._id === currentUser._id}
                  createdAt={msg.createdAt}
                  showName={false}
                  showAvatar={
                    i === messages.length - 1 || messages[i + 1].sender._id !== msg.sender._id
                  }
                  isLastInGroup={
                    i === messages.length - 1 || messages[i + 1].sender._id !== msg.sender._id
                  }
                />
              ))
            )}
          </>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-3 border-t border-border bg-surface px-4 py-2.5"
      >
        <input
          ref={inputRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleTyping();
          }}
          placeholder={`Message ${otherParticipant.name.split(" ")[0]}...`}
          maxLength={1000}
          className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-all focus:border-primary"
        />
        <button
          type="submit"
          disabled={!content.trim() || sending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-opacity hover:opacity-85 disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
