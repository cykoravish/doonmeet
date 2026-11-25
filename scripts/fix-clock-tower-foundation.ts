// One-off fix: the Clock Tower text said it was "opened by" Sarojini Naidu,
// but sources say she laid its foundation stone. Rewrites just that phrase.
// Safe to run more than once.
//
// Usage (from the project folder, with its .env):
//   npx tsx scripts/fix-clock-tower-foundation.ts --dry-run
//   npx tsx scripts/fix-clock-tower-foundation.ts
import "dotenv/config";
import mongoose from "mongoose";
import { Place } from "../src/models/Place";

const WRONG = "Built in the early 1950s and opened by freedom fighter Sarojini Naidu, this six-sided tower";
const RIGHT = "Built in the early 1950s, with its foundation stone laid by freedom fighter Sarojini Naidu, this six-sided tower";

async function run() {
  const dryRun = process.argv.includes("--dry-run");
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set (run from the project folder with its .env)");
  await mongoose.connect(uri);

  const place = await Place.findOne({ slug: "clock-tower" }).select("about");
  if (!place) {
    console.log("Clock Tower not found, nothing to do.");
  } else if (!place.about.includes(WRONG)) {
    console.log("Already fixed (or the text has changed), nothing to do.");
  } else if (dryRun) {
    console.log("Would change:\n  " + WRONG + "\nto:\n  " + RIGHT);
  } else {
    await Place.updateOne({ _id: place._id }, { $set: { about: place.about.replace(WRONG, RIGHT) } });
    console.log("Fixed: foundation stone wording updated.");
  }
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error("Fix failed:", error);
  process.exit(1);
});
