import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { EventRSVP } from "@/models/EventRSVP";
import { requireVerified, AuthenticatedRequest } from "@/middleware/auth";
import { generalLimiter } from "@/middleware/rateLimit";

// POST — RSVP to an event
export const POST = requireVerified(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(req, String(req.user._id));
    if (limited) return limited;

    const { slug } = await params;

    try {
      await connectDB();

      const event = await Event.findOne({ slug, status: "published" }).select("_id capacity");
      if (!event) {
        return NextResponse.json({ success: false, message: "Event not found." }, { status: 404 });
      }

      const existing = await EventRSVP.findOne({ event: event._id, user: req.user._id });
      if (existing) {
        return NextResponse.json({ success: true, message: "Already RSVP'd." }, { status: 200 });
      }

      if (event.capacity) {
        const count = await EventRSVP.countDocuments({ event: event._id });
        if (count >= event.capacity) {
          return NextResponse.json(
            { success: false, message: "This event is full." },
            { status: 400 }
          );
        }
      }

      await EventRSVP.create({ event: event._id, user: req.user._id });

      return NextResponse.json({ success: true, message: "You're going!" }, { status: 200 });
    } catch (error) {
      console.error("[POST /events/[slug]/rsvp] Error:", error);
      return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
    }
  }
);

// DELETE — cancel RSVP
export const DELETE = requireVerified(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(req, String(req.user._id));
    if (limited) return limited;

    const { slug } = await params;

    try {
      await connectDB();

      const event = await Event.findOne({ slug }).select("_id");
      if (!event) {
        return NextResponse.json({ success: false, message: "Event not found." }, { status: 404 });
      }

      await EventRSVP.findOneAndDelete({ event: event._id, user: req.user._id });

      return NextResponse.json({ success: true, message: "RSVP cancelled." }, { status: 200 });
    } catch (error) {
      console.error("[DELETE /events/[slug]/rsvp] Error:", error);
      return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
    }
  }
);