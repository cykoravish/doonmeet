"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CalendarDays,
  FileText,
  LogOut,
  MapPin,
  Menu,
  Shield,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { NavUser } from "@/types/user";
import { useNotifications } from "@/providers/notifications-provider";
import InstallAppMenuItem from "./InstallAppMenuItem";
import ThemeToggle from "../theme/theme-toggle";
import Avatar from "@/components/ui/Avatar";
import IconButton from "@/components/ui/IconButton";
import { buttonClasses } from "@/components/ui/Button";

const TRANSITION_MS = 200;

interface MobileDrawerProps {
  user: NavUser | null;
}

export default function MobileDrawer({ user }: MobileDrawerProps) {
  const [open, setOpen] = useState(false);
  // Kept mounted for the duration of the close transition so the panel can
  // slide out instead of vanishing.
  const [rendered, setRendered] = useState(false);
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const { unreadCount } = useNotifications();
  const close = () => setOpen(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRendered(true);
      return;
    }
    const timeout = setTimeout(() => setRendered(false), TRANSITION_MS);
    return () => clearTimeout(timeout);
  }, [open]);

  // Scroll lock + Escape key + focus management
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const focusTimeout = setTimeout(() => panelRef.current?.focus(), 50);

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      // Basic focus trap
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      clearTimeout(focusTimeout);
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open]);

  async function handleLogout() {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <>
      <IconButton label="Open menu" onClick={() => setOpen(true)} aria-expanded={open} aria-haspopup="dialog">
        <Menu size={20} />
      </IconButton>

      {rendered && (
        <>
          {/* Overlay — plain dim, no blur (blur is expensive on cheap GPUs) */}
          <div
            className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-200 ease-out ${
              open ? "opacity-100" : "opacity-0"
            }`}
            onClick={close}
            aria-hidden="true"
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            tabIndex={-1}
            className={`fixed top-0 right-0 z-[60] flex h-dvh w-80 max-w-[86vw] flex-col border-l border-border bg-surface outline-none transition-transform duration-200 ease-out ${
              open ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex h-14 shrink-0 items-center justify-between px-4">
              <span className="font-display text-lg font-extrabold">Menu</span>
              <IconButton label="Close menu" onClick={close}>
                <X size={20} />
              </IconButton>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {user ? (
                <Link
                  href="/profile"
                  onClick={close}
                  className="flex items-center gap-3 rounded-[20px] bg-primary-soft p-3.5"
                >
                  <Avatar name={user.name} src={user.avatar} size={48} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-text">{user.name}</span>
                    <span className="block text-sm font-semibold text-primary-fg">View profile</span>
                  </span>
                </Link>
              ) : (
                <div className="rounded-[20px] bg-primary-soft p-4">
                  <p className="font-semibold text-text">Doon ke logon se milo</p>
                  <p className="mt-0.5 text-sm text-muted">Free account — chat, post and join events.</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link href="/login" onClick={close} className={buttonClasses("outline", "md")}>
                      Log in
                    </Link>
                    <Link href="/signup" onClick={close} className={buttonClasses("primary", "md")}>
                      Sign up
                    </Link>
                  </div>
                </div>
              )}

              <DrawerSection title="Explore">
                <DrawerLink href="/events" icon={<CalendarDays size={20} />} label="Events" onClick={close} />
                <DrawerLink href="/communities" icon={<Users size={20} />} label="Communities" onClick={close} />
                <DrawerLink href="/places" icon={<MapPin size={20} />} label="Places" onClick={close} />
              </DrawerSection>

              <DrawerSection title="Account">
                {user && (
                  <>
                    <DrawerLink
                      href="/notifications"
                      icon={<Bell size={20} />}
                      label="Notifications"
                      badge={unreadCount > 0 ? unreadCount : undefined}
                      onClick={close}
                    />
                    <DrawerLink href="/profile" icon={<UserRound size={20} />} label="Profile & settings" onClick={close} />
                  </>
                )}
                <InstallAppMenuItem onInstallPrompted={close} />
                <div className="flex min-h-12 items-center gap-3 rounded-[14px] px-3">
                  <span className="flex-1 text-[15px] font-medium text-text">Dark mode</span>
                  <ThemeToggle />
                </div>
              </DrawerSection>

              <DrawerSection title="About">
                <DrawerLink href="/privacy" icon={<Shield size={20} />} label="Privacy Policy" onClick={close} />
                <DrawerLink href="/terms" icon={<FileText size={20} />} label="Terms of Service" onClick={close} />
              </DrawerSection>

              {user && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-danger/10 text-[15px] font-semibold text-danger transition-colors hover:bg-danger/15"
                >
                  <LogOut size={18} aria-hidden="true" />
                  Log out
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="mb-1 px-3 text-xs font-bold tracking-wider text-muted uppercase">{title}</p>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function DrawerLink({
  href,
  icon,
  label,
  badge,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex min-h-12 items-center gap-3 rounded-[14px] px-3 text-[15px] font-medium text-text transition-colors hover:bg-surface-2"
    >
      <span className="text-muted" aria-hidden="true">
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {!!badge && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-bold text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}
