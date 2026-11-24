import Avatar from "@/components/ui/Avatar";

export interface ConversationSummary {
  _id: string;
  otherParticipant: {
    _id: string;
    name: string;
    avatar: string | null;
    lastSeenAt?: string;
    isOnline?: boolean;
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
  /** Live online status (from MessagesPanel's presence watch). */
  isOnline?: boolean;
  onClick: () => void;
}

function shortTimeAgo(date: string | null) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 6) return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (mins > 0) return `${mins}m`;
  return "now";
}

export default function ConversationListItem({
  conversation,
  isActive,
  currentUserId,
  isOnline = false,
  onClick,
}: ConversationListItemProps) {
  const other = conversation.otherParticipant;
  if (!other) return null;

  const isOwnLastMessage = conversation.lastMessage.senderId === currentUserId;
  const hasUnread = conversation.unreadCount > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "true" : undefined}
      className={`flex w-full items-center gap-3 rounded-[16px] px-3 py-2.5 text-left transition-colors ${
        isActive ? "bg-primary-soft" : "hover:bg-surface-2"
      }`}
    >
      <Avatar name={other.name} src={other.avatar} size={52} online={isOnline} />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`truncate text-base ${hasUnread ? "font-bold" : "font-semibold"} text-text`}>
            {other.name}
          </p>
          {conversation.lastMessage.sentAt && (
            <span className={`shrink-0 text-xs ${hasUnread ? "font-semibold text-primary-fg" : "text-muted"}`}>
              {shortTimeAgo(conversation.lastMessage.sentAt)}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className={`truncate text-sm ${hasUnread ? "font-semibold text-text" : "text-muted"}`}>
            {conversation.lastMessage.content
              ? `${isOwnLastMessage ? "You: " : ""}${conversation.lastMessage.content}`
              : "Say hi \u{1F44B}"}
          </p>
          {hasUnread && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-on-primary">
              {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
              <span className="sr-only"> unread</span>
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
