"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { ArrowDown, ArrowLeft, ChevronUp, Loader2, Send } from "lucide-react";
import ChatMessage from "./ChatMessage";
import Avatar from "@/components/ui/Avatar";
import IconButton from "@/components/ui/IconButton";
import { appendUnique, buildChatRows, prependUnique } from "./chatUtils";
import { useChatScroll } from "./useChatScroll";

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
  // Present on messages loaded from history; live socket payloads omit it.
  readBy?: { userId: string; readAt: string }[];
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

/** Id of the newest message the other person has read (from history). */
function lastReadIdFromHistory(messages: DMMessage[], otherId: string): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.readBy?.some((r) => String(r.userId) === otherId)) return m._id;
  }
  return null;
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
  // Everything up to and including this message id has been seen by the other person.
  const [seenThroughId, setSeenThroughId] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Newest message id, updated synchronously wherever a message is added —
  // a dm:read event can arrive before React has re-rendered with the
  // message it refers to, so state alone would be one message behind.
  const latestIdRef = useRef<string | null>(null);
  const firstName = otherParticipant.name.split(" ")[0];

  const { scrollRef, onScroll, scrollToBottom, beginPrepend, unseenCount } = useChatScroll({
    messages,
    ready: !loading,
    currentUserId: currentUser._id,
  });

  const rows = useMemo(() => buildChatRows(messages), [messages]);

  // Load message history for this conversation
  useEffect(() => {
    let cancelled = false;

    fetch(`/api/conversations/${conversationId}/messages?limit=30`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const history: DMMessage[] = d.messages ?? [];
        // Don't overwrite a newer id from a live message that raced the fetch.
        if (!latestIdRef.current && history.length > 0) {
          latestIdRef.current = history[history.length - 1]._id;
        }
        setMessages((prev) => (prev.length === 0 ? history : prependUnique(prev, history)));
        // A live event may already have set a newer value — keep it.
        setSeenThroughId((prev) => prev ?? lastReadIdFromHistory(history, otherParticipant._id));
        setHasMore(!!d.hasMore);
        setNextCursor(d.nextCursor ?? null);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [conversationId, otherParticipant._id]);

  // Socket connection scoped to this conversation (this component remounts
  // per conversation via key={conversationId}, so disconnecting on unmount
  // also leaves the server-side dm room).
  useEffect(() => {
    const socket = io({ withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("dm:join", { conversationId });
    });

    socket.on("dm:message", (message: DMMessage) => {
      if (message.conversationId !== conversationId) return;
      latestIdRef.current = message._id;
      setMessages((prev) => appendUnique(prev, message));
      if (message.sender._id !== currentUser._id) {
        setOtherTyping(false);
        // Replying means they've seen everything before this.
        setSeenThroughId(message._id);
        onMessageSent?.(conversationId, message);
      }
    });

    // The other person opened the conversation / read a message live —
    // everything currently in the list is now seen.
    socket.on("dm:read", (data: { conversationId: string; readBy: string }) => {
      if (data.conversationId !== conversationId || data.readBy !== otherParticipant._id) return;
      if (latestIdRef.current) setSeenThroughId(latestIdRef.current);
    });

    socket.on("typing:start", () => {
      setOtherTyping(true);
      // Safety net in case the matching typing:stop never arrives.
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      typingClearRef.current = setTimeout(() => setOtherTyping(false), 5000);
    });
    socket.on("typing:stop", () => setOtherTyping(false));

    return () => {
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  async function loadOlder() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages?limit=30&cursor=${nextCursor}`
      );
      const d = await res.json();
      beginPrepend();
      setMessages((prev) => prependUnique(prev, d.messages ?? []));
      setHasMore(!!d.hasMore);
      setNextCursor(d.nextCursor ?? null);
    } catch {
      // Button stays available for a retry.
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
        if (d.success) {
          latestIdRef.current = d.message._id;
          setMessages((prev) => appendUnique(prev, d.message));
        }
      }
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  // "Seen" / "Sent" under your latest message, WhatsApp-style.
  const receipt = useMemo(() => {
    let lastOwnIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender._id === currentUser._id) {
        lastOwnIndex = i;
        break;
      }
    }
    if (lastOwnIndex === -1) return null;
    const seenIndex = seenThroughId ? messages.findIndex((m) => m._id === seenThroughId) : -1;
    return {
      afterId: messages[lastOwnIndex]._id,
      label: seenIndex >= lastOwnIndex ? "Seen" : "Sent",
    };
  }, [messages, seenThroughId, currentUser._id]);

  return (
    <div className="relative flex h-full flex-col">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface px-2 sm:px-4 md:h-16">
        {onBack && (
          <IconButton label="Back to messages" variant="ghost" onClick={onBack} className="md:hidden">
            <ArrowLeft size={22} />
          </IconButton>
        )}
        <Link
          href={`/users/${otherParticipant._id}`}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[14px] py-1 pr-2"
        >
          <Avatar name={otherParticipant.name} src={otherParticipant.avatar} size={40} />
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-bold text-text">{otherParticipant.name}</span>
            <span
              className={`block text-[13px] ${otherTyping ? "font-semibold text-primary-fg" : "text-muted"}`}
              aria-live="polite"
            >
              {otherTyping ? "typing…" : "View profile"}
            </span>
          </span>
        </Link>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto overscroll-contain px-3 pt-3 pb-2 sm:px-6"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 size={22} className="animate-spin text-muted" aria-label="Loading messages" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Avatar name={otherParticipant.name} src={otherParticipant.avatar} size={72} />
            <p className="mt-3 text-lg font-bold">Say hi to {firstName}!</p>
            <p className="mt-1 text-[15px] text-muted">This is the start of your conversation.</p>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="flex justify-center pb-3">
                <button
                  type="button"
                  onClick={loadOlder}
                  disabled={loadingMore}
                  className="flex h-10 items-center gap-1.5 rounded-full bg-surface-2 px-4 text-sm font-semibold text-muted transition-colors hover:text-text disabled:opacity-50"
                >
                  {loadingMore ? (
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <ChevronUp size={16} aria-hidden="true" />
                  )}
                  Load earlier messages
                </button>
              </div>
            )}

            {rows.map((row) => (
              <div key={row.msg._id}>
                {row.showDivider && (
                  <div className="flex justify-center py-2">
                    <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-muted">
                      {row.dayLabel}
                    </span>
                  </div>
                )}
                <ChatMessage
                  variant="dm"
                  content={row.msg.content}
                  senderId={row.msg.sender._id}
                  senderName={row.msg.sender.name}
                  senderAvatar={row.msg.sender.avatar}
                  isOwn={row.msg.sender._id === currentUser._id}
                  time={row.time}
                  firstInGroup={row.firstInGroup}
                  lastInGroup={row.lastInGroup}
                />
                {receipt?.afterId === row.msg._id && (
                  <p className="-mt-1.5 mb-2 pr-1 text-right text-xs font-medium text-muted">{receipt.label}</p>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {unseenCount > 0 && (
        <button
          type="button"
          onClick={() => scrollToBottom()}
          className="absolute bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-1/2 z-10 flex h-10 -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-on-primary shadow-md md:bottom-20"
        >
          <ArrowDown size={16} aria-hidden="true" />
          {unseenCount} new {unseenCount === 1 ? "message" : "messages"}
        </button>
      )}

      {/* Composer */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-border bg-surface px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:px-6 md:pb-3"
      >
        <label htmlFor={`dm-input-${conversationId}`} className="sr-only">
          Message {otherParticipant.name}
        </label>
        <input
          id={`dm-input-${conversationId}`}
          ref={inputRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleTyping();
          }}
          placeholder={`Message ${firstName}…`}
          maxLength={1000}
          autoComplete="off"
          enterKeyHint="send"
          className="h-12 min-w-0 flex-1 rounded-[16px] border-[1.5px] border-transparent bg-surface-2 px-4 text-base text-text outline-none placeholder:text-muted focus:border-primary focus:bg-surface"
        />
        <button
          type="submit"
          disabled={!content.trim() || sending}
          aria-label="Send message"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-primary text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-40"
        >
          <Send size={19} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
