"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Ban, Flag, MessageCircle, UserRound } from "lucide-react";
import SafetySheet from "@/components/safety/SafetySheet";

interface ChatUserActionsProps {
  userId: string;
  isOwn?: boolean;
  align?: "left" | "right";
  className?: string;
  /** Accessible name for the trigger button. */
  label?: string;
  // When provided, "Message" opens the DM in-place (no URL round trip).
  onMessage?: (userId: string) => void;
  /** Needed for Report / Block. */
  userName?: string;
  /** The public-chat message this menu was opened from (attached to a report). */
  messageId?: string;
  children: ReactNode;
}

// Wraps a sender's avatar/name in the public chat with a small menu
// (Message / View profile).
export default function ChatUserActions({
  userId,
  isOwn,
  align = "left",
  className,
  label,
  onMessage,
  userName,
  messageId,
  children,
}: ChatUserActionsProps) {
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState<"report" | "block" | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // The menu opens below the trigger, so for the last message it can end up
  // clipped by the chat scroll area. Scroll just enough to reveal it fully.
  useEffect(() => {
    if (!open) return;
    menuRef.current?.scrollIntoView({ block: "nearest" });
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleOutside(e: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function goToMessage() {
    setOpen(false);
    if (onMessage) {
      onMessage(userId);
      return;
    }
    router.push(`/chat?dm=${userId}`);
  }

  function goToProfile() {
    setOpen(false);
    router.push(`/users/${userId}`);
  }

  return (
    <div ref={wrapperRef} className="relative inline-flex min-w-0">
      <button
        type="button"
        onClick={() => userId && setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className={`border-0 bg-transparent p-0 text-left ${className ?? ""}`}
      >
        {children}
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          className={`absolute top-full z-20 mt-1.5 w-48 overflow-hidden rounded-[16px] border border-border bg-surface py-1 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {!isOwn && (
            <button
              role="menuitem"
              type="button"
              onClick={goToMessage}
              className="flex min-h-11 w-full items-center gap-2.5 px-3.5 text-left text-[15px] font-medium text-text hover:bg-surface-2"
            >
              <MessageCircle size={18} className="text-primary-fg" aria-hidden="true" />
              Message
            </button>
          )}
          <button
            role="menuitem"
            type="button"
            onClick={goToProfile}
            className="flex min-h-11 w-full items-center gap-2.5 px-3.5 text-left text-[15px] font-medium text-text hover:bg-surface-2"
          >
            <UserRound size={18} className="text-primary-fg" aria-hidden="true" />
            View profile
          </button>
          {!isOwn && userName && (
            <>
              <div className="my-1 h-px bg-border" role="separator" />
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpen(false);
                  setSheet("report");
                }}
                className="flex min-h-11 w-full items-center gap-2.5 px-3.5 text-left text-[15px] font-medium text-danger hover:bg-danger/10"
              >
                <Flag size={18} aria-hidden="true" />
                Report
              </button>
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpen(false);
                  setSheet("block");
                }}
                className="flex min-h-11 w-full items-center gap-2.5 px-3.5 text-left text-[15px] font-medium text-danger hover:bg-danger/10"
              >
                <Ban size={18} aria-hidden="true" />
                Block
              </button>
            </>
          )}
        </div>
      )}

      {sheet && userName && (
        <SafetySheet
          mode={sheet}
          user={{ _id: userId, name: userName }}
          context="room_message"
          refId={messageId}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}
