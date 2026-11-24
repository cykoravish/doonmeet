// "Online now / Active today / Active 3 days ago" — shared by the public
// profile page and the chat header. Pure (no server imports), so client
// components can use it too.
import { IST } from "@/lib/dates";

const istDay = new Intl.DateTimeFormat("en-CA", { timeZone: IST }); // "2026-11-22"
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * "Online now", "Active today", "Active yesterday", "Active 3 days ago" —
 * or null when they haven't been around for over a week (we don't show
 * anything older; it isn't useful and feels like tracking).
 */
export function activityLabel(
  isOnline: boolean,
  lastSeenAt: string | Date | null | undefined,
  now = new Date()
): { text: string; online: boolean } | null {
  if (isOnline) return { text: "Online now", online: true };
  if (!lastSeenAt) return null;

  const seen = new Date(lastSeenAt);
  if (Number.isNaN(seen.getTime())) return null;

  // Calendar days in IST, not 24-hour blocks: 11 pm yesterday is "yesterday".
  const days = Math.round(
    (Date.parse(istDay.format(now)) - Date.parse(istDay.format(seen))) / DAY_MS
  );
  if (days <= 0) return { text: "Active today", online: false };
  if (days === 1) return { text: "Active yesterday", online: false };
  if (days < 7) return { text: `Active ${days} days ago`, online: false };
  return null;
}
