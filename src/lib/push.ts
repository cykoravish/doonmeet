// Sends browser push notifications via the Web Push protocol.
// ============================================================
import webpush from "web-push";
import { connectDB } from "@/lib/db";
import { PushSubscription } from "@/models/PushSubscription";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails("mailto:ravish@doonmeet.in", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string; // where to navigate on click, e.g. "/messages"
  tag?: string; // notifications with the same tag replace each other instead of stacking
}

// Sends to every device/browser this user has subscribed on. Silently drops
// subscriptions the push service reports as gone (uninstalled, permission
// revoked, etc.) so the collection stays clean. Never throws — push is
// always a best-effort supplement to in-app/email notifications.
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return; // not configured yet

  try {
    await connectDB();
    const subs = await PushSubscription.find({ user: userId }).lean();
    if (subs.length === 0) return;

    const body = JSON.stringify(payload);

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            body
          );
        } catch (err) {
          const statusCode = (err as { statusCode?: number })?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            // Subscription is dead (browser data cleared, uninstalled, etc.) — clean up.
            await PushSubscription.deleteOne({ _id: sub._id }).catch(() => {});
          } else {
            console.error(`[push] Failed to send to subscription ${sub._id}:`, err);
          }
        }
      })
    );
  } catch (err) {
    console.error("[push] sendPushToUser failed:", err);
  }
}
