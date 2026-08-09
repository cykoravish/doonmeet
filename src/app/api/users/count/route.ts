// GET /api/users/count — total real (non-guest, active) member count.
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

    const total = await User.countDocuments({ isGuest: false, isActive: true });

    return NextResponse.json({ success: true, total }, { status: 200 });
  } catch (error) {
    console.error("[GET /users/count] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});
