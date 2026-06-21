"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Send, Loader2, Users, Wifi, WifiOff } from "lucide-react";
import ChatMessage from "./ChatMessage";
import GuestLimitBanner from "./GuestLimitBanner";

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

export default function ChatRoom({ currentUser }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [guestCount, setGuestCount] = useState(
    currentUser?.guestMessageCount ?? 0
  );
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

    const socket = io(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000", {
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
    if (!content.trim() || !socketRef.current || limitReached) return;

    socketRef.current.emit("room:message", { content: content.trim() });
    setContent("");

    if (currentUser?.isGuest) {
      const newCount = guestCount + 1;
      setGuestCount(newCount);
      if (newCount >= GUEST_LIMIT) setLimitReached(true);
    }

    inputRef.current?.focus();
  }

  const remaining = GUEST_LIMIT - guestCount;
  const canSend = !limitReached && !!currentUser && connected;

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">

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

          {/* Connection status */}
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
          messages.map((msg) => (
            <ChatMessage
              key={msg._id}
              content={msg.content}
              senderName={msg.sender.name}
              senderAvatar={msg.sender.avatar}
              isGuest={msg.sender.isGuest}
              isOwn={msg.sender._id === currentUser?._id}
              createdAt={msg.createdAt}
            />
          ))
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
        {currentUser?.isGuest && (
          <GuestLimitBanner remaining={remaining} reached={limitReached} />
        )}

        {/* Not logged in */}
        {!currentUser && (
          <div
            className="flex items-center justify-between rounded-xl border px-4 py-3"
            style={{
              borderColor: "rgb(var(--border))",
              backgroundColor: "rgb(var(--primary) / 0.05)",
            }}
          >
            <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
              Join to participate in the chat
            </p>
            <div className="flex gap-2">
              
              <a href="/login"
                className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                style={{ borderColor: "rgb(var(--border))" }}
              >
                Log in
              </a>
              
               <a href="/signup"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                style={{ backgroundColor: "rgb(var(--primary))" }}
              >
                Sign up
              </a>
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              !currentUser
                ? "Log in to send messages..."
                : limitReached
                ? "Message limit reached — sign up to continue"
                : "Say something to Dehradun..."
            }
            disabled={!canSend}
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
            disabled={!canSend || !content.trim()}
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
    </div>
  );
}