import CreateEventForm from "@/components/events/CreateEventForm";
import BackLink from "@/components/shared/BackLink";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata("Host an event", "Create and publish a local event in Dehradun.");

export default function CreateEventPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-3 pb-10 sm:px-6 sm:pt-6">
      <BackLink href="/events" label="All events" />
      <header className="mb-5">
        <h1 className="text-[28px] leading-tight font-extrabold sm:text-4xl">Host an event</h1>
        <p className="mt-1 text-[15px] text-muted">
          A trek, a chai meetup, a workshop — publish it and Dehradun can RSVP.
        </p>
      </header>
      <CreateEventForm />
    </div>
  );
}
