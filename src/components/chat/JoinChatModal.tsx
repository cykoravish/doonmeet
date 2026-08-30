"use client";

import { X, MessageCircle } from "lucide-react";

interface JoinChatModalProps {
  pendingMessage: string;
  onClose: () => void;
}

export default function JoinChatModal({ pendingMessage, onClose }: JoinChatModalProps) {
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

        <h2 className="text-lg font-bold" style={{ color: "rgb(var(--text))" }}>
          Join the conversation
        </h2>
        <p className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
          You need an account before sending messages to the Doon Public Chat.
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
          <a
            href="/signup"
            className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "rgb(var(--primary))" }}
          >
            <div>
              <p className="text-sm font-semibold">Create a free account</p>
              <p className="text-xs" style={{ color: "rgb(255 255 255 / 0.8)" }}>
                Join in seconds · save your profile
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
      </div>
    </div>
  );
}
