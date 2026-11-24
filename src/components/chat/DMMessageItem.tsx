"use client";

import { memo, useRef } from "react";
import Link from "next/link";
import { Reply, SmilePlus } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import type { DMMessage } from "./dmTypes";

// Touch gestures, WhatsApp-style: swipe a message right to reply, press and
// hold for reactions / more. Mouse users get small buttons on hover instead.
const LONG_PRESS_MS = 450;
const SWIPE_REPLY_PX = 56;
const SWIPE_MAX_PX = 72;
const MOVE_SLOP_PX = 10;

interface DMMessageItemProps {
  message: DMMessage;
  isOwn: boolean;
  /** Pre-formatted time (computed once per message upstream). */
  time: string;
  lastInGroup: boolean;
  currentUserId: string;
  /** Shown on reply quotes of the other person's messages. */
  otherFirstName: string;
  /** Briefly true after jumping here from a reply quote. */
  highlighted: boolean;
  onReply: (message: DMMessage) => void;
  onOpenActions: (message: DMMessage) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onJumpTo: (messageId: string) => void;
}

interface Gesture {
  x: number;
  y: number;
  px: number;
  swiping: boolean;
  done: boolean;
  timer: ReturnType<typeof setTimeout>;
}

function groupReactions(reactions: DMMessage["reactions"], currentUserId: string) {
  const groups = new Map<string, { emoji: string; count: number; mine: boolean }>();
  for (const r of reactions ?? []) {
    const g = groups.get(r.emoji) ?? { emoji: r.emoji, count: 0, mine: false };
    g.count += 1;
    if (r.userId === currentUserId) g.mine = true;
    groups.set(r.emoji, g);
  }
  return [...groups.values()];
}

// memo: a new message or a reaction elsewhere re-renders the list, but every
// other bubble's props are unchanged — skip them (long histories, cheap phones).
function DMMessageItem({
  message,
  isOwn,
  time,
  lastInGroup,
  currentUserId,
  otherFirstName,
  highlighted,
  onReply,
  onOpenActions,
  onToggleReaction,
  onJumpTo,
}: DMMessageItemProps) {
  const columnRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const lastPointerRef = useRef<string>("mouse");

  const reactions = groupReactions(message.reactions, currentUserId);
  const profile = message.type === "profile" ? message.sharedProfile : null;
  const replyTo = message.replyTo;

  // Moves the bubble with the finger — straight on the DOM, no re-render.
  function shift(px: number, animate = false) {
    const col = columnRef.current;
    const hint = hintRef.current;
    if (col) {
      col.style.transition = animate ? "transform 0.18s ease-out" : "none";
      col.style.transform = px ? `translateX(${px}px)` : "";
    }
    if (hint) hint.style.opacity = String(Math.min(px / SWIPE_REPLY_PX, 1));
  }

  function onPointerDown(e: React.PointerEvent) {
    lastPointerRef.current = e.pointerType;
    if (e.pointerType === "mouse") return;
    const g: Gesture = {
      x: e.clientX,
      y: e.clientY,
      px: 0,
      swiping: false,
      done: false,
      timer: setTimeout(() => {
        g.done = true;
        navigator.vibrate?.(10);
        onOpenActions(message);
      }, LONG_PRESS_MS),
    };
    gestureRef.current = g;
  }

  function onPointerMove(e: React.PointerEvent) {
    const g = gestureRef.current;
    if (!g || g.done) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.swiping) {
      if (Math.abs(dx) < MOVE_SLOP_PX && Math.abs(dy) < MOVE_SLOP_PX) return;
      clearTimeout(g.timer);
      // Only a rightward, mostly-horizontal drag is a reply swipe.
      if (dx > 0 && dx > Math.abs(dy)) {
        g.swiping = true;
      } else {
        g.done = true; // scrolling (or a left drag) — leave it to the browser
        return;
      }
    }
    g.px = Math.min(Math.max(dx, 0), SWIPE_MAX_PX);
    shift(g.px);
  }

  function endGesture(commit: boolean) {
    const g = gestureRef.current;
    gestureRef.current = null;
    if (!g) return;
    clearTimeout(g.timer);
    if (g.swiping) {
      if (commit && g.px >= SWIPE_REPLY_PX) onReply(message);
      shift(0, true);
    }
  }

  function onContextMenu(e: React.MouseEvent) {
    // No browser menu on a long press; right-click opens our actions.
    e.preventDefault();
    if (lastPointerRef.current === "mouse") onOpenActions(message);
  }

  const hasReactions = reactions.length > 0;

  return (
    <div
      id={`dm-msg-${message._id}`}
      className={`group relative flex items-center gap-1 ${isOwn ? "justify-end" : "justify-start"} ${
        lastInGroup || hasReactions ? "mb-2.5" : "mb-0.5"
      }`}
      style={{ touchAction: "pan-y" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => endGesture(true)}
      onPointerCancel={() => endGesture(false)}
      onContextMenu={onContextMenu}
    >
      {/* Swipe hint — fades in under the finger as the bubble moves right */}
      <span
        ref={hintRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-surface-2 text-muted opacity-0"
      >
        <Reply size={16} />
      </span>

      {/* Hover actions (mouse / keyboard only) */}
      <div
        className={`flex items-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:hidden ${
          isOwn ? "order-first" : "order-last"
        }`}
      >
        <button
          type="button"
          onClick={() => onReply(message)}
          aria-label="Reply"
          title="Reply"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-text"
        >
          <Reply size={17} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onOpenActions(message)}
          aria-label="React or more options"
          title="React"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-text"
        >
          <SmilePlus size={17} aria-hidden="true" />
        </button>
      </div>

      <div ref={columnRef} className={`flex max-w-[80%] min-w-0 flex-col ${isOwn ? "items-end" : "items-start"}`}>
        <div
          className={`max-w-full rounded-[18px] text-[15px] leading-snug wrap-anywhere whitespace-pre-wrap transition-shadow [@media(hover:none)]:select-none ${
            profile ? "p-1.5" : "px-3.5 py-2"
          } ${replyTo ? "min-w-40" : ""} ${
            isOwn
              ? `bg-primary text-on-primary ${lastInGroup ? "rounded-br-[6px]" : ""}`
              : `border border-border bg-surface text-text ${lastInGroup ? "rounded-bl-[6px]" : ""}`
          } ${highlighted ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""}`}
          style={{ WebkitTouchCallout: "none" }}
        >
          {replyTo && (
            <button
              type="button"
              onClick={() => onJumpTo(replyTo.messageId)}
              className={`mb-1.5 block w-full rounded-[10px] border-l-[3px] px-2.5 py-1.5 text-left ${
                isOwn ? "border-on-primary/70 bg-on-primary/15" : "border-primary bg-surface-2"
              } ${profile ? "mx-0.5 mt-0.5 w-[calc(100%-0.25rem)]" : ""}`}
            >
              <span className={`block text-[13px] font-bold ${isOwn ? "text-on-primary" : "text-primary-fg"}`}>
                {replyTo.senderId === currentUserId ? "You" : otherFirstName}
              </span>
              <span className={`line-clamp-2 block text-[13px] ${isOwn ? "text-on-primary/85" : "text-muted"}`}>
                {replyTo.preview}
              </span>
            </button>
          )}

          {profile ? (
            <>
              <div className="w-60 max-w-full overflow-hidden rounded-[14px] bg-surface text-text">
                <div className="flex items-center gap-3 p-3">
                  <Avatar name={profile.name} src={profile.avatar} size={44} />
                  <div className="min-w-0">
                    <p className="truncate font-bold">{profile.name}</p>
                    <p className="text-[13px] text-muted">DoonMeet member</p>
                  </div>
                </div>
                <Link
                  href={`/users/${profile.userId}`}
                  className="flex h-11 items-center justify-center border-t border-border text-sm font-semibold text-primary-fg hover:bg-surface-2"
                >
                  View profile
                </Link>
              </div>
              <span
                className={`block px-1.5 pt-1 text-right text-[11px] leading-none ${
                  isOwn ? "text-on-primary/75" : "text-muted"
                }`}
              >
                {time}
              </span>
            </>
          ) : (
            <>
              {message.content}
              <span
                className={`ml-2 inline-block translate-y-0.5 align-bottom text-[11px] leading-none ${
                  isOwn ? "text-on-primary/75" : "text-muted"
                }`}
              >
                {time}
              </span>
            </>
          )}
        </div>

        {hasReactions && (
          <div className={`relative z-[1] -mt-1.5 flex flex-wrap gap-1 ${isOwn ? "justify-end pr-1.5" : "pl-1.5"}`}>
            {reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => onToggleReaction(message._id, r.emoji)}
                aria-label={`${r.emoji} ${r.count}${r.mine ? ", your reaction — tap to remove" : ""}`}
                className={`flex h-7 items-center gap-0.5 rounded-full border px-2 text-sm leading-none shadow-sm ${
                  r.mine ? "border-primary bg-primary-soft" : "border-border bg-surface"
                }`}
              >
                <span aria-hidden="true">{r.emoji}</span>
                {r.count > 1 && <span className="text-xs font-semibold text-muted">{r.count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(DMMessageItem);
