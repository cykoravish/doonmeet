// Adds the first batch of new places (Sahastradhara, Mindrolling, Tapkeshwar,
// Malsi, Paltan Bazaar, Tiger Falls, Rajaji). Safe to run more than once:
// places that already exist (same slug) are skipped, never overwritten.
//
// Usage (on the server, from the project folder):
//   npx tsx scripts/seed-places-batch-1.ts --dry-run   # shows what would happen
//   npx tsx scripts/seed-places-batch-1.ts             # adds the missing places
//
// Photos: Wikimedia Commons files with licenses that allow reuse (CC0 /
// CC BY / CC BY-SA), resized to WebP in public/images/places/. Each one
// carries its author + license + source, shown on the site under the photo.
// Text: facts checked against several sources, written in our own words.
import "dotenv/config";
import mongoose from "mongoose";
import { Place } from "../src/models/Place";

const places = [
  {
    title: "Sahastradhara",
    slug: "sahastradhara",
    image: "/images/places/sahastradhara.webp",
    category: "Nature",
    shortDescription: "Dripping limestone caves, sulphur springs and a cold mountain stream, about 14 km from the city.",
    about: `Sahastradhara literally means "the thousand-fold spring", and once you're there the name makes sense. Water seeps out of the limestone rock and drips down in hundreds of tiny streams into the river below, so the whole hillside feels like it's gently raining. It's one of the oldest weekend picnic spots for families in Dehradun.

The sulphur springs are the main draw. Locals have believed for generations that a dip in the sulphur water is good for the skin, so you'll see people soaking in the pools along the bank. Thoda crowd hota hai on weekends and holidays, so go early on a weekday if you want it calm.`,
    highlights: [
      "Water dripping from limestone caves and ledges",
      "Sulphur springs that locals swear by for the skin",
      "Cold, shallow stream for a dip on hot days",
      "Easy half-day trip from the city",
    ],
    bestTimeToVisit: "October to March is the most comfortable; in the monsoon the water rises fast, so be careful",
    howToReach: "About 14 km from the city centre; easiest by cab or auto",
    imageCredit: {
      author: "Sayani Saha",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Sahasradhara,_Dehradun.jpg",
    },
  },
  {
    title: "Mindrolling Monastery",
    slug: "mindrolling-monastery",
    image: "/images/places/mindrolling-monastery.webp",
    category: "Spiritual",
    shortDescription: "A peaceful Tibetan Buddhist monastery in Clement Town, home to the huge Great Stupa.",
    about: `Mindrolling Monastery in Clement Town is one of the calmest places in Dehradun. It was set up in 1965 and is one of the main monasteries of the Nyingma school of Tibetan Buddhism. Walk in and the city noise just fades away: prayer flags, neat gardens, monks going about their day.

The star of the place is the Great Stupa, inaugurated in 2002. It's a massive white and gold structure, often called one of the tallest stupas in the world, with colourful shrines and paintings inside. You can usually take photos outside and in the gardens, but photography is generally not allowed inside the main prayer hall, so check the signs and be respectful.`,
    highlights: [
      "The Great Stupa, one of the largest in the world",
      "Colourful Tibetan murals and shrines",
      "Quiet gardens to sit and slow down",
      "Peaceful walk around the stupa grounds",
    ],
    bestTimeToVisit: "Any time of year; mornings and late afternoons are quietest. Visiting hours vary, so check before you go",
    howToReach: "In Clement Town, about 10 km south of the city centre; auto, cab or a vikram towards Clement Town",
    imageCredit: {
      author: "DesiBoy101",
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Mindrolling_Monastery_Stupa,_Dehradun_(60657).jpg",
    },
  },
  {
    title: "Tapkeshwar Temple",
    slug: "tapkeshwar-temple",
    image: "/images/places/tapkeshwar-temple.webp",
    category: "Spiritual",
    shortDescription: "An old Shiva temple inside a natural cave, where water drips onto the Shivling.",
    about: `Tapkeshwar Mahadev is one of Dehradun's most loved Shiva temples, tucked inside a natural cave in the Garhi Cantt area. The name comes from "tapakna", to drip: water keeps dripping from the rock ceiling onto the Shivling, as if nature itself is doing the abhishek.

Local belief links the cave to Guru Dronacharya of the Mahabharata, which is why it's also called Drona Cave. A small river flows right next to the temple, and the walk down the steps to the cave is part of the experience. Mahashivratri brings a big fair and huge crowds, so pick a normal day if you want a quiet darshan.`,
    highlights: [
      "Shivling inside a natural cave with water dripping from the rock",
      "Linked to Guru Dronacharya in local tradition",
      "Riverside setting right next to the temple",
      "Big Mahashivratri fair",
    ],
    bestTimeToVisit: "All year; early mornings are calmest. Timings differ between sources, so confirm locally",
    howToReach: "In the Garhi Cantt area, a short auto or cab ride from the city centre",
    imageCredit: {
      author: "Jassimehra",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Shiv_tapkeshwar_temple.jpg",
    },
  },
  {
    title: "Malsi Deer Park",
    slug: "malsi-deer-park",
    image: "/images/places/malsi-deer-park.webp",
    category: "Wildlife",
    shortDescription: "Dehradun's zoo and deer park on the Mussoorie road, an easy half-day plan with kids.",
    about: `Malsi Deer Park, now run as the Dehradun Zoo, sits in the green foothills on the road to Mussoorie. It started in 1976 as a deer park and has grown into a proper zoo, with spotted deer, birds and other animals, and shaded walking paths.

It's an easy, relaxed outing, especially if you have kids with you. Combine it with a drive up towards Mussoorie, or stop for chai and Maggi at the stalls along the hill road on the way back.`,
    highlights: [
      "Spotted deer and other animals in green, shaded enclosures",
      "Easy walking paths, good for kids and elders",
      "On the Mussoorie road, so it fits into a day trip",
      "Chai and snack stalls along the hill road nearby",
    ],
    bestTimeToVisit: "October to March; it's closed on Mondays, and hours and fees can change, so check before going",
    howToReach: "About 10 km from the city on the Mussoorie road; cab, auto or a bus towards Mussoorie",
    imageCredit: {
      author: "Dbudakoti",
      license: "CC0",
      licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Malsi_deer_park_dehradun_zoo.png",
    },
  },
  {
    title: "Paltan Bazaar",
    slug: "paltan-bazaar",
    image: "/images/places/paltan-bazaar.webp",
    category: "Shopping",
    shortDescription: "Dehradun's busiest market next to the Clock Tower: clothes, spices, basmati rice and street food.",
    about: `Paltan Bazaar starts right at the Clock Tower and is the beating heart of old Dehradun. It's the city's main market, packed with shops selling clothes, woollens, spices, basmati rice, utensils and almost anything else you can think of. Expect crowds, honking scooters and a lot of energy, especially in the evenings and before festivals.

Come hungry. The lanes around the bazaar are famous for street food, with a whole stretch known as Chaat Gali for dahi bhalla and papdi chaat, and Gaylord at the start of the bazaar for ice cream. Bargaining is normal here, so smile and ask for a better price.`,
    highlights: [
      "The city's biggest everyday market",
      "Clothes, woollens, spices and Dehradun basmati rice",
      "Chaat Gali and other street food lanes",
      "Right next to the Clock Tower (Ghanta Ghar)",
    ],
    bestTimeToVisit: "Evenings are the liveliest; weekday mornings are calmer for serious shopping",
    howToReach: "At the Clock Tower in the city centre, close to Dehradun railway station; parking is tight, so take an auto or e-rickshaw",
    imageCredit: {
      author: "ArmouredCyborg",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Paltan_Bazar_Dehradun_01.jpg",
    },
  },
  {
    title: "Tiger Falls",
    slug: "tiger-falls",
    image: "/images/places/tiger-falls.webp",
    category: "Adventure",
    shortDescription: "A tall waterfall in the forests near Chakrata, a scenic day trip from Dehradun.",
    about: `Tiger Falls is a long, straight drop of water in the hills near Chakrata, often described as one of the highest direct waterfalls in India. The water falls into a cold pool surrounded by thick forest, and on a clear day the sound of it reaches you well before you see it.

Getting there is half the fun. The drive goes out via Vikasnagar and Kalsi, crosses the Yamuna and climbs towards Chakrata through oak and rhododendron forest. The last stretch of road is rough and narrow, and you finish with a short walk down to the falls. Kapde extra le jaana, you will want to get close to the spray.`,
    highlights: [
      "One of the tallest direct waterfalls in the region",
      "Beautiful drive via Kalsi and the Chakrata hills",
      "Cold pool at the base, surrounded by forest",
      "Pairs well with an overnight stay in Chakrata",
    ],
    bestTimeToVisit: "After the monsoon, when the falls are full; avoid days of heavy rain when hill roads can be risky",
    howToReach: "Roughly 100 km from Dehradun via Vikasnagar and Kalsi towards Chakrata; the last road is rough, then a short walk",
    imageCredit: {
      author: "Daniel Romanson",
      license: "CC0",
      licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Tiger_Falls_Uttarakhand_India.jpg",
    },
  },
  {
    title: "Rajaji National Park",
    slug: "rajaji-national-park",
    image: "/images/places/rajaji-national-park.webp",
    category: "Wildlife",
    shortDescription: "A tiger reserve at Doon's doorstep, famous for wild elephants. Jeep safaris from November to June.",
    about: `Rajaji National Park wraps around the edge of the Doon valley, stretching towards Haridwar and Rishikesh. It was formed in 1983 by joining three wildlife sanctuaries, Rajaji, Motichur and Chilla, and was declared a tiger reserve in 2015. Sal forests, grasslands and riverbeds here are home to Asian elephants, leopards, deer, a few tigers and many kinds of birds.

The easiest way to experience it is a jeep safari. The Chilla zone, near Haridwar, is the most popular and gives a good chance of spotting elephants. The park opens to visitors in mid-November and closes for the monsoon in mid-June, with morning and evening safari slots. Book in advance on weekends and holidays.`,
    highlights: [
      "Wild Asian elephants, deer and leopards",
      "Jeep safaris in the morning and evening",
      "Chilla zone, the most popular safari area",
      "Great for birdwatching in winter",
    ],
    bestTimeToVisit: "Open from mid-November to mid-June; winter mornings are lovely for birds and wildlife",
    howToReach: "The Chilla gate is near Haridwar, a drive of a couple of hours from Dehradun; book safaris through the official Rajaji Tiger Reserve website",
    imageCredit: {
      author: "Pathik2207",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Rajaji_National_Park.jpg",
    },
  },
];

async function seed() {
  const dryRun = process.argv.includes("--dry-run");
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set (run from the project folder with its .env)");

  await mongoose.connect(uri);
  console.log(`Connected${dryRun ? " (dry run — nothing will be written)" : ""}`);

  let added = 0;
  for (const place of places) {
    const exists = await Place.exists({ slug: place.slug });
    if (exists) {
      console.log(`Skip (already exists): ${place.slug}`);
      continue;
    }
    if (dryRun) {
      console.log(`Would add: ${place.title}`);
    } else {
      await Place.create(place);
      console.log(`Added: ${place.title}`);
    }
    added += 1;
  }

  console.log(`${dryRun ? "Would add" : "Added"} ${added} place(s).`);
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
