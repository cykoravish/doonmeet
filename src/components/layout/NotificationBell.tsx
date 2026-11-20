"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
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
        type="button"
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
          <div className="flex min-h-13 items-center justify-between border-b border-border px-4 py-2">
            <p className="font-bold">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={marking}
                className="flex h-9 items-center gap-1.5 rounded-[10px] px-2.5 text-sm font-semibold text-primary-fg transition-colors hover:bg-primary-soft disabled:opacity-50"
              >
                <CheckCheck size={16} aria-hidden="true" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10" role="status">
                <Loader2 size={20} className="animate-spin text-muted" aria-hidden="true" />
                <span className="sr-only">Loading notifications</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                <Bell size={24} className="mb-2 text-muted" aria-hidden="true" />
                <p className="font-semibold">All caught up!</p>
                <p className="mt-0.5 text-sm text-muted">No notifications yet.</p>
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
                    className={`flex items-start gap-3 border-b border-border/60 px-4 py-3 transition-colors last:border-b-0 ${
                      notif.isRead ? "hover:bg-surface-2" : "bg-primary-soft hover:bg-primary-soft/70"
                    }`}
                  >
                    <Avatar name={notif.actor.name} src={notif.actor.avatar} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug">
                        <span className={notif.isRead ? "font-semibold" : "font-bold"}>{notif.actor.name}</span>{" "}
                        <span className="text-muted">{config.label}</span>
                      </p>
                      {notif.preview && (
                        <p className="mt-0.5 truncate text-sm text-muted">&ldquo;{notif.preview}&rdquo;</p>
                      )}
                      <p className="mt-0.5 text-[13px] text-muted">{timeAgo(notif.createdAt)}</p>
                    </div>
                    {!notif.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary">
                        <span className="sr-only">Unread</span>
                      </span>
                    )}
                  </Link>
                );
              })
            )}
          </div>

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="flex h-11 items-center justify-center border-t border-border text-sm font-semibold text-primary-fg transition-colors hover:bg-primary-soft"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
