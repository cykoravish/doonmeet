"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, MessageCircle, CalendarDays, CheckCheck } from "lucide-react";

interface Notification {
  _id: string;
  type: "new_dm" | "event_comment" | "comment_reply" | "new_event";
  preview: string | null;
  isRead: boolean;
  createdAt: string;
  actor: {
    userId: string;
    name: string;
    avatar: string | null;
  };
}

interface NotificationsClientProps {
  initialNotifications: Notification[];
  initialUnreadCount: number;
}

const TYPE_CONFIG = {
  new_dm: {
    icon: <MessageCircle size={14} />,
    color: "rgb(var(--primary))",
    bg: "rgb(var(--primary) / 0.1)",
    label: "sent you a message",
    href: "/chat", // fallback; overridden per-notification with the actor's id below
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
};

export default function NotificationsClient({
  initialNotifications,
  initialUnreadCount,
}: NotificationsClientProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [marking, setMarking] = useState(false);

  async function markAllRead() {
    setMarking(true);
    try {
      await fetch("/api/notifications/read", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } finally {
      setMarking(false);
    }
  }

  async function markOneRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "Just now";
  };

  return (
    <div className="min-h-screen">

      {/* Header */}
      <div
        className="border-b py-10"
        style={{
          backgroundColor: "rgb(var(--surface))",
          borderColor: "rgb(var(--border))",
        }}
      >
        <div className="mx-auto max-w-2xl px-6">
          <div className="flex items-center justify-between">
            <div>
              <p
                className="mb-1 text-sm font-semibold uppercase tracking-widest"
                style={{ color: "rgb(var(--primary))" }}
              >
                Updates
              </p>
              <h1 className="text-3xl font-black">Notifications</h1>
              {unreadCount > 0 && (
                <p className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
                  {unreadCount} unread
                </p>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={marking}
                className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ borderColor: "rgb(var(--border))" }}
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications list */}
      <div className="mx-auto max-w-2xl px-6 py-6">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "rgb(var(--surface))" }}
            >
              <Bell size={28} style={{ color: "rgb(var(--muted))" }} />
            </div>
            <p className="font-bold">All caught up!</p>
            <p className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
              No notifications yet. Start connecting!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const config = TYPE_CONFIG[notif.type];
              const href =
                notif.type === "new_dm" && notif.actor.userId
                  ? `/chat?dm=${notif.actor.userId}`
                  : config.href;
              return (
                <Link
                  key={notif._id}
                  href={href}
                  onClick={() => !notif.isRead && markOneRead(notif._id)}
                  className="flex items-start gap-4 rounded-2xl border p-4 transition-all hover:opacity-80"
                  style={{
                    borderColor: notif.isRead
                      ? "rgb(var(--border))"
                      : "rgb(var(--primary) / 0.2)",
                    backgroundColor: notif.isRead
                      ? "rgb(var(--surface))"
                      : "rgb(var(--primary) / 0.04)",
                  }}
                >
                  {/* Actor avatar */}
                  <div className="relative shrink-0">
                    {notif.actor.avatar ? (
                      <Image
                        src={notif.actor.avatar}
                        alt={notif.actor.name}
                        width={44}
                        height={44}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-full font-bold text-white"
                        style={{ backgroundColor: "rgb(var(--primary))" }}
                      >
                        {notif.actor.name[0]?.toUpperCase()}
                      </div>
                    )}
                    {/* Type icon badge */}
                    <div
                      className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: config.bg,
                        color: config.color,
                        border: "2px solid rgb(var(--surface))",
                      }}
                    >
                      {config.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">
                      <span className="font-semibold">{notif.actor.name}</span>{" "}
                      <span style={{ color: "rgb(var(--muted))" }}>
                        {config.label}
                      </span>
                    </p>
                    {notif.preview && (
                      <p
                        className="mt-1 text-xs line-clamp-1"
                        style={{ color: "rgb(var(--muted))" }}
                      >
                        &ldquo;{notif.preview}&rdquo;
                      </p>
                    )}
                    <p
                      className="mt-1.5 text-xs font-medium"
                      style={{ color: config.color }}
                    >
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notif.isRead && (
                    <div
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: "rgb(var(--primary))" }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}