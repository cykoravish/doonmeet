"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { NOTIFICATION_TYPE_CONFIG, getNotificationHref, timeAgo } from "@/lib/notificationTypeConfig";
import { useNotifications } from "@/providers/notifications-provider";

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden="true"
      className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-danger px-1 text-[11px] font-bold text-white"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

// Mobile: a plain link to the full notifications page — a dropdown is
// cramped on a 360px screen, a full page is easier to read and tap.
export function NotificationLink() {
  const { unreadCount } = useNotifications();
  return (
    <Link
      href="/notifications"
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
      className="relative flex h-11 w-11 items-center justify-center rounded-[14px] bg-surface-2 text-text transition-colors hover:bg-border"
    >
      <Bell size={20} aria-hidden="true" />
      <UnreadBadge count={unreadCount} />
    </Link>
  );
}

export default function NotificationBell() {
  const { notifications, unreadCount, loading, markOneRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close the dropdown on outside click or Escape
  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  async function handleMarkAllRead() {
    setMarking(true);
    try {
      await markAllRead();
    } finally {
      setMarking(false);
    }
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
        className="relative flex h-11 w-11 items-center justify-center rounded-[14px] bg-surface-2 text-text transition-colors hover:bg-border"
      >
        <Bell size={20} aria-hidden="true" />
        <UnreadBadge count={unreadCount} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-bold">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={marking}
                className="flex items-center gap-1 text-xs font-semibold text-primary-fg transition-opacity hover:opacity-70 disabled:opacity-50"
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={18} className="animate-spin text-muted" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                <Bell size={22} className="mb-2 text-muted" />
                <p className="text-sm font-semibold">All caught up!</p>
                <p className="mt-0.5 text-xs text-muted">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const config = NOTIFICATION_TYPE_CONFIG[notif.type];
                return (
                  <Link
                    key={notif._id}
                    href={getNotificationHref(notif)}
                    onClick={() => {
                      setOpen(false);
                      if (!notif.isRead) markOneRead(notif._id);
                    }}
                    className={`flex items-start gap-3 border-b border-border/60 px-4 py-3 transition-colors last:border-b-0 hover:bg-primary/5 ${
                      notif.isRead ? "" : "bg-primary/[0.04]"
                    }`}
                  >
                    <div className="relative shrink-0">
                      {notif.actor.avatar ? (
                        <Image
                          src={notif.actor.avatar}
                          alt={notif.actor.name}
                          width={36}
                          height={36}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                          {notif.actor.name[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-snug">
                        <span className={notif.isRead ? "font-medium" : "font-bold"}>
                          {notif.actor.name}
                        </span>{" "}
                        <span className="text-muted">{config.label}</span>
                      </p>
                      {notif.preview && (
                        <p className="mt-0.5 truncate text-xs text-muted">
                          &ldquo;{notif.preview}&rdquo;
                        </p>
                      )}
                      <p className="mt-0.5 text-[11px] font-medium" style={{ color: config.color }}>
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })
            )}
          </div>

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-border px-4 py-2.5 text-center text-xs font-semibold text-primary-fg transition-colors hover:bg-primary/5"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
