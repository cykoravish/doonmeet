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

// Populated by the tiny inline script in the root layout's <head>, which
// captures `beforeinstallprompt` the instant it fires — including before
// this hook has mounted and attached its own listener below. The event
// fires once per page load and isn't replayed, so without that early
// capture, a fast fire would be missed entirely.
declare global {
  interface Window {
    __deferredInstallPrompt?: BeforeInstallPromptEvent | null;
  }
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

    // The event may have already fired and been stashed by the <head>
    // script before this effect ran — pick it up immediately if so.
    if (window.__deferredInstallPrompt) {
      setDeferredPrompt(window.__deferredInstallPrompt);
    }

    // Fired by the <head> script the moment it captures the event — covers
    // the case where it arrives between this effect running and the event
    // actually firing.
    function handleInstallReady() {
      if (window.__deferredInstallPrompt) {
        setDeferredPrompt(window.__deferredInstallPrompt);
      }
    }

    // Fallback direct listener, for the (unlikely but possible) case this
    // hook mounts before the <head> script has run at all.
    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__deferredInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    }

    function handleAppInstalled() {
      window.__deferredInstallPrompt = null;
      setDeferredPrompt(null);
      setIsStandalone(true);
    }

    window.addEventListener("pwa-install-ready", handleInstallReady);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("pwa-install-ready", handleInstallReady);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    // Each deferred prompt can only be used once, win or lose.
    window.__deferredInstallPrompt = null;
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return { canInstall: !!deferredPrompt, isIOS, isStandalone, promptInstall };
}
