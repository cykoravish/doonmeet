// Run once to seed initial places into DB
// Usage: tsx scripts/seed-places.ts
// ============================================================
import mongoose from "mongoose";
import { Place } from "../src/models/Place";

const MONGODB_URI = process.env.MONGODB_URI as string;

const places = [
  {
    title: "Clock Tower",
    slug: "clock-tower",
    image: "/images/hero-clock-tower.webp",
    category: "Landmark",
    shortDescription: "The iconic landmark in the heart of Dehradun.",
    about: `Right in the middle of the city, the Clock Tower — known to locals as Ghanta Ghar — is where Dehradun's heart beats. Built in the early 1950s and opened by freedom fighter Sarojini Naidu, this six-sided tower was raised to honor India's independence, and the names of local freedom fighters are engraved on a golden plate near its base. Standing close to 85 metres tall, it's easy to spot from almost anywhere nearby.

The clocks on its six faces don't run anymore, but that hasn't slowed the place down one bit. Paltan Bazaar wraps around it on every side, so you'll find street food stalls, clothing shops, and the constant hum of auto-rickshaws all rolled into one lively little corner of the city.`,
    highlights: [
      "Hexagonal six-faced design",
      "Golden plate honoring local freedom fighters",
      "Surrounded by Paltan Bazaar's shops and street food",
      "Beautifully lit up during festivals",
    ],
    bestTimeToVisit: "Any time of day — mornings for a quiet walk, evenings for the market buzz",
    howToReach: "City centre, about 2 km from Dehradun Railway Station",
  },
  {
    title: "Rajpur Road",
    slug: "rajpur-road",
    image: "/images/places/rajpur-road.webp",
    category: "Food & Cafes",
    shortDescription: "Popular cafes, restaurants and hangout spots.",
    about: `If Dehradun has a street where everyone eventually ends up, it's Rajpur Road. This stretch runs from the city centre toward the Mussoorie hills and has slowly turned into the go-to spot for cafes, restaurants and shopping — everything from big international brands to small boutiques selling local crafts.

It wasn't always like this. Old Rajpur, the quieter older part of the road, still carries traces of Dehradun's colonial past. But today, most people know Rajpur Road for one thing: it's simply the best place in the city to sit down with a coffee, grab some Tibetan food, or walk around in the evening with friends.`,
    highlights: [
      "Countless cafes, from cozy corners to Instagram-worthy spots",
      "Shopping for big brands and local boutiques",
      "Old Rajpur's quieter, historic lanes nearby",
      "Lively weekend evenings",
    ],
    bestTimeToVisit: "Evenings for the cafe/shopping vibe; weekdays to skip the crowd",
    howToReach: "Well connected by autos, e-rickshaws and city buses",
  },
  {
    title: "Forest Research Institute",
    slug: "fri",
    image: "/images/places/fri.webp",
    category: "Nature",
    shortDescription: "A historic campus loved by students and photographers.",
    about: `FRI began life in 1878 as a small school for training forest officers, and by 1906 it had grown into the Imperial Forest Research Institute — one of the oldest forestry institutions in the world. What you see today is mostly thanks to the building completed in 1929: a huge Greco-Roman structure designed by British architect C.G. Blomfield, often called one of the largest brick buildings on the planet.

The campus spreads across a massive green estate, with wide lawns, tree-lined avenues and a botanical garden perfect for a slow walk. Inside the main building, six small museums cover everything from timber to insects to tree diseases — interesting for curious visitors and forestry students alike. It's still a working research institute today, so you're walking through a place that's equal parts history, science and quiet green space.`,
    highlights: [
      "Grand Greco-Roman architecture, one of the world's largest brick buildings",
      "Six themed museums",
      "Sprawling lawns and botanical garden",
      "A favourite with photographers and film crews",
    ],
    bestTimeToVisit: "October to March for comfortable walks; mornings for fewer crowds",
    howToReach: "About 5-6 km from city centre on Chakrata Road, easy by auto or taxi",
  },
  {
    title: "Robber's Cave",
    slug: "robbers-cave",
    image: "/images/places/robbers-cave.webp",
    category: "Adventure",
    shortDescription: "One of Dehradun's most visited natural attractions.",
    about: `Locals have always called it Guchhupani — "disappearing water" — and once you're inside, you'll understand why. This narrow river cave, tucked into the hills about 8 km from the city, has a stream that vanishes underground at points and reappears a little further along — exactly the kind of quirky detail that makes it one of Dehradun's most memorable spots.

The name "Robber's Cave" comes from the British era, when the gorge was supposedly used as a hideout by bandits. These days, the only thing you need to worry about is cold water — the stream stays chilly even in peak summer, which is exactly why it's such a popular escape from the heat. Most visitors roll up their pants, wade through the knee-deep water, and walk the first 200-300 metres of the roughly 600-metre cave, past narrow gorges and a small waterfall, before turning back.`,
    highlights: [
      "A stream that disappears and reappears — a genuine geological curiosity",
      "Cool water even in peak summer",
      "Narrow gorge walk past a small waterfall",
      "Sandals for rent near the entrance",
    ],
    bestTimeToVisit: "April to October, especially hot summer afternoons",
    howToReach: "About 8 km from city centre near Anarwala village; shared vikram from Clock Tower, or auto/cab (~₹60-90)",
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    for (const place of places) {
      const exists = await Place.findOne({ slug: place.slug });
      if (exists) {
        console.log(`Skipping existing: ${place.slug}`);
        continue;
      }

      await Place.create(place);
      console.log(`Created: ${place.title}`);
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
// MONGODB_URI=your_uri tsx scripts/seed-places.ts