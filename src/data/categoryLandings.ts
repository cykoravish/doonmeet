// Landing pages for Doon Feed categories (/dehradun/[topic]) — "PG in
// Dehradun", "jobs in Dehradun" and so on. Each one is a real, crawlable
// page: a keyword-rich heading and intro, the live posts of that category,
// then a short local guide and FAQs.
//
// Writing rules (same as community guides): simple English with a light
// Hinglish touch, our own words, only facts we have a source for. FAQ
// answers stay plain text — they also go into the FAQPage schema.
import type { PostCategory } from "@/lib/postCategories";

export interface CategoryLanding {
  /** URL segment: /dehradun/<slug> */
  slug: string;
  category: PostCategory;
  /** Short chip / breadcrumb label. */
  label: string;
  h1: string;
  /** Page title without the brand — the layout adds " | DoonMeet". */
  seoTitle: string;
  /** ~150–160 characters. */
  seoDescription: string;
  keywords: string[];
  /** One short paragraph shown above the posts. */
  lead: string;
  /** The longer local guide shown below the posts. */
  guide: { heading: string; paragraphs: string[]; tips?: string[] }[];
  faqs: { q: string; a: string }[];
  /** Helpful next pages on the site. */
  related: { label: string; href: string }[];
  /** When the facts were last checked, YYYY-MM-DD. */
  updatedAt: string;
}

const LANDINGS: CategoryLanding[] = [
  {
    slug: "pg-and-rooms",
    category: "rentals",
    label: "PG & Rooms",
    h1: "PG, Rooms & Flats for Rent in Dehradun",
    seoTitle: "PG, Rooms & Flats for Rent in Dehradun",
    seoDescription:
      "Find PG, rooms and flats for rent in Dehradun, posted by locals. Areas students and professionals look at, rent agreement and police verification tips.",
    keywords: ["PG in Dehradun", "rooms for rent Dehradun", "flats for rent Dehradun", "PG near UPES", "rent in Dehradun"],
    lead:
      "Looking for a PG, a room or a flat in Dehradun? These are rental posts shared by people in the city. Message the person directly, ask questions, and post your own requirement if you don't find the right place yet.",
    guide: [
      {
        heading: "Where people look for a room",
        paragraphs: [
          "Most students stay close to their college to save on daily travel. For UPES, that usually means the Bidholi, Kandoli and Pondha side of the city, and Prem Nagar is another common choice for colleges on that route. Areas like Clement Town and Ballupur also have plenty of PGs for students and working people.",
          "If you work in the city, staying near your office matters more than anything else. Dehradun traffic on the main roads can be slow at peak hours, so a short commute is worth a little extra rent.",
        ],
      },
      {
        heading: "Before you pay the deposit",
        paragraphs: ["A few simple checks save a lot of trouble later:"],
        tips: [
          "Visit the place in person, ideally in the evening, and check water supply, power backup and the actual room you'll get.",
          "Ask what's included: food, Wi-Fi, electricity, laundry and housekeeping can change the real monthly cost a lot.",
          "Get a written rent agreement and keep receipts for rent and the security deposit.",
          "Landlords in Uttarakhand are expected to get tenants verified by the police, so keep your ID proof and a photo ready.",
          "Never send an advance to someone you haven't met, for a place you haven't seen.",
        ],
      },
    ],
    faqs: [
      {
        q: "Which areas are popular for PG in Dehradun?",
        a: "Students at UPES usually stay around Bidholi, Kandoli and Pondha. Prem Nagar, Clement Town and Ballupur are also popular with students and working people.",
      },
      {
        q: "Is police verification needed to rent a room in Dehradun?",
        a: "Landlords in Uttarakhand are expected to get their tenants verified by the police, especially tenants from other states. Keep your ID proof, a photo and your rent agreement ready.",
      },
      {
        q: "How do I post that I'm looking for a room?",
        a: "Log in, open the Doon Feed, choose the Rentals & PG category and write what you need: area, budget and when you want to move in.",
      },
    ],
    related: [
      { label: "New to Dehradun? A local guide", href: "/communities/doon-general" },
      { label: "Ask Dehradun a question", href: "/dehradun/ask" },
    ],
    updatedAt: "2026-11-24",
  },
  {
    slug: "jobs",
    category: "jobs",
    label: "Jobs",
    h1: "Jobs in Dehradun",
    seoTitle: "Jobs in Dehradun: Local Openings & Hiring Posts",
    seoDescription:
      "Local job openings and hiring posts in Dehradun, shared by businesses and people in the city. Part-time, full-time and freelance work, plus tips to stay safe.",
    keywords: ["jobs in Dehradun", "Dehradun hiring", "part time jobs Dehradun", "IT jobs Dehradun", "freshers jobs Dehradun"],
    lead:
      "Hiring, or looking for work in Dehradun? These are local openings and job requests shared by people and businesses in the city. Reach out directly, and post your own opening or profile for free.",
    guide: [
      {
        heading: "Where the work is in Dehradun",
        paragraphs: [
          "Dehradun's economy runs a lot on services. Hospitality and tourism, education, IT and logistics are some of the biggest employers, and the city is full of schools, coaching centres and colleges that hire teachers and staff.",
          "Tech companies are mostly around the IT Park on Sahastradhara Road. For factory and pharma jobs, the Selaqui industrial area on the city's western side is the main hub. Cafes, shops and small businesses across the city regularly look for part-time help, which is great for students.",
        ],
      },
      {
        heading: "Stay safe while job hunting",
        paragraphs: ["Real employers don't ask you for money. Keep these in mind:"],
        tips: [
          "Never pay a \"registration\" or \"training\" fee to get a job.",
          "Meet for interviews at the actual office or a public place, and tell someone where you're going.",
          "Don't share your Aadhaar, bank details or OTPs before you have a real offer.",
          "If a salary sounds too good to be true for the work, ask more questions.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where are IT companies located in Dehradun?",
        a: "Most are around the IT Park on Sahastradhara Road, along with smaller offices and coworking spaces on Rajpur Road.",
      },
      {
        q: "Which industries hire the most in Dehradun?",
        a: "Hospitality and tourism, education, IT and logistics are major employers, and the Selaqui industrial area has manufacturing and pharma units.",
      },
      {
        q: "Can I post a job opening on DoonMeet for free?",
        a: "Yes. Log in, open the Doon Feed, choose the Jobs category and describe the role, location and how to apply.",
      },
    ],
    related: [
      { label: "Doon Tech Hub community", href: "/communities/doon-tech-hub" },
      { label: "Local businesses in Dehradun", href: "/dehradun/local-business" },
    ],
    updatedAt: "2026-11-24",
  },
  {
    slug: "buy-and-sell",
    category: "buy_sell",
    label: "Buy & Sell",
    h1: "Buy & Sell in Dehradun",
    seoTitle: "Buy & Sell in Dehradun: Second-hand Items from Locals",
    seoDescription:
      "Buy and sell second-hand items in Dehradun: furniture, bikes, books, electronics and more, posted by locals. Tips for safe deals and where to shop.",
    keywords: ["buy and sell Dehradun", "second hand items Dehradun", "used furniture Dehradun", "second hand bike Dehradun"],
    lead:
      "Moving out, upgrading, or hunting for a good deal? Here people in Dehradun sell things they don't need anymore, from furniture and books to cycles and electronics. Message the seller directly and post your own items for free.",
    guide: [
      {
        heading: "Deal safely",
        paragraphs: ["Most buyers and sellers are genuine, but a little care goes a long way:"],
        tips: [
          "Meet in a busy public place during the day, and bring a friend for bigger deals.",
          "Check the item properly before paying. For electronics, switch them on and test them.",
          "For vehicles, check the papers and make sure the name on them matches the seller.",
          "Avoid paying in advance for something you haven't seen.",
        ],
      },
      {
        heading: "Shopping new in Dehradun",
        paragraphs: [
          "If you'd rather buy new, Paltan Bazaar near the Clock Tower is the city's busiest market for clothes, spices, basmati rice and everyday things. Indira Market, a short walk away, is popular for affordable clothing, and the Tibetan Market is known for woollens and souvenirs at good prices. Bargaining is normal in all of them.",
        ],
      },
    ],
    faqs: [
      {
        q: "How do I sell something in Dehradun on DoonMeet?",
        a: "Log in, open the Doon Feed, choose the Buy & Sell category, add a photo, the price and your area. Interested people can message you directly.",
      },
      {
        q: "Is it safe to buy second-hand items from strangers?",
        a: "Meet in a busy public place, check the item before paying and avoid sending money in advance. For vehicles, verify the papers.",
      },
      {
        q: "Which are the main markets in Dehradun?",
        a: "Paltan Bazaar near the Clock Tower, Indira Market nearby, and the Tibetan Market are the best-known markets in the city.",
      },
    ],
    related: [
      { label: "Explore Paltan Bazaar and the Clock Tower", href: "/places/clock-tower" },
      { label: "Local businesses in Dehradun", href: "/dehradun/local-business" },
    ],
    updatedAt: "2026-11-24",
  },
  {
    slug: "local-business",
    category: "business",
    label: "Local Business",
    h1: "Local Businesses in Dehradun",
    seoTitle: "Local Businesses in Dehradun: Shops, Services & Home Businesses",
    seoDescription:
      "Discover local shops, services and home businesses in Dehradun, shared by the owners themselves. Bakers, tutors, cafes and more. Promote yours for free.",
    keywords: ["local business Dehradun", "Dehradun shops", "home business Dehradun", "services in Dehradun"],
    lead:
      "Support local. These are shops, services and home businesses from Dehradun, shared by the people who run them: home bakers, tutors, repair shops, cafes and more. Running something yourself? You can share it here for free.",
    guide: [
      {
        heading: "Share your business for free",
        paragraphs: [
          "Every member can share one Local Business post per week at no cost. Tell people what you offer, your area, your timings and how to reach you. A clear photo of your work or shop helps a lot.",
          "Answer questions in the comments quickly, and post again when you have something new, like a festive offer or a new menu.",
        ],
      },
      {
        heading: "Why buy local in Doon",
        paragraphs: [
          "Dehradun has a long tradition of family-run shops, from bakeries on Rajpur Road that go back generations to the stalls of Paltan Bazaar. Buying from them keeps that character alive, and you often get better service from someone who lives in the same city.",
        ],
      },
    ],
    faqs: [
      {
        q: "How can I promote my business in Dehradun for free?",
        a: "Log in to DoonMeet, open the Doon Feed and post in the Local Business category. Every member can share one free business post per week.",
      },
      {
        q: "What should a good business post include?",
        a: "What you offer, your area, timings, how to contact you and a clear photo. Mention any offer or price range if you have one.",
      },
      {
        q: "Can home businesses post too?",
        a: "Yes. Home bakers, tutors, tailors, freelancers and other home businesses in Dehradun are welcome.",
      },
    ],
    related: [
      { label: "Doon Foodies: food guide to Dehradun", href: "/communities/doon-foodies" },
      { label: "Jobs in Dehradun", href: "/dehradun/jobs" },
    ],
    updatedAt: "2026-11-24",
  },
  {
    slug: "ask",
    category: "ask",
    label: "Ask Doon",
    h1: "Ask Dehradun: Local Questions & Recommendations",
    seoTitle: "Ask Dehradun: Local Questions & Recommendations",
    seoDescription:
      "Ask people in Dehradun anything: the best cafe, a good doctor, a reliable mechanic, a PG or a weekend plan. Real answers from locals on DoonMeet.",
    keywords: ["ask Dehradun", "Dehradun recommendations", "Dehradun local help", "best in Dehradun"],
    lead:
      "Need a good dentist near Rajpur Road, a reliable bike mechanic, or a quiet cafe to work from? Ask people who actually live in Dehradun. Browse questions others asked, or ask your own.",
    guide: [
      {
        heading: "How to get good answers",
        paragraphs: ["Locals love helping, so make it easy for them:"],
        tips: [
          "Mention your area. \"Near Clock Tower\" gets better answers than \"in Dehradun\".",
          "Add your budget or timing if it matters.",
          "Come back and say what worked, so the next person benefits too.",
        ],
      },
    ],
    faqs: [
      {
        q: "What can I ask on Ask Doon?",
        a: "Anything about life in Dehradun: places to eat, doctors, shops, services, routes, PGs, weekend plans and more.",
      },
      {
        q: "Who answers the questions?",
        a: "Other DoonMeet members who live in Dehradun. Anyone logged in can reply.",
      },
      {
        q: "Do I need an account to ask?",
        a: "You can read questions without an account. To ask or answer, sign up for free with email or Google.",
      },
    ],
    related: [
      { label: "New to Dehradun? A local guide", href: "/communities/doon-general" },
      { label: "Places to visit in Dehradun", href: "/places" },
    ],
    updatedAt: "2026-11-24",
  },
];

export function getCategoryLanding(slug: string): CategoryLanding | null {
  return LANDINGS.find((l) => l.slug === slug) ?? null;
}

export function getAllCategoryLandings(): CategoryLanding[] {
  return LANDINGS;
}

/**
 * Where a category's posts live: its landing page if it has one,
 * otherwise the filtered feed (e.g. "Other").
 */
export function categoryFeedPath(category: PostCategory): string {
  const landing = LANDINGS.find((l) => l.category === category);
  return landing ? `/dehradun/${landing.slug}` : `/posts?category=${category}`;
}
