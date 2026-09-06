// DoonMeet service worker — push notifications, plus the bare minimum to
// satisfy Chrome's PWA installability check (see the fetch handler below).
// Still no offline caching by design, so it can't interfere with normal
// page loads or accidentally serve stale content.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Chrome only fires `beforeinstallprompt` (the event our "Install App"
// button depends on) if the service worker has a non-empty fetch handler —
// an empty/noop one is explicitly detected and ignored. This simply passes
// every request straight through to the network, unmodified — it exists
// purely to satisfy that check, not to add caching or offline support.
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "DoonMeet", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "DoonMeet";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || undefined, // same tag = replaces previous notification instead of stacking
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Reuse an already-open DoonMeet tab if there is one.
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
