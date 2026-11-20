import { memo } from "react";
import ChatUserActions from "./ChatUserActions";
import Avatar from "@/components/ui/Avatar";

interface ChatMessageProps {
  /** Message id — attached to a report made from this message. */
  messageId?: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  isOwn: boolean;
  /** Pre-formatted time string (computed once per message upstream). */
  time: string;
  /** "room" shows avatars + names for other people; "dm" shows bubbles only. */
  variant?: "room" | "dm";
  firstInGroup: boolean;
  lastInGroup: boolean;
  onMessageUser?: (userId: string) => void;
}

// Two theme-aware name colours so neighbouring speakers are easy to tell
// apart in a busy room. Stable per person.
const NAME_COLORS = ["text-primary-fg", "text-accent-fg"];
function nameColorFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return NAME_COLORS[Math.abs(hash) % NAME_COLORS.length];
}

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
  variant = "room",
  firstInGroup,
  lastInGroup,
  onMessageUser,
}: ChatMessageProps) {
  const showAvatarColumn = variant === "room" && !isOwn;
  const showName = variant === "room" && !isOwn && firstInGroup;

  return (
    <div
      className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"} ${
        lastInGroup ? "mb-2.5" : "mb-0.5"
      }`}
    >
      {showAvatarColumn &&
        (lastInGroup ? (
          <ChatUserActions
            userId={senderId}
            onMessage={onMessageUser}
            userName={senderName}
            messageId={messageId}
            label={`Options for ${senderName}`}
            className="shrink-0 rounded-full"
          >
            <Avatar name={senderName} src={senderAvatar} size={34} />
          </ChatUserActions>
        ) : (
          <span className="w-[34px] shrink-0" aria-hidden="true" />
        ))}

      <div className={`flex max-w-[80%] flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {showName && (
          <ChatUserActions
            userId={senderId}
            onMessage={onMessageUser}
            userName={senderName}
            messageId={messageId}
            label={`Options for ${senderName}`}
            className={`mb-0.5 ml-1 max-w-full truncate text-[13px] font-bold ${nameColorFor(senderId)}`}
          >
            {senderName}
          </ChatUserActions>
        )}

        <div
          className={`rounded-[18px] px-3.5 py-2 text-[15px] leading-snug break-words whitespace-pre-wrap ${
            isOwn
              ? `bg-primary text-on-primary ${lastInGroup ? "rounded-br-[6px]" : ""}`
              : `border border-border bg-surface text-text ${lastInGroup ? "rounded-bl-[6px]" : ""}`
          }`}
        >
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
    </div>
  );
}

export default memo(ChatMessage);
