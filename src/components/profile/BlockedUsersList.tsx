"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Ban, Loader2 } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { setBlocked } from "@/lib/safety-client";

interface BlockedUser {
  _id: string;
  name: string;
  avatar: string | null;
}

// Settings → Privacy: people I've blocked, with one-tap Unblock.
export default function BlockedUsersList() {
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users/blocked")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function unblock(id: string) {
    setBusyId(id);
    const ok = await setBlocked(id, false);
    setBusyId(null);
    if (ok) setUsers((prev) => prev.filter((u) => u._id !== id));
  }

  return (
    <section aria-labelledby="blocked-title" className="mt-6">
      <h3 id="blocked-title" className="text-base font-bold">
        Blocked people
      </h3>
      <p className="mt-0.5 mb-3 text-sm text-muted">They can&apos;t message you, and you can&apos;t message them.</p>

      {loading ? (
        <Loader2 size={18} className="animate-spin text-muted" aria-label="Loading blocked people" />
      ) : users.length === 0 ? (
        <p className="flex items-center gap-2 rounded-[16px] bg-surface-2 p-3.5 text-[15px] text-muted">
          <Ban size={18} aria-hidden="true" />
          You haven&apos;t blocked anyone.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {users.map((u) => (
            <li key={u._id} className="flex items-center gap-3 rounded-[16px] border border-border p-2.5 pl-3">
              <Link href={`/users/${u._id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={u.name} src={u.avatar} size={40} />
                <span className="truncate font-semibold text-text">{u.name}</span>
              </Link>
              <button
                type="button"
                onClick={() => unblock(u._id)}
                disabled={busyId === u._id}
                className="flex h-10 shrink-0 items-center gap-1.5 rounded-[12px] bg-surface-2 px-3.5 text-sm font-semibold text-text hover:bg-border disabled:opacity-60"
              >
                {busyId === u._id && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
                Unblock
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
