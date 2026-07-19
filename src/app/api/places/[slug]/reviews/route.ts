import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Place } from "@/models/Place";
import { PlaceReview } from "@/models/PlaceReview";
import { withGuestAllowed, requireVerified, AuthenticatedRequest } from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import { generalLimiter } from "@/middleware/rateLimit";
import { createPlaceReviewSchema } from "@/validations/placeReview";

// GET — list reviews for a place (guests can view)
export const GET = withGuestAllowed(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(req, String(req.user?._id ?? "guest"));
    if (limited) return limited;

    const { slug } = await params;

    try {
      await connectDB();

      const place = await Place.findOne({ slug }).select("_id").lean();
      if (!place) {
        return NextResponse.json({ success: false, message: "Place not found." }, { status: 404 });
      }

      const reviews = await PlaceReview.find({ place: place._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("user", "name avatar")
        .lean();

      return NextResponse.json({ success: true, reviews }, { status: 200 });
    } catch (error) {
      console.error("[GET /places/[slug]/reviews] Error:", error);
      return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
    }
  }
);

// POST — create or update your own review (logged-in, verified users only — no guests)
export const POST = requireVerified(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(req, String(req.user._id));
    if (limited) return limited;

    const { slug } = await params;

    const result = await validateBody(req, createPlaceReviewSchema);
    if (result instanceof NextResponse) return result;
    const data = result.data as { rating: number; text: string };

    try {
      await connectDB();

      const place = await Place.findOne({ slug }).select("_id").lean();
      if (!place) {
        return NextResponse.json({ success: false, message: "Place not found." }, { status: 404 });
      }

      const review = await PlaceReview.findOneAndUpdate(
        { place: place._id, user: req.user._id },
        { $set: { rating: data.rating, text: data.text } },
        { upsert: true, new: true, runValidators: true }
      );

      await review.populate("user", "name avatar");

      return NextResponse.json({ success: true, message: "Review saved", review }, { status: 200 });
    } catch (error) {
      console.error("[POST /places/[slug]/reviews] Error:", error);
      return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
    }
  }
);