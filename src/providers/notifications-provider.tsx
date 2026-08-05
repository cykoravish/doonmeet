"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import type { NotificationItem } from "@/lib/notificationTypeConfig";

interface NotificationsContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  markOneRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

// userId is null for guests/logged-out visitors — no socket connection is
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
  const socketRef = useRef<Socket | null>(null);

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

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    refresh();

    const socket = io({ withCredentials: true });
    socketRef.current = socket;

    socket.on("notification:new", (notif: NotificationItem) => {
      setUnreadCount((prev) => prev + 1);
      setNotifications((prev) => [notif, ...prev].slice(0, 8));
    });

    // We don't know exactly which ones were marked read from wherever this
    // came from (another tab, opening a DM, "mark all read") — a light
    // refetch keeps both the count and the preview list accurate.
    socket.on("notification:read_bulk", () => refresh());

    function handleFocus() {
      refresh();
    }
    window.addEventListener("focus", handleFocus);

    return () => {
      socket.disconnect();
      window.removeEventListener("focus", handleFocus);
    };
  }, [userId, refresh]);

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
