import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET);

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    console.log("[SESSION] token present:", !!token);
    if (!token) return null;

    const { payload } = await jwtVerify(token, ACCESS_TOKEN_SECRET);
    if (!payload.userId) return null;

    await connectDB();

    const user = await User.findById(payload.userId as string)
      .select(
        "-passwordHash -googleId -verificationToken -verificationExpires -resetPasswordToken -resetPasswordExpires -__v"
      )
      .lean();

    if (!user || !user.isActive) return null;

    return JSON.parse(JSON.stringify(user));
  } catch {
    return null;
  }
}