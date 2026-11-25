// One-off fix: the Clock Tower's "About" text claimed it stands "close to
// 85 metres tall", which isn't supported by any source. Removes that one
// sentence and leaves the rest untouched. Safe to run more than once.
//
// Usage (from the project folder, with its .env):
//   npx tsx scripts/fix-clock-tower-height.ts --dry-run
//   npx tsx scripts/fix-clock-tower-height.ts
import "dotenv/config";
import mongoose from "mongoose";
import { Place } from "../src/models/Place";

const WRONG_SENTENCE = /\s*Standing close to 85 metres tall, it's easy to spot from almost anywhere nearby\./;

async function run() {
  const dryRun = process.argv.includes("--dry-run");
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set (run from the project folder with its .env)");
  await mongoose.connect(uri);

  const place = await Place.findOne({ slug: "clock-tower" }).select("about");
  if (!place) {
    console.log("Clock Tower not found — nothing to do.");
  } else if (!WRONG_SENTENCE.test(place.about)) {
    console.log("Already fixed — the 85 metres sentence isn't there.");
  } else {
    const fixed = place.about.replace(WRONG_SENTENCE, "");
    if (dryRun) {
      console.log("Would change the About text to:\n\n" + fixed);
    } else {
      await Place.updateOne({ _id: place._id }, { $set: { about: fixed } });
      console.log("Fixed: removed the 85 metres sentence.");
    }
  }
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error("Fix failed:", error);
  process.exit(1);
});
