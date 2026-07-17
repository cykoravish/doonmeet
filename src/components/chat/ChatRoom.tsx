"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Send, Loader2, Users, Wifi, WifiOff } from "lucide-react";
import ChatMessage from "./ChatMessage";
import GuestLimitBanner from "./GuestLimitBanner";
import JoinChatModal from "./JoinChatModal";

interface Message {
  _id: string;
  content: string;
  isGuest: boolean;
  createdAt: string;
  sender: {
    _id: string;
    name: string;
    avatar: string | null;
    isGuest: boolean;
  };
}

interface CurrentUser {
  _id: string;
  name: string;
  avatar: string | null;
  isGuest: boolean;
  guestMessageCount: number;
}

interface ChatRoomProps {
  currentUser: CurrentUser | null;
}

const GUEST_LIMIT = 20;

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

export default function ChatRoom({ currentUser }: ChatRoomProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [guestCount, setGuestCount] = useState(currentUser?.guestMessageCount ?? 0);
  const [limitReached, setLimitReached] = useState(
    (currentUser?.guestMessageCount ?? 0) >= GUEST_LIMIT
  );

  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch initial messages
  useEffect(() => {
    fetch("/api/room-messages?limit=50")
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Socket connection
  useEffect(() => {
    if (!currentUser) return;

    const socket = io({
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("room:join");
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("room:message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("room:limit_reached", () => {
      setLimitReached(true);
    });

    socket.on("room:online_count", (count: number) => {
      setOnlineCount(count);
    });

    return () => {
      socket.emit("room:leave");
      socket.disconnect();
    };
  }, [currentUser]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    // Not logged in — show the join modal instead of sending
    if (!currentUser) {
      setShowJoinModal(true);
      return;
    }

    if (!socketRef.current || limitReached) return;

    socketRef.current.emit("room:message", { content: content.trim() });
    setContent("");

    if (currentUser?.isGuest) {
      const newCount = guestCount + 1;
      setGuestCount(newCount);
      if (newCount >= GUEST_LIMIT) setLimitReached(true);
    }

    inputRef.current?.focus();
  }

  // Called after a successful guest sign-up from the modal —
  // refresh server-fetched currentUser, then the socket effect
  // below will connect and the pending message stays in the input.
  function handleGuestJoined() {
    setShowJoinModal(false);
    router.refresh();
  }

  const remaining = GUEST_LIMIT - guestCount;

  return (
    <div className="flex h-[calc(100vh-64px-72px)] flex-col md:h-[calc(100vh-64px)]">
      {/* Chat header */}
      <div
        className="flex items-center justify-between border-b px-6 py-4"
        style={{
          backgroundColor: "rgb(var(--surface))",
          borderColor: "rgb(var(--border))",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: "rgb(var(--primary) / 0.1)" }}
          >
            <span className="text-lg">🏔️</span>
          </div>
          <div>
            <p className="font-bold text-sm">Doon Public Chat</p>
            <p className="text-xs" style={{ color: "rgb(var(--muted))" }}>
              Everyone in Dehradun
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onlineCount > 0 && (
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
              style={{ backgroundColor: "rgb(var(--primary) / 0.1)" }}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <Users size={11} style={{ color: "rgb(var(--primary))" }} />
              <span style={{ color: "rgb(var(--primary))" }}>{onlineCount} online</span>
            </div>
          )}

          {/* Connection status — only meaningful once the user has joined */}
          {currentUser && (
            <div className="flex items-center gap-1.5">
              {connected ? (
                <Wifi size={14} style={{ color: "rgb(var(--primary))" }} />
              ) : (
                <WifiOff size={14} style={{ color: "rgb(var(--muted))" }} />
              )}
              <span className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                {connected ? "Connected" : "Connecting..."}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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
          messages.map((msg, i) => {
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
                  senderName={msg.sender.name}
                  senderAvatar={msg.sender.avatar}
                  isGuest={msg.sender.isGuest}
                  isOwn={msg.sender._id === currentUser?._id}
                  createdAt={msg.createdAt}
                />
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Bottom input area */}
      <div
        className="border-t px-6 py-4 space-y-3"
        style={{
          backgroundColor: "rgb(var(--surface))",
          borderColor: "rgb(var(--border))",
        }}
      >
        {/* Guest limit banner */}
        {currentUser?.isGuest && <GuestLimitBanner remaining={remaining} reached={limitReached} />}

        {/* Not logged in — hint (no more blocked input) */}
        {!currentUser && (
          <p className="text-center text-xs" style={{ color: "rgb(var(--muted))" }}>
            Type your message below — you&apos;ll be asked to join when you hit send
          </p>
        )}

        {/* Input */}
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              limitReached
                ? "Message limit reached — sign up to continue"
                : "Say something to Dehradun..."
            }
            disabled={limitReached}
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
            disabled={limitReached || !content.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-opacity disabled:opacity-40 hover:opacity-85"
            style={{ backgroundColor: "rgb(var(--primary))" }}
          >
            <Send size={16} className="text-white" />
          </button>
        </form>

        {currentUser?.isGuest && !limitReached && (
          <p className="text-center text-xs" style={{ color: "rgb(var(--muted))" }}>
            {remaining} messages remaining as guest
          </p>
        )}
      </div>

      {showJoinModal && (
        <JoinChatModal
          pendingMessage={content}
          onClose={() => setShowJoinModal(false)}
          onGuestSuccess={handleGuestJoined}
        />
      )}
    </div>
  );
}
