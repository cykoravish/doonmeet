// One-time migration: drop the old broken unique index on
// Conversation.participants (a unique index directly on an array field is
// a *multikey* index — it enforces uniqueness per array ELEMENT across
// every document, not per pair of participants. In practice that meant
// each user could only ever be part of ONE conversation, platform-wide,
// and every second DM attempt failed with a duplicate-key error.
//
// The model now uses a `participantsKey` string field (unique) instead,
// which correctly enforces "one conversation per pair of users". Mongoose
// will auto-create that new index on next connect, but it will NOT drop
// the old bad index for you — that has to be done once, manually.
//
// Usage: tsx scripts/fix-conversation-index.ts
// ============================================================
import mongoose from "mongoose";
import { Conversation } from "../src/models/Conversation";

const MONGODB_URI = process.env.MONGODB_URI as string;

async function run() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not set.");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to DB.");

  const collection = Conversation.collection;
  const existingIndexes = await collection.indexes();
  const badIndex = existingIndexes.find(
    (idx) => idx.key && Object.keys(idx.key).length === 1 && "participants" in idx.key
  );

  if (badIndex?.name) {
    console.log(`Dropping broken index "${badIndex.name}"...`);
    await collection.dropIndex(badIndex.name);
    console.log("Dropped.");
  } else {
    console.log("Broken index not found (already fixed, or fresh DB) — nothing to do.");
  }

  // Recreate indexes per the current schema (adds the new unique
  // `participantsKey` index if it isn't there yet).
  await Conversation.syncIndexes();
  console.log("Indexes are now in sync with the schema.");

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
