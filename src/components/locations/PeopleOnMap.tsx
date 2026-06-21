import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock } from "lucide-react";

interface LocationPin {
  userId: string;
  name: string;
  avatar: string | null;
  coords: { lat: number; lng: number };
  label: string | null;
  checkedInAt: string;
}

interface PeopleOnMapProps {
  pins: LocationPin[];
  currentUserId?: string;
}

export default function PeopleOnMap({ pins, currentUserId }: PeopleOnMapProps) {
  if (pins.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border py-10 text-center"
        style={{
          borderColor: "rgb(var(--border))",
          backgroundColor: "rgb(var(--surface))",
        }}
      >
        <span className="mb-2 text-4xl">👻</span>
        <p className="font-bold text-sm">Nobody on the map yet</p>
        <p className="mt-1 text-xs" style={{ color: "rgb(var(--muted))" }}>
          Be the first to check in!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pins.map((pin) => {
        const isCurrentUser = pin.userId === currentUserId;
        const timeAgo = new Date(pin.checkedInAt).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <Link
            key={pin.userId}
            href={isCurrentUser ? "/profile" : `/users/${pin.userId}`}
            className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:opacity-80"
            style={{ backgroundColor: "rgb(var(--surface))" }}
          >
            {/* Avatar */}
            {pin.avatar ? (
              <Image
                src={pin.avatar}
                alt={pin.name}
                width={40}
                height={40}
                className="rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{
                  backgroundColor: isCurrentUser
                    ? "rgb(var(--primary))"
                    : "rgb(var(--muted))",
                }}
              >
                {pin.name[0].toUpperCase()}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-semibold">{pin.name}</p>
                {isCurrentUser && (
                  <span
                    className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{
                      backgroundColor: "rgb(var(--primary) / 0.1)",
                      color: "rgb(var(--primary))",
                    }}
                  >
                    You
                  </span>
                )}
              </div>
              {pin.label && (
                <p className="truncate text-xs" style={{ color: "rgb(var(--muted))" }}>
                  <MapPin size={10} className="inline mr-0.5" />
                  {pin.label}
                </p>
              )}
            </div>

            {/* Time */}
            <div
              className="flex shrink-0 items-center gap-1 text-xs"
              style={{ color: "rgb(var(--muted))" }}
            >
              <Clock size={10} />
              {timeAgo}
            </div>
          </Link>
        );
      })}
    </div>
  );
}