"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/locations", label: "Locations" },
  { href: "/chat", label: "Chat" },
  { href: "/communities", label: "Communities" },
  { href: "/events", label: "Events" },
];

export default function DesktopNavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        const active = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className="transition-colors"
            style={{
              color: active
                ? "rgb(var(--primary))"
                : "rgb(var(--text))",
              fontWeight: active ? 600 : 400,
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}