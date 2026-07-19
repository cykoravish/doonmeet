import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Community } from "@/models/Community";
import { Event } from "@/models/Event";
import { withGuestAllowed, AuthenticatedRequest } from "@/middleware/auth";
import { generalLimiter } from "@/middleware/rateLimit";

export const GET = withGuestAllowed(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(req, String(req.user?._id ?? "guest"));
    if (limited) return limited;

    const { slug } = await params;

    try {
      await connectDB();

      const community = await Community.findOne({ slug }).select("_id");
      if (!community) {
        return NextResponse.json({ success: false, message: "Community not found." }, { status: 404 });
      }

      const events = await Event.find({
        community: community._id,
        status: "published",
        date: { $gte: new Date() },
      })
        .sort({ date: 1 })
        .limit(10)
        .select("title slug banner date location")
        .lean();

      return NextResponse.json({ success: true, events }, { status: 200 });
    } catch (error) {
      console.error("[GET /communities/[slug]/events] Error:", error);
      return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
    }
  }
);