"use client";

import { useEffect, useRef, useState } from "react";
import { Ban, Flag, MoreHorizontal } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import SafetySheet from "./SafetySheet";
import { fetchBlockStatus, setBlocked } from "@/lib/safety-client";

interface ProfileSafetyMenuProps {
  user: { _id: string; name: string };
  /** "up" when the button sits at the bottom of the screen (mobile action bar). */
  placement?: "down" | "up";
}

// "⋯" button on someone else's profile → Report / Block (or Unblock).
export default function ProfileSafetyMenu({ user, placement = "down" }: ProfileSafetyMenuProps) {
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState<"report" | "block" | null>(null);
  const [blockedByMe, setBlockedByMe] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const firstName = user.name.split(" ")[0];

  useEffect(() => {
    fetchBlockStatus(user._id).then((s) => s && setBlockedByMe(s.blockedByMe));
  }, [user._id]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function unblock() {
    setOpen(false);
    if (await setBlocked(user._id, false)) setBlockedByMe(false);
  }

  return (
    <div ref={ref} className="relative">
      <IconButton
        label={`More options for ${user.name}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="h-12 w-12"
      >
        <MoreHorizontal size={20} />
      </IconButton>

      {open && (
        <div
          role="menu"
          className={`absolute right-0 z-20 ${placement === "up" ? "bottom-full mb-1" : "top-full mt-1"} w-52 overflow-hidden rounded-[16px] border border-border bg-surface py-1 shadow-lg`}
        >
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
            Report {firstName}
          </button>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              if (blockedByMe) {
                unblock();
              } else {
                setOpen(false);
                setSheet("block");
              }
            }}
            className={`flex min-h-11 w-full items-center gap-2.5 px-3.5 text-left text-[15px] font-medium ${
              blockedByMe ? "text-text hover:bg-surface-2" : "text-danger hover:bg-danger/10"
            }`}
          >
            <Ban size={18} aria-hidden="true" />
            {blockedByMe ? `Unblock ${firstName}` : `Block ${firstName}`}
          </button>
        </div>
      )}

      {sheet && (
        <SafetySheet
          mode={sheet}
          user={user}
          context="profile"
          alreadyBlocked={blockedByMe}
          onClose={() => setSheet(null)}
          onBlocked={() => setBlockedByMe(true)}
        />
      )}
    </div>
  );
}
