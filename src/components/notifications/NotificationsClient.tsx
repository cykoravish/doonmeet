"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, CheckCheck } from "lucide-react";
import {
  NOTIFICATION_TYPE_CONFIG,
  getNotificationHref,
  timeAgo,
  type NotificationItem,
} from "@/lib/notificationTypeConfig";

interface NotificationsClientProps {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
}

export default function NotificationsClient({
  initialNotifications,
  initialUnreadCount,
}: NotificationsClientProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [marking, setMarking] = useState(false);

  const { unread, read } = useMemo(() => {
    const unread: NotificationItem[] = [];
    const read: NotificationItem[] = [];
    for (const n of notifications) (n.isRead ? read : unread).push(n);
    return { unread, read };
  }, [notifications]);

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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-surface py-10">
        <div className="mx-auto max-w-2xl px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-primary">
                Updates
              </p>
              <h1 className="text-3xl font-black">Notifications</h1>
              {unreadCount > 0 && (
                <p className="mt-1 text-sm text-muted">
                  {unreadCount} unread
                </p>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={marking}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
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
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
              <Bell size={28} className="text-muted" />
            </div>
            <p className="font-bold">All caught up!</p>
            <p className="mt-1 text-sm text-muted">
              No notifications yet. Start connecting!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {unread.length > 0 && (
              <section>
                <p className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-primary">
                  New
                </p>
                <div className="space-y-2">
                  {unread.map((notif) => (
                    <NotificationRow key={notif._id} notif={notif} onRead={markOneRead} />
                  ))}
                </div>
              </section>
            )}

            {read.length > 0 && (
              <section>
                <p className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-muted">
                  Earlier
                </p>
                <div className="space-y-2">
                  {read.map((notif) => (
                    <NotificationRow key={notif._id} notif={notif} onRead={markOneRead} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationRow({
  notif,
  onRead,
}: {
  notif: NotificationItem;
  onRead: (id: string) => void;
}) {
  const config = NOTIFICATION_TYPE_CONFIG[notif.type];

  return (
    <Link
      href={getNotificationHref(notif)}
      onClick={() => !notif.isRead && onRead(notif._id)}
      className={`flex items-start gap-4 rounded-2xl border p-4 transition-all hover:opacity-80 ${
        notif.isRead
          ? "border-border bg-surface opacity-70"
          : "border-border border-l-4 border-l-primary bg-primary/[0.04]"
      }`}
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
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-bold text-white">
            {notif.actor.name[0]?.toUpperCase()}
          </div>
        )}
        {/* Type icon badge */}
        <div
          className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface"
          style={{ backgroundColor: config.bg, color: config.color }}
        >
          {config.icon}
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">
          <span className={notif.isRead ? "font-medium" : "font-bold"}>{notif.actor.name}</span>{" "}
          <span className="text-muted">{config.label}</span>
        </p>
        {notif.preview && (
          <p className="mt-1 line-clamp-1 text-xs text-muted">&ldquo;{notif.preview}&rdquo;</p>
        )}
        <p className="mt-1.5 text-xs font-medium" style={{ color: config.color }}>
          {timeAgo(notif.createdAt)}
        </p>
      </div>

      {/* Unread dot */}
      {!notif.isRead && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
    </Link>
  );
}
