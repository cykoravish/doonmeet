export default function ChatPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-12">
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">Community Chat</h1>

        <p
          className="max-w-2xl"
          style={{
            color: "rgb(var(--muted))",
          }}
        >
          Join conversations, meet people and discuss what&apos;s happening in Dehradun.
        </p>
      </div>

      <div
        className="rounded-2xl border"
        style={{
          borderColor: "rgb(var(--border))",
        }}
      >
        <div
          className="border-b p-4"
          style={{
            borderColor: "rgb(var(--border))",
          }}
        >
          💬 DoonMeet General Chat
        </div>

        <div className="h-[500px] space-y-4 overflow-y-auto p-4">
          <div>
            <strong>Rohit:</strong> Anyone near Rajpur Road today?
          </div>

          <div>
            <strong>Priya:</strong> Looking for photography spots.
          </div>

          <div>
            <strong>Aman:</strong> Any tech meetups this weekend?
          </div>
        </div>

        <div
          className="border-t p-4"
          style={{
            borderColor: "rgb(var(--border))",
          }}
        >
          <input
            type="text"
            placeholder="Type a message..."
            className="w-full rounded-xl border p-3"
          />
        </div>
      </div>
    </div>
  );
}
