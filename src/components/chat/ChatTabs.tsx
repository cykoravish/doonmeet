"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { Socket } from "socket.io-client";
import { Globe2, MessageCircle, Lock, Users2, ChevronRight } from "lucide-react";
import ChatRoom from "./ChatRoom";
import MessagesPanel from "./MessagesPanel";
import AllUsersPanel from "./AllUsersPanel";

interface CurrentUser {
  _id: string;
  name: string;
  avatar: string | null;
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

  const canUseMessages = !!currentUser;

  return (
    // Fills the <main> the chat layout gives it exactly (100% — that main
    // is already viewport-locked). The fixed mobile bottom nav still
    // overlays the bottom of this space, so on mobile we reserve room for
    // it with padding-bottom (border-box keeps our own height unchanged),
    // safe-area aware for notched/gesture-nav phones. Desktop has no bottom
    // nav, so no reservation is needed there.
    <div className="flex h-full flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
      {/* Tab switcher — flex-nowrap + shrink-0 on every item + overflow-x-auto
          as a last-resort escape hatch keep this row from ever wrapping
          text inside a button on narrow screens; labels shorten instead. */}
      <div className="flex shrink-0 flex-nowrap items-center gap-1 overflow-x-auto border-b border-border bg-surface px-2 py-1.5 sm:gap-1.5 sm:px-3">
        <button
          onClick={() => setTab("public")}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors sm:px-3 ${
            tab === "public" ? "bg-primary text-white" : "text-muted hover:bg-primary/10"
          }`}
        >
          <Globe2 size={13} />
          <span className="sm:hidden">Public</span>
          <span className="hidden sm:inline">Public Chat</span>
        </button>
        <button
          onClick={() => canUseMessages && setTab("messages")}
          disabled={!canUseMessages}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors sm:px-3 ${
            tab === "messages" ? "bg-primary text-white" : "text-muted hover:bg-primary/10"
          } ${!canUseMessages ? "cursor-not-allowed opacity-50" : ""}`}
          title={!canUseMessages ? "Sign up to send direct messages" : undefined}
        >
          {canUseMessages ? <MessageCircle size={13} /> : <Lock size={11} />}
          Messages
        </button>

        {/* Members — bordered, chevron-led pill so it visibly reads as a
            tappable destination rather than a static count label. Collapses
            to just the count on mobile so it can't force the row to wrap. */}
        <button
          onClick={openMembersPanel}
          className="group ml-auto flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 sm:gap-1.5 sm:px-3"
          style={{
            backgroundColor: "rgb(var(--primary) / 0.1)",
            borderColor: "rgb(var(--primary) / 0.35)",
          }}
          aria-haspopup="dialog"
          aria-expanded={membersOpen}
        >
          <Users2 size={13} />
          <span className="hidden sm:inline">
            {memberCount !== null ? `See ${memberCount} Dehradunis` : "See Dehradunis"}
          </span>
          <span className="sm:hidden">{memberCount !== null ? memberCount : ""}</span>
          <ChevronRight
            size={13}
            className="hidden transition-transform group-hover:translate-x-0.5 sm:block"
          />
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
              <p className="font-bold">Sign up to message people</p>
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
