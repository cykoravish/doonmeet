import {
  Camera,
  Cpu,
  Palette,
  Trees,
  Trophy,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

// One icon per community/event category — used by cards, detail pages and
// the home page so the same category always looks the same.
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  tech: Cpu,
  nature: Trees,
  food: UtensilsCrossed,
  photography: Camera,
  sports: Trophy,
  arts: Palette,
  general: Users,
};

export const CATEGORY_FILTERS = [
  { label: "All", value: "" },
  { label: "Tech", value: "tech" },
  { label: "Nature", value: "nature" },
  { label: "Food", value: "food" },
  { label: "Photography", value: "photography" },
  { label: "Sports", value: "sports" },
  { label: "Arts", value: "arts" },
];
