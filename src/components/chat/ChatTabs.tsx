"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { Socket } from "socket.io-client";
import { Globe2, MessageCircle, Lock, Users2 } from "lucide-react";
import ChatRoom from "./ChatRoom";
import MessagesPanel from "./MessagesPanel";
import AllUsersPanel from "./AllUsersPanel";

interface CurrentUser {
  _id: string;
  name: string;
  avatar: string | null;
  isGuest: boolean;
  guestMessageCount: number;
}

interface ChatTabsProps {
  currentUser: CurrentUser | null;
}

export default function ChatTabs({ currentUser }: ChatTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const dmParam = searchParams.get("dm");
  const [tab, setTab] = useState<"public" | "messages">(dmParam ? "messages" : "public");
  const [pendingDmUserId, setPendingDmUserId] = useState<string | null>(dmParam);

  // Members panel — lives up here (not inside ChatRoom) so the trigger stays
  // visible and working no matter which tab is active. Visibility rides on
  // the URL (?members=1) so the back button, after following a member to
  // their profile, reopens it.
  const membersOpen = searchParams.get("members") === "1";
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
  const [memberCount, setMemberCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/users/count")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setMemberCount(d.total);
      })
      .catch(() => {});
  }, []);

  function openMembersPanel() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("members", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function closeMembersPanel() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("members");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  // If the ?dm= param changes (e.g. clicking "Message" again from another
  // profile while already on this page), pick it up.
  useEffect(() => {
    if (dmParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTab("messages");
      setPendingDmUserId(dmParam);
    }
  }, [dmParam]);

  function clearDmParam() {
    setPendingDmUserId(null);
    router.replace(pathname, { scroll: false });
  }

  const canUseMessages = !!currentUser && !currentUser.isGuest;

  return (
    <div className="flex h-[calc(100vh-64px-72px)] flex-col md:h-[calc(100vh-64px)]">
      {/* Tab switcher */}
      <div className="flex shrink-0 items-center gap-1 border-b border-border bg-surface px-3 py-1.5">
        <button
          onClick={() => setTab("public")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            tab === "public" ? "bg-primary text-white" : "text-muted hover:bg-primary/10"
          }`}
        >
          <Globe2 size={13} />
          Public Chat
        </button>
        <button
          onClick={() => canUseMessages && setTab("messages")}
          disabled={!canUseMessages}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            tab === "messages" ? "bg-primary text-white" : "text-muted hover:bg-primary/10"
          } ${!canUseMessages ? "cursor-not-allowed opacity-50" : ""}`}
          title={!canUseMessages ? "Sign up to send direct messages" : undefined}
        >
          {canUseMessages ? <MessageCircle size={13} /> : <Lock size={11} />}
          Messages
        </button>

        {/* Members — attractive, count-led pill so it reads as a real
            destination rather than a plain utility button. */}
        <button
          onClick={openMembersPanel}
          className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-primary transition-opacity hover:opacity-80"
          style={{ backgroundColor: "rgb(var(--primary) / 0.1)" }}
          aria-haspopup="dialog"
          aria-expanded={membersOpen}
        >
          <Users2 size={13} />
          {memberCount !== null ? `${memberCount} Dehradunis` : "Dehradunis"}
        </button>
      </div>

      <div className="min-h-0 flex-1">
        {tab === "public" && <ChatRoom currentUser={currentUser} onSocketChange={setSocketInstance} />}

        {tab === "messages" &&
          (canUseMessages ? (
            <MessagesPanel
              currentUser={currentUser}
              initialDmUserId={pendingDmUserId}
              onDmParamConsumed={clearDmParam}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Lock size={22} className="text-primary" />
              </div>
              <p className="font-bold">
                {currentUser?.isGuest ? "Guests can't send direct messages" : "Sign up to message people"}
              </p>
              <p className="mt-1 max-w-xs text-sm text-muted">
                Create a free account to start one-on-one conversations with people you meet on
                DoonMeet.
              </p>
              <Link
                href="/signup"
                className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              >
                Sign up free
              </Link>
            </div>
          ))}
      </div>

      <AllUsersPanel open={membersOpen} onClose={closeMembersPanel} socket={socketInstance} />
    </div>
  );
}
