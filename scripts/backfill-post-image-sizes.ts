// One-time backfill: posts created before photo sizes were stored have
// imageWidth/imageHeight missing, so the feed shows their photo letterboxed
// in a 4:3 box (never cropped, but not in its real shape). This asks
// Cloudinary for each photo's real size and saves it.
//
// Safe to run more than once — it only touches posts that have a photo and
// no stored size yet. Read-only on Cloudinary (Admin API "resource" lookup).
//
// Usage (on the server, from the repo folder so .env is picked up):
//   npx tsx scripts/backfill-post-image-sizes.ts --dry-run   # preview
//   npx tsx scripts/backfill-post-image-sizes.ts             # apply
// ============================================================
import "dotenv/config";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

const MONGODB_URI = process.env.MONGODB_URI as string;
const DRY_RUN = process.argv.includes("--dry-run");

async function run() {
  if (!MONGODB_URI) throw new Error("MONGODB_URI is not set.");
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary keys are not set.");
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  await mongoose.connect(MONGODB_URI);
  console.log(`Connected.${DRY_RUN ? " (dry run — nothing will be changed)" : ""}`);
  const posts = mongoose.connection.db!.collection("posts");

  const todo = await posts
    .find(
      { image: { $ne: null }, imagePublicId: { $ne: null }, $or: [{ imageWidth: null }, { imageWidth: { $exists: false } }] },
      { projection: { imagePublicId: 1 } }
    )
    .toArray();
  console.log(`${todo.length} post photo(s) without a stored size.`);

  let updated = 0;
  let failed = 0;
  for (const post of todo) {
    try {
      const res = await cloudinary.api.resource(post.imagePublicId as string);
      const width = Number(res.width);
      const height = Number(res.height);
      if (!width || !height) throw new Error("no size in response");
      if (!DRY_RUN) {
        await posts.updateOne({ _id: post._id }, { $set: { imageWidth: width, imageHeight: height } });
      }
      updated++;
      console.log(`  ${post._id}: ${width}×${height}`);
    } catch (err) {
      failed++;
      console.warn(`  ${post._id}: skipped (${err instanceof Error ? err.message : String(err)})`);
    }
    // Stay well inside Cloudinary's Admin API rate limit.
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`${DRY_RUN ? "Would update" : "Updated"} ${updated}, skipped ${failed}.`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
