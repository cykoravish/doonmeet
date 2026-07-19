import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { EventRSVP } from "@/models/EventRSVP";
import { withGuestAllowed, AuthenticatedRequest } from "@/middleware/auth";
import { generalLimiter } from "@/middleware/rateLimit";

export const GET = withGuestAllowed(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(req, String(req.user?._id ?? "guest"));
    if (limited) return limited;

    const { slug } = await params;

    try {
      await connectDB();

      const event = await Event.findOne({ slug }).select("_id capacity");
      if (!event) {
        return NextResponse.json({ success: false, message: "Event not found." }, { status: 404 });
      }

      const [attendees, totalCount] = await Promise.all([
        EventRSVP.find({ event: event._id })
          .sort({ createdAt: -1 })
          .limit(30)
          .populate("user", "name avatar")
          .lean(),
        EventRSVP.countDocuments({ event: event._id }),
      ]);

      const isGoing = req.user
        ? !!(await EventRSVP.exists({ event: event._id, user: req.user._id }))
        : false;

      return NextResponse.json(
        { success: true, attendees, totalCount, capacity: event.capacity, isGoing },
        { status: 200 }
      );
    } catch (error) {
      console.error("[GET /events/[slug]/attendees] Error:", error);
      return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
    }
  }
);