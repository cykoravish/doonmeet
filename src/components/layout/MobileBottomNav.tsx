"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import {
  MOBILE_NAV_LEFT,
  MOBILE_NAV_RIGHT,
  isNavItemActive,
  type NavItem,
} from "@/config/nav-items";
import CreateSheet from "./CreateSheet";

interface MobileBottomNavProps {
  isLoggedIn: boolean;
  promotionsEnabled?: boolean;
}

export default function MobileBottomNav({ isLoggedIn, promotionsEnabled = false }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);
  const closeCreate = useCallback(() => setCreateOpen(false), []);

  return (
    <>
      {/* Solid background (no backdrop-blur) — blur on a fixed full-width bar
          repaints on every scroll frame and stutters on low-end phones. */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="grid h-16 grid-cols-5 items-center px-1">
          {MOBILE_NAV_LEFT.map((item) => (
            <BottomNavLink key={item.href} item={item} active={isNavItemActive(pathname, item)} />
          ))}

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              aria-label="Create"
              aria-haspopup="dialog"
              aria-expanded={createOpen}
              className="btn-springy -mt-6 flex h-14 w-14 items-center justify-center rounded-[20px] bg-primary text-on-primary shadow-[0_6px_16px_rgb(0_0_0/0.25)]"
            >
              <Plus size={28} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>

          {MOBILE_NAV_RIGHT.map((item) => (
            <BottomNavLink key={item.href} item={item} active={isNavItemActive(pathname, item)} />
          ))}
        </div>
      </nav>

      <CreateSheet
        open={createOpen}
        onClose={closeCreate}
        isLoggedIn={isLoggedIn}
        promotionsEnabled={promotionsEnabled}
      />
    </>
  );
}

function BottomNavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex h-full flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
        active ? "font-bold text-primary-fg" : "font-medium text-muted"
      }`}
    >
      <span
        className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors ${
          active ? "bg-primary-soft" : ""
        }`}
      >
        <Icon size={22} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
      </span>
      {item.label}
    </Link>
  );
}
