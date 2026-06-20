// app/api/auth/verify-email/route.ts
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Verification token is missing" },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: new Date() }, // not expired
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Verification link is invalid or has expired. Please sign up again.",
          code: "TOKEN_INVALID",
        },
        { status: 400 }
      );
    }

    // Mark verified and clear token fields
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    return NextResponse.json(
      { success: true, message: "Email verified! You can now log in." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[verify-email] Error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
