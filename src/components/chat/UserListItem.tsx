import Link from "next/link";
import { MessageCircle } from "lucide-react";
import Avatar from "@/components/ui/Avatar";

export interface MemberUser {
  _id: string;
  name: string;
  avatar: string | null;
  bio?: string;
  isOnline: boolean;
  lastSeenAt: string;
}

function formatLastSeen(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Active just now";
  if (minutes < 60) return `Active ${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Active ${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `Active ${days}d ago`;

  return "Active a while ago";
}

interface UserListItemProps {
  user: MemberUser;
  /** Show a one-tap "Message" button (logged-in viewers only). */
  canMessage?: boolean;
}

export default function UserListItem({ user, canMessage = false }: UserListItemProps) {
  const firstName = user.name.split(" ")[0];

  return (
    <div className="flex items-center gap-1 rounded-[16px] pr-1 transition-colors hover:bg-surface-2">
      <Link href={`/users/${user._id}`} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5">
        <Avatar name={user.name} src={user.avatar} size={46} online={user.isOnline} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-text">{user.name}</span>
          <span
            className={`block truncate text-[13px] ${
              user.isOnline ? "font-semibold text-primary-fg" : "text-muted"
            }`}
          >
            {user.isOnline ? "Online now" : formatLastSeen(user.lastSeenAt)}
          </span>
        </span>
      </Link>

      {canMessage && (
        // Goes through ?dm= so ChatTabs switches to Messages and opens the
        // conversation; dropping ?members=1 also closes this panel.
        <Link
          href={`/chat?dm=${user._id}`}
          scroll={false}
          aria-label={`Message ${user.name}`}
          title={`Message ${firstName}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary-soft text-primary-fg transition-colors hover:bg-primary hover:text-on-primary"
        >
          <MessageCircle size={20} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
