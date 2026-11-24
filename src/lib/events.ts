import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { EventRSVP } from "@/models/EventRSVP";

export async function getEvents(options: { tag?: string; search?: string; limit?: number } = {}) {
  await connectDB();
  const { tag, search, limit = 20 } = options;

  const query: Record<string, unknown> = { status: "published", date: { $gte: new Date() } };
  if (tag) query.tags = tag;
  if (search) query.$text = { $search: search };

  return Event.find(query)
    .sort({ date: 1 })
    .limit(limit)
    .populate("creator", "name avatar")
    .select("-bannerPublicId -__v")
    .lean();
}

// ---------------------------------------------------------------------------
// When is an event over? Its end time if the host set one; otherwise the end
// of its start day in Dehradun (IST), so an evening event stays "on" all day.
// ---------------------------------------------------------------------------
const istDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }); // "2026-11-23"

export function eventEndTime(date: Date | string, endsAt?: Date | string | null): Date {
  if (endsAt) return new Date(endsAt);
  return new Date(`${istDay.format(new Date(date))}T23:59:59.999+05:30`);
}

export function isEventOver(date: Date | string, endsAt?: Date | string | null, now = Date.now()): boolean {
  return eventEndTime(date, endsAt).getTime() < now;
}

/** Ended events stay readable, but leave Google's index after this long. */
export const ENDED_EVENT_NOINDEX_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

export function shouldNoindexEvent(date: Date | string, endsAt?: Date | string | null, now = Date.now()): boolean {
  return eventEndTime(date, endsAt).getTime() + ENDED_EVENT_NOINDEX_AFTER_MS < now;
}

export async function getEventBySlug(slug: string) {
  await connectDB();
  return Event.findOne({ slug, status: "published" })
    .populate("creator", "name avatar")
    .populate("community", "name slug")
    .select("-bannerPublicId -__v")
    .lean();
}

export async function getEventStats() {
  await connectDB();
  const [totalEvents, organisers, totalRSVPs] = await Promise.all([
    Event.countDocuments({ status: "published", date: { $gte: new Date() } }),
    Event.distinct("creator", { status: "published" }),
    EventRSVP.countDocuments(),
  ]);
  return { totalEvents, organiserCount: organisers.length, totalRSVPs };
}