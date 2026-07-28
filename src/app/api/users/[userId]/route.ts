// GET — get public profile of any user
// Respects privacy settings — only returns fields user has made public
// ============================================================
import { NextResponse } from "next/server";
import { getPublicUser } from "@/lib/getPublicUser";
import { withGuestAllowed, AuthenticatedRequest } from "@/middleware/auth";
import { generalLimiter } from "@/middleware/rateLimit";

export const GET = withGuestAllowed(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(
      req,
      String(req.user?._id ?? req.headers.get("x-forwarded-for") ?? "guest")
    );
    if (limited) return limited;

    const { userId } = await params;

    if (!/^[a-f\d]{24}$/i.test(userId)) {
      return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 });
    }

    const user = await getPublicUser(userId);

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user }, { status: 200 });
  }
);