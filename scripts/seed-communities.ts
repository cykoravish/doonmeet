// Run once to seed initial communities into DB
// Usage: tsx scripts/seed-communities.ts
// ============================================================
import mongoose from "mongoose";
import { Community } from "../src/models/Community";
import { User } from "../src/models/User";

const MONGODB_URI = process.env.MONGODB_URI as string;

const communities = [
  {
    name: "Doon Tech Hub",
    slug: "doon-tech-hub",
    description:
      "A community for developers, designers and tech enthusiasts in Dehradun. Share projects, discuss ideas and collaborate.",
    category: "tech",
    memberCount: 0,
  },
  {
    name: "Doon Nature Lovers",
    slug: "doon-nature-lovers",
    description:
      "Explore the forests, rivers, hills and peaceful escapes around Dehradun. Share trails, spots and nature photography.",
    category: "nature",
    memberCount: 0,
  },
  {
    name: "Doon Foodies",
    slug: "doon-foodies",
    description: "Discover the best restaurants, street food and hidden food gems across Dehradun.",
    category: "food",
    memberCount: 0,
  },
  {
    name: "Doon Photographers",
    slug: "doon-photographers",
    description:
      "Find the most photogenic places in the city. Share your shots, tips and organise photography walks.",
    category: "photography",
    memberCount: 0,
  },
  {
    name: "Doon Sports Club",
    slug: "doon-sports-club",
    description:
      "Connect with sports enthusiasts in Dehradun. Find players, organise matches and discover sports facilities.",
    category: "sports",
    memberCount: 0,
  },
  {
    name: "Doon Arts & Culture",
    slug: "doon-arts-culture",
    description:
      "Celebrate the art, music and culture of Dehradun. Events, exhibitions and creative collaborations.",
    category: "arts",
    memberCount: 0,
  },
  {
    name: "Doon General",
    slug: "doon-general",
    description:
      "The general community for everything Dehradun. Announcements, discussions and local news.",
    category: "general",
    memberCount: 0,
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

// Communities are attributed to your own account (the platform owner)
    const admin = await User.findOne({ email: "cykoravish@gmail.com" }).select("_id");
    if (!admin) {
      console.error(
        "Admin user not found. Make sure you've signed up on the site first with this email."
      );
      process.exit(1);
    }
    const adminId = admin._id;

    for (const community of communities) {
      const exists = await Community.findOne({ slug: community.slug });
      if (exists) {
        console.log(`Skipping existing: ${community.slug}`);
        continue;
      }

      await Community.create({ ...community, createdBy: adminId });
      console.log(`Created: ${community.name}`);
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();

// Run the seed script once after setting up your DB:
// MONGODB_URI=your_uri tsx scripts/seed-communities.ts
