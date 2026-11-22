import type { ReactNode } from "react";
import { MessageCircle, CalendarDays, Heart, Megaphone, Newspaper, Reply, ShieldAlert } from "lucide-react";

export type NotificationType =
  | "new_dm"
  | "event_comment"
  | "comment_reply"
  | "new_event"
  | "announcement"
  | "post_comment"
  | "post_like"
  | "post_removed";

export interface NotificationItem {
  _id: string;
  type: NotificationType;
  preview: string | null;
  url: string | null;
  isRead: boolean;
  createdAt: string;
  actor: {
    userId: string;
    name: string;
    avatar: string | null;
  };
}

interface TypeConfigEntry {
  icon: ReactNode;
  color: string;
  bg: string;
  label: string;
  href: string;
}

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, TypeConfigEntry> = {
  new_dm: {
    icon: <MessageCircle size={14} />,
    color: "rgb(var(--primary-fg))",
    bg: "rgb(var(--primary-soft))",
    label: "sent you a message",
    href: "/chat", // fallback; overridden per-notification via getNotificationHref
  },
  event_comment: {
    icon: <CalendarDays size={14} />,
    color: "rgb(var(--accent-fg))",
    bg: "rgb(var(--accent-soft))",
    label: "commented on your event",
    href: "/events",
  },
  // Replies on Doon Feed posts — the notification's url opens the thread.
  comment_reply: {
    icon: <Reply size={14} />,
    color: "rgb(var(--primary-fg))",
    bg: "rgb(var(--primary-soft))",
    label: "replied to your comment",
    href: "/posts",
  },
  new_event: {
    icon: <CalendarDays size={14} />,
    color: "rgb(var(--primary-fg))",
    bg: "rgb(var(--primary-soft))",
    label: "created a new event",
    href: "/events",
  },
  announcement: {
    icon: <Megaphone size={14} />,
    color: "rgb(var(--accent-fg))",
    bg: "rgb(var(--accent-soft))",
    label: "posted an announcement",
    href: "/",
  },
  post_comment: {
    icon: <Newspaper size={14} />,
    color: "rgb(var(--accent-fg))",
    bg: "rgb(var(--accent-soft))",
    label: "commented on your post",
    href: "/posts",
  },
  post_like: {
    icon: <Heart size={14} />,
    color: "rgb(var(--danger))",
    bg: "rgb(var(--danger) / 0.1)",
    label: "liked your post",
    href: "/posts",
  },
  post_removed: {
    icon: <ShieldAlert size={14} />,
    color: "rgb(var(--danger))",
    bg: "rgb(var(--danger) / 0.1)",
    label: "removed your post because it broke the community guidelines",
    href: "/grievance",
  },
};

// Unknown types (e.g. a newer type sent before this code is deployed) still render.
const FALLBACK_CONFIG: TypeConfigEntry = {
  icon: <Megaphone size={14} />,
  color: "rgb(var(--primary-fg))",
  bg: "rgb(var(--primary-soft))",
  label: "sent you an update",
  href: "/notifications",
};

export function getNotificationConfig(type: string): TypeConfigEntry {
  return NOTIFICATION_TYPE_CONFIG[type as NotificationType] ?? FALLBACK_CONFIG;
}

// new_dm notifications deep-link straight into that conversation; any
// notification that carries its own url (announcement links, post comments,
// replies, likes, removals) goes there; everything else falls back to its
// section's static href.
export function getNotificationHref(
  notif: Pick<NotificationItem, "type" | "actor" | "url">
): string {
  if (notif.type === "new_dm" && notif.actor.userId) {
    return `/chat?dm=${notif.actor.userId}`;
  }
  // Only same-site paths — never send someone off-site from a notification.
  if (notif.url && notif.url.startsWith("/") && !notif.url.startsWith("//")) {
    return notif.url;
  }
  if (notif.type === "announcement" && notif.url) return notif.url;
  return getNotificationConfig(notif.type).href;
}

export function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
}
