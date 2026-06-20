import { Metadata } from "next";
import { CalendarPlus } from "lucide-react";
import CreateEventForm from "@/components/events/CreateEventForm";

export const metadata: Metadata = {
  title: "Create Event | DoonMeet",
  description: "Create and publish a local event in Dehradun.",
};

export default function CreateEventPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">

      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: "rgb(var(--primary) / 0.1)" }}
        >
          <CalendarPlus size={22} style={{ color: "rgb(var(--primary))" }} />
        </div>
        <div>
          <h1 className="text-2xl font-black">Create an Event</h1>
          <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
            Publish a local event for Dehradun to discover
          </p>
        </div>
      </div>

      {/* Form */}
      <div
        className="rounded-2xl border p-6"
        style={{
          borderColor: "rgb(var(--border))",
          backgroundColor: "rgb(var(--surface))",
        }}
      >
        <CreateEventForm />
      </div>
    </div>
  );
}