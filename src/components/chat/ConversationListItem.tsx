import Image from "next/image";

export interface ConversationSummary {
  _id: string;
  otherParticipant: {
    _id: string;
    name: string;
    avatar: string | null;
    lastSeenAt?: string;
  } | null;
  lastMessage: {
    content: string | null;
    sentAt: string | null;
    senderId: string | null;
  };
  unreadCount: number;
}

interface ConversationListItemProps {
  conversation: ConversationSummary;
  isActive: boolean;
  currentUserId: string;
  onClick: () => void;
}

function timeAgo(date: string | null) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (mins > 0) return `${mins}m`;
  return "now";
}

export default function ConversationListItem({
  conversation,
  isActive,
  currentUserId,
  onClick,
}: ConversationListItemProps) {
  const other = conversation.otherParticipant;
  if (!other) return null;

  const isOwnLastMessage = conversation.lastMessage.senderId === currentUserId;
  const hasUnread = conversation.unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
        isActive ? "bg-primary/10" : "hover:bg-primary/5"
      }`}
    >
      <div className="relative shrink-0">
        {other.avatar ? (
          <Image
            src={other.avatar}
            alt={other.name}
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-base font-bold text-white">
            {other.name[0]?.toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={`truncate text-sm ${hasUnread ? "font-bold" : "font-semibold"}`}>
            {other.name}
          </p>
          {conversation.lastMessage.sentAt && (
            <span className="shrink-0 text-[11px] text-muted">
              {timeAgo(conversation.lastMessage.sentAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p
            className={`truncate text-xs ${hasUnread ? "font-semibold text-text" : "text-muted"}`}
          >
            {conversation.lastMessage.content
              ? `${isOwnLastMessage ? "You: " : ""}${conversation.lastMessage.content}`
              : "Say hi \u{1F44B}"}
          </p>
          {hasUnread && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
              {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
