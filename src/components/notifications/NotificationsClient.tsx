"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import {
  getNotificationConfig,
  getNotificationHref,
  timeAgo,
  type NotificationItem,
} from "@/lib/notificationTypeConfig";
import Avatar from "@/components/ui/Avatar";
import { buttonClasses } from "@/components/ui/Button";

interface NotificationsClientProps {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
}

export default function NotificationsClient({ initialNotifications, initialUnreadCount }: NotificationsClientProps) {
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

  function markOneRead(id: string) {
    // Optimistic — the user is navigating away anyway.
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch(() => {});
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-5 pb-8 sm:px-6 sm:pt-8">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] leading-tight font-extrabold sm:text-4xl">Notifications</h1>
          <p className="mt-0.5 text-[15px] text-muted">
            {unreadCount > 0 ? `${unreadCount} new` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            disabled={marking}
            className={buttonClasses("secondary", "sm", "shrink-0")}
          >
            <CheckCheck size={17} aria-hidden="true" />
            Mark all read
          </button>
        )}
      </header>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-primary-soft text-primary-fg">
            <Bell size={28} aria-hidden="true" />
          </span>
          <p className="text-lg font-bold">Nothing here yet</p>
          <p className="mt-1 max-w-xs text-[15px] text-muted">
            Messages, replies and event updates will show up here. Say hi in the public chat to get started!
          </p>
          <Link href="/chat" className={buttonClasses("primary", "md", "mt-5")}>
            Open public chat
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {unread.length > 0 && (
            <section aria-label="New notifications">
              <h2 className="mb-2 px-1 text-xs font-bold tracking-wider text-primary-fg uppercase">New</h2>
              <ul className="flex flex-col gap-2">
                {unread.map((notif) => (
                  <li key={notif._id}>
                    <NotificationRow notif={notif} onRead={markOneRead} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {read.length > 0 && (
            <section aria-label="Earlier notifications">
              <h2 className="mb-2 px-1 text-xs font-bold tracking-wider text-muted uppercase">Earlier</h2>
              <ul className="flex flex-col gap-2">
                {read.map((notif) => (
                  <li key={notif._id}>
                    <NotificationRow notif={notif} onRead={markOneRead} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationRow({ notif, onRead }: { notif: NotificationItem; onRead: (id: string) => void }) {
  const config = getNotificationConfig(notif.type);

  return (
    <Link
      href={getNotificationHref(notif)}
      onClick={() => !notif.isRead && onRead(notif._id)}
      className={`flex items-start gap-3.5 rounded-[18px] p-3.5 transition-colors ${
        notif.isRead ? "bg-surface hover:bg-surface-2" : "bg-primary-soft hover:bg-primary-soft/70"
      }`}
    >
      <span className="relative shrink-0">
        <Avatar name={notif.actor.name} src={notif.actor.avatar} size={46} />
        {/* Type badge */}
        <span
          className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface"
          style={{ backgroundColor: config.bg, color: config.color }}
          aria-hidden="true"
        >
          {config.icon}
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-snug text-text">
          <span className={notif.isRead ? "font-semibold" : "font-bold"}>{notif.actor.name}</span>{" "}
          <span className="text-muted">{config.label}</span>
        </span>
        {notif.preview && (
          <span className="mt-0.5 line-clamp-2 block text-sm text-muted">&ldquo;{notif.preview}&rdquo;</span>
        )}
        <span className="mt-1 block text-[13px] font-semibold text-muted">{timeAgo(notif.createdAt)}</span>
      </span>

      {!notif.isRead && (
        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary">
          <span className="sr-only">Unread</span>
        </span>
      )}
    </Link>
  );
}
