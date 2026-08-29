"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X, Settings, LogOut, Shield, Bell } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { NavUser } from "@/types/user";
import { useNotifications } from "@/providers/notifications-provider";

const TRANSITION_MS = 220;

interface MobileDrawerProps {
  user: NavUser | null;
}

export default function MobileDrawer({ user }: MobileDrawerProps) {
  const [open, setOpen] = useState(false);
  // Kept mounted for the duration of the close transition instead of
  // unmounting instantly, so the panel/overlay can animate out smoothly.
  const [rendered, setRendered] = useState(false);
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { unreadCount } = useNotifications();

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
    // Let the slide-in transition start before we yank focus, so it isn't
    // interrupted by the browser scrolling the panel into view mid-animation.
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
      <button
        ref={triggerRef}
        onClick={() => setOpen(true)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border"
        aria-label={unreadCount > 0 ? `Open menu, ${unreadCount} unread notifications` : "Open menu"}
        aria-expanded={open}
      >
        <Menu size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {rendered && (
        <>
          {/* Overlay */}
          <div
            className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-[220ms] ease-out ${
              open ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer — spans the full viewport height from the very top, so
              it fully covers the navbar underneath (instead of starting
              below it and leaving a confusing blurred strip peeking out
              above the panel). Slides in/out from the right. */}
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            tabIndex={-1}
            className={`fixed right-0 top-0 z-[60] flex h-dvh w-72 max-w-[85vw] flex-col overflow-hidden border-l border-border bg-surface shadow-2xl outline-none transition-transform duration-[220ms] ease-out ${
              open ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Header */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
              <Link href="/" className="flex items-center gap-2 group shrink-0" onClick={() => setOpen(false)}>
                <Image
                  src="/doonmeet-light.png"
                  alt="DoonMeet"
                  width={40}
                  height={40}
                  className="logo-light h-10 w-10 object-contain"
                />
                <Image
                  src="/doonmeet-dark.png"
                  alt="DoonMeet"
                  width={40}
                  height={40}
                  className="logo-dark h-10 w-10 object-contain"
                />
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-border transition-transform active:scale-90"
                aria-label="Close menu"
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable section — user card + account links + Log out.
                Log out sits inside this scroll area (not pinned as a rigid
                fixed-height footer) with mt-auto: on tall screens it still
                settles visually toward the bottom, but on short screens or
                with more menu items it simply flows after the last link and
                stays reachable via scroll instead of ever being clipped or
                stranded behind an awkward empty gap. */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="flex min-h-full flex-col">
                {/* User card */}
                {user ? (
                  <div className="mx-4 mt-4 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 to-transparent p-4">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={user.name}
                          width={44}
                          height={44}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-bold text-white">
                          {user.name[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-bold text-sm">{user.name}</p>
                        {user.email && (
                          <p className="truncate text-xs text-muted">{user.email}</p>
                        )}
                      </div>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setOpen(false)}
                      className="mt-3 block w-full rounded-xl bg-primary py-2 text-center text-xs font-semibold text-white"
                    >
                      View Profile
                    </Link>
                  </div>
                ) : (
                  <div className="mx-4 mt-4 space-y-2">
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="block w-full rounded-xl border border-border py-2.5 text-center text-sm font-medium"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setOpen(false)}
                      className="block w-full rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-white"
                    >
                      Sign up free
                    </Link>
                  </div>
                )}

                {/* Settings links */}
                <div className="mt-4 px-4 pb-4">
                  <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-muted">
                    Account
                  </p>
                  <div className="space-y-1">
                    {user && (
                      <>
                        <DrawerLink
                          href="/profile"
                          icon={<Settings size={15} />}
                          label="Settings"
                          onClick={() => setOpen(false)}
                        />
                        <DrawerLink
                          href="/notifications"
                          icon={<Bell size={15} />}
                          label="Notifications"
                          badge={unreadCount > 0 ? unreadCount : undefined}
                          onClick={() => setOpen(false)}
                        />
                      </>
                    )}
                    <DrawerLink
                      href="/privacy"
                      icon={<Shield size={15} />}
                      label="Privacy Policy"
                      onClick={() => setOpen(false)}
                    />
                  </div>
                </div>

                {/* Log out — visually anchored toward the bottom (mt-auto)
                    but part of the natural document flow, so it never
                    detaches from the rest of the menu with a big gap, and
                    never gets clipped since it's inside the scroll area. */}
                {user && (
                  <div className="mt-auto border-t border-border px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl border border-red-600/20 px-3 py-2.5 text-sm font-medium text-red-600 transition-opacity hover:opacity-80"
                    >
                      <LogOut size={15} />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
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
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text transition-colors hover:opacity-80"
    >
      <span className="text-muted">{icon}</span>
      <span className="flex-1">{label}</span>
      {!!badge && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}
