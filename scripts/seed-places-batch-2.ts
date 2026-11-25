// Adds the second batch of places: Guru Ram Rai Darbar Sahib, Khalanga War
// Memorial, Prakasheshwar Mahadev, Asan Barrage, Maldevta, Kempty Falls,
// Mussoorie Mall Road, George Everest House, Kalsi Ashoka Edict, Chakrata
// and Nag Tibba. Safe to run more than once: existing slugs are skipped.
//
// Usage (from the project folder, with its .env):
//   npx tsx scripts/seed-places-batch-2.ts --dry-run
//   npx tsx scripts/seed-places-batch-2.ts
//
// Photos: Wikimedia Commons files licensed CC0 / CC BY / CC BY-SA (checked
// via the Commons API), resized to WebP in public/images/places/. Text:
// facts cross-checked across sources and written in our own words; numbers
// the sources disagree on are left out.
import "dotenv/config";
import mongoose from "mongoose";
import { Place } from "../src/models/Place";

const BY_SA_4 = "https://creativecommons.org/licenses/by-sa/4.0";
const BY_4 = "https://creativecommons.org/licenses/by/4.0";
const CC0 = "https://creativecommons.org/publicdomain/zero/1.0/";

const places = [
  {
    title: "Guru Ram Rai Darbar Sahib",
    slug: "guru-ram-rai-darbar-sahib",
    image: "/images/places/guru-ram-rai-darbar-sahib.webp",
    category: "Spiritual",
    shortDescription: "The historic shrine that gave Dehradun its name, home of the Jhanda Mela.",
    about: `This is where Dehradun's story begins. Guru Ram Rai, the eldest son of the seventh Sikh Guru, set up his camp, his "dera", in the valley in the 1670s, and the city takes its name from it. The Darbar Sahib built here around the start of the 18th century is one of the most important heritage sites in Dehradun.

The architecture is a beautiful mix, with domes and minarets that show Mughal influence and painted walls full of old murals. Every year, a few days after Holi, the Jhanda Mela brings huge crowds here as a new flag is raised in the courtyard. Visit with your head covered and shoes off, and take a slow walk around the complex.`,
    highlights: [
      "The shrine that gave Dehradun its name",
      "Mughal-style domes and old painted murals",
      "Jhanda Mela every year after Holi",
      "In the heart of the old city",
    ],
    bestTimeToVisit: "All year; visit during the Jhanda Mela (a few days after Holi) for the festival, or a normal morning for quiet",
    howToReach: "In the old city near the Clock Tower; easiest on foot, by e-rickshaw or auto",
    imageCredit: {
      author: "Satdeep Gill",
      license: "CC BY 4.0",
      licenseUrl: BY_4,
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Memorial_site_of_Mata_Punjab_Kaur_at_Guru_Ram_Rai_Darbar_Sahib_-_01.jpg",
    },
  },
  {
    title: "Khalanga War Memorial",
    slug: "khalanga-war-memorial",
    image: "/images/places/khalanga-war-memorial.webp",
    category: "Heritage",
    shortDescription: "A memorial to the Gorkha soldiers of the 1814 Battle of Nalapani, on Sahastradhara Road.",
    about: `In 1814, during the first battle of the Anglo-Nepalese War, a small Gorkha force led by Balbhadra Kunwar held the Khalanga fort at Nalapani against a much larger British army. They held out against repeated attacks, and their courage impressed even their enemies.

The memorial on Sahastradhara Road remembers that battle. It's often described as a rare monument raised by the winning side to honour the soldiers they fought against. It's a small, quiet place, but the story behind it makes it worth a stop on the way to Sahastradhara.`,
    highlights: [
      "Remembers the 1814 Battle of Nalapani",
      "Honours the Gorkha defenders led by Balbhadra Kunwar",
      "Quiet, green spot on Sahastradhara Road",
      "Easy stop on the way to Sahastradhara",
    ],
    bestTimeToVisit: "October to March; mornings are pleasant. Opening hours can change, so check locally",
    howToReach: "On Sahastradhara Road, roughly 5 km from the city centre; cab or auto",
    imageCredit: {
      author: "Rajeshbahuguna.in",
      license: "CC BY-SA 4.0",
      licenseUrl: BY_SA_4,
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Anglo_Nepali_war.jpg",
    },
  },
  {
    title: "Prakasheshwar Mahadev Temple",
    slug: "prakasheshwar-mahadev-temple",
    image: "/images/places/prakasheshwar-mahadev-temple.webp",
    category: "Spiritual",
    shortDescription: "A bright red-and-white Shiva temple on the Mussoorie road that famously accepts no donations.",
    about: `You can't miss Prakasheshwar Mahadev on the drive up to Mussoorie: a bright red and white temple standing right by the road near Kuthal Gate. Inside, it's a peaceful Shiva temple with a lot of detailed work.

What makes it special is its rule about money: the temple clearly says it does not accept donations. Instead, visitors are usually offered prasad, often with a cup of tea. Bahut log Mussoorie jaate hue yahan chai aur darshan ke liye rukte hain. Photography rules aren't clear across sources, so ask before you take pictures inside.`,
    highlights: [
      "Striking red-and-white temple on the Mussoorie road",
      "Does not accept donations",
      "Prasad, often with tea, for visitors",
      "Perfect stop on the way up to Mussoorie",
    ],
    bestTimeToVisit: "All year; it's an easy stop on any Mussoorie drive. Hours differ between sources",
    howToReach: "On the Dehradun–Mussoorie road near Kuthal Gate, about 9 km from Dehradun",
    imageCredit: {
      author: "pavankunar",
      license: "CC BY-SA 4.0",
      licenseUrl: BY_SA_4,
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Prakasheshwar_temple_dehradun.jpg",
    },
  },
  {
    title: "Asan Barrage",
    slug: "asan-barrage",
    image: "/images/places/asan-barrage.webp",
    category: "Wildlife",
    shortDescription: "Uttarakhand's first Ramsar wetland, where thousands of migratory birds spend the winter.",
    about: `Asan Barrage, near Dhalipur on the Vikasnagar side of Dehradun district, is where the Asan river meets the Yamuna canal. The wetland around it was declared the Asan Conservation Reserve in 2005, and in 2020 it became Uttarakhand's first Ramsar site, a wetland of international importance.

Winter is when it comes alive. Migratory ducks and waterbirds flying the Central Asian route stop here, including Ruddy Shelducks and Red-crested Pochards. Bring binoculars, go early in the morning, and keep your voice low. Birders, this one is for you.`,
    highlights: [
      "Uttarakhand's first Ramsar site (2020)",
      "Migratory ducks and waterbirds in winter",
      "Ruddy Shelduck and Red-crested Pochard",
      "Calm wetland views for photography",
    ],
    bestTimeToVisit: "Winter, roughly November to February, for migratory birds; early mornings are best",
    howToReach: "Near Dhalipur on the Vikasnagar side of Dehradun district; best by car or cab",
    imageCredit: {
      author: "Ashish Gaur",
      license: "CC BY-SA 4.0",
      licenseUrl: BY_SA_4,
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Asan_Conservation_Reserve_1_%E2%80%93_(Ashish_Gaur).jpg",
    },
  },
  {
    title: "Maldevta",
    slug: "maldevta",
    image: "/images/places/maldevta.webp",
    category: "Nature",
    shortDescription: "A green valley on the Song river, a quick escape from the city for picnics and short walks.",
    about: `Maldevta is a green, open valley along the Song river on the Raipur side of Dehradun. It's one of the easiest escapes from the city: drive past Sahastradhara Road and within an hour you're by the river, with hills on every side.

People come here for picnics by the water, short walks on the nearby trails and simply some fresh air. It's at its greenest after the monsoon. River levels can rise quickly in heavy rain though, so stay away from the water on those days.`,
    highlights: [
      "Picnic spots along the Song river",
      "Short walking trails in the hills around",
      "Quick half-day escape from the city",
      "Lush and green after the monsoon",
    ],
    bestTimeToVisit: "October to March for comfortable weather; after the monsoon for the greenest views",
    howToReach: "On the Raipur side of the city via Sahastradhara Road; taxis, autos and local buses go there",
    imageCredit: {
      author: "Leo Ashford",
      license: "CC BY 4.0",
      licenseUrl: BY_4,
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Song_River_Maldevta_Dehradun.jpg",
    },
  },
  {
    title: "Kempty Falls",
    slug: "kempty-falls",
    image: "/images/places/kempty-falls.webp",
    category: "Nature",
    shortDescription: "Mussoorie's most famous waterfall, with a pool at the bottom to splash around in.",
    about: `Kempty Falls is the waterfall everyone visits on a Mussoorie trip. It's on the Chakrata road, around 13 to 15 km beyond Mussoorie, where water tumbles down the rocks into a big pool. People wade in, swim and click pictures, and there are plenty of stalls for snacks around it.

Be ready for crowds, especially on summer weekends. If you want it calmer, go early on a weekday. During heavy monsoon rain the flow can get strong, so follow any instructions from the staff.`,
    highlights: [
      "Mussoorie's best-known waterfall",
      "Pool at the bottom to splash around in",
      "Snack stalls all around",
      "Easy to combine with a Mussoorie day",
    ],
    bestTimeToVisit: "March to June for pleasant weather; it gets very crowded on summer weekends",
    howToReach: "About 13–15 km from Mussoorie on the Chakrata road, around 45 km from Dehradun; cab or bus via Mussoorie",
    imageCredit: {
      author: "BestMan20",
      license: "CC0",
      licenseUrl: CC0,
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Kempty_Falls,_May_2024.jpg",
    },
  },
  {
    title: "Mussoorie Mall Road",
    slug: "mussoorie-mall-road",
    image: "/images/places/mussoorie-mall-road.webp",
    category: "Hill Station",
    shortDescription: "The heart of the 'Queen of the Hills', about 35 km up from Dehradun.",
    about: `Mussoorie, the "Queen of the Hills", is the classic day trip from Dehradun, about an hour's drive up the hill. Mall Road is its heart: a long walking street with old buildings, shops, cafes and views of the valley below. Evenings here are made for a slow walk with something warm in hand.

From the Mall, a short ropeway ride takes you up to Gun Hill for wide views. Camel's Back Road, a quieter walk of about 3 km between Kulri and Library Chowk, is named after a rock that looks like a camel's hump. Weekend traffic up the hill can be heavy, so start early.`,
    highlights: [
      "Classic hill walk with valley views",
      "Ropeway up to Gun Hill",
      "Camel's Back Road walk between Kulri and Library",
      "Cafes, bakeries and shopping",
    ],
    bestTimeToVisit: "March to June and October to December; winter can bring cold and sometimes snow on nearby peaks",
    howToReach: "About 34–36 km from Dehradun, roughly an hour's drive; buses and shared taxis run from the city",
    imageCredit: {
      author: "ArmouredCyborg",
      license: "CC BY-SA 4.0",
      licenseUrl: BY_SA_4,
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Mall_Road,_Mussoorie.jpg",
    },
  },
  {
    title: "George Everest House",
    slug: "george-everest-house",
    image: "/images/places/george-everest-house.webp",
    category: "Heritage",
    shortDescription: "The 1830s home and observatory of Sir George Everest, with big Himalayan views near Mussoorie.",
    about: `Sir George Everest, Surveyor General of India from 1830 to 1843, built this house at Park Estate near Mussoorie in 1832 and lived and worked here for about 11 years. It was his home, laboratory and observatory while India's great survey was being carried out. Mount Everest is named after him.

The old house was restored and reopened in December 2021, with a small cartography museum and observatory. Even without the history, people come for the views: wide open slopes with the Doon valley on one side and Himalayan peaks on the other on a clear day.`,
    highlights: [
      "Home of Sir George Everest from 1832",
      "Restored in 2021 with a cartography museum",
      "Wide Himalayan and valley views",
      "Short drive from Mussoorie's Library Chowk",
    ],
    bestTimeToVisit: "October to June on clear days for the views; go early before the clouds roll in",
    howToReach: "About 6 km from Library Chowk, Mussoorie, near Hathipaon; cab from Mussoorie",
    imageCredit: {
      author: "Singh.abhinav 021",
      license: "CC BY-SA 4.0",
      licenseUrl: BY_SA_4,
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Sir_George_Everest_Bungalow.jpg",
    },
  },
  {
    title: "Kalsi Ashoka Rock Edict",
    slug: "kalsi-ashoka-edict",
    image: "/images/places/kalsi-ashoka-edict.webp",
    category: "Heritage",
    shortDescription: "A boulder carved with Emperor Ashoka's edicts over 2,200 years ago, near the Yamuna at Kalsi.",
    about: `At Kalsi, near where the Yamuna and Tons rivers meet, stands a large rock carved with the edicts of Emperor Ashoka from the 3rd century BCE. The inscriptions are in the Brahmi script and carry Ashoka's messages about dhamma, kindness and good governance. One of them even names Greek kings of that time.

The rock is protected inside a small shelter. It's a short stop, but a special one: few places near Dehradun let you stand this close to history that old. Kalsi falls on the road to Chakrata, so it fits easily into that trip.`,
    highlights: [
      "Edicts of Emperor Ashoka, over 2,200 years old",
      "Inscriptions in the ancient Brahmi script",
      "Near the meeting of the Yamuna and Tons",
      "On the way to Chakrata",
    ],
    bestTimeToVisit: "October to March; combine it with a Chakrata trip",
    howToReach: "At Kalsi, beyond Vikasnagar on the road to Chakrata; best by car or bus towards Chakrata",
    imageCredit: {
      author: "Ms Sarah Welch",
      license: "CC0",
      licenseUrl: CC0,
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:0051823_Major_rock_edict_of_Asoka,_Kalsi_Uttarakhand_017.jpg",
    },
  },
  {
    title: "Chakrata",
    slug: "chakrata",
    image: "/images/places/chakrata.webp",
    category: "Hill Station",
    shortDescription: "A quiet old cantonment town in the hills, with forests, viewpoints and Tiger Falls nearby.",
    about: `If Mussoorie feels too busy, Chakrata is the answer. It grew as a British cantonment for army regiments and still has the calm, unhurried feel of an army town, surrounded by thick forests and wide hill views.

There isn't a lot of nightlife or shopping, and that's the point. People come for long walks, sunsets, Tiger Falls nearby and the forest trails around Deoban. The drive itself is lovely, going via Vikasnagar and Kalsi. Since it's a cantonment, some areas are restricted, so follow the signs.`,
    highlights: [
      "Peaceful old cantonment town",
      "Thick forests and big hill views",
      "Tiger Falls and Deoban nearby",
      "Scenic drive via Kalsi",
    ],
    bestTimeToVisit: "March to June and October to December; winters are cold",
    howToReach: "A few hours' drive from Dehradun via Vikasnagar and Kalsi; buses and taxis run from Dehradun",
    imageCredit: {
      author: "Manojpanchal90",
      license: "CC BY-SA 4.0",
      licenseUrl: BY_SA_4,
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Chakrata.jpg",
    },
  },
  {
    title: "Nag Tibba",
    slug: "nag-tibba",
    image: "/images/places/nag-tibba.webp",
    category: "Adventure",
    shortDescription: "A popular weekend trek near Dehradun with camping meadows and Himalayan views from the top.",
    about: `Nag Tibba is one of the most loved weekend treks for people in Dehradun and Delhi. The usual base is Pantwari village, a few hours' drive from the city, and most people do it as an overnight trip with a night in tents near the top.

The trail climbs through forest to open camping grounds, with a small Nag Devta temple along the way. From the summit area, a clear day gives you a long line of snow peaks. It's usually rated easy to moderate, but the last climb is steep. Trek permissions and operator schedules change, so check the current status before you plan.`,
    highlights: [
      "Popular overnight weekend trek",
      "Camping meadows near the top",
      "Small Nag Devta temple on the way",
      "Snow-peak views on clear days",
    ],
    bestTimeToVisit: "October to March for clear views (snow is possible in winter); check trail status before going",
    howToReach: "Base village Pantwari, a few hours' drive from Dehradun; most people go with a local trek operator",
    imageCredit: {
      author: "Ashish Gupta from Noida, India",
      license: "CC BY 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by/2.0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Panorama_of_camping_ground_from_above_the_Nag_Tibba_temple_(15632227134).jpg",
    },
  },
];

async function seed() {
  const dryRun = process.argv.includes("--dry-run");
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set (run from the project folder with its .env)");

  await mongoose.connect(uri);
  console.log(`Connected${dryRun ? " (dry run, nothing will be written)" : ""}`);

  let added = 0;
  for (const place of places) {
    if (await Place.exists({ slug: place.slug })) {
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
