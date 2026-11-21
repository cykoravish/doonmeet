"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { onConnected, useSocket } from "@/lib/socket-client";
import { ArrowDown, ChevronUp, Loader2, MessagesSquare, Send, ShieldCheck } from "lucide-react";
import ChatMessage from "./ChatMessage";
import JoinChatModal from "./JoinChatModal";
import { appendUnique, buildChatRows, prependUnique } from "./chatUtils";
import { useChatScroll } from "./useChatScroll";

interface Message {
  _id: string;
  content: string;
  createdAt: string;
  sender: {
    _id: string;
    name: string;
    avatar: string | null;
  };
}

interface CurrentUser {
  _id: string;
  name: string;
  avatar: string | null;
}

interface ChatRoomProps {
  currentUser: CurrentUser | null;
  // Open a DM with this user (switches to the Messages tab).
  onStartDm?: (userId: string) => void;
}

export default function ChatRoom({ currentUser, onStartDm }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  // Set when the server rejects a message because this user was auto-muted
  // after several reports (ISO timestamp of when the mute ends).
  const [mutedUntil, setMutedUntil] = useState<string | null>(null);

  // Hide the mute notice automatically once the mute has expired.
  useEffect(() => {
    if (!mutedUntil) return;
    const ms = new Date(mutedUntil).getTime() - Date.now();
    const timer = setTimeout(() => setMutedUntil(null), Math.max(0, ms));
    return () => clearTimeout(timer);
  }, [mutedUntil]);

  // The tab's shared socket (logged-in users only — the server requires auth).
  const socket = useSocket(currentUser?._id);
  const inputRef = useRef<HTMLInputElement>(null);

  const { scrollRef, onScroll, scrollToBottom, beginPrepend, unseenCount } = useChatScroll({
    messages,
    ready: !loading,
    currentUserId: currentUser?._id,
  });

  // Dividers / grouping / time strings computed once per message list change.
  const rows = useMemo(() => buildChatRows(messages), [messages]);

  // Fetch initial messages
  useEffect(() => {
    fetch("/api/room-messages?limit=50")
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages ?? []);
        setHasMore(!!d.hasMore);
        setNextCursor(d.nextCursor ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function loadOlder() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/room-messages?limit=50&cursor=${nextCursor}`);
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

  // Live public-room updates over the shared socket.
  useEffect(() => {
    if (!socket) return;

    function handleMessage(message: Message) {
      setMessages((prev) => appendUnique(prev, message));
    }
    function handleMuted(data: { until: string }) {
      setMutedUntil(data.until);
    }

    socket.on("room:message", handleMessage);
    socket.on("room:muted", handleMuted);
    // Join now (if connected) and again after any reconnect.
    const stopRejoining = onConnected(socket, () => socket.emit("room:join"));

    return () => {
      stopRejoining();
      socket.off("room:message", handleMessage);
      socket.off("room:muted", handleMuted);
      // The socket stays open for other features — just leave the room.
      socket.emit("room:leave");
    };
  }, [socket]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    // Not logged in — show the join sheet instead of sending
    if (!currentUser) {
      setShowJoinModal(true);
      return;
    }

    if (!socket) return;

    socket.emit("room:message", { content: content.trim() });
    setContent("");
    inputRef.current?.focus();
  }

  return (
    <div className="relative flex h-full flex-col">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 pt-3 pb-2 sm:px-6"
      >
        {/* House rules + a hint that names are tappable (a feature people
            otherwise never discover). Scrolls away with the history. */}
        <div className="mx-auto mb-3 flex max-w-md items-start gap-2.5 rounded-[14px] bg-primary-soft px-3.5 py-2.5 text-sm text-text">
          <ShieldCheck size={18} className="mt-px shrink-0 text-primary-fg" aria-hidden="true" />
          <p>
            Be kind — everyone in Dehradun can read this chat. Tap someone&apos;s name to message
            them or see their profile.
          </p>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 size={22} className="animate-spin text-muted" aria-label="Loading messages" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary-soft text-primary-fg">
              <MessagesSquare size={26} aria-hidden="true" />
            </span>
            <p className="font-bold">No messages yet</p>
            <p className="mt-1 text-[15px] text-muted">Say hi to Dehradun — be the first!</p>
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
                  messageId={row.msg._id}
                  content={row.msg.content}
                  senderId={row.msg.sender._id}
                  senderName={row.msg.sender.name}
                  senderAvatar={row.msg.sender.avatar}
                  isOwn={row.msg.sender._id === currentUser?._id}
                  time={row.time}
                  firstInGroup={row.firstInGroup}
                  lastInGroup={row.lastInGroup}
                  onMessageUser={onStartDm}
                />
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
      <div className="border-t border-border bg-surface px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:px-6 md:pb-3">
        {!currentUser && (
          <p className="mb-2 text-center text-sm text-muted">
            <span className="font-semibold text-primary-fg">Sign up free</span> to send messages
          </p>
        )}
        {mutedUntil && (
          <p role="alert" className="mb-2 rounded-[12px] bg-danger/10 px-3 py-2 text-center text-sm font-medium text-danger">
            You&apos;ve been muted from the public chat until{" "}
            {new Date(mutedUntil).toLocaleString("en-IN", {
              weekday: "short",
              hour: "numeric",
              minute: "2-digit",
            })}{" "}
            after reports from other members. Direct messages still work.
          </p>
        )}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <label htmlFor="room-message-input" className="sr-only">
            Message the public chat
          </label>
          <input
            id="room-message-input"
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Message Doon…"
            maxLength={500}
            autoComplete="off"
            enterKeyHint="send"
            className="h-12 min-w-0 flex-1 rounded-[16px] border-[1.5px] border-transparent bg-surface-2 px-4 text-base text-text outline-none placeholder:text-muted focus:border-primary focus:bg-surface"
          />
          <button
            type="submit"
            disabled={!content.trim()}
            aria-label="Send message"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-primary text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            <Send size={19} aria-hidden="true" />
          </button>
        </form>
      </div>

      {showJoinModal && (
        <JoinChatModal pendingMessage={content} onClose={() => setShowJoinModal(false)} />
      )}
    </div>
  );
}
