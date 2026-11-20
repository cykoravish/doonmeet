"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useSocket } from "@/lib/socket-client";
import type { NotificationItem } from "@/lib/notificationTypeConfig";
import { playMessageSound } from "@/lib/notificationSound";

interface NotificationsContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  markOneRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

// userId is null for logged-out visitors — no socket connection is
// opened and unreadCount just stays 0. Passing a single userId in from
// Navbar (rather than each consumer deciding independently) means the bell
// and the mobile drawer always agree on who they're fetching for.
export function NotificationsProvider({
  userId,
  children,
}: {
  userId: string | null;
  children: ReactNode;
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(!!userId);

  const refresh = useCallback(() => {
    if (!userId) return;
    fetch("/api/notifications?limit=8")
      .then((r) => r.json())
      .then((d) => {
        setNotifications(d.notifications ?? []);
        setUnreadCount(d.unreadCount ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  // The tab's shared socket (see src/lib/socket-client.ts) — no extra
  // connection just for notifications.
  const socket = useSocket(userId);

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    refresh();

    function handleFocus() {
      refresh();
    }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [userId, refresh]);

  useEffect(() => {
    if (!socket) return;

    function handleNew(notif: NotificationItem) {
      setUnreadCount((prev) => prev + 1);
      setNotifications((prev) => [notif, ...prev].slice(0, 8));

      // Sound only for personal DMs, not every notification type (community
      // replies, event comments, etc.) — those stay silent/visual-only.
      if (notif.type === "new_dm") {
        playMessageSound();
      }
    }

    // We don't know exactly which ones were marked read from wherever this
    // came from (another tab, opening a DM, "mark all read") — a light
    // refetch keeps both the count and the preview list accurate.
    function handleReadBulk() {
      refresh();
    }

    socket.on("notification:new", handleNew);
    socket.on("notification:read_bulk", handleReadBulk);
    return () => {
      // Remove only OUR handlers — other features share this socket.
      socket.off("notification:new", handleNew);
      socket.off("notification:read_bulk", handleReadBulk);
    };
  }, [socket, refresh]);

  async function markOneRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    } catch {
      // Non-critical — worst case the badge resyncs on next focus/socket event.
    }
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await fetch("/api/notifications/read", { method: "PATCH" });
    } catch {
      // Non-critical — worst case the badge resyncs on next focus/socket event.
    }
  }

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, loading, markOneRead, markAllRead }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return ctx;
}
