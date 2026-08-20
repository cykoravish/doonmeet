"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import Alert from "@/components/ui/Alert";
import {
  isPushSupported,
  getPushSubscriptionStatus,
  enablePushNotifications,
  disablePushNotifications,
} from "@/lib/push-client";

export default function NotificationSettings() {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isPushSupported()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronous capability check, mirrors notifications-provider.tsx
      setSupported(false);
      setChecking(false);
      return;
    }
    getPushSubscriptionStatus().then((status) => {
      setEnabled(status);
      setChecking(false);
    });
  }, []);

  async function handleToggle() {
    setSaving(true);
    setError("");

    if (enabled) {
      const err = await disablePushNotifications();
      if (err) setError(err);
      else setEnabled(false);
    } else {
      const err = await enablePushNotifications();
      if (err) setError(err);
      else setEnabled(true);
    }

    setSaving(false);
  }

  return (
    <div className="space-y-3">
      {error && <Alert type="error" message={error} />}

      {!supported && (
        <Alert
          type="info"
          message="Browser notifications aren't supported here. On iPhone, add DoonMeet to your Home Screen from Safari first."
        />
      )}

      <div
        className="flex items-center justify-between gap-3 rounded-xl border p-4"
        style={{
          borderColor: "rgb(var(--border))",
          backgroundColor: "rgb(var(--surface))",
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: enabled
                ? "rgb(var(--primary) / 0.1)"
                : "rgb(var(--muted) / 0.1)",
            }}
          >
            {enabled ? (
              <Bell size={14} style={{ color: "rgb(var(--primary))" }} />
            ) : (
              <BellOff size={14} style={{ color: "rgb(var(--muted))" }} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">Browser notifications</p>
            <p className="text-xs" style={{ color: "rgb(var(--muted))" }}>
              Get notified about new messages and replies even when DoonMeet isn&apos;t open.
            </p>
          </div>
        </div>

        {checking ? (
          <Loader2 size={16} className="shrink-0 animate-spin" style={{ color: "rgb(var(--muted))" }} />
        ) : (
          <button
            onClick={handleToggle}
            disabled={saving || !supported}
            className="relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50"
            style={{
              backgroundColor: enabled ? "rgb(var(--primary))" : "rgb(var(--border))",
            }}
          >
            <div
              className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
              style={{
                transform: enabled ? "translateX(20px)" : "translateX(2px)",
              }}
            />
          </button>
        )}
      </div>
    </div>
  );
}
