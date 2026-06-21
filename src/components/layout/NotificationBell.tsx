"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";

export default function NotificationBell({ userId }: { userId: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch("/api/notifications?unreadOnly=true&limit=1")
      .then((r) => r.json())
      .then((d) => setCount(d.unreadCount ?? 0))
      .catch(() => {});
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