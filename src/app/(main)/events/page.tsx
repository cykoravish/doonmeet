import Link from "next/link";

const events = [
  {
    title: "Doon Tech Meetup",
    date: "20 June 2026",
    location: "Rajpur Road",
  },
  {
    title: "Photography Walk",
    date: "25 June 2026",
    location: "FRI",
  },
  {
    title: "Coffee Networking",
    date: "28 June 2026",
    location: "Clock Tower",
  },
  {
    title: "Weekend Trek",
    date: "30 June 2026",
    location: "Mussoorie Road",
  },
];

export default function EventsPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-12">
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">Events</h1>

        <p
          className="max-w-2xl"
          style={{
            color: "rgb(var(--muted))",
          }}
        >
          Discover meetups, activities and events happening across Dehradun.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {events.map((event) => (
          <Link key={event.title} href="#" className="rounded-2xl border p-6">
            <h2 className="mb-3 text-xl font-semibold">{event.title}</h2>

            <p className="mb-2">{event.date}</p>

            <p>{event.location}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
