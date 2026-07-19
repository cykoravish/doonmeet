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