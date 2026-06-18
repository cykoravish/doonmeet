import ExploreCategories from "@/components/home/ExploreCategories";
import HeroSection from "@/components/home/HeroSection";
import PopularPlaces from "@/components/home/PopularPlaces";
import QuickActions from "@/components/home/QuickActions";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <QuickActions />
      <PopularPlaces />
      <ExploreCategories />
    </>
  );
}
