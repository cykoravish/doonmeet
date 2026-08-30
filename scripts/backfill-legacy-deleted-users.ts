// One-time backfill: some accounts were anonymized by an older version of
// DELETE /api/users/me — before the `isDeleted` field existed on the User
// schema. Those accounts have all the anonymized markers (name "Deleted
// User", email/passwordHash/googleId all null) but `isDeleted` was never
// set to true, so they still show up anywhere the app filters by that flag
// (members list, member count badge, public profile, starting a new DM).
//
// This finds users matching that anonymized fingerprint — email,
// passwordHash AND googleId all null, and not already flagged — and sets
// isDeleted: true (+ deletedAt, backdated to their updatedAt since that's
// the closest record of when the anonymization actually happened).
//
// No real, active account can have email, passwordHash AND googleId all
// null at once: signup requires email+password, Google sign-in requires
// googleId. So this fingerprint only ever matches genuinely-anonymized
// accounts — this script cannot accidentally flag a real user as deleted.
//
// Usage: tsx scripts/backfill-legacy-deleted-users.ts
//   Add --dry-run to preview which accounts would be updated.
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
  console.log(`Connected to DB.${DRY_RUN ? " (dry run — nothing will be changed)" : ""}`);

  const db = mongoose.connection.db;
  if (!db) throw new Error("No active DB connection");

  const users = db.collection("users");

  const filter = {
    email: null,
    passwordHash: null,
    googleId: null,
    isDeleted: { $ne: true },
  };

  const matches = await users
    .find(filter, { projection: { _id: 1, name: 1, updatedAt: 1 } })
    .toArray();

  console.log(`Found ${matches.length} legacy anonymized account(s) missing isDeleted:true.`);
  matches.forEach((u) => console.log(`  - ${u._id}  "${u.name}"`));

  if (matches.length === 0) {
    console.log("Nothing to backfill.");
    await mongoose.disconnect();
    return;
  }

  if (DRY_RUN) {
    console.log("\nDry run — no changes made.");
    await mongoose.disconnect();
    return;
  }

  // deletedAt backdated to updatedAt (last time the doc was touched, i.e.
  // most likely the anonymization itself) rather than "now" — keeps
  // deletedAt meaningful instead of showing today's date for old deletions.
  let updated = 0;
  for (const u of matches) {
    await users.updateOne(
      { _id: u._id },
      { $set: { isDeleted: true, deletedAt: u.updatedAt ?? new Date() } }
    );
    updated++;
  }

  console.log(`\nBackfilled ${updated} account(s).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
