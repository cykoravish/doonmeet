// PATCH — mark ALL notifications as read
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { generalLimiter } from "@/middleware/rateLimit";
import { getIO } from "@/lib/socket";

export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user._id));
  if (limited) return limited;

  try {
    await connectDB();

    const { modifiedCount } = await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    // Keep the navbar bell (and any other open tab/device) in sync — it
    // doesn't share state with this page, so without this it would keep
    // showing a stale unread count until the next full reload.
    if (modifiedCount > 0) {
      try {
        getIO()
          .to(`user:${String(req.user._id)}`)
          .emit("notification:read_bulk", { count: modifiedCount });
      } catch {
        // Socket server not reachable from this process — ignore, the DB
        // is still correctly updated.
      }
    }

    return NextResponse.json(
      { success: true, message: "All notifications marked as read" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PATCH /notifications/read] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});
