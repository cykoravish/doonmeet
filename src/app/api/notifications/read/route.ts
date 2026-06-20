// PATCH — mark ALL notifications as read
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { generalLimiter } from "@/middleware/rateLimit";

export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user._id));
  if (limited) return limited;

  try {
    await connectDB();

    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    return NextResponse.json(
      { success: true, message: "All notifications marked as read" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PATCH /notifications/read] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});
