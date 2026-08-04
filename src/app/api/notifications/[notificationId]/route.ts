// PATCH — mark a single notification as read
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { generalLimiter } from "@/middleware/rateLimit";
import { getIO } from "@/lib/socket";

export const PATCH = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(req, String(req.user._id));
    if (limited) return limited;

    const { notificationId } = await params;

    if (!/^[a-f\d]{24}$/i.test(notificationId)) {
      return NextResponse.json(
        { success: false, message: "Invalid notification ID" },
        { status: 400 }
      );
    }

    try {
      await connectDB();

      // Check prior state first so we only sync the bell (decrement) when a
      // notification actually flips from unread -> read — marking an
      // already-read notification read again is a harmless no-op here, but
      // it must NOT decrement the badge a second time.
      const existing = await Notification.findOne({
        _id: notificationId,
        recipient: req.user._id, // ensure user owns this notification
      })
        .select("isRead")
        .lean();

      if (!existing) {
        return NextResponse.json(
          { success: false, message: "Notification not found." },
          { status: 404 }
        );
      }

      if (!existing.isRead) {
        await Notification.updateOne({ _id: notificationId }, { $set: { isRead: true } });
        try {
          getIO()
            .to(`user:${String(req.user._id)}`)
            .emit("notification:read_bulk", { count: 1 });
        } catch {
          // Socket server not reachable from this process — ignore, the DB
          // is still correctly updated.
        }
      }

      return NextResponse.json(
        { success: true, notification: { _id: notificationId, isRead: true } },
        { status: 200 }
      );
    } catch (error) {
      console.error("[PATCH /notifications/[id]] Error:", error);
      return NextResponse.json(
        { success: false, message: "Something went wrong." },
        { status: 500 }
      );
    }
  }
);
