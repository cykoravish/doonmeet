import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Session } from "@/models/Session";
import { generateAccessToken, generateRefreshToken } from "@/lib/tokens";

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// One page load can send several requests at once (the page, prefetched
// links, the chat socket asking for a refresh), all carrying the same refresh
// token. The first one rotates it. For this long afterwards the old token
// still works and hands back the SAME new token, so the others don't fail and
// render the page logged out.
const ROTATION_GRACE_MS = 60 * 1000;

interface SessionDoc {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  replacedBy?: string | null;
  expiresAt: Date;
}

/**
 * Swaps a refresh token for a new access + refresh token pair.
 * Returns null when the token is no longer valid (expired, logged out,
 * account banned) — the caller should treat the person as logged out.
 * Throws only for unexpected errors (e.g. the database is unreachable).
 */
export async function rotateSession(
  refreshToken: string,
  meta: { userAgent: string | null; ip: string | null }
): Promise<{ accessToken: string; refreshToken: string } | null> {
  let payload: { userId: string };
  try {
    payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as { userId: string };
  } catch {
    return null; // expired or tampered
  }

  await connectDB();

  const session = await Session.findOne({ token: refreshToken })
    .select("userId replacedBy expiresAt")
    .lean<SessionDoc>();
  // MongoDB's TTL cleanup only runs about once a minute — check expiry ourselves.
  if (!session || session.expiresAt.getTime() <= Date.now() || String(session.userId) !== payload.userId) {
    return null;
  }

  const user = await User.findById(payload.userId).select("_id role isActive isDeleted").lean<{
    _id: mongoose.Types.ObjectId;
    role: string;
    isActive: boolean;
    isDeleted?: boolean;
  }>();
  if (!user || !user.isActive || user.isDeleted) {
    await Session.deleteOne({ _id: session._id });
    return null;
  }

  const accessToken = generateAccessToken(String(user._id), user.role);

  // Rotated a moment ago by a parallel request — use the token it created,
  // as long as that session is still alive (not logged out / revoked since).
  const replacementIfAlive = async (token: string | null | undefined) =>
    token && (await Session.exists({ token, expiresAt: { $gt: new Date() } })) ? { accessToken, refreshToken: token } : null;
  if (session.replacedBy) return replacementIfAlive(session.replacedBy);

  const newRefreshToken = generateRefreshToken(String(user._id));
  const created = await Session.create({
    userId: user._id,
    token: newRefreshToken,
    userAgent: meta.userAgent,
    ip: meta.ip,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });

  // Retire the old token — atomically, so only one parallel request wins.
  const claimed = await Session.updateOne(
    { _id: session._id, replacedBy: null },
    { $set: { replacedBy: newRefreshToken, expiresAt: new Date(Date.now() + ROTATION_GRACE_MS) } }
  );
  if (claimed.modifiedCount === 1) return { accessToken, refreshToken: newRefreshToken };

  // Another request rotated it first: drop ours and hand out theirs.
  await Session.deleteOne({ _id: created._id });
  const winner = await Session.findById(session._id).select("replacedBy").lean<{ replacedBy?: string | null }>();
  return replacementIfAlive(winner?.replacedBy);
}
