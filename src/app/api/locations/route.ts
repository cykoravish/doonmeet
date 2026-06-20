// GET  — get all visible user locations for map display
// POST — check in (create or update own location)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Location } from "@/models/Location";
import {
  withAuth,
  withGuestAllowed,
  requireVerified,
  AuthenticatedRequest,
} from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import { generalLimiter } from "@/middleware/rateLimit";
import { checkInSchema } from "@/validations/location";

// GET /api/locations
// Everyone can see the map — guests and users
export const GET = withGuestAllowed(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user?._id ?? "guest"));
  if (limited) return limited;

  try {
    await connectDB();

    const locations = await Location.find({ isVisible: true })
      .populate("user", "name avatar lastSeenAt")
      .select("coords label checkedInAt user")
      .lean();

    return NextResponse.json({ success: true, locations }, { status: 200 });
  } catch (error) {
    console.error("[GET /locations] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});

// POST /api/locations
// Upsert — creates or updates own location (logged in users only)
export const POST = requireVerified(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user._id));
  if (limited) return limited;

  const result = await validateBody(req, checkInSchema);
  if (result instanceof NextResponse) return result;
  const { coords, label, isVisible } = result.data as {
    coords: { lat: number; lng: number };
    label?: string | null;
    isVisible?: boolean;
  };

  try {
    await connectDB();

    // Upsert — one record per user, always overwrite
    const location = await Location.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          coords,
          label: label ?? null,
          isVisible: isVisible ?? true,
          checkedInAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    ).populate("user", "name avatar");

    return NextResponse.json(
      {
        success: true,
        message: "Location updated successfully",
        location,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /locations] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});
