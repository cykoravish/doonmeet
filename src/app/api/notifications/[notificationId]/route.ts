// PATCH — mark a single notification as read
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { generalLimiter } from "@/middleware/rateLimit";

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

      const notification = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          recipient: req.user._id, // ensure user owns this notification
        },
        { $set: { isRead: true } },
        { new: true, select: "_id isRead" }
      ).lean();

      if (!notification) {
        return NextResponse.json(
          { success: false, message: "Notification not found." },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, notification }, { status: 200 });
    } catch (error) {
      console.error("[PATCH /notifications/[id]] Error:", error);
      return NextResponse.json(
        { success: false, message: "Something went wrong." },
        { status: 500 }
      );
    }
  }
);
