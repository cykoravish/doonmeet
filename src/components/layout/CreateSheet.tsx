"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  CalendarPlus,
  ChevronRight,
  Megaphone,
  MessageCircle,
  PenLine,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import { buttonClasses } from "@/components/ui/Button";
import { PROMOTION_PLAN_LABEL } from "@/lib/promotionPlans";

interface CreateSheetProps {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  /** Show the paid "Promote your business" entry (payments switched on). */
  promotionsEnabled?: boolean;
}

interface CreateOption {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  /** Needs an account — guests are sent to sign up instead. */
  requiresAuth: boolean;
}

const OPTIONS: CreateOption[] = [
  {
    title: "Write a post",
    description: "Share anything with Dehradun",
    href: "/posts?compose=1",
    icon: PenLine,
    requiresAuth: true,
  },
  {
    title: "Host an event",
    description: "Treks, meetups, workshops",
    href: "/events/create",
    icon: CalendarPlus,
    requiresAuth: true,
  },
  {
    title: "Chat with Doon",
    description: "Jump into the public chat",
    href: "/chat",
    icon: MessageCircle,
    requiresAuth: false,
  },
  {
    title: "Join a community",
    description: "Find people who like what you like",
    href: "/communities",
    icon: Users,
    requiresAuth: false,
  },
  {
    title: "Promote your business",
    description: `Pin a post on top for ${PROMOTION_PLAN_LABEL}`,
    href: "/promote",
    icon: Megaphone,
    requiresAuth: false,
  },
];

export default function CreateSheet({ open, onClose, isLoggedIn, promotionsEnabled = false }: CreateSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape to close, lock background scroll, move focus into the sheet.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className="composer-backdrop absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-sheet-title"
        tabIndex={-1}
        className="composer-sheet relative w-full rounded-t-[28px] bg-surface px-4 pt-2.5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] outline-none sm:max-w-md sm:rounded-[28px] sm:pb-5"
      >
        <div className="mx-auto mb-2 h-1.5 w-11 rounded-full bg-border sm:hidden" aria-hidden="true" />
        <div className="mb-3 flex items-center justify-between">
          <h2 id="create-sheet-title" className="text-2xl font-extrabold">
            Create
          </h2>
          <IconButton label="Close" onClick={onClose}>
            <X size={20} />
          </IconButton>
        </div>

        {!isLoggedIn && (
          <div className="mb-3 rounded-[18px] bg-primary-soft p-4">
            <p className="font-semibold text-text">Free account se sab unlock karo</p>
            <p className="mt-0.5 text-sm text-muted">
              Posting, events aur direct messages ke liye sign up karo — 30 seconds lagte hain.
            </p>
            <Link href="/signup" onClick={onClose} className={buttonClasses("primary", "md", "mt-3 w-full")}>
              Sign up free
            </Link>
          </div>
        )}

        <ul className="flex flex-col gap-2">
          {OPTIONS.filter((o) => promotionsEnabled || o.href !== "/promote").map((option) => {
            const Icon = option.icon;
            const locked = option.requiresAuth && !isLoggedIn;
            return (
              <li key={option.title}>
                <Link
                  href={locked ? "/signup" : option.href}
                  onClick={onClose}
                  className="flex items-center gap-3.5 rounded-[18px] border border-border p-3.5 transition-colors hover:bg-surface-2"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-primary-soft text-primary-fg">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-semibold text-text">{option.title}</span>
                    <span className="block text-sm text-muted">
                      {locked ? "Sign up to use this" : option.description}
                    </span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
