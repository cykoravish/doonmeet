// Browser-side helpers for Web Push. All functions are safe to call even
// when push isn't supported (older Safari, some in-app browsers) — they
// just resolve to a "not supported" state instead of throwing.
"use client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch (err) {
    console.error("[push] Service worker registration failed:", err);
    return null;
  }
}

// Returns whether this browser currently has an active push subscription.
export async function getPushSubscriptionStatus(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}

// Requests permission (if needed) and subscribes this browser to push,
// saving the subscription on the server. Returns an error message on
// failure, or null on success.
export async function enablePushNotifications(): Promise<string | null> {
  if (!isPushSupported()) return "Push notifications aren't supported in this browser.";

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return "Push notifications aren't configured yet.";

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return "Notification permission was denied.";
    }

    const registration = await registerServiceWorker();
    if (!registration) return "Couldn't set up notifications in this browser.";

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
    }

    const json = subscription.toJSON();
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
    });

    if (!res.ok) return "Failed to save your subscription. Please try again.";
    return null;
  } catch (err) {
    console.error("[push] enablePushNotifications failed:", err);
    return "Something went wrong enabling notifications.";
  }
}

// Unsubscribes this browser and removes it from the server.
export async function disablePushNotifications(): Promise<string | null> {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return null;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    }).catch(() => {});

    return null;
  } catch (err) {
    console.error("[push] disablePushNotifications failed:", err);
    return "Something went wrong disabling notifications.";
  }
}
