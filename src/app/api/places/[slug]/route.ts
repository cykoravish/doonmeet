import { NextResponse } from "next/server";
import { withGuestAllowed, AuthenticatedRequest } from "@/middleware/auth";
import { generalLimiter } from "@/middleware/rateLimit";
import { getPlaceWithRating } from "@/lib/places";

export const GET = withGuestAllowed(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(req, String(req.user?._id ?? "guest"));
    if (limited) return limited;

    const { slug } = await params;

    try {
      const place = await getPlaceWithRating(slug);
      if (!place) {
        return NextResponse.json({ success: false, message: "Place not found." }, { status: 404 });
      }
      return NextResponse.json({ success: true, place }, { status: 200 });
    } catch (error) {
      console.error("[GET /places/[slug]] Error:", error);
      return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
    }
  }
);