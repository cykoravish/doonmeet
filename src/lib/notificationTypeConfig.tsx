import type { ReactNode } from "react";
import { MessageCircle, CalendarDays, Megaphone } from "lucide-react";

export type NotificationType =
  | "new_dm"
  | "event_comment"
  | "comment_reply"
  | "new_event"
  | "announcement";

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
    color: "rgb(var(--primary))",
    bg: "rgb(var(--primary) / 0.1)",
    label: "sent you a message",
    href: "/chat", // fallback; overridden per-notification via getNotificationHref
  },
  event_comment: {
    icon: <CalendarDays size={14} />,
    color: "rgb(var(--accent))",
    bg: "rgb(var(--accent) / 0.1)",
    label: "commented on your event",
    href: "/events",
  },
  comment_reply: {
    icon: <CalendarDays size={14} />,
    color: "rgb(100 120 220)",
    bg: "rgb(100 120 220 / 0.1)",
    label: "replied to your comment",
    href: "/events",
  },
  new_event: {
    icon: <CalendarDays size={14} />,
    color: "rgb(var(--primary-light))",
    bg: "rgb(var(--primary-light) / 0.1)",
    label: "created a new event",
    href: "/events",
  },
  announcement: {
    icon: <Megaphone size={14} />,
    color: "rgb(220 150 30)",
    bg: "rgb(220 150 30 / 0.1)",
    label: "posted an announcement",
    href: "/",
  },
};

// new_dm notifications deep-link straight into that conversation;
// announcement notifications use whatever URL the admin attached (if any);
// everything else falls back to its section's static href.
export function getNotificationHref(
  notif: Pick<NotificationItem, "type" | "actor" | "url">
): string {
  if (notif.type === "new_dm" && notif.actor.userId) {
    return `/chat?dm=${notif.actor.userId}`;
  }
  if (notif.type === "announcement" && notif.url) {
    return notif.url;
  }
  return NOTIFICATION_TYPE_CONFIG[notif.type].href;
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
