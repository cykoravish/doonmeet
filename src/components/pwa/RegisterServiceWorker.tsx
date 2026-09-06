"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/push-client";

// Registers the service worker as soon as the app loads, independent of
// push notifications. Chrome/Edge require an active service worker before
// they'll fire `beforeinstallprompt`, so without this, the "Install App"
// button (see useInstallPrompt) never becomes available to users who
// haven't already opted into push notifications — this fixes that.
//
// Renders nothing; safe to mount once near the root of the app.
export default function RegisterServiceWorker() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
