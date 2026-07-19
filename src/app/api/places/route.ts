import { NextResponse } from "next/server";
import { withGuestAllowed, AuthenticatedRequest } from "@/middleware/auth";
import { generalLimiter } from "@/middleware/rateLimit";
import { getAllPlacesWithRatings } from "@/lib/places";

export const GET = withGuestAllowed(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user?._id ?? "guest"));
  if (limited) return limited;

  try {
    const places = await getAllPlacesWithRatings();
    return NextResponse.json({ success: true, places }, { status: 200 });
  } catch (error) {
    console.error("[GET /places] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});