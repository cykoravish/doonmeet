"use client";

import { useEffect, useState, useCallback } from "react";

// Not part of the standard DOM lib typings yet — Chrome/Edge-specific event
// fired instead of showing their own install UI immediately, so we can
// trigger it later (e.g. from a button tap) instead of an unpredictable
// browser-timed popup.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface InstallPromptState {
  // True once Chrome/Android has handed us a deferred prompt we can fire.
  canInstall: boolean;
  // iOS (Safari, and any other iOS browser under the same WebKit share
  // sheet) never fires beforeinstallprompt — "Add to Home Screen" only
  // exists as a manual step via the Share sheet, so we show instructions
  // instead of a one-tap install here.
  isIOS: boolean;
  // Already running as an installed app (launched from the home screen) —
  // nothing to install, callers should hide any install UI entirely.
  isStandalone: boolean;
  promptInstall: () => Promise<void>;
}

export function useInstallPrompt(): InstallPromptState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS's older, non-standard flag — display-mode media query support
      // for standalone PWAs on iOS has historically been inconsistent.
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsStandalone(standalone);

    const userAgent = window.navigator.userAgent;
    setIsIOS(/iphone|ipad|ipod/i.test(userAgent));

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setDeferredPrompt(null);
      setIsStandalone(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    // Each deferred prompt can only be used once, win or lose.
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return { canInstall: !!deferredPrompt, isIOS, isStandalone, promptInstall };
}
