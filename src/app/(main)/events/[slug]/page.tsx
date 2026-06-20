export default function EventDetailsPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="mb-4 text-4xl font-bold">Doon Tech Meetup</h1>

      <p className="mb-8">Connect with developers and tech enthusiasts from Dehradun.</p>

      <div className="mb-10 rounded-2xl border p-6">
        <p>📅 20 June 2026</p>
        <p>📍 Rajpur Road</p>
        <p>👥 35 Attendees</p>
      </div>

      <div className="mb-10">
        <h2 className="mb-4 text-2xl font-bold">About Event</h2>

        <p>Meet local developers, discuss technology and network with like-minded people.</p>
      </div>

      <button className="rounded-lg border px-6 py-3">Join Event</button>
    </div>
  );
}
