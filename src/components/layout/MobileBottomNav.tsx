"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, MapPinned, MessageCircle, Users, CalendarDays } from "lucide-react";

const navItems = [
  {
    label: "Home",
    href: "/",
    icon: House,
  },
  {
    label: "Map",
    href: "/locations",
    icon: MapPinned,
  },
  {
    label: "Chat",
    href: "/chat",
    icon: MessageCircle,
  },
  {
    label: "Community",
    href: "/communities",
    icon: Users,
  },
  {
    label: "Events",
    href: "/events",
    icon: CalendarDays,
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t md:hidden"
      style={{
        backgroundColor: "rgb(var(--surface))",
        borderColor: "rgb(var(--border))",
      }}
    >
      <div className="grid grid-cols-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center py-2 text-xs"
              style={{
                color: active ? "rgb(var(--primary))" : "rgb(var(--muted))",
              }}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
