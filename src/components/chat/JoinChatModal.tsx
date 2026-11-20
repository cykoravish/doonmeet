"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { X, MessageCircle } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import { buttonClasses } from "@/components/ui/Button";

interface JoinChatModalProps {
  pendingMessage: string;
  onClose: () => void;
}

// Shown when a guest tries to send in the public chat.
export default function JoinChatModal({ pendingMessage, onClose }: JoinChatModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Parent passes an inline arrow — keep the latest in a ref so the effect
  // below runs once (focus isn't re-grabbed on every parent render).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className="composer-backdrop absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-chat-title"
        tabIndex={-1}
        className="composer-sheet relative w-full max-w-md rounded-t-[28px] bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] outline-none sm:rounded-[28px] sm:pb-5"
      >
        <div className="mb-3 flex items-start justify-between">
          <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-primary-soft text-primary-fg">
            <MessageCircle size={24} aria-hidden="true" />
          </span>
          <IconButton label="Close" onClick={onClose}>
            <X size={20} />
          </IconButton>
        </div>

        <h2 id="join-chat-title" className="text-xl font-extrabold">
          Join the conversation
        </h2>
        <p className="mt-1 text-[15px] text-muted">
          Free account banao aur Doon ke logon se baat karo — takes less than a minute.
        </p>

        {pendingMessage && (
          <p className="mt-3 rounded-[14px] bg-surface-2 px-3.5 py-2.5 text-[15px] break-words text-text italic">
            &ldquo;{pendingMessage}&rdquo;
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <Link href="/signup" className={buttonClasses("primary", "lg", "w-full")}>
            Create a free account
          </Link>
          <Link href="/login" className={buttonClasses("secondary", "lg", "w-full")}>
            I already have an account
          </Link>
        </div>
      </div>
    </div>
  );
}
