import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET);

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, ACCESS_TOKEN_SECRET);
    if (!payload.userId) return null;

    await connectDB();

    const user = await User.findById(payload.userId as string)
      .select(
        "-googleId -verificationOtp -verificationOtpExpires -verificationOtpAttempts -resetPasswordToken -resetPasswordExpires -__v"
      )
      .lean();

    if (!user || !user.isActive) return null;

    // Strip the hash itself, but expose whether one exists — the profile
    // page's Security tab needs this to know whether to show "change
    // password" or "set a password for the first time".
    const { passwordHash, ...safeUser } = user as typeof user & { passwordHash?: string | null };

    return JSON.parse(JSON.stringify({ ...safeUser, hasPassword: !!passwordHash }));
  } catch {
    return null;
  }
}
