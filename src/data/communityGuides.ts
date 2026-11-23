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
};

export function getCommunityGuide(slug: string): CommunityGuide | null {
  return GUIDES[slug] ?? null;
}
