const categories = [
  {
    emoji: "☕",
    title: "Cafes",
    description: "Discover cozy cafes and coffee spots across Dehradun.",
  },
  {
    emoji: "🌲",
    title: "Nature",
    description: "Explore forests, rivers, hills and peaceful escapes.",
  },
  {
    emoji: "🍴",
    title: "Food",
    description: "Find restaurants, street food and local favourites.",
  },
  {
    emoji: "📸",
    title: "Photography",
    description: "Discover the most photogenic places in the city.",
  },
  {
    emoji: "🏞️",
    title: "Attractions",
    description: "Explore landmarks and popular tourist destinations.",
  },
  {
    emoji: "🚶",
    title: "Walking Spots",
    description: "Perfect places for walks, conversations and relaxation.",
  },
];

export default function ExploreCategories() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-12 text-center">
        <h2 className="mb-3 text-3xl font-bold">Explore Dehradun by Interest</h2>

        <p
          style={{
            color: "rgb(var(--muted))",
          }}
        >
          Find places based on what you love doing.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <div
            key={category.title}
            className="rounded-2xl border p-6 transition-all hover:-translate-y-1 hover:shadow-xl"
            style={{
              backgroundColor: "rgb(var(--surface))",
              borderColor: "rgb(var(--border))",
            }}
          >
            <div className="mb-4 text-4xl">{category.emoji}</div>

            <h3 className="mb-2 text-xl font-semibold">{category.title}</h3>

            <p
              style={{
                color: "rgb(var(--muted))",
              }}
            >
              {category.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
