// PATCH — update privacy settings
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import { generalLimiter } from "@/middleware/rateLimit";
import { updatePrivacySchema } from "@/validations/user";

export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  const limited: NextResponse | null = generalLimiter(req, String(req.user._id));
  if (limited) return limited;

  const result = await validateBody(req, updatePrivacySchema);
  if (result instanceof NextResponse) return result;

  try {
    await connectDB();

    // Build $set object with privacy prefix
    const privacyUpdate = Object.fromEntries(
      Object.entries(result.data as Record<string, boolean>).map(([key, value]) => [
        `privacy.${key}`,
        value,
      ])
    );

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: privacyUpdate },
      { new: true, select: "privacy" }
    ).lean();

    return NextResponse.json(
      { success: true, message: "Privacy settings updated", privacy: updated?.privacy },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PATCH /users/privacy] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});
