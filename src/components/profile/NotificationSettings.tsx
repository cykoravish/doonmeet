"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import Alert from "@/components/ui/Alert";
import SwitchRow from "@/components/ui/Switch";
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
    <div className="flex flex-col gap-2.5">
      {error && <Alert type="error" message={error} />}

      {!supported && (
        <Alert
          type="info"
          message="Notifications aren't supported in this browser. On iPhone, add DoonMeet to your Home Screen from Safari first."
        />
      )}

      {checking ? (
        <div className="flex h-[72px] items-center justify-center rounded-[16px] border border-border">
          <Loader2 size={18} className="animate-spin text-muted" aria-label="Checking notification status" />
        </div>
      ) : (
        <SwitchRow
          label="Phone notifications"
          description="Get notified about new messages and replies even when DoonMeet is closed."
          checked={enabled}
          onChange={handleToggle}
          disabled={!supported}
          saving={saving}
          icon={enabled ? <Bell size={19} /> : <BellOff size={19} />}
        />
      )}
    </div>
  );
}
