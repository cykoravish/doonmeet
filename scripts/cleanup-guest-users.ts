// One-time cleanup: the "Continue as guest" feature has been removed from
// the product. This deletes leftover data that was created by guest
// accounts before the feature was removed:
//
//   1. User documents with role: "guest" (or the legacy isGuest: true flag,
//      in case any pre-migration documents still carry it)
//   2. RoomMessage documents sent by those guest users (public chat only —
//      guests were never able to create posts, comments, events,
//      communities, reviews, or direct messages, so no other collections
//      need cleanup)
//   3. Session documents (refresh-token sessions) belonging to those users
//   4. Notification / PushSubscription documents belonging to those users,
//      just in case any exist
//
// This talks to the raw MongoDB collections (not the Mongoose models)
// wherever a guest-only field is involved, since those fields have already
// been removed from the current schemas and Mongoose would otherwise
// ignore them when building a query.
//
// Usage: tsx scripts/cleanup-guest-users.ts
//   Add --dry-run to preview counts without deleting anything.
// ============================================================
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;
const DRY_RUN = process.argv.includes("--dry-run");

async function run() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not set.");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log(`Connected to DB.${DRY_RUN ? " (dry run — nothing will be deleted)" : ""}`);

  const db = mongoose.connection.db;
  if (!db) throw new Error("No active DB connection");

  const users = db.collection("users");
  const roomMessages = db.collection("roommessages");
  const sessions = db.collection("sessions");
  const notifications = db.collection("notifications");
  const pushSubscriptions = db.collection("pushsubscriptions");

  const guestFilter = { $or: [{ role: "guest" }, { isGuest: true }] };

  const guestUsers = await users.find(guestFilter, { projection: { _id: 1 } }).toArray();
  const guestUserIds = guestUsers.map((u) => u._id);

  console.log(`Found ${guestUserIds.length} guest user(s).`);

  if (guestUserIds.length === 0) {
    console.log("Nothing to clean up.");
    await mongoose.disconnect();
    return;
  }

  // Public chat messages sent by guests (either by sender id, or by the
  // legacy isGuest flag on the message itself, in case a message outlived
  // its sender for any reason).
  const messageFilter = {
    $or: [{ sender: { $in: guestUserIds } }, { isGuest: true }],
  };
  const messagesToDelete = await roomMessages.countDocuments(messageFilter);
  const sessionsToDelete = await sessions.countDocuments({ userId: { $in: guestUserIds } });
  const notificationsToDelete = await notifications.countDocuments({
    recipient: { $in: guestUserIds },
  });
  const pushSubsToDelete = await pushSubscriptions.countDocuments({
    user: { $in: guestUserIds },
  });

  console.log("Will delete:");
  console.log(`  - ${guestUserIds.length} user(s)`);
  console.log(`  - ${messagesToDelete} room message(s)`);
  console.log(`  - ${sessionsToDelete} session(s)`);
  console.log(`  - ${notificationsToDelete} notification(s)`);
  console.log(`  - ${pushSubsToDelete} push subscription(s)`);

  if (DRY_RUN) {
    console.log("\nDry run — no changes made.");
    await mongoose.disconnect();
    return;
  }

  const messagesResult = await roomMessages.deleteMany(messageFilter);
  console.log(`Deleted ${messagesResult.deletedCount} room message(s).`);

  const sessionsResult = await sessions.deleteMany({ userId: { $in: guestUserIds } });
  console.log(`Deleted ${sessionsResult.deletedCount} session(s).`);

  const notificationsResult = await notifications.deleteMany({
    recipient: { $in: guestUserIds },
  });
  console.log(`Deleted ${notificationsResult.deletedCount} notification(s).`);

  const pushSubsResult = await pushSubscriptions.deleteMany({ user: { $in: guestUserIds } });
  console.log(`Deleted ${pushSubsResult.deletedCount} push subscription(s).`);

  const usersResult = await users.deleteMany(guestFilter);
  console.log(`Deleted ${usersResult.deletedCount} user(s).`);

  console.log("\nDone.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
