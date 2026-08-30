// GET /api/users/count — total active member count, excluding the viewer
// themselves — matches GET /api/users' "other people" list so the "N
// Dehradunis" badge and the members panel agree.
// Kept as its own tiny endpoint rather than folded into GET /api/users so
// the paginated members list doesn't pay for a countDocuments() on every
// page/search request — this is called once per chat session instead.
// ============================================================
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { withGuestAllowed, AuthenticatedRequest } from "@/middleware/auth";
import { generalLimiter } from "@/middleware/rateLimit";

export const GET = withGuestAllowed(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user?._id ?? "guest"));
  if (limited) return limited;

  try {
    await connectDB();

    // Same two-layer filter as GET /api/users (isDeleted flag + anonymized
    // fingerprint) — keeps this badge count consistent with what the
    // members list panel actually shows. See that route for full reasoning.
    const query: Record<string, unknown> = {
      isActive: true,
      isDeleted: { $ne: true },
      $or: [{ email: { $ne: null } }, { passwordHash: { $ne: null } }, { googleId: { $ne: null } }],
    };

    // Exclude the viewer themselves, same as GET /api/users — this count
    // powers the "N Dehradunis" badge that should match the members list
    // below it (which is an "other people" list, not "everyone").
    if (req.user) query._id = { $ne: req.user._id };

    const total = await User.countDocuments(query);

    return NextResponse.json({ success: true, total }, { status: 200 });
  } catch (error) {
    console.error("[GET /users/count] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});
