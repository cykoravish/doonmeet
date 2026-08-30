"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import Alert from "@/components/ui/Alert";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface DeleteAccountSectionProps {
  hasPassword: boolean;
}

// Danger-zone card in profile > Security. Permanently deletes the caller's
// account (soft-delete + anonymize on the backend — see DELETE /api/users/me).
export default function DeleteAccountSection({ hasPassword }: DeleteAccountSectionProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const confirmLabel = hasPassword ? "Your password" : 'Type "DELETE" to confirm';

  async function handleDelete() {
    if (!confirmation) {
      setError(hasPassword ? "Please enter your password." : 'Please type "DELETE" to confirm.');
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/users/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.message || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      className="mt-8 rounded-xl border p-4"
      style={{ borderColor: "rgb(220 38 38 / 0.4)", backgroundColor: "rgb(220 38 38 / 0.04)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: "rgb(220 38 38 / 0.1)" }}
        >
          <AlertTriangle size={15} style={{ color: "rgb(220 38 38)" }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold" style={{ color: "rgb(220 38 38)" }}>
            Delete Account
          </p>
          <p className="mt-1 text-xs" style={{ color: "rgb(var(--muted))" }}>
            This permanently deletes your account. Your profile, photos, and personal details are
            removed. Your existing posts, comments, and messages stay visible to others but will
            show as &quot;Deleted User&quot;. This cannot be undone.
          </p>

          {!expanded ? (
            <button
              onClick={() => setExpanded(true)}
              className="mt-3 text-xs font-semibold underline"
              style={{ color: "rgb(220 38 38)" }}
            >
              Delete my account
            </button>
          ) : (
            <div className="mt-4 space-y-3">
              {error && <Alert type="error" message={error} />}

              <Input
                label={confirmLabel}
                type={hasPassword ? "password" : "text"}
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder={hasPassword ? "••••••••" : "DELETE"}
                autoComplete={hasPassword ? "current-password" : "off"}
              />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="w-auto flex-1"
                  onClick={() => {
                    setExpanded(false);
                    setConfirmation("");
                    setError("");
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  className="w-auto flex-1"
                  style={{ backgroundColor: "rgb(220 38 38)", color: "white" }}
                  onClick={handleDelete}
                  loading={loading}
                >
                  Permanently Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
