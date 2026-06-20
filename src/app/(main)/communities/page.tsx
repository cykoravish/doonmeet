import Link from "next/link";

const communities = [
  {
    name: "Developers of Dehradun",
    members: "245 Members",
    description: "Connect with developers, founders and tech enthusiasts.",
  },
  {
    name: "Doon Photographers",
    members: "180 Members",
    description: "Share photos, locations and photography experiences.",
  },
  {
    name: "Trekking & Hiking",
    members: "320 Members",
    description: "Find trekking partners and discover trails.",
  },
  {
    name: "Coffee Lovers",
    members: "95 Members",
    description: "Explore cafes and meet fellow coffee enthusiasts.",
  },
  {
    name: "Cycling Club",
    members: "140 Members",
    description: "Join cycling rides and fitness activities.",
  },
  {
    name: "Startup & Business",
    members: "75 Members",
    description: "Network with entrepreneurs and professionals.",
  },
];

export default function CommunitiesPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-12">
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">Communities</h1>

        <p
          className="max-w-2xl"
          style={{
            color: "rgb(var(--muted))",
          }}
        >
          Discover communities, connect with like-minded people and participate in discussions
          across Dehradun.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {communities.map((community) => (
          <Link
            key={community.name}
            href="#"
            className="rounded-2xl border p-6 transition-all hover:-translate-y-1 hover:shadow-xl"
            style={{
              backgroundColor: "rgb(var(--surface))",
              borderColor: "rgb(var(--border))",
            }}
          >
            <h2 className="mb-2 text-xl font-semibold">{community.name}</h2>

            <p
              className="mb-4 text-sm"
              style={{
                color: "rgb(var(--primary))",
              }}
            >
              {community.members}
            </p>

            <p
              style={{
                color: "rgb(var(--muted))",
              }}
            >
              {community.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
