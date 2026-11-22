// Presence housekeeping for the custom server (server.ts).
// Keep this file free of any "next/…" import — see src/lib/rateLimitStore.ts.
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

/**
 * Marks everyone offline. Called once when the server starts, BEFORE it
 * accepts connections: this single process holds every chat socket, so
 * right after a (re)start nobody is connected. Without this, people whose
 * tab closed while the server was down (deploys, crashes) stayed "online"
 * forever, because their disconnect was never processed.
 * Clients reconnect within seconds and flip themselves back online.
 */
export async function resetPresenceOnBoot(): Promise<void> {
  try {
    await connectDB();
    const { modifiedCount } = await User.updateMany({ isOnline: true }, { $set: { isOnline: false } });
    if (modifiedCount > 0) console.log(`[presence] Reset ${modifiedCount} stale "online" user(s).`);
  } catch (error) {
    // Never block the site from starting over this.
    console.error("[presence] Failed to reset online status:", error);
  }
}
