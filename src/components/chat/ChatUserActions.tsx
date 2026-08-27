"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, UserRound, Lock } from "lucide-react";
import { useToast } from "@/providers/toast-provider";

interface ChatUserActionsProps {
  userId: string;
  isGuest?: boolean;
  // Whether the person viewing this menu (not the sender) is a guest.
  // Guests can look, but can't start a DM — the "Message" item reflects
  // that instead of leading to a dead end after a page navigation.
  viewerIsGuest?: boolean;
  isOwn?: boolean;
  align?: "left" | "right";
  className?: string;
  children: ReactNode;
}

// Wraps a sender's avatar/name in the public chat. Real users get a small
// menu (Message / View Profile) instead of jumping straight to the profile —
// guests have no public profile, so they get a toast instead of a dead click.
export default function ChatUserActions({
  userId,
  isGuest,
  viewerIsGuest,
  isOwn,
  align = "left",
  className,
  children,
}: ChatUserActionsProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    if (!open) return;

    function handleOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleTriggerClick() {
    if (isGuest || !userId) {
      showToast("Guests don't have a public profile yet — sign up to connect with them.", "info");
      return;
    }
    setOpen((prev) => !prev);
  }

  function goToMessage() {
    setOpen(false);

    // Guests can't start DMs. Rather than navigate to /chat?dm=... only to
    // land on a locked screen there, tell them right here — same
    // lightweight pattern as the "no public profile" toast above.
    if (viewerIsGuest) {
      showToast("Guests can't send personal messages. Sign up free to chat 1:1.", "info");
      return;
    }

    router.push(`/chat?dm=${userId}`);
  }

  function goToProfile() {
    setOpen(false);
    router.push(`/users/${userId}`);
  }

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        type="button"
        onClick={handleTriggerClick}
        aria-haspopup={!isGuest ? "menu" : undefined}
        aria-expanded={open}
        className={`border-0 bg-transparent p-0 text-left transition-opacity hover:opacity-70 ${className ?? ""}`}
      >
        {children}
      </button>

      {open && !isGuest && (
        <div
          role="menu"
          className={`absolute z-20 mt-1.5 w-40 overflow-hidden rounded-xl border shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
          style={{
            backgroundColor: "rgb(var(--surface))",
            borderColor: "rgb(var(--border))",
          }}
        >
          {!isOwn && (
            <button
              role="menuitem"
              type="button"
              onClick={goToMessage}
              className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-xs font-medium transition-colors hover:bg-primary/10"
              style={{ color: viewerIsGuest ? "rgb(var(--accent))" : "rgb(var(--text))" }}
            >
              {viewerIsGuest ? (
                <Lock size={13} style={{ color: "rgb(var(--accent))" }} />
              ) : (
                <MessageCircle size={13} style={{ color: "rgb(var(--primary))" }} />
              )}
              {viewerIsGuest ? "Sign up to message" : "Message"}
            </button>
          )}
          <button
            role="menuitem"
            type="button"
            onClick={goToProfile}
            className="flex w-full items-center gap-2 border-t px-3.5 py-2.5 text-left text-xs font-medium transition-colors hover:bg-primary/10"
            style={{ color: "rgb(var(--text))", borderColor: "rgb(var(--border))" }}
          >
            <UserRound size={13} style={{ color: "rgb(var(--primary))" }} />
            View Profile
          </button>
        </div>
      )}
    </div>
  );
}
