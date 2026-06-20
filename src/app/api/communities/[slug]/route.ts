// GET — get a single community by slug (guests + users)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Community } from "@/models/Community";
import { withGuestAllowed, AuthenticatedRequest } from "@/middleware/auth";
import { generalLimiter } from "@/middleware/rateLimit";

export const GET = withGuestAllowed(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(req, String(req.user?._id ?? "guest"));
    if (limited) return limited;

    const { slug } = await params;

    // Validate slug format — only lowercase letters, numbers, hyphens
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { success: false, message: "Invalid community slug" },
        { status: 400 }
      );
    }

    try {
      await connectDB();

      const community = await Community.findOne({ slug, isActive: true })
        .populate("createdBy", "name avatar")
        .select("-bannerPublicId -__v")
        .lean();

      if (!community) {
        return NextResponse.json(
          { success: false, message: "Community not found." },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, community }, { status: 200 });
    } catch (error) {
      console.error("[GET /communities/[slug]] Error:", error);
      return NextResponse.json(
        { success: false, message: "Something went wrong." },
        { status: 500 }
      );
    }
  }
);
