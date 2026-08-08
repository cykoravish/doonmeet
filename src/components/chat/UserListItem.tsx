import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

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
}

export default function UserListItem({ user }: UserListItemProps) {
  return (
    <Link
      href={`/users/${user._id}`}
      className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-primary/5"
    >
      {/* Avatar with online dot */}
      <div className="relative shrink-0">
        {user.avatar ? (
          <Image
            src={user.avatar}
            alt={user.name}
            width={44}
            height={44}
            className="h-11 w-11 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            {user.name[0]?.toUpperCase()}
          </div>
        )}
        {user.isOnline && (
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface bg-green-500"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Name + status */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{user.name}</p>
        <p
          className={`truncate text-xs ${user.isOnline ? "font-medium text-green-600 dark:text-green-400" : "text-muted"}`}
        >
          {user.isOnline ? "Online now" : formatLastSeen(user.lastSeenAt)}
        </p>
      </div>

      <ChevronRight size={16} className="shrink-0 text-muted" />
    </Link>
  );
}
