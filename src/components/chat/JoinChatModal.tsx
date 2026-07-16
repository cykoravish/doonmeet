"use client";

import { useState } from "react";
import { X, MessageCircle, Sparkles, Loader2 } from "lucide-react";

interface JoinChatModalProps {
  pendingMessage: string;
  onClose: () => void;
  onGuestSuccess: () => void;
}

export default function JoinChatModal({
  pendingMessage,
  onClose,
  onGuestSuccess,
}: JoinChatModalProps) {
  const [mode, setMode] = useState<"choices" | "guest-name">("choices");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGuestSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/guest-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        onGuestSuccess();
      } else {
        setError(data.message ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border p-6 sm:rounded-3xl animate-in slide-in-from-bottom-4 duration-200"
        style={{
          backgroundColor: "rgb(var(--surface))",
          borderColor: "rgb(var(--border))",
        }}
      >
        {/* Close button */}
        <div className="mb-4 flex items-start justify-between">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "rgb(var(--primary) / 0.1)" }}
          >
            <MessageCircle size={20} style={{ color: "rgb(var(--primary))" }} />
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-70"
            style={{ backgroundColor: "rgb(var(--background))" }}
          >
            <X size={15} style={{ color: "rgb(var(--muted))" }} />
          </button>
        </div>

        {mode === "choices" ? (
          <>
            <h2 className="text-lg font-bold" style={{ color: "rgb(var(--text))" }}>
              Join the conversation
            </h2>
            <p className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
              You need to join before sending messages to the Doon Public Chat.
            </p>

            {pendingMessage && (
              <div
                className="mt-3 rounded-xl border px-3 py-2.5 text-sm italic"
                style={{
                  backgroundColor: "rgb(var(--background))",
                  borderColor: "rgb(var(--border))",
                  color: "rgb(var(--text))",
                }}
              >
                “{pendingMessage}”
              </div>
            )}

            <div className="mt-5 space-y-2.5">
              <button
                onClick={() => setMode("guest-name")}
                className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-opacity hover:opacity-85"
                style={{
                  borderColor: "rgb(var(--primary) / 0.3)",
                  backgroundColor: "rgb(var(--primary) / 0.06)",
                }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: "rgb(var(--text))" }}>
                    Continue as guest
                  </p>
                  <p className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                    Jump in instantly · 20 free messages
                  </p>
                </div>
                <Sparkles size={16} style={{ color: "rgb(var(--primary))" }} />
              </button>

              <a
                href="/signup"
                className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "rgb(var(--primary))" }}
              >
                <div>
                  <p className="text-sm font-semibold">Create a free account</p>
                  <p className="text-xs" style={{ color: "rgb(255 255 255 / 0.8)" }}>
                    Unlimited messages · save your profile
                  </p>
                </div>
              </a>

              <a
                href="/login"
                className="flex w-full items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium transition-opacity hover:opacity-85"
                style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--text))" }}
              >
                Already have an account? Log in
              </a>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold" style={{ color: "rgb(var(--text))" }}>
              What should we call you?
            </h2>
            <p className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
              Guests get 20 free messages. No email or password needed — sign up
              anytime for unlimited chat.
            </p>

            <form onSubmit={handleGuestSubmit} className="mt-4 space-y-3">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter a display name"
                maxLength={30}
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                style={{
                  backgroundColor: "rgb(var(--background))",
                  borderColor: "rgb(var(--border))",
                  color: "rgb(var(--text))",
                }}
              />

              {error && (
                <p className="text-xs" style={{ color: "rgb(220 38 38)" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: "rgb(var(--primary))" }}
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                Join chat as guest
              </button>

              <button
                type="button"
                onClick={() => setMode("choices")}
                className="w-full text-center text-xs"
                style={{ color: "rgb(var(--muted))" }}
              >
                ← Back to other options
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}