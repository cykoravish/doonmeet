import { CATEGORY_ICONS } from "@/lib/communityCategories";
import { Users } from "lucide-react";

interface CategoryIconProps {
  category: string | null | undefined;
  size?: number;
  className?: string;
}

// Renders the lucide icon for a community/event category (decorative).
export default function CategoryIcon({ category, size = 20, className }: CategoryIconProps) {
  const Icon = (category && CATEGORY_ICONS[category]) || Users;
  return <Icon size={size} className={className} aria-hidden="true" />;
}
