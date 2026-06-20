export default function CommunityDetailsPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-12">
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">Developers of Dehradun</h1>

        <p
          className="max-w-2xl"
          style={{
            color: "rgb(var(--muted))",
          }}
        >
          Connect with developers, founders and tech enthusiasts across Dehradun.
        </p>
      </div>

      <div className="mb-12 rounded-2xl border p-6">
        <div className="flex flex-wrap gap-6">
          <div>
            <h3 className="font-semibold">245</h3>
            <p>Members</p>
          </div>

          <div>
            <h3 className="font-semibold">42</h3>
            <p>Posts</p>
          </div>

          <div>
            <h3 className="font-semibold">12</h3>
            <p>Online</p>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="mb-6 text-2xl font-bold">Recent Discussions</h2>

        <div className="space-y-4">
          <div className="rounded-2xl border p-5">
            <h3 className="mb-2 font-semibold">Anyone interested in a React meetup?</h3>

            <p>12 replies</p>
          </div>

          <div className="rounded-2xl border p-5">
            <h3 className="mb-2 font-semibold">Best places to work remotely in Dehradun?</h3>

            <p>8 replies</p>
          </div>

          <div className="rounded-2xl border p-5">
            <h3 className="mb-2 font-semibold">Looking for Next.js developers</h3>

            <p>5 replies</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-6">
        <h2 className="mb-4 text-2xl font-bold">Start a Discussion</h2>

        <div className="rounded-xl border p-4">Write something...</div>
      </div>
    </div>
  );
}
