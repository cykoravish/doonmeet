"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  MapPinned,
  MessageCircle,
  Users,
  CalendarDays,
} from "lucide-react";

const navItems = [
  { label: "Home", href: "/", icon: House },
  { label: "Map", href: "/locations", icon: MapPinned },
  { label: "Chat", href: "/chat", icon: MessageCircle },
  { label: "Community", href: "/communities", icon: Users },
  { label: "Events", href: "/events", icon: CalendarDays },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t md:hidden"
      style={{
        backgroundColor: "rgb(var(--surface) / 0.95)",
        borderColor: "rgb(var(--border))",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="grid grid-cols-5 px-2 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 rounded-xl py-2 transition-all"
              style={{
                color: active ? "rgb(var(--primary))" : "rgb(var(--muted))",
              }}
            >
              <div className="relative">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl transition-all"
                  style={{
                    backgroundColor: active
                      ? "rgb(var(--primary) / 0.12)"
                      : "transparent",
                  }}
                >
                  <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
                </div>
                {/* Active dot */}
                {active && (
                  <div
                    className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                    style={{ backgroundColor: "rgb(var(--primary))" }}
                  />
                )}
              </div>
              <span
                className="text-[10px] font-medium"
                style={{ fontWeight: active ? 700 : 400 }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}