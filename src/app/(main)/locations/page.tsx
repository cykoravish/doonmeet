export default function LocationsPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-12">
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">
          Locations
        </h1>

        <p
          style={{
            color: "rgb(var(--muted))",
          }}
        >
          Discover people, activity and meetup spots across Dehradun.
        </p>
      </div>

      <div
        className="mb-16 flex h-[450px] items-center justify-center rounded-2xl border"
        style={{
          backgroundColor: "rgb(var(--surface))",
          borderColor: "rgb(var(--border))",
        }}
      >
        🗺️ Dehradun Map Coming Soon
      </div>

      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold">
          People Nearby
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border p-5">
            <h3 className="font-semibold">Rohit</h3>
            <p>2 km away</p>
          </div>

          <div className="rounded-2xl border p-5">
            <h3 className="font-semibold">Priya</h3>
            <p>Rajpur Road</p>
          </div>

          <div className="rounded-2xl border p-5">
            <h3 className="font-semibold">Aman</h3>
            <p>Clock Tower</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-bold">
          Popular Meetup Spots
        </h2>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border p-5">
            Clock Tower
          </div>

          <div className="rounded-2xl border p-5">
            FRI
          </div>

          <div className="rounded-2xl border p-5">
            Rajpur Road
          </div>

          <div className="rounded-2xl border p-5">
            Robber&apos;s Cave
          </div>
        </div>
      </section>
    </div>
  );
}