// Post categories — single source of truth for the model enum, validation,
// feed filter chips, composer picker, card badges and per-category SEO.

export const POST_CATEGORY_VALUES = ["ask", "jobs", "rentals", "buy_sell", "business", "other"] as const;
export type PostCategory = (typeof POST_CATEGORY_VALUES)[number];

export const DEFAULT_POST_CATEGORY: PostCategory = "other";

export interface PostCategoryInfo {
  value: PostCategory;
  /** Chip / badge label. */
  label: string;
  /** One-line hint shown in the composer picker. */
  hint: string;
  /** SEO for /posts?category=… */
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
}

export const POST_CATEGORIES: PostCategoryInfo[] = [
  {
    value: "ask",
    label: "Ask Doon",
    hint: "Questions & recommendations",
    seoTitle: "Ask Dehradun — Local Questions & Recommendations",
    seoDescription:
      "Ask people in Dehradun for recommendations — cafes, doctors, PGs, routes, things to do — and get answers from locals on DoonMeet.",
    keywords: ["Dehradun recommendations", "ask Dehradun", "Dehradun local help"],
  },
  {
    value: "jobs",
    label: "Jobs",
    hint: "Hiring or looking for work",
    seoTitle: "Jobs in Dehradun — Local Openings & Hiring Posts",
    seoDescription:
      "Local job openings and hiring posts in Dehradun shared by businesses and people on DoonMeet — part-time, full-time and freelance.",
    keywords: ["jobs in Dehradun", "Dehradun hiring", "part time jobs Dehradun"],
  },
  {
    value: "rentals",
    label: "Rentals & PG",
    hint: "Rooms, flats, PG",
    seoTitle: "Rooms, Flats & PG in Dehradun — Rental Posts",
    seoDescription:
      "Rooms, flats and PG accommodation in Dehradun posted by locals on DoonMeet — for students and working professionals.",
    keywords: ["PG in Dehradun", "rooms for rent Dehradun", "flats for rent Dehradun"],
  },
  {
    value: "buy_sell",
    label: "Buy & Sell",
    hint: "Second-hand stuff",
    seoTitle: "Buy & Sell in Dehradun — Second-hand Items",
    seoDescription:
      "Buy and sell second-hand items locally in Dehradun — furniture, bikes, books, electronics and more on DoonMeet.",
    keywords: ["buy and sell Dehradun", "second hand Dehradun", "used items Dehradun"],
  },
  {
    value: "business",
    label: "Local Business",
    hint: "Promote your shop or service",
    seoTitle: "Local Businesses in Dehradun — Shops & Services",
    seoDescription:
      "Discover local shops, home businesses and services in Dehradun shared on DoonMeet.",
    keywords: ["local business Dehradun", "Dehradun shops", "home business Dehradun"],
  },
  {
    value: "other",
    label: "Other",
    hint: "Anything else",
    seoTitle: "Other Posts from Dehradun",
    seoDescription: "Everything else people in Dehradun are sharing on DoonMeet.",
    keywords: ["Dehradun posts", "Doon Valley updates"],
  },
];

export function isPostCategory(value: unknown): value is PostCategory {
  return typeof value === "string" && (POST_CATEGORY_VALUES as readonly string[]).includes(value);
}

export function getPostCategory(value: string | null | undefined): PostCategoryInfo {
  return POST_CATEGORIES.find((c) => c.value === value) ?? POST_CATEGORIES[POST_CATEGORIES.length - 1];
}

/**
 * Mongo filter for a category. Posts created before categories existed have
 * no `category` field — they count as "other".
 */
export function categoryQuery(category: PostCategory): Record<string, unknown> {
  return category === "other" ? { category: { $in: ["other", null] } } : { category };
}

// Free business promotion: max this many "business" posts per user per window.
export const BUSINESS_POSTS_PER_WINDOW = 1;
export const BUSINESS_POST_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
