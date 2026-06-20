// GET    — get a single event (public)
// PATCH  — update event (creator only)
// DELETE — cancel event (creator only)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { connectDB } from "@/lib/db";
import { Event, IEvent } from "@/models/Event";
import { withGuestAllowed, requireVerified, AuthenticatedRequest } from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import { generalLimiter, eventLimiter } from "@/middleware/rateLimit";
import { updateEventSchema } from "@/validations/event";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET /api/events/[eventId]
export const GET = withGuestAllowed(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(req, String(req.user?._id ?? "guest"));
    if (limited) return limited;

    const { eventId } = await params;

    if (!/^[a-f\d]{24}$/i.test(eventId)) {
      return NextResponse.json({ success: false, message: "Invalid event ID" }, { status: 400 });
    }

    try {
      await connectDB();

      const event = await Event.findOne({
        _id: eventId,
        status: "published",
      })
        .populate("creator", "name avatar")
        .select("-bannerPublicId -__v")
        .lean();

      if (!event) {
        return NextResponse.json({ success: false, message: "Event not found." }, { status: 404 });
      }

      return NextResponse.json({ success: true, event }, { status: 200 });
    } catch (error) {
      console.error("[GET /events/[id]] Error:", error);
      return NextResponse.json(
        { success: false, message: "Something went wrong." },
        { status: 500 }
      );
    }
  }
);

// PATCH /api/events/[eventId]
export const PATCH = requireVerified(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = eventLimiter(req, String(req.user._id));
    if (limited) return limited;

    const { eventId } = await params;

    if (!/^[a-f\d]{24}$/i.test(eventId)) {
      return NextResponse.json({ success: false, message: "Invalid event ID" }, { status: 400 });
    }

    const result = await validateBody(req, updateEventSchema);
    if (result instanceof NextResponse) return result;

    try {
      await connectDB();

      const event = await Event.findById(eventId).select("creator bannerPublicId");

      if (!event) {
        return NextResponse.json({ success: false, message: "Event not found." }, { status: 404 });
      }

      // Only creator can update
      if (String(event.creator) !== String(req.user._id)) {
        return NextResponse.json(
          { success: false, message: "You are not authorized to update this event." },
          { status: 403 }
        );
      }

      const updated = await Event.findByIdAndUpdate(
        eventId,
        { $set: result.data as Partial<IEvent> },
        { new: true, runValidators: true, select: "-bannerPublicId -__v" }
      ).populate("creator", "name avatar");

      return NextResponse.json(
        { success: true, message: "Event updated successfully", event: updated },
        { status: 200 }
      );
    } catch (error) {
      console.error("[PATCH /events/[id]] Error:", error);
      return NextResponse.json(
        { success: false, message: "Something went wrong." },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/events/[eventId]
// Soft delete — sets status to "cancelled", deletes banner from Cloudinary
export const DELETE = requireVerified(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const { eventId } = await params;

    if (!/^[a-f\d]{24}$/i.test(eventId)) {
      return NextResponse.json({ success: false, message: "Invalid event ID" }, { status: 400 });
    }

    try {
      await connectDB();

      const event = await Event.findById(eventId).select("creator bannerPublicId status");

      if (!event) {
        return NextResponse.json({ success: false, message: "Event not found." }, { status: 404 });
      }

      // Only creator can delete
      if (String(event.creator) !== String(req.user._id)) {
        return NextResponse.json(
          { success: false, message: "You are not authorized to delete this event." },
          { status: 403 }
        );
      }

      // Soft delete — mark as cancelled
      event.status = "cancelled";
      await event.save();

      // Delete banner from Cloudinary asynchronously
      if (event.bannerPublicId) {
        cloudinary.uploader
          .destroy(event.bannerPublicId)
          .catch((err) => console.error("[events] Failed to delete banner:", err));
      }

      return NextResponse.json(
        { success: true, message: "Event cancelled successfully." },
        { status: 200 }
      );
    } catch (error) {
      console.error("[DELETE /events/[id]] Error:", error);
      return NextResponse.json(
        { success: false, message: "Something went wrong." },
        { status: 500 }
      );
    }
  }
);
