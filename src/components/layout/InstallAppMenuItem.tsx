"use client";

import { useState } from "react";
import { Download, X, Share, SquarePlus } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

interface InstallAppMenuItemProps {
  // Called after the native Android/Chrome install prompt is shown, so the
  // drawer can close itself. Not called for the iOS instructions path,
  // since that instructions panel is rendered by this component itself and
  // would disappear along with the drawer.
  onInstallPrompted?: () => void;
}

export default function InstallAppMenuItem({ onInstallPrompted }: InstallAppMenuItemProps) {
  const { canInstall, isIOS, isStandalone, promptInstall } = useInstallPrompt();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Already installed, or this browser has no install path at all (e.g.
  // desktop Firefox) — nothing useful to offer.
  if (isStandalone || (!canInstall && !isIOS)) return null;

  async function handleClick() {
    if (canInstall) {
      await promptInstall();
      onInstallPrompted?.();
    } else if (isIOS) {
      setShowIOSInstructions(true);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-text transition-colors hover:opacity-80"
      >
        <span className="text-muted">
          <Download size={15} />
        </span>
        <span className="flex-1">Install App</span>
      </button>

      {showIOSInstructions && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
          onClick={() => setShowIOSInstructions(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-t-3xl border border-border bg-surface p-6 sm:rounded-3xl"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <Download size={20} className="text-primary" />
              </div>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-background"
                aria-label="Close"
              >
                <X size={15} className="text-muted" />
              </button>
            </div>

            <h2 className="text-lg font-bold text-text">Install DoonMeet</h2>
            <p className="mt-1 text-sm text-muted">
              iPhone and iPad don&apos;t support one-tap installs — add DoonMeet to your Home Screen
              in a few taps instead:
            </p>

            <ol className="mt-4 space-y-3 text-sm text-text">
              <li className="flex items-start gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  1
                </span>
                <span className="pt-0.5">
                  Tap the <Share size={14} className="mx-1 inline align-text-bottom text-primary" />
                  Share button in your browser&apos;s toolbar
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  2
                </span>
                <span className="pt-0.5">
                  Scroll down and tap
                  <SquarePlus size={14} className="mx-1 inline align-text-bottom text-primary" />
                  &ldquo;Add to Home Screen&rdquo;
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  3
                </span>
                <span className="pt-0.5">
                  Tap &ldquo;Add&rdquo; — DoonMeet will appear on your Home Screen
                </span>
              </li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
