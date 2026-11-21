// app/api/auth/refresh/route.ts
// Rotates refresh token on every use (prevents token replay attacks)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies, setAuthCookies } from "@/lib/tokens";
import { rotateSession } from "@/lib/rotateSession";
import { getClientIp } from "@/lib/clientIp";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { success: false, message: "No refresh token provided" },
      { status: 401 }
    );
  }

  try {
    const result = await rotateSession(refreshToken, {
      userAgent: req.headers.get("user-agent"),
      ip: getClientIp(req.headers),
    });

    if (!result) {
      const response = NextResponse.json(
        { success: false, message: "Session expired. Please log in again." },
        { status: 401 }
      );
      clearAuthCookies(response as unknown as Response);
      return response;
    }

    const response = NextResponse.json({ success: true }, { status: 200 });
    setAuthCookies(response as unknown as Response, result.accessToken, result.refreshToken);
    return response;
  } catch (error) {
    console.error("[refresh] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
