// POST — save a new push subscription for the logged-in user
// DELETE — remove a subscription (e.g. user disabled notifications)
// ============================================================
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PushSubscription } from "@/models/PushSubscription";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { generalLimiter } from "@/middleware/rateLimit";

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const limited: NextResponse | null = generalLimiter(req, String(req.user._id));
  if (limited) return limited;

  try {
    const body = await req.json();
    const { endpoint, keys } = body ?? {};

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { success: false, message: "Invalid subscription payload." },
        { status: 400 }
      );
    }

    await connectDB();

    // Upsert by endpoint — if this exact browser subscription already
    // exists (e.g. re-registering), just make sure it points at this user.
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        user: req.user._id,
        endpoint,
        keys: { p256dh: keys.p256dh, auth: keys.auth },
        userAgent: req.headers.get("user-agent") ?? null,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /push/subscribe] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save subscription." },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { endpoint } = body ?? {};

    if (!endpoint) {
      return NextResponse.json({ success: false, message: "endpoint is required." }, { status: 400 });
    }

    await connectDB();
    // Scoped to the current user so one user can't delete another's subscription.
    await PushSubscription.deleteOne({ endpoint, user: req.user._id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /push/subscribe] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to remove subscription." },
      { status: 500 }
    );
  }
});
