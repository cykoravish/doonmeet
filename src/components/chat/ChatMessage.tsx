import Image from "next/image";
import ChatUserActions from "./ChatUserActions";

interface ChatMessageProps {
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  isGuest: boolean;
  // Whether the person viewing this message (not the sender) is a guest —
  // guests can't start DMs, so their "Message" action needs different
  // handling than a signed-up viewer's. Defaults to false for callers
  // (e.g. DMChatWindow) where the viewer is guaranteed not to be a guest.
  viewerIsGuest?: boolean;
  isOwn: boolean;
  createdAt: string;
  showAvatar: boolean;
  showName: boolean;
  isLastInGroup: boolean;
}

export default function ChatMessage({
  content,
  senderId,
  senderName,
  senderAvatar,
  isGuest,
  viewerIsGuest = false,
  isOwn,
  createdAt,
  showAvatar,
  showName,
  isLastInGroup,
}: ChatMessageProps) {
  const time = new Date(createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : "flex-row"} ${showAvatar ? "mb-2.5" : "mb-0.5"}`}
    >
      {/* Avatar — only on the last message of a consecutive group */}
      {showAvatar ? (
        <ChatUserActions
          userId={senderId}
          isGuest={isGuest}
          viewerIsGuest={viewerIsGuest}
          isOwn={isOwn}
          align={isOwn ? "right" : "left"}
          className="self-end shrink-0 rounded-full"
        >
          {senderAvatar ? (
            <Image
              src={senderAvatar}
              alt={senderName}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: isGuest ? "rgb(var(--muted))" : "rgb(var(--primary))" }}
            >
              {senderName[0]?.toUpperCase()}
            </div>
          )}
        </ChatUserActions>
      ) : (
        <div className="w-8 shrink-0" />
      )}

      {/* Bubble */}
      <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {/* Name + badge */}
        {showName && (
          <div className="flex items-center gap-1.5">
            <ChatUserActions
              userId={senderId}
              isGuest={isGuest}
              viewerIsGuest={viewerIsGuest}
              isOwn={isOwn}
              align={isOwn ? "right" : "left"}
              className="text-xs font-semibold"
            >
              {senderName}
            </ChatUserActions>
          </div>
        )}

        <div
          className="flex flex-wrap items-end gap-2 rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
          style={{
            backgroundColor: isOwn ? "rgb(var(--primary))" : "rgb(var(--surface))",
            color: isOwn ? "white" : "rgb(var(--text))",
            borderBottomRightRadius: isOwn && isLastInGroup ? "4px" : undefined,
            borderBottomLeftRadius: !isOwn && isLastInGroup ? "4px" : undefined,
          }}
        >
          <span>{content}</span>
          <span
            className="ml-auto shrink-0 text-[10px] leading-none"
            style={{ color: isOwn ? "rgb(255 255 255 / 0.7)" : "rgb(var(--muted))" }}
          >
            {time}
          </span>
        </div>
      </div>
    </div>
  );
}
