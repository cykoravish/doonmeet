// Hand-written local guides shown on community pages (/communities/[slug]).
//
// A community with a guide gets a keyword-rich title/description and a short,
// server-rendered guide above its discussion, so the page is useful to readers
// and to Google even before members start posting. Communities without an
// entry here render exactly as before.
//
// Writing rules: mostly simple English (that's what people search in) with a
// light Hinglish / pahadi touch; short sentences; only facts we have a source
// for. Wrap a name in **double asterisks** to show it in bold. FAQ answers
// stay plain text (they also go into the FAQPage schema).

export interface CommunityGuideSection {
  heading: string;
  paragraphs: string[];
}

export interface CommunityGuideFaq {
  q: string;
  a: string;
}

export interface CommunityGuide {
  /** Page title without the brand — the layout adds " | DoonMeet". */
  seoTitle: string;
  /** ~150–160 characters. */
  seoDescription: string;
  keywords: string[];
  intro: string;
  sections: CommunityGuideSection[];
  faqs: CommunityGuideFaq[];
  cta: string;
  /** Place categories (Place.category) to suggest in the sidebar. */
  relatedPlaceCategories: string[];
  /** When the facts were last checked, YYYY-MM-DD. */
  updatedAt: string;
}

const GUIDES: Record<string, CommunityGuide> = {
  "doon-foodies": {
    seoTitle: "Doon Foodies: Street Food, Momos & Cafes in Dehradun",
    seoDescription:
      "Where to eat in Dehradun, picked by locals: Chaat Gali in Paltan Bazaar, Joshi Momos, Elloras rusk, pahadi thalis and Rajpur Road cafes. Join Doon Foodies.",
    keywords: [
      "food in Dehradun",
      "street food in Dehradun",
      "best momos in Dehradun",
      "bakeries in Dehradun",
      "Paltan Bazaar food",
      "cafes on Rajpur Road",
      "pahadi food Dehradun",
    ],
    intro:
      "Dehradun is a seriously underrated food city. Mornings start with chai and rusk, evenings end with chaat in Paltan Bazaar, and somewhere in between there's always time for a plate of momos. Doon Foodies is for people who love finding new spots, defending old favourites, and giving honest answers to the city's oldest question: aaj kya khaayein?",
    sections: [
      {
        heading: "Old bakeries and the rusk tradition",
        paragraphs: [
          "Dehradun's bakery story goes back to Partition. In 1953, Shri Krishan Lal Gulati opened a small shop on Rajpur Road, known today as **Elloras Melting Moments**. Their elaichi rusk, plum cake and sticky jaw toffees have been loved for generations. **Sunrise Bakers**, also on Rajpur Road, has been around since 1956. Honestly, nobody leaves Doon without a packet of rusk in their bag.",
        ],
      },
      {
        heading: "Street food in Paltan Bazaar",
        paragraphs: [
          "Near the Clock Tower, Paltan Bazaar has a whole lane for chaat, and locals simply call it **Chaat Gali**. **Kumar Chaat Wala** is famous for dahi bhalla and papdi chaat. Evenings are the best time to go.",
          "For kachori, head to **Chetan Puri Wala near Hanuman Chowk**, serving locals for about forty years. And end your shopping with an ice cream at **Gaylord**, right at the start of the bazaar.",
        ],
      },
      {
        heading: "Best momos in Dehradun",
        paragraphs: [
          "Momos are Doon's unofficial snack. You'll find them on every corner, but a few spots stand out. **Joshi Momos near Astley Hall** is a tiny stall where students and families eat hot momos from steel plates. On Rajpur Road, **Kalsang** is known for chilli momos in a spicy gravy. Want soup with your momos? Try **Singh Soup Bar** in Paltan Bazaar.",
        ],
      },
      {
        heading: "Pahadi food you should try",
        paragraphs: [
          "Suno bhula, Dehradun aake sirf momos aur cafes? Try some real pahadi food too. **Kafuli** (a thick spinach and fenugreek curry), **gahat ki dal** and **jhangora ki kheer** are true Garhwali flavours. **Desi Chulha** serves a Pahadi thali that comes with jhangora kheer, and **Samoon** is a millet-focused restaurant with its own thali. For sweets, don't miss **bal mithai** and **arsa**.",
        ],
      },
      {
        heading: "Cafes on Rajpur Road and beyond",
        paragraphs: [
          "Rajpur Road is Dehradun's cafe street. **Rising Dough** in Chukkuwala, opposite Meedo Plaza, is a good budget pick. If you want a quiet corner with books, check out **Maulyar BookCafe** in Vasant Vihar. Weekend tip: Rajpur Road cafes fill up fast, so go a little early.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is the oldest bakery in Dehradun?",
        a: "Elloras Melting Moments, started on Rajpur Road in 1953, is one of the oldest and most famous bakeries in the city.",
      },
      {
        q: "Where can I find street food in Dehradun?",
        a: "Paltan Bazaar near the Clock Tower, especially Chaat Gali. Evenings are the best time.",
      },
      {
        q: "Where are the best momos in Dehradun?",
        a: "Joshi Momos near Astley Hall and the chilli momos at Kalsang on Rajpur Road are local favourites.",
      },
      {
        q: "Where can I eat pahadi food in Dehradun?",
        a: "Desi Chulha and Samoon serve Pahadi thalis with dishes like kafuli and jhangora ki kheer.",
      },
    ],
    cta: "Is your favourite spot missing from this list? Join Doon Foodies and tell us. The best food tips always come from locals.",
    relatedPlaceCategories: ["Food & Cafes"],
    updatedAt: "2026-11-23",
  },

  "doon-nature-lovers": {
    seoTitle: "Doon Nature Lovers: Waterfalls & Treks near Dehradun",
    seoDescription:
      "Waterfalls, easy treks and green escapes around Dehradun: Sahastradhara, Robber's Cave, Benog Tibba, Nag Tibba, Malsi and Rajaji. Tips from locals, best seasons.",
    keywords: [
      "nature spots in Dehradun",
      "waterfalls near Dehradun",
      "treks near Dehradun",
      "Sahastradhara",
      "Nag Tibba trek",
      "Rajaji National Park Dehradun",
    ],
    intro:
      "The best part of living in Dehradun? The hills start right where the city ends. Within an hour you can be standing under a waterfall, walking through a sal forest or climbing a ridge with the Himalaya in view. Doon Nature Lovers is for people who would rather spend Sunday outdoors than on the sofa. Share trails, plan group outings and help each other find the quieter spots.",
    sections: [
      {
        heading: "Waterfalls and springs close to the city",
        paragraphs: [
          "**Sahastradhara** is the classic first trip, around 14 km from the city centre. Water drips from limestone ledges into the river below, and the sulphur springs here have been a local favourite for generations. Go on a weekday if you can, because weekends get crowded.",
          "**Robber's Cave**, or Guchhupani as locals call it, is a river that flows through a narrow rocky gorge. You walk through ankle-deep cold water between tall rock walls, so wear sandals and carry a spare pair of clothes. Further up the Mussoorie road, **Bhatta Falls** is an easy picnic stop that you can reach by car or bus.",
        ],
      },
      {
        heading: "Easy treks near Dehradun",
        paragraphs: [
          "**Benog Tibba** starts near Cloud's End above Mussoorie and is usually rated easy, which makes it a good first trek for beginners and families. **George Everest Peak** starts near Hathipaon and rewards a short climb with wide valley views.",
          "For a proper weekend trek, **Nag Tibba** is the big one. The usual base village is Pantwari, a few hours' drive from Dehradun, and most people do it as an overnight trip. Trek permissions and operator schedules change from season to season, so check the current status before you plan.",
          "If you want a waterfall at the end of your walk, **Tiger Falls** near Chakrata is worth the long drive. The last stretch is a walk of a few kilometres through oak and rhododendron forest.",
        ],
      },
      {
        heading: "Parks and wildlife",
        paragraphs: [
          "**Malsi Deer Park** on the Mussoorie road is an easy half-day plan with family. It is closed on Mondays. For a real jungle experience, **Rajaji National Park** sits right at the city's edge. It has several entry gates, Chilla being the most popular for safaris, and it usually opens to visitors from November to June.",
        ],
      },
      {
        heading: "When to go",
        paragraphs: [
          "October to March is the most comfortable time for walks and treks: clear skies, cool mornings and dry trails. Monsoon (roughly June to September) makes the waterfalls look their best, but trails get slippery and river levels can rise quickly. Pahad mein mausam ka bharosa nahi, so always check the forecast and tell someone where you are going.",
        ],
      },
    ],
    faqs: [
      {
        q: "What are the best waterfalls near Dehradun?",
        a: "Sahastradhara and Robber's Cave are the closest and most popular. Bhatta Falls on the Mussoorie road and Tiger Falls near Chakrata are good longer trips.",
      },
      {
        q: "Which treks near Dehradun are good for beginners?",
        a: "Benog Tibba and George Everest Peak near Mussoorie are short and beginner friendly. Nag Tibba is a popular weekend trek but needs more stamina.",
      },
      {
        q: "When is the best time for nature trips around Dehradun?",
        a: "October to March is best for treks and walks. Waterfalls are fullest in the monsoon, but trails are slippery then.",
      },
      {
        q: "Is Rajaji National Park close to Dehradun?",
        a: "Yes. It lies along the city's edge, with Chilla being the most popular gate for safaris. It is usually open to visitors from November to June.",
      },
    ],
    cta: "Know a trail that's missing here? Join Doon Nature Lovers, share it with the group, or plan the next weekend outing together.",
    relatedPlaceCategories: ["Nature", "Adventure"],
    updatedAt: "2026-11-23",
  },

  "doon-photographers": {
    seoTitle: "Doon Photographers: Best Photo Spots in Dehradun",
    seoDescription:
      "The most photogenic places in Dehradun: FRI's colonial buildings, Mindrolling's Great Stupa, Clock Tower street scenes and river gorges. Tips on light and timing.",
    keywords: [
      "photography spots in Dehradun",
      "best photo spots Dehradun",
      "FRI Dehradun photography",
      "Mindrolling Monastery",
      "street photography Dehradun",
    ],
    intro:
      "Dehradun is a gift for anyone with a camera, even a phone camera. Old colonial buildings, a giant Buddhist stupa, busy bazaars, river gorges and the hills as a backdrop, all within a short ride. Doon Photographers is where you share your shots, swap tips and organise photo walks around the city.",
    sections: [
      {
        heading: "FRI: architecture and long corridors",
        paragraphs: [
          "The **Forest Research Institute** is probably the most photographed building in the city. The institute was founded in 1906 and its grand main building, opened in 1929, mixes Greco-Roman and colonial styles, with endless arches and corridors that are perfect for symmetry shots. It was once listed in the Guinness Book of Records as the largest purely brick building in the world. The lawns and tree-lined roads around it work well for portraits too.",
        ],
      },
      {
        heading: "Mindrolling Monastery and the Great Stupa",
        paragraphs: [
          "In Clement Town, **Mindrolling Monastery** is home to the **Great Stupa**, often called one of the tallest stupas in the world. It was inaugurated in 2002 and sits in a peaceful garden full of colour: prayer flags, gold details and murals. You can usually photograph the outside and the gardens freely, but photos are generally not allowed inside the main hall, so check the signs and ask before you shoot.",
        ],
      },
      {
        heading: "Street photography around the Clock Tower",
        paragraphs: [
          "The six-faced **Ghanta Ghar** (Clock Tower) sits at the heart of the city, and the lanes of **Paltan Bazaar** around it are full of life: spice shops, street food stalls and evening crowds. Mornings are calmer if you want clean shots of the tower. Evenings are better for street life. Always be respectful and ask people before taking close-up portraits.",
        ],
      },
      {
        heading: "Water, rocks and long exposures",
        paragraphs: [
          "**Robber's Cave** and **Sahastradhara** are great for practising slow-shutter shots of moving water. A small tripod or even a steady rock helps. Keep your gear in a dry bag, because you will be walking through water at Robber's Cave.",
        ],
      },
      {
        heading: "Light and season tips",
        paragraphs: [
          "Shoot early in the morning or in the last hour before sunset for soft light and fewer people. Winter mornings often bring mist that makes the city look magical, and the monsoon turns everything deep green. Afternoon light in summer is harsh, so that's the time to edit your photos over chai.",
        ],
      },
    ],
    faqs: [
      {
        q: "What are the best places for photography in Dehradun?",
        a: "FRI, Mindrolling Monastery, the Clock Tower and Paltan Bazaar, Robber's Cave and Sahastradhara are local favourites.",
      },
      {
        q: "Is photography allowed at Mindrolling Monastery?",
        a: "Photos of the outside and the gardens are usually fine, but photography is generally not allowed inside the main hall. Check the signs when you visit.",
      },
      {
        q: "When is the best time for photography in Dehradun?",
        a: "Early mornings and the hour before sunset give the best light. Winter mornings bring mist, and the monsoon makes everything green.",
      },
      {
        q: "Can I join a photo walk in Dehradun?",
        a: "Yes. Join Doon Photographers on DoonMeet to find people organising photo walks and to share your own shots.",
      },
    ],
    cta: "Got a shot you're proud of, or a spot nobody knows about? Join Doon Photographers and share it with the city.",
    relatedPlaceCategories: ["Landmark", "Nature", "Adventure"],
    updatedAt: "2026-11-23",
  },

  "doon-tech-hub": {
    seoTitle: "Doon Tech Hub: IT Park & Coworking in Dehradun",
    seoDescription:
      "Dehradun's tech scene in one place: IT Park on Sahastradhara Road, STPI's startup facility, coworking spaces on Rajpur Road and the city's engineering colleges.",
    keywords: [
      "tech community Dehradun",
      "IT Park Dehradun",
      "coworking space Dehradun",
      "startups in Dehradun",
      "developers in Dehradun",
    ],
    intro:
      "Dehradun is no longer just a place people leave for a tech job. Students from the city's engineering colleges, remote workers who moved here for the mountains, and small startups are slowly building a real tech scene. Doon Tech Hub brings them together: share what you're building, find people to work with and hear about local tech events.",
    sections: [
      {
        heading: "IT Park and the startup scene",
        paragraphs: [
          "Most of the city's tech offices are around the **IT Park on Sahastradhara Road**. **STPI Dehradun** (Software Technology Parks of India) has worked in the city since 2001, and in October 2026 it opened a new incubation facility at the IT Park of about 30,000 sq ft for IT companies and startups from Uttarakhand. If you are starting something, it's worth knowing about.",
        ],
      },
      {
        heading: "Coworking spaces in Dehradun",
        paragraphs: [
          "Working from home gets lonely. Dehradun has a growing list of coworking spaces, mostly around Rajpur Road, Sahastradhara Road and the Clock Tower area. On Rajpur Road you will find names like **Regus**, **Spaces** and **The Circle.Work**, along with smaller local spaces that offer day passes and monthly desks. Try a day pass first to check the internet speed and the vibe before you commit.",
        ],
      },
      {
        heading: "Colleges and young talent",
        paragraphs: [
          "Universities like **UPES**, **Graphic Era**, **DIT University** and **Uttaranchal University** bring thousands of engineering and design students to the city every year. That means a steady stream of fresh developers, designers and builders, and plenty of people looking for internships, side projects and teammates.",
        ],
      },
      {
        heading: "Why build from Dehradun",
        paragraphs: [
          "Lower costs than the metros, cleaner air, hills for weekend breaks and a calmer pace of life. More and more remote workers are choosing Doon for exactly these reasons. Bas ek achhi community chahiye, aur wahi yeh group hai.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is there an IT park in Dehradun?",
        a: "Yes. The IT Park is on Sahastradhara Road, and STPI Dehradun runs facilities there, including a startup incubation centre opened in October 2026.",
      },
      {
        q: "Where are the coworking spaces in Dehradun?",
        a: "Mostly on Rajpur Road, Sahastradhara Road and around the Clock Tower. Regus, Spaces and The Circle.Work are on Rajpur Road, along with smaller local spaces.",
      },
      {
        q: "Which are the main engineering colleges in Dehradun?",
        a: "UPES, Graphic Era University, DIT University and Uttaranchal University are among the best known.",
      },
      {
        q: "How can I meet developers in Dehradun?",
        a: "Join Doon Tech Hub on DoonMeet to share projects, find collaborators and hear about local tech meetups.",
      },
    ],
    cta: "Building something, hiring, or looking for a teammate? Join Doon Tech Hub and say hi. Dehradun's tech scene grows when we help each other.",
    relatedPlaceCategories: [],
    updatedAt: "2026-11-23",
  },

  "doon-arts-culture": {
    seoTitle: "Doon Arts & Culture: Festivals, Fairs & Art in Dehradun",
    seoDescription:
      "Dehradun's culture calendar: the historic Jhanda Mela, the Vasantotsav flower show at Lok Bhavan, literature festivals, Tibetan art and more. Join the community.",
    keywords: [
      "Dehradun culture",
      "festivals in Dehradun",
      "Jhanda Mela Dehradun",
      "Vasantotsav Dehradun flower show",
      "art events Dehradun",
    ],
    intro:
      "Dehradun's culture is a beautiful mix: Garhwali roots, Sikh history, Tibetan monasteries, colonial-era schools and a young crowd of artists and musicians. Doon Arts & Culture is for everyone who loves that mix. Share exhibitions, gigs, workshops and festivals, and find people to go with.",
    sections: [
      {
        heading: "Jhanda Mela: the fair that named the city",
        paragraphs: [
          "Dehradun's story starts with **Guru Ram Rai**, the eldest son of the seventh Sikh Guru, Guru Har Rai. He set up his camp, his \"dera\", in the valley in the 1670s, and the city takes its name from it. Every year the **Jhanda Mela** at the **Guru Ram Rai Darbar Sahib** marks his arrival. It begins on the fifth day after Holi, when a new flag is raised at the Darbar Sahib in front of huge crowds of devotees, and the fair carries on for days after.",
        ],
      },
      {
        heading: "Vasantotsav: spring at Lok Bhavan",
        paragraphs: [
          "Every spring, the grounds of **Lok Bhavan** (earlier called Raj Bhawan) open up for **Vasantotsav**, a flower show with cultural programmes. The 2026 edition ran for three days at the end of February, with flower competitions, an art gallery, a photo exhibition and even a stamp exhibition. Keep an eye out around February and March for the next one.",
        ],
      },
      {
        heading: "Books, words and festivals",
        paragraphs: [
          "Dehradun has a quiet love for books. **Valley of Words**, a literature and arts festival, brings writers, talks, theatre, music and workshops to the city, and its 9th edition was held in October 2025. Smaller readings, open mics and poetry nights pop up across cafes all year. Share them here so nobody misses out.",
        ],
      },
      {
        heading: "Tibetan art and culture",
        paragraphs: [
          "Clement Town's **Mindrolling Monastery** is one of the most peaceful places in the city, with colourful murals, prayer flags and the towering Great Stupa. It's a great reminder of how much the Tibetan community has added to Doon's culture, from art to food.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is the Jhanda Mela in Dehradun?",
        a: "It is a large annual fair at the Guru Ram Rai Darbar Sahib that marks Guru Ram Rai's arrival in the valley. It starts on the fifth day after Holi with the raising of a new flag.",
      },
      {
        q: "How did Dehradun get its name?",
        a: "From the \"dera\" (camp) that Guru Ram Rai set up in the Doon valley in the 1670s.",
      },
      {
        q: "When is the Dehradun flower show?",
        a: "Vasantotsav at Lok Bhavan is held every spring. The 2026 edition took place at the end of February.",
      },
      {
        q: "Where can I find art and culture events in Dehradun?",
        a: "Join Doon Arts & Culture on DoonMeet, where members share exhibitions, gigs, workshops and festivals happening in the city.",
      },
    ],
    cta: "Painter, musician, poet or just a fan? Join Doon Arts & Culture and share what's happening in the city this week.",
    relatedPlaceCategories: ["Landmark"],
    updatedAt: "2026-11-23",
  },

  "doon-sports-club": {
    seoTitle: "Doon Sports Club: Cricket, Cycling & Sports in Dehradun",
    seoDescription:
      "Play more sport in Dehradun: the international cricket stadium in Raipur, Maharana Pratap Sports College, the Mussoorie cycling climb and easy rides for beginners.",
    keywords: [
      "sports in Dehradun",
      "cricket stadium Dehradun",
      "cycling in Dehradun",
      "Maharana Pratap Sports College",
      "find players Dehradun",
    ],
    intro:
      "Finding people to play with is the hardest part of staying active. Doon Sports Club fixes that. Whether it's a Sunday cricket match, a morning cycling group or a football game after work, post it here and find your team in Dehradun.",
    sections: [
      {
        heading: "Cricket in Dehradun",
        paragraphs: [
          "The **Rajiv Gandhi International Cricket Stadium** in Raipur is Uttarakhand's first international-standard stadium and the home ground of the state team. It has floodlights for day-night games and hosted its first international matches in June 2018, a T20 series between Afghanistan and Bangladesh. For everyday cricket, gully matches on Sunday mornings are still the best part. Post a match here and fill your team.",
        ],
      },
      {
        heading: "Maharana Pratap Sports College",
        paragraphs: [
          "Also in Raipur, **Maharana Pratap Sports College** was set up in 1993 to train young athletes. It has an astroturf hockey ground, an athletics field, football and cricket grounds and a multipurpose indoor stadium. Its ice rink was renovated and reopened in 2025, which is a rare thing to find in India.",
        ],
      },
      {
        heading: "Cycling: the Mussoorie climb and easy rides",
        paragraphs: [
          "Every serious cyclist in Doon eventually takes on the **Dehradun to Mussoorie climb**: about 22 km from the Clock Tower with roughly 1,400 metres of climbing. It's tough, so start early and carry water. Many riders do it over two days with a night in Mussoorie.",
          "New to cycling? Start with flatter, quieter rides like **Purkul Road**, the **FRI campus** area or the road towards **Sahastradhara**. A popular loop goes from the city to Sahastradhara, Maldevta and Raipur and back.",
        ],
      },
      {
        heading: "Stay safe on the road",
        paragraphs: [
          "Ride and run early in the morning when traffic is light, wear a helmet and use lights in winter fog. In summer, avoid the afternoon heat. Group rides are safer and more fun, so find your group here.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where is the cricket stadium in Dehradun?",
        a: "The Rajiv Gandhi International Cricket Stadium is in the Raipur area of Dehradun. It is the home ground of the Uttarakhand cricket team.",
      },
      {
        q: "Is the Dehradun to Mussoorie ride hard on a bicycle?",
        a: "Yes. It is about 22 km with roughly 1,400 metres of climbing from the Clock Tower. Beginners should start with flatter rides like Purkul Road or Sahastradhara.",
      },
      {
        q: "What sports facilities are there in Dehradun?",
        a: "Maharana Pratap Sports College in Raipur has hockey, athletics, football and cricket grounds, an indoor stadium and an ice rink, and the city has an international cricket stadium.",
      },
      {
        q: "How can I find people to play sports with in Dehradun?",
        a: "Join Doon Sports Club on DoonMeet and post your match, ride or game. Local players can join you.",
      },
    ],
    cta: "Need two more players for Sunday's match, or a partner for the Mussoorie climb? Join Doon Sports Club and post it.",
    relatedPlaceCategories: [],
    updatedAt: "2026-11-23",
  },

  "doon-general": {
    seoTitle: "New to Dehradun? A Local Guide to Living in Doon",
    seoDescription:
      "Moving to Dehradun? Where people live, how to get around by Vikram, e-rickshaw and bus, what the weather is like each season, and how to meet people.",
    keywords: [
      "moving to Dehradun",
      "living in Dehradun",
      "Dehradun guide",
      "Dehradun local transport",
      "Dehradun weather",
      "new to Dehradun",
    ],
    intro:
      "Moved to Dehradun for college, a job or a slower life? Welcome to Doon. The city is friendly, green and easy to love, but the first few weeks can be confusing. This is the general community for everything Dehradun: questions, local news, announcements and help from people who already live here. Start with this quick guide.",
    sections: [
      {
        heading: "Where people live",
        paragraphs: [
          "**Rajpur Road** is the city's main stretch of cafes, shops and offices, and the area around it is one of the more expensive parts of town. **Vasant Vihar** is central, green and popular with families. Students usually look for rooms and PGs close to their college, for example around Kandoli, Bidholi and Pondha for colleges on that side of the city. Ask in this community before you sign a rent agreement, because locals know which lanes flood in the monsoon.",
        ],
      },
      {
        heading: "Getting around Dehradun",
        paragraphs: [
          "The local favourite is the **Vikram**, a shared three-wheeler that runs on fixed routes and fits about six people. **E-rickshaws** and **autos** are everywhere for short trips, and **city buses** run on main routes like Prem Nagar to Parade Ground and Parade Ground to Raipur. The city bus stand is near the Clock Tower, about a ten-minute walk from the railway station, and the city also runs electric buses. Tip: agree on the auto fare before you sit.",
        ],
      },
      {
        heading: "Weather through the year",
        paragraphs: [
          "Summers (March to May) can touch the mid-30s °C during the day. The monsoon (June to September) is heavy, as Dehradun gets around 2,000 mm of rain a year, most of it in July and August, so a good umbrella and shoes that grip are a must. Winters (December to February) are cool and pleasant. It rarely freezes in the city, but nights drop to around 5 °C, so pack a proper jacket.",
        ],
      },
      {
        heading: "A little history",
        paragraphs: [
          "Dehradun gets its name from the \"dera\" (camp) that Guru Ram Rai set up in the valley in the 1670s. The six-faced **Ghanta Ghar** (Clock Tower) is the city's heart and the easiest landmark for giving directions. Bas bolo \"Ghanta Ghar ke paas\" and everyone will know.",
        ],
      },
      {
        heading: "Meeting people",
        paragraphs: [
          "New city, no friends yet? That's exactly why DoonMeet exists. Join a community that matches your interests, say hi in the public chat or come to a local event. Dehradun is small enough that you'll start seeing familiar faces quickly.",
        ],
      },
    ],
    faqs: [
      {
        q: "How do I get around in Dehradun?",
        a: "Shared Vikrams on fixed routes, autos and e-rickshaws for short trips, and city and electric buses on main routes. Agree on auto fares before the ride.",
      },
      {
        q: "What is the weather like in Dehradun?",
        a: "Warm summers up to the mid-30s °C, a heavy monsoon from June to September, and cool winters with nights around 5 °C.",
      },
      {
        q: "Which areas are good to live in Dehradun?",
        a: "Rajpur Road and Vasant Vihar are popular central areas. Students usually stay close to their college, in areas like Kandoli, Bidholi or Pondha.",
      },
      {
        q: "How can I make friends after moving to Dehradun?",
        a: "Join communities on DoonMeet, chat with people in the public chat and go to local events. It's the easiest way to meet people in the city.",
      },
    ],
    cta: "Just moved here, or lived here all your life? Join Doon General and ask anything, or help someone new find their way around Doon.",
    relatedPlaceCategories: ["Landmark", "Food & Cafes", "Nature"],
    updatedAt: "2026-11-23",
  },
};

export function getCommunityGuide(slug: string): CommunityGuide | null {
  return GUIDES[slug] ?? null;
}
