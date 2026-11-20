import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getPosts, type PostListItem } from "@/lib/posts";
import { getEvents } from "@/lib/events";
import { getAllPlacesWithRatings, type PlaceWithRating } from "@/lib/places";
import { getAllCommunities } from "@/lib/communities";

export interface HomeEvent {
  _id: string;
  slug: string;
  title: string;
  date: string;
  location: { name: string; address: string };
  banner: string | null;
}

export interface HomeCommunity {
  _id: string;
  slug: string;
  name: string;
  category: string;
  memberCount: number;
}

export interface HomeData {
  onlineCount: number;
  posts: PostListItem[];
  events: HomeEvent[];
  places: PlaceWithRating[];
  communities: HomeCommunity[];
}

// Each block fails independently — a slow/broken query hides one section
// instead of taking down the whole home page.
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("[home] section query failed:", error);
    return fallback;
  }
}

export async function getHomeData(): Promise<HomeData> {
  await connectDB();

  const [onlineCount, posts, events, places, communities] = await Promise.all([
    safe(() => User.countDocuments({ isOnline: true, isActive: true, isDeleted: { $ne: true } }), 0),
    safe(() => getPosts({ limit: 3 }), [] as PostListItem[]),
    safe(async () => {
      const docs = await getEvents({ limit: 3 });
      return JSON.parse(JSON.stringify(docs)) as HomeEvent[];
    }, [] as HomeEvent[]),
    safe(async () => (await getAllPlacesWithRatings()).slice(0, 6), [] as PlaceWithRating[]),
    safe(async () => {
      const docs = await getAllCommunities();
      return (JSON.parse(JSON.stringify(docs)) as HomeCommunity[]).slice(0, 6);
    }, [] as HomeCommunity[]),
  ]);

  return { onlineCount, posts, events, places, communities };
}
