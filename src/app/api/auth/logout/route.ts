// app/api/auth/logout/route.ts
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Session } from "@/models/Session";
import { clearAuthCookies } from "@/lib/tokens";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refresh_token")?.value;

  try {
    if (refreshToken) {
      await connectDB();
      // Remove session from DB — invalidates token immediately
      await Session.deleteOne({ token: refreshToken });
    }

    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );

    clearAuthCookies(response as unknown as Response);
    return response;
  } catch (error) {
    console.error("[logout] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
