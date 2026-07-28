import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { MapPin, MessageCircle, Calendar } from "lucide-react";
import type { Metadata } from "next";
import { getPublicUser } from "@/lib/getPublicUser";

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(
  process.env.ACCESS_TOKEN_SECRET
);

async function getCurrentUserId() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, ACCESS_TOKEN_SECRET);
    return payload.userId as string ?? null;
  } catch {
    return null;
  }
}

interface UserProfilePageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({
  params,
}: UserProfilePageProps): Promise<Metadata> {
  const { userId } = await params;
  const user = await getPublicUser(userId);
  if (!user) return { title: "User Not Found | DoonMeet" };
  return {
    title: `${user.name} | DoonMeet`,
    description: user.bio || `${user.name}'s profile on DoonMeet`,
  };
}

export default async function PublicProfilePage({ params }: UserProfilePageProps) {
  const { userId } = await params;

  const [user, currentUserId] = await Promise.all([
    getPublicUser(userId),
    getCurrentUserId(),
  ]);

  if (!user) notFound();

  const isOwnProfile = currentUserId === userId;
  const joinedDate = new Date(user.createdAt).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen">

      {/* Hero */}
      <div
        className="border-b py-12"
        style={{
          background: "linear-gradient(135deg, rgb(var(--primary) / 0.06) 0%, transparent 60%)",
          borderColor: "rgb(var(--border))",
        }}
      >
        <div className="mx-auto max-w-2xl px-6">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-6">

            {/* Avatar */}
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                width={96}
                height={96}
                className="rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-3xl font-black text-white"
                style={{ backgroundColor: "rgb(var(--primary))" }}
              >
                {user.name[0]?.toUpperCase()}
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-2xl font-black">{user.name}</h1>

              {user.bio && (
                <p
                  className="mt-1.5 text-sm leading-relaxed"
                  style={{ color: "rgb(var(--muted))" }}
                >
                  {user.bio}
                </p>
              )}

              <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-3">
                {user.address && (
                  <div
                    className="flex items-center gap-1 text-xs"
                    style={{ color: "rgb(var(--muted))" }}
                  >
                    <MapPin size={11} />
                    {user.address}
                  </div>
                )}
                <div
                  className="flex items-center gap-1 text-xs"
                  style={{ color: "rgb(var(--muted))" }}
                >
                  <Calendar size={11} />
                  Joined {joinedDate}
                </div>
              </div>

              {/* Interests */}
              {user.interests?.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-1.5">
                  {user.interests.map((i: string) => (
                    <span
                      key={i}
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                      style={{
                        backgroundColor: "rgb(var(--primary) / 0.1)",
                        color: "rgb(var(--primary))",
                      }}
                    >
                      {i}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
                {isOwnProfile ? (
                  <Link
                    href="/profile"
                    className="flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-80"
                    style={{ borderColor: "rgb(var(--border))" }}
                  >
                    Edit Profile
                  </Link>
                ) : (
                  <>
                    {currentUserId && (
                      <StartDMButton recipientId={userId} recipientName={user.name} />
                    )}
                    {!currentUserId && (
                      <Link
                        href="/login"
                        className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: "rgb(var(--primary))" }}
                      >
                        <MessageCircle size={13} />
                        Send Message
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Public info */}
      <div className="mx-auto max-w-2xl px-6 py-8 space-y-4">
        {(user.gender || user.email) && (
          <div
            className="rounded-2xl border p-5 space-y-3"
            style={{
              borderColor: "rgb(var(--border))",
              backgroundColor: "rgb(var(--surface))",
            }}
          >
            <h2 className="font-bold text-sm">About</h2>
            {user.gender && (
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "rgb(var(--muted))" }}>Gender</span>
                <span className="font-medium capitalize">{user.gender.replace("_", " ")}</span>
              </div>
            )}
            {user.email && (
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "rgb(var(--muted))" }}>Email</span>
                <span className="font-medium">{user.email}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Static link — no client interactivity needed yet, so this stays server-rendered.
function StartDMButton({ recipientId, recipientName }: { recipientId: string; recipientName: string }) {
  return (
    <Link
      href={`/chat?dm=${recipientId}`}
      className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
      style={{ backgroundColor: "rgb(var(--primary))" }}
    >
      <MessageCircle size={13} />
      Message {recipientName.split(" ")[0]}
    </Link>
  );
}