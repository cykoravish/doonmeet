import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Session } from "@/models/Session";
import { generateAccessToken, generateRefreshToken } from "@/lib/tokens";

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

export async function rotateSession(
  refreshToken: string,
  meta: { userAgent: string | null; ip: string | null }
) {
  const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as { userId: string };
  await connectDB();

  const session = await Session.findOne({ token: refreshToken });
  if (!session) return null;

  const user = await User.findById(payload.userId).select("_id role isActive");
  if (!user || !user.isActive) {
    await Session.deleteOne({ _id: session._id });
    return null;
  }

  const accessToken = generateAccessToken(String(user._id), user.role);
  const newRefreshToken = generateRefreshToken(String(user._id));

  await Session.deleteOne({ _id: session._id });
  await Session.create({
    userId: user._id,
    token: newRefreshToken,
    userAgent: meta.userAgent,
    ip: meta.ip,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return { accessToken, refreshToken: newRefreshToken };
}