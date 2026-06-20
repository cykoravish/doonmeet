// GET    — get own current location
// PATCH  — toggle visibility (show/hide on map)
// DELETE — remove own location from map entirely
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Location } from "@/models/Location";
import { requireVerified, AuthenticatedRequest } from "@/middleware/auth";
import { generalLimiter } from "@/middleware/rateLimit";

// GET /api/locations/me
export const GET = requireVerified(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user._id));
  if (limited) return limited;

  try {
    await connectDB();

    const location = await Location.findOne({ user: req.user._id })
      .select("coords label isVisible checkedInAt")
      .lean();

    return NextResponse.json({ success: true, location: location ?? null }, { status: 200 });
  } catch (error) {
    console.error("[GET /locations/me] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});

// PATCH /api/locations/me
// Toggle visibility without changing coords
export const PATCH = requireVerified(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user._id));
  if (limited) return limited;

  let isVisible: boolean;

  try {
    const body = await req.json();
    if (typeof body?.isVisible !== "boolean") {
      return NextResponse.json(
        { success: false, message: "isVisible must be a boolean" },
        { status: 400 }
      );
    }
    isVisible = body.isVisible;
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
  }

  try {
    await connectDB();

    const location = await Location.findOneAndUpdate(
      { user: req.user._id },
      { $set: { isVisible } },
      { new: true, select: "isVisible coords label checkedInAt" }
    ).lean();

    if (!location) {
      return NextResponse.json(
        { success: false, message: "You haven't checked in yet." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: isVisible ? "You are now visible on the map" : "You are now hidden from the map",
        location,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PATCH /locations/me] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});

// DELETE /api/locations/me
// Fully removes user from the map
export const DELETE = requireVerified(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user._id));
  if (limited) return limited;

  try {
    await connectDB();

    await Location.deleteOne({ user: req.user._id });

    return NextResponse.json(
      { success: true, message: "Your location has been removed from the map." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DELETE /locations/me] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});
