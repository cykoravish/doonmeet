// GET — list all active communities (guests + users)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Community } from "@/models/Community";
import { withGuestAllowed, AuthenticatedRequest } from "@/middleware/auth";
import { validateQuery } from "@/middleware/validate";
import { generalLimiter } from "@/middleware/rateLimit";
import { z } from "zod";

const getCommunitiesSchema = z.object({
  category: z
    .enum(["tech", "nature", "food", "photography", "sports", "arts", "general"])
    .optional(),
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(parseInt(val, 10), 50) : 20)),
});

export const GET = withGuestAllowed(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user?._id ?? "guest"));
  if (limited) return limited;

  const queryResult = validateQuery(req, getCommunitiesSchema);
  if (queryResult instanceof NextResponse) return queryResult;
  const { category, cursor, limit } = queryResult.data;

  try {
    await connectDB();

    const query: Record<string, unknown> = { isActive: true };

    if (category) query.category = category;

    if (cursor) {
      if (!/^[a-f\d]{24}$/i.test(cursor)) {
        return NextResponse.json({ success: false, message: "Invalid cursor" }, { status: 400 });
      }
      query._id = { $lt: cursor };
    }

    const communities = await Community.find(query)
      .sort({ memberCount: -1, _id: -1 }) // most popular first
      .limit(limit)
      .populate("createdBy", "name avatar")
      .select("-bannerPublicId -__v")
      .lean();

    const nextCursor =
      communities.length === limit ? String(communities[communities.length - 1]._id) : null;

    return NextResponse.json(
      {
        success: true,
        communities,
        nextCursor,
        hasMore: !!nextCursor,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /communities] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});
