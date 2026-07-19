export const places = [
  {
    slug: "clock-tower",
    title: "Clock Tower",
    image: "/images/hero-clock-tower.webp",
    description:
      "The Clock Tower is one of the most iconic landmarks of Dehradun and serves as a popular meeting point for locals and visitors.",
    rating: "4.8",
    reviews: "124",
    category: "Landmark",
  },
  {
    slug: "rajpur-road",
    title: "Rajpur Road",
    image: "/images/places/rajpur-road.webp",
    description:
      "Rajpur Road is one of Dehradun's most popular streets, known for cafes, restaurants and shopping destinations.",
    rating: "4.7",
    reviews: "89",
    category: "Food & Cafes",
  },
  {
    slug: "fri",
    title: "Forest Research Institute",
    image: "/images/places/fri.webp",
    description:
      "FRI is one of the most beautiful campuses in India and a favorite place for photography and walks.",
    rating: "4.9",
    reviews: "156",
    category: "Nature",
  },
  {
    slug: "robbers-cave",
    title: "Robber's Cave",
    image: "/images/places/robbers-cave.webp",
    description:
      "Robber's Cave is a famous natural attraction where visitors can walk through a river flowing inside a cave.",
    rating: "4.8",
    reviews: "201",
    category: "Adventure",
  },
] as const;

export type Place = (typeof places)[number];

export function getPlaceBySlug(slug: string) {
  return places.find((p) => p.slug === slug);
}