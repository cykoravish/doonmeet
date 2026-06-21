"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/locations", label: "Map" },
  { href: "/chat", label: "Chat" },
  { href: "/communities", label: "Communities" },
  { href: "/events", label: "Events" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className="relative rounded-lg px-3 py-2 text-sm transition-colors"
            style={{
              color: active ? "rgb(var(--primary))" : "rgb(var(--muted))",
              fontWeight: active ? 600 : 400,
            }}
          >
            {link.label}
            {active && (
              <span
                className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                style={{ backgroundColor: "rgb(var(--primary))" }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}