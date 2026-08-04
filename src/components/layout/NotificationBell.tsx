"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";

export default function NotificationBell({ userId }: { userId: string }) {
  const [count, setCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  function refetchCount() {
    fetch("/api/notifications?unreadOnly=true&limit=1")
      .then((r) => r.json())
      .then((d) => setCount(d.unreadCount ?? 0))
      .catch(() => {});
  }

  useEffect(() => {
    refetchCount();

    // Live updates while the app is open — new DMs/comments bump the count,
    // and reading them elsewhere (opening a DM, "mark all read") clears it —
    // without this the badge only ever reflected the moment the page loaded.
    const socket = io({ withCredentials: true });
    socketRef.current = socket;

    socket.on("notification:new", () => setCount((prev) => prev + 1));
    socket.on("notification:read_bulk", ({ count: cleared }: { count: number }) =>
      setCount((prev) => Math.max(0, prev - cleared))
    );

    // Belt-and-braces: re-sync whenever the tab regains focus, in case a
    // notification was read on another device/tab in the meantime.
    function handleFocus() {
      refetchCount();
    }
    window.addEventListener("focus", handleFocus);

    return () => {
      socket.disconnect();
      window.removeEventListener("focus", handleFocus);
    };
  }, [userId]);

  return (
    <Link
      href="/notifications"
      className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:opacity-80"
      style={{ backgroundColor: "rgb(var(--surface))" }}
    >
      <Bell size={17} />
      {count > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: "rgb(220 38 38)" }}
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
