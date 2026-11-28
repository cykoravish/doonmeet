"use client";

import { memo } from "react";
import { Reply } from "lucide-react";
import ChatUserActions from "./ChatUserActions";
import Avatar from "@/components/ui/Avatar";
import { useMessageGestures } from "./useMessageGestures";
import type { RoomReplyTo } from "@/lib/roomShared";

interface ChatMessageProps {
  /** Message id — used for replies, jumping to it, and attached to reports. */
  messageId: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  isOwn: boolean;
  /** Pre-formatted time string (computed once per message upstream). */
  time: string;
  firstInGroup: boolean;
  lastInGroup: boolean;
  /** The message this one replies to (quote shown inside the bubble). */
  replyTo?: RoomReplyTo | null;
  /** So a quote of my own message reads "You". */
  currentUserId?: string;
  /** Briefly true after jumping here from a reply quote. */
  highlighted?: boolean;
  onMessageUser?: (userId: string) => void;
  /** Stable callbacks (they take the id) so memoised bubbles don't re-render. */
  onReply: (messageId: string) => void;
  onOpenActions: (messageId: string) => void;
  onJumpTo: (messageId: string) => void;
}

// Two theme-aware name colours so neighbouring speakers are easy to tell
// apart in a busy room. Stable per person.
const NAME_COLORS = ["text-primary-fg", "text-accent-fg"];
function nameColorFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return NAME_COLORS[Math.abs(hash) % NAME_COLORS.length];
}

// A public-chat message. Swipe right to reply, press and hold for Reply /
// Copy (useMessageGestures); mouse users get a reply button on hover.
// memo: a new incoming message re-renders the list, but every existing
// bubble's props are unchanged — skip them. Big win on long histories.
function ChatMessage({
  messageId,
  content,
  senderId,
  senderName,
  senderAvatar,
  isOwn,
  time,
  firstInGroup,
  lastInGroup,
  replyTo,
  currentUserId,
  highlighted = false,
  onMessageUser,
  onReply,
  onOpenActions,
  onJumpTo,
}: ChatMessageProps) {
  const { columnRef, hintRef, rowHandlers } = useMessageGestures({
    onSwipeReply: () => onReply(messageId),
    onLongPress: () => onOpenActions(messageId),
  });

  const showAvatarColumn = !isOwn;
  const showName = !isOwn && firstInGroup;
  const quotedName = replyTo ? (replyTo.senderId === currentUserId ? "You" : replyTo.senderName) : "";

  return (
    <div
      id={`room-msg-${messageId}`}
      className={`group relative flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"} ${
        lastInGroup ? "mb-2.5" : "mb-0.5"
      }`}
      style={{ touchAction: "pan-y" }}
      {...rowHandlers}
    >
      {/* Swipe hint — fades in under the finger as the bubble moves right */}
      <span
        ref={hintRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-surface-2 text-muted opacity-0"
      >
        <Reply size={16} />
      </span>

      {showAvatarColumn &&
        (lastInGroup ? (
          <ChatUserActions
            userId={senderId}
            onMessage={onMessageUser}
            userName={senderName}
            messageId={messageId}
            avatar={senderAvatar}
            label={`Options for ${senderName}`}
            className="shrink-0 rounded-full"
          >
            <Avatar name={senderName} src={senderAvatar} size={34} />
          </ChatUserActions>
        ) : (
          <span className="w-[34px] shrink-0" aria-hidden="true" />
        ))}

      <div ref={columnRef} className={`flex max-w-[80%] min-w-0 flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {showName && (
          <ChatUserActions
            userId={senderId}
            onMessage={onMessageUser}
            userName={senderName}
            messageId={messageId}
            avatar={senderAvatar}
            label={`Options for ${senderName}`}
            className={`mb-0.5 ml-1 max-w-full truncate text-[13px] font-bold ${nameColorFor(senderId)}`}
          >
            {senderName}
          </ChatUserActions>
        )}

        <div
          className={`max-w-full rounded-[18px] px-3.5 py-2 text-[15px] leading-snug wrap-anywhere whitespace-pre-wrap transition-shadow [@media(hover:none)]:select-none ${
            replyTo ? "min-w-40" : ""
          } ${
            isOwn
              ? `bg-primary text-on-primary ${lastInGroup ? "rounded-br-[6px]" : ""}`
              : `border border-border bg-surface text-text ${lastInGroup ? "rounded-bl-[6px]" : ""}`
          } ${highlighted ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""}`}
          style={{ WebkitTouchCallout: "none" }}
        >
          {replyTo &&
            (replyTo.removed ? (
              <span
                className={`mb-1.5 block rounded-[10px] border-l-[3px] px-2.5 py-1.5 text-[13px] italic ${
                  isOwn ? "border-on-primary/50 bg-on-primary/10 text-on-primary/80" : "border-border bg-surface-2 text-muted"
                }`}
              >
                Message removed
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onJumpTo(replyTo.messageId)}
                className={`mb-1.5 block w-full rounded-[10px] border-l-[3px] px-2.5 py-1.5 text-left whitespace-normal ${
                  isOwn ? "border-on-primary/70 bg-on-primary/15" : "border-primary bg-surface-2"
                }`}
              >
                <span
                  className={`block truncate text-[13px] font-bold ${
                    isOwn ? "text-on-primary" : nameColorFor(replyTo.senderId)
                  }`}
                >
                  {quotedName}
                </span>
                <span className={`line-clamp-2 block text-[13px] ${isOwn ? "text-on-primary/85" : "text-muted"}`}>
                  {replyTo.preview}
                </span>
              </button>
            ))}
          {content}
          <span
            className={`ml-2 inline-block translate-y-0.5 align-bottom text-[11px] leading-none ${
              isOwn ? "text-on-primary/75" : "text-muted"
            }`}
          >
            {time}
          </span>
        </div>
      </div>

      {/* Hover reply (mouse / keyboard only) — beside the bubble, inside the gap */}
      <button
        type="button"
        onClick={() => onReply(messageId)}
        aria-label="Reply"
        title="Reply"
        className={`mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface-2 hover:text-text focus-visible:opacity-100 [@media(hover:none)]:hidden ${
          isOwn ? "order-first" : ""
        }`}
      >
        <Reply size={17} aria-hidden="true" />
      </button>
    </div>
  );
}

export default memo(ChatMessage);
