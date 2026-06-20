// GET — fetch notifications for logged in user
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { validateQuery } from "@/middleware/validate";
import { generalLimiter } from "@/middleware/rateLimit";
import { getNotificationsSchema } from "@/validations/notification";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user._id));
  if (limited) return limited;

  const queryResult = validateQuery(req, getNotificationsSchema);
  if (queryResult instanceof NextResponse) return queryResult;
  const { cursor, limit, unreadOnly } = queryResult.data;

  try {
    await connectDB();

    const query: Record<string, unknown> = {
      recipient: req.user._id,
    };

    if (unreadOnly) query.isRead = false;

    if (cursor) {
      if (!/^[a-f\d]{24}$/i.test(cursor)) {
        return NextResponse.json({ success: false, message: "Invalid cursor" }, { status: 400 });
      }
      query._id = { $lt: cursor };
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query).sort({ _id: -1 }).limit(limit).select("-__v").lean(),
      // Always return total unread count for badge in UI
      Notification.countDocuments({
        recipient: req.user._id,
        isRead: false,
      }),
    ]);

    const nextCursor =
      notifications.length === limit ? String(notifications[notifications.length - 1]._id) : null;

    return NextResponse.json(
      {
        success: true,
        notifications,
        unreadCount,
        nextCursor,
        hasMore: !!nextCursor,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /notifications] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});
