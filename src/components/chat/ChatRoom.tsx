"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Send, Loader2, Sparkles, ChevronUp } from "lucide-react";
import ChatMessage from "./ChatMessage";
import JoinChatModal from "./JoinChatModal";

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
  // The members panel now lives in ChatTabs (so it's reachable from any
  // tab) but presence updates still need this room's live socket.
  onSocketChange?: (socket: Socket | null) => void;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getDateLabel(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export default function ChatRoom({ currentUser, onSocketChange }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Tracks whether we've already done the first, instant jump-to-bottom for
  // this mount. Every scroll after that is a genuine new message and should
  // animate — but the very first render of a loaded history must not, or the
  // user visibly sees the list animate from empty/top down to the latest
  // message.
  const hasScrolledInitially = useRef(false);
  // Set right before loadOlder() prepends older messages, so the
  // scroll-to-bottom effect below doesn't fight with loadOlder's own
  // "keep reading position steady" scroll restoration.
  const suppressNextAutoScroll = useRef(false);

  // Auto scroll to bottom — scrolls the message list container directly
  // rather than scrollIntoView, which can otherwise walk up and scroll an
  // unintended ancestor.
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollAreaRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  // Fetch initial messages
  useEffect(() => {
    fetch("/api/room-messages?limit=50")
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages ?? []);
        setHasMore(!!d.hasMore);
        setNextCursor(d.nextCursor ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Scroll on new messages. useLayoutEffect (not useEffect) so this runs
  // before the browser paints — the very first batch of history is placed
  // at the bottom instantly, with no visible top-to-bottom animation. Only
  // messages after that first paint get the smooth scroll animation.
  useLayoutEffect(() => {
    if (loadingMore || messages.length === 0) return;

    if (suppressNextAutoScroll.current) {
      suppressNextAutoScroll.current = false;
      return;
    }

    if (!hasScrolledInitially.current) {
      hasScrolledInitially.current = true;
      scrollToBottom("auto");
      return;
    }

    scrollToBottom("smooth");
  }, [messages, loadingMore, scrollToBottom]);

  // Load an older page of history, preserving the reader's scroll position
  // (the "load older" button sits at the top, so without this the newly
  // prepended messages would push the viewport down unexpectedly).
  async function loadOlder() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const container = scrollAreaRef.current;
    const prevHeight = container?.scrollHeight ?? 0;

    try {
      const res = await fetch(`/api/room-messages?limit=50&cursor=${nextCursor}`);
      const d = await res.json();
      suppressNextAutoScroll.current = true;
      setMessages((prev) => [...(d.messages ?? []), ...prev]);
      setHasMore(!!d.hasMore);
      setNextCursor(d.nextCursor ?? null);

      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevHeight;
        }
      });
    } catch {
      // Silently ignore — the button just stays available for the user to retry.
    } finally {
      setLoadingMore(false);
    }
  }

  // Socket connection
  useEffect(() => {
    if (!currentUser) return;

    const socket = io({
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      onSocketChange?.(socket);
      socket.emit("room:join");
    });

    socket.on("room:message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("room:online_count", (count: number) => {
      setOnlineCount(count);
    });

    return () => {
      socket.emit("room:leave");
      socket.disconnect();
      onSocketChange?.(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    // Not logged in — show the join modal instead of sending
    if (!currentUser) {
      setShowJoinModal(true);
      return;
    }

    if (!socketRef.current) return;

    socketRef.current.emit("room:message", { content: content.trim() });
    setContent("");

    inputRef.current?.focus();
  }

  return (
    <div className="flex h-full flex-col">
      {/* Live status strip — replaces the old static "Doon Public Chat" header.
          Only rendered once there's something worth showing, so it doesn't
          just sit there as empty chrome. */}
      {onlineCount > 0 && (
        <div
          className="flex items-center justify-end gap-3 border-b px-4 py-1.5 md:px-6"
          style={{
            backgroundColor: "rgb(var(--surface))",
            borderColor: "rgb(var(--border))",
          }}
        >
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
            style={{ backgroundColor: "rgb(var(--primary) / 0.1)" }}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span style={{ color: "rgb(var(--primary))" }}>{onlineCount} online</span>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 size={24} className="animate-spin" style={{ color: "rgb(var(--muted))" }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="mb-3 text-5xl">👋</span>
            <p className="font-bold">No messages yet</p>
            <p className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
              Be the first to say something!
            </p>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="flex justify-center pb-2">
                <button
                  onClick={loadOlder}
                  disabled={loadingMore}
                  className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                  style={{
                    borderColor: "rgb(var(--border))",
                    color: "rgb(var(--muted))",
                  }}
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

            {messages.map((msg, i) => {
              const showDivider =
                i === 0 || getDateLabel(msg.createdAt) !== getDateLabel(messages[i - 1].createdAt);

              return (
                <div key={msg._id}>
                  {showDivider && (
                    <div className="flex items-center justify-center py-2">
                      <span
                        className="rounded-full px-3 py-1 text-[11px] font-medium"
                        style={{
                          backgroundColor: "rgb(var(--primary) / 0.08)",
                          color: "rgb(var(--muted))",
                        }}
                      >
                        {getDateLabel(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <ChatMessage
                    content={msg.content}
                    senderId={msg.sender._id}
                    senderName={msg.sender.name}
                    senderAvatar={msg.sender.avatar}
                    isOwn={msg.sender._id === currentUser?._id}
                    createdAt={msg.createdAt}
                    showName={showDivider || messages[i - 1]?.sender._id !== msg.sender._id}
                    showAvatar={
                      i === messages.length - 1 ||
                      messages[i + 1].sender._id !== msg.sender._id ||
                      getDateLabel(messages[i + 1].createdAt) !== getDateLabel(msg.createdAt)
                    }
                    isLastInGroup={
                      i === messages.length - 1 ||
                      messages[i + 1].sender._id !== msg.sender._id ||
                      getDateLabel(messages[i + 1].createdAt) !== getDateLabel(msg.createdAt)
                    }
                  />
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Bottom input area */}
      <div
        className="border-t px-4 py-2 space-y-1.5 md:px-6 md:py-2.5 md:space-y-2"
        style={{
          backgroundColor: "rgb(var(--surface))",
          borderColor: "rgb(var(--border))",
        }}
      >
        {/* Not logged in — subtle pill hint instead of a plain sentence */}
        {!currentUser && (
          <div className="flex justify-center">
            <div
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                backgroundColor: "rgb(var(--primary) / 0.1)",
                color: "rgb(var(--primary))",
              }}
            >
              <Sparkles size={11} />
              Log in to send your first message
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Say something to Dehradun..."
            maxLength={500}
            className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none transition-all disabled:opacity-50"
            style={{
              backgroundColor: "rgb(var(--background))",
              borderColor: "rgb(var(--border))",
              color: "rgb(var(--text))",
            }}
          />
          <button
            type="submit"
            disabled={!content.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-opacity disabled:opacity-40 hover:opacity-85"
            style={{ backgroundColor: "rgb(var(--primary))" }}
          >
            <Send size={16} className="text-white" />
          </button>
        </form>
      </div>

      {showJoinModal && (
        <JoinChatModal pendingMessage={content} onClose={() => setShowJoinModal(false)} />
      )}
    </div>
  );
}
