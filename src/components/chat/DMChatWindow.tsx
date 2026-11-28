"use client";

import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { onConnected, useSocket } from "@/lib/socket-client";
import {
  ArrowLeft,
  Ban,
  ChevronUp,
  Flag,
  Loader2,
  MoreVertical,
  Plus,
  Reply,
  Send,
  X,
} from "lucide-react";
import DMMessageItem from "./DMMessageItem";
import MessageActionsSheet from "./MessageActionsSheet";
import ShareProfileSheet from "./ShareProfileSheet";
import Avatar from "@/components/ui/Avatar";
import IconButton from "@/components/ui/IconButton";
import PhotoViewButton from "@/components/ui/PhotoViewButton";
import { appendUnique, buildChatRows, groupRowsByDay, prependUnique } from "./chatUtils";
import { useChatScroll } from "./useChatScroll";
import { DayDivider, JumpToLatestButton, TypingBubble } from "./ChatListParts";
import SafetySheet from "@/components/safety/SafetySheet";
import { fetchBlockStatus, setBlocked, type BlockStatus } from "@/lib/safety-client";
import { activityLabel } from "@/lib/activity";
import { replyPreviewText, type DmReactionEntry } from "@/lib/dmShared";
import { useToast } from "@/providers/toast-provider";
import type { DMMessage, PresenceInfo } from "./dmTypes";

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
  /** Live online status of the other person (owned by MessagesPanel). */
  presence?: PresenceInfo | null;
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

const COMPOSER_MAX_PX = 128;
const HIGHLIGHT_MS = 1600;
/** One-tap openers on a brand-new conversation — the hardest message to write. */
const QUICK_STARTS = ["👋 Hi!", "Namaste 🙏", "Kaise ho?"];

// Phones: Enter adds a new line and the send button sends (like WhatsApp).
// Keyboard + mouse: Enter sends, Shift+Enter adds a new line.
const isTouchDevice = () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

export default function DMChatWindow({
  conversationId,
  otherParticipant,
  currentUser,
  presence,
  onBack,
  onMessageSent,
}: DMChatWindowProps) {
  const { showToast } = useToast();
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
  // Safety: block status between the two of us, and the report/block sheet.
  const [blockStatus, setBlockStatus] = useState<BlockStatus | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheet, setSheet] = useState<"report" | "block" | null>(null);
  // Reply / reactions / profile sharing.
  const [replyingTo, setReplyingTo] = useState<DMMessage | null>(null);
  const [actionsForId, setActionsForId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const refreshBlockStatus = useCallback(() => {
    fetchBlockStatus(otherParticipant._id).then((s) => s && setBlockStatus(s));
  }, [otherParticipant._id]);

  useEffect(() => {
    refreshBlockStatus();
  }, [refreshBlockStatus]);

  // Close the ⋮ menu on outside tap / Escape.
  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function handleUnblock() {
    const ok = await setBlocked(otherParticipant._id, false);
    if (ok) refreshBlockStatus();
  }

  // The tab's shared socket — this window only joins/leaves its dm room.
  const socket = useSocket(currentUser._id);
  const socketRef = useRef(socket);
  const messagesRef = useRef(messages);
  useEffect(() => {
    socketRef.current = socket;
    messagesRef.current = messages;
  });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingEmitRef = useRef(0);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Newest message id, updated synchronously wherever a message is added —
  // a dm:read event can arrive before React has re-rendered with the
  // message it refers to, so state alone would be one message behind.
  const latestIdRef = useRef<string | null>(null);
  const firstName = otherParticipant.name.split(" ")[0];

  const { scrollRef, onScroll, scrollToBottom, beginPrepend, unseenCount, awayFromBottom } = useChatScroll({
    messages,
    ready: !loading,
    currentUserId: currentUser._id,
  });

  const rows = useMemo(() => buildChatRows(messages), [messages]);

  const setReactions = useCallback((messageId: string, reactions: DmReactionEntry[]) => {
    setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, reactions } : m)));
  }, []);

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

  // Live updates for THIS conversation over the shared socket. The window
  // remounts per conversation (key={conversationId}); on unmount it leaves
  // the dm room explicitly — the socket itself stays open for other features.
  useEffect(() => {
    if (!socket) return;

    function handleMessage(message: DMMessage) {
      if (message.conversationId !== conversationId) return;
      latestIdRef.current = message._id;
      setMessages((prev) => appendUnique(prev, message));
      if (message.sender._id !== currentUser._id) {
        setOtherTyping(false);
        // Replying means they've seen everything before this.
        setSeenThroughId(message._id);
        onMessageSent?.(conversationId, message);
      }
    }

    // The other person opened the conversation / read a message live —
    // everything currently in the list is now seen.
    function handleRead(data: { conversationId: string; readBy: string }) {
      if (data.conversationId !== conversationId || data.readBy !== otherParticipant._id) return;
      if (latestIdRef.current) setSeenThroughId(latestIdRef.current);
    }

    // Someone (either of us, any tab) reacted — the server sends the full list.
    function handleReaction(data: { conversationId: string; messageId: string; reactions: DmReactionEntry[] }) {
      if (data.conversationId !== conversationId) return;
      setReactions(data.messageId, data.reactions);
    }

    // Typing events carry conversationId (older servers didn't — accept those too).
    function handleTypingStart(data?: { conversationId?: string }) {
      if (data?.conversationId && data.conversationId !== conversationId) return;
      setOtherTyping(true);
      // Safety net in case the matching typing:stop never arrives.
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      typingClearRef.current = setTimeout(() => setOtherTyping(false), 5000);
    }
    function handleTypingStop(data?: { conversationId?: string }) {
      if (data?.conversationId && data.conversationId !== conversationId) return;
      setOtherTyping(false);
    }

    // Server refused a message because one of us blocked the other.
    function handleBlocked(data: { conversationId: string }) {
      if (data.conversationId === conversationId) refreshBlockStatus();
    }

    // Server refused a message for another reason (e.g. a shared profile was deleted).
    function handleError(data: { conversationId: string; message?: string }) {
      if (data.conversationId === conversationId) showToast(data.message || "Couldn't send that.", "error");
    }

    socket.on("dm:message", handleMessage);
    socket.on("dm:read", handleRead);
    socket.on("dm:reaction", handleReaction);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("dm:blocked", handleBlocked);
    socket.on("dm:error", handleError);
    // Join now (if connected) and again after any reconnect.
    const stopRejoining = onConnected(socket, () => socket.emit("dm:join", { conversationId }));

    return () => {
      stopRejoining();
      socket.off("dm:message", handleMessage);
      socket.off("dm:read", handleRead);
      socket.off("dm:reaction", handleReaction);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("dm:blocked", handleBlocked);
      socket.off("dm:error", handleError);
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        // Don't leave the other person seeing "typing…" after we close.
        socket.emit("typing:stop", { conversationId });
      }
      // Leave the room — otherwise the server would still treat us as
      // "looking at this conversation" (auto-read, no notifications).
      socket.emit("dm:leave", { conversationId });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, conversationId]);

  useEffect(() => () => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
  }, []);

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
    if (!socket) return;
    // Throttled: one typing:start per ~3s instead of one per keystroke (the
    // receiver's indicator auto-clears after 5s, so 3s keeps it steady).
    const now = Date.now();
    if (!typingTimeoutRef.current || now - lastTypingEmitRef.current > 3000) {
      lastTypingEmitRef.current = now;
      socket.emit("typing:start", { conversationId });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
      socket.emit("typing:stop", { conversationId });
    }, 1500);
  }

  // Grow the message box with its text, up to a few lines.
  function resizeComposer() {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, COMPOSER_MAX_PX)}px`;
  }

  /** Sends a text message or a profile card (optionally as a reply). */
  async function sendMessage(payload: { content?: string; sharedProfileUserId?: string }) {
    if (sending) return;
    const replyToId = replyingTo?._id;
    setSending(true);
    setReplyingTo(null);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = null;
    socket?.emit("typing:stop", { conversationId });

    try {
      if (socket?.connected) {
        socket.emit("dm:message", { conversationId, ...payload, replyToId });
      } else {
        // REST fallback if the socket connection is down
        const res = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, replyToId }),
        });
        const d = await res.json();
        if (d.success) {
          latestIdRef.current = d.message._id;
          setMessages((prev) => appendUnique(prev, d.message));
        } else if (d.code === "BLOCKED") {
          refreshBlockStatus();
        } else if (d.message) {
          showToast(d.message, "error");
        }
      }
    } finally {
      setSending(false);
    }
  }

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    setContent("");
    // Reset the grown textarea once React has cleared it.
    requestAnimationFrame(resizeComposer);
    await sendMessage({ content: trimmed });
    inputRef.current?.focus();
  }

  function handleComposerKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && !isTouchDevice()) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleShareProfile(userId: string) {
    setShareOpen(false);
    sendMessage({ sharedProfileUserId: userId });
  }

  // ---- Message actions (stable callbacks so memoised bubbles don't re-render) ----

  const startReply = useCallback((message: DMMessage) => {
    setActionsForId(null);
    setReplyingTo(message);
    inputRef.current?.focus();
  }, []);

  const openActions = useCallback((message: DMMessage) => {
    setActionsForId(message._id);
  }, []);

  const closeActions = useCallback(() => setActionsForId(null), []);

  /** Sets my reaction, or removes it when I tap the one I already chose. */
  const toggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      const s = socketRef.current;
      const me = currentUser._id;
      const msg = messagesRef.current.find((m) => m._id === messageId);
      if (!msg) return;
      if (!s?.connected) {
        showToast("You're offline — try again in a moment.", "error");
        return;
      }
      const previous = msg.reactions ?? [];
      const mine = previous.find((r) => r.userId === me)?.emoji ?? null;
      const next = mine === emoji ? null : emoji;

      // Show it straight away; the server's answer (or a failure) settles it.
      setReactions(messageId, [
        ...previous.filter((r) => r.userId !== me),
        ...(next ? [{ userId: me, emoji: next }] : []),
      ]);
      s.timeout(8000).emit(
        "dm:react",
        { conversationId, messageId, emoji: next },
        (err: Error | null, res?: { ok: boolean; reactions?: DmReactionEntry[]; code?: string }) => {
          if (!err && res?.ok && res.reactions) {
            setReactions(messageId, res.reactions);
            return;
          }
          setReactions(messageId, previous);
          if (res?.code === "SLOW_DOWN") showToast("Slow down a little 🙂", "info");
          else if (res?.code !== "BLOCKED") showToast("Couldn't add that reaction.", "error");
        }
      );
    },
    [conversationId, currentUser._id, setReactions, showToast]
  );

  const jumpToMessage = useCallback(
    (messageId: string) => {
      const box = scrollRef.current;
      const el = document.getElementById(`dm-msg-${messageId}`);
      if (!box || !el) {
        showToast("That message is further up — tap “Load earlier messages”.", "info");
        return;
      }
      const offset = el.getBoundingClientRect().top - box.getBoundingClientRect().top;
      box.scrollTo({ top: box.scrollTop + offset - box.clientHeight / 2 + el.offsetHeight / 2, behavior: "smooth" });
      setHighlightedId(messageId);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(() => setHighlightedId(null), HIGHLIGHT_MS);
    },
    [scrollRef, showToast]
  );

  async function copyMessage(message: DMMessage) {
    setActionsForId(null);
    try {
      await navigator.clipboard.writeText(message.content);
      showToast("Copied", "success");
    } catch {
      showToast("Couldn't copy on this device.", "error");
    }
  }

  // Latest message from the other person — attached as evidence when reporting.
  const lastTheirMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender._id !== currentUser._id) return messages[i]._id;
    }
    return null;
  }, [messages, currentUser._id]);

  const isBlocked = !!blockStatus && (blockStatus.blockedByMe || blockStatus.blockedMe);

  // ✓✓ on every message of mine up to the newest one they've read, ✓ after it.
  const seenIndex = useMemo(
    () => (seenThroughId ? messages.findIndex((m) => m._id === seenThroughId) : -1),
    [messages, seenThroughId]
  );

  const days = useMemo(() => groupRowsByDay(rows), [rows]);

  // Double tap → ❤️. Only ever adds it: double-tapping again keeps the heart.
  const heartMessage = useCallback(
    (messageId: string) => {
      const msg = messagesRef.current.find((m) => m._id === messageId);
      const mine = msg?.reactions?.find((r) => r.userId === currentUser._id)?.emoji;
      if (mine !== "❤️") toggleReaction(messageId, "❤️");
    },
    [currentUser._id, toggleReaction]
  );

  // The typing bubble joins the bottom of the list — keep it in view if
  // you're reading the latest messages (never yank you down from history).
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!otherTyping || !el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 180) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [otherTyping, scrollRef]);

  // Header subtitle: typing… → Online → "Active today" → "View profile".
  // Nothing about activity once either of us has blocked the other.
  const activity = !isBlocked && presence ? activityLabel(presence.isOnline, presence.lastSeenAt) : null;
  const subtitle = otherTyping ? "typing…" : activity ? (activity.online ? "Online" : activity.text) : "View profile";
  const subtitleLive = otherTyping || !!activity?.online;

  const actionsFor = actionsForId ? (messages.find((m) => m._id === actionsForId) ?? null) : null;
  const myReactionOnActions = actionsFor?.reactions?.find((r) => r.userId === currentUser._id)?.emoji ?? null;

  return (
    <div className="relative flex h-full flex-col">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface px-2 sm:px-4 md:h-16">
        {onBack && (
          <IconButton
            label="Back to messages"
            variant="ghost"
            onClick={onBack}
            className="md:hidden"
          >
            <ArrowLeft size={22} />
          </IconButton>
        )}
        {/* Photo → full screen; name → profile. Without a photo the avatar is part of the profile link. */}
        {otherParticipant.avatar && (
          <PhotoViewButton src={otherParticipant.avatar} name={otherParticipant.name} className="shrink-0">
            <Avatar name={otherParticipant.name} src={otherParticipant.avatar} size={40} online={!!activity?.online} />
          </PhotoViewButton>
        )}
        <Link
          href={`/users/${otherParticipant._id}`}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[14px] py-1 pr-2"
        >
          {!otherParticipant.avatar && (
            <Avatar name={otherParticipant.name} src={null} size={40} online={!!activity?.online} />
          )}
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-bold text-text">{otherParticipant.name}</span>
            <span
              className={`block truncate text-[13px] ${subtitleLive ? "font-semibold text-primary-fg" : "text-muted"}`}
              aria-live="polite"
            >
              {subtitle}
            </span>
          </span>
        </Link>

        {/* Safety menu — report / block */}
        <div ref={menuRef} className="relative">
          <IconButton
            label="More options"
            variant="ghost"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <MoreVertical size={20} />
          </IconButton>
          {menuOpen && (
            <div
              role="menu"
              className="absolute top-full right-0 z-20 mt-1 w-52 overflow-hidden rounded-[16px] border border-border bg-surface py-1 shadow-lg"
            >
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setSheet("report");
                }}
                className="flex min-h-11 w-full items-center gap-2.5 px-3.5 text-left text-[15px] font-medium text-danger hover:bg-danger/10"
              >
                <Flag size={18} aria-hidden="true" />
                Report {firstName}
              </button>
              {blockStatus?.blockedByMe ? (
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleUnblock();
                  }}
                  className="flex min-h-11 w-full items-center gap-2.5 px-3.5 text-left text-[15px] font-medium text-text hover:bg-surface-2"
                >
                  <Ban size={18} aria-hidden="true" />
                  Unblock {firstName}
                </button>
              ) : (
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setSheet("block");
                  }}
                  className="flex min-h-11 w-full items-center gap-2.5 px-3.5 text-left text-[15px] font-medium text-danger hover:bg-danger/10"
                >
                  <Ban size={18} aria-hidden="true" />
                  Block {firstName}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {sheet && (
        <SafetySheet
          mode={sheet}
          user={{ _id: otherParticipant._id, name: otherParticipant.name }}
          context="direct_message"
          refId={lastTheirMessageId}
          alreadyBlocked={!!blockStatus?.blockedByMe}
          onClose={() => setSheet(null)}
          onBlocked={() =>
            setBlockStatus((prev) => ({ blockedMe: prev?.blockedMe ?? false, blockedByMe: true }))
          }
        />
      )}

      {/* Messages — the relative box anchors the round "jump to latest" button
          just above the composer, however tall the composer gets. */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 pt-3 pb-2 sm:px-6"
        >
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 size={22} className="animate-spin text-muted" aria-label="Loading messages" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-2 text-center">
              <PhotoViewButton src={otherParticipant.avatar} name={otherParticipant.name}>
                <Avatar name={otherParticipant.name} src={otherParticipant.avatar} size={72} />
              </PhotoViewButton>
              <p className="mt-3 text-lg font-bold">Say hi to {firstName}!</p>
              <p className="mt-1 text-[15px] text-muted">This is the start of your conversation.</p>
              {!isBlocked && (
                <div className="mt-5 flex flex-wrap justify-center gap-2" role="group" aria-label="Quick hellos">
                  {QUICK_STARTS.map((text) => (
                    <button
                      key={text}
                      type="button"
                      disabled={sending}
                      onClick={() => sendMessage({ content: text })}
                      className="btn-springy h-11 rounded-full border border-border bg-surface px-4 text-[15px] font-semibold text-text hover:bg-surface-2 disabled:opacity-50"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              )}
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

              {/* One block per day so each date pill can stick while you scroll that day. */}
              {days.map((day) => (
                <section key={day.label}>
                  <DayDivider label={day.label} />
                  {day.rows.map((row) => {
                    const isOwn = row.msg.sender._id === currentUser._id;
                    return (
                      <DMMessageItem
                        key={row.msg._id}
                        message={row.msg}
                        isOwn={isOwn}
                        time={row.time}
                        lastInGroup={row.lastInGroup}
                        currentUserId={currentUser._id}
                        otherFirstName={firstName}
                        highlighted={highlightedId === row.msg._id}
                        onReply={startReply}
                        onOpenActions={openActions}
                        onToggleReaction={toggleReaction}
                        onJumpTo={jumpToMessage}
                        receipt={isOwn ? (row.index <= seenIndex ? "seen" : "sent") : undefined}
                        onHeart={isBlocked ? undefined : heartMessage}
                      />
                    );
                  })}
                </section>
              ))}

              {otherTyping && !isBlocked && <TypingBubble />}
            </>
          )}
        </div>

        {(awayFromBottom || unseenCount > 0) && (
          <JumpToLatestButton count={unseenCount} onClick={() => scrollToBottom()} />
        )}
      </div>

      {/* Composer — replaced by a notice when either side has blocked the other */}
      {isBlocked ? (
        <div className="flex items-center gap-3 border-t border-border bg-surface px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-3">
          <Ban size={20} className="shrink-0 text-muted" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-[15px] text-muted">
            {blockStatus?.blockedByMe
              ? `You blocked ${firstName}. Neither of you can send messages.`
              : "You can't reply to this conversation."}
          </p>
          {blockStatus?.blockedByMe && (
            <button
              type="button"
              onClick={handleUnblock}
              className="h-10 shrink-0 rounded-[12px] bg-surface-2 px-3.5 text-sm font-semibold text-text hover:bg-border"
            >
              Unblock
            </button>
          )}
        </div>
      ) : (
        <div className="border-t border-border bg-surface px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:px-6 md:pb-3">
          {replyingTo && (
            <div className="mb-2 flex items-center gap-2 rounded-[14px] border-l-[3px] border-primary bg-surface-2 py-1.5 pr-1 pl-3">
              <Reply size={16} className="shrink-0 text-primary-fg" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-primary-fg">
                  Replying to {replyingTo.sender._id === currentUser._id ? "yourself" : firstName}
                </p>
                <p className="truncate text-[13px] text-muted">{replyPreviewText(replyingTo.content)}</p>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                aria-label="Cancel reply"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-border hover:text-text"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-end gap-2">
            <IconButton
              label="Share a profile"
              variant="ghost"
              onClick={() => setShareOpen(true)}
              className="mb-0.5"
            >
              <Plus size={22} />
            </IconButton>
            <label htmlFor={`dm-input-${conversationId}`} className="sr-only">
              Message {otherParticipant.name}
            </label>
            <textarea
              id={`dm-input-${conversationId}`}
              ref={inputRef}
              value={content}
              rows={1}
              onChange={(e) => {
                setContent(e.target.value);
                resizeComposer();
                handleTyping();
              }}
              onKeyDown={handleComposerKeyDown}
              placeholder={`Message ${firstName}…`}
              maxLength={1000}
              autoComplete="off"
              className="max-h-32 min-h-12 min-w-0 flex-1 resize-none rounded-[16px] border-[1.5px] border-transparent bg-surface-2 px-4 py-[11px] text-base leading-snug text-text outline-none placeholder:text-muted focus:border-primary focus:bg-surface"
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
      )}

      {actionsFor && (
        <MessageActionsSheet
          preview={actionsFor.content}
          reactions={{
            mine: myReactionOnActions,
            onReact: (emoji) => {
              setActionsForId(null);
              toggleReaction(actionsFor._id, emoji);
            },
          }}
          onReply={() => startReply(actionsFor)}
          onCopy={actionsFor.type === "profile" ? undefined : () => copyMessage(actionsFor)}
          onClose={closeActions}
        />
      )}

      {shareOpen && (
        <ShareProfileSheet
          currentUser={currentUser}
          excludeUserId={otherParticipant._id}
          onShare={handleShareProfile}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
