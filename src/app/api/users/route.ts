// GET /api/users — paginated list of community members, online users
// first. Powers the "All members" panel in public chat.
// ============================================================
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { withGuestAllowed, AuthenticatedRequest } from "@/middleware/auth";
import { validateQuery } from "@/middleware/validate";
import { generalLimiter } from "@/middleware/rateLimit";
import { listUsersSchema } from "@/validations/user";

export const GET = withGuestAllowed(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user?._id ?? "guest"));
  if (limited) return limited;

  const queryResult = validateQuery(req, listUsersSchema);
  if (queryResult instanceof NextResponse) return queryResult;
  const { page, limit, search } = queryResult.data;

  try {
    await connectDB();

    // A user query, shared by every endpoint that lists/looks up "real"
    // members. Two layers of defense against deleted accounts:
    //
    // 1. isDeleted: { $ne: true } — the flag set by the current delete
    //    flow (DELETE /api/users/me). $ne (not "isDeleted: false") because
    //    plenty of accounts predate this field and don't have it stored at
    //    all — a strict equality match would wrongly exclude those real,
    //    non-deleted users too.
    //
    // 2. The "anonymized fingerprint" — email, passwordHash AND googleId
    //    all null at once. Some accounts were deleted/anonymized *before*
    //    the isDeleted field existed on the schema, so flag (1) alone
    //    misses them. But no real, active account can ever have all three
    //    of these null simultaneously — signup requires email+password,
    //    Google sign-in requires googleId — so this combination uniquely
    //    identifies an anonymized account regardless of whether isDeleted
    //    was ever set on it.
    const query: Record<string, unknown> = {
      isActive: true,
      isDeleted: { $ne: true },
      $or: [{ email: { $ne: null } }, { passwordHash: { $ne: null } }, { googleId: { $ne: null } }],
    };

    // Never show the viewer themselves in "meet other people" list
    if (req.user) query._id = { $ne: req.user._id };

    if (search) {
      // Escape regex special characters — search is free text from the client
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.name = { $regex: escaped, $options: "i" };
    }

    // Fetch one extra doc to know if there's a next page without a
    // separate (and, at scale, expensive) countDocuments() call.
    const skip = (page - 1) * limit;
    const docs = await User.find(query)
      .select("name avatar bio isOnline lastSeenAt")
      .sort({ isOnline: -1, name: 1 })
      .skip(skip)
      .limit(limit + 1)
      .lean();

    const hasMore = docs.length > limit;
    const users = docs.slice(0, limit);

    return NextResponse.json({ success: true, users, page, hasMore }, { status: 200 });
  } catch (error) {
    console.error("[GET /users] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});
