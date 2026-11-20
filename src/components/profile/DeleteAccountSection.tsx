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
  const helperHint = hasPassword
    ? "Enter your current account password."
    : "Type the word DELETE (all caps) exactly to confirm.";

  function validateBeforeSubmit(): string | null {
    if (!confirmation.trim()) {
      return hasPassword ? "Please enter your password." : 'Please type "DELETE" to confirm.';
    }
    if (!hasPassword && confirmation.trim().toUpperCase() !== "DELETE") {
      return 'That doesn\'t match. Please type "DELETE" exactly to confirm.';
    }
    return null;
  }

  async function handleDelete() {
    const validationError = validateBeforeSubmit();
    if (validationError) {
      setError(validationError);
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
        setError(
          data?.message ||
            (hasPassword
              ? "Incorrect password. Please try again."
              : 'Please type "DELETE" exactly to confirm.')
        );
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
    <div className="mt-8 rounded-[20px] border border-danger/40 bg-danger/5 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-danger/10 text-danger">
          <AlertTriangle size={19} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-danger">Delete account</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            This permanently deletes your account. Your profile, photos, and personal details are
            removed. Your existing posts, comments, and messages stay visible to others but will
            show as &quot;Deleted User&quot;. This cannot be undone.
          </p>

          {!expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mt-2 min-h-11 text-sm font-semibold text-danger underline"
            >
              Delete my account
            </button>
          ) : (
            <div className="mt-4 space-y-3">
              {error && <Alert type="error" message={error} />}

              <div>
                <Input
                  label={confirmLabel}
                  type={hasPassword ? "password" : "text"}
                  value={confirmation}
                  onChange={(e) => {
                    setConfirmation(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder={hasPassword ? "••••••••" : "DELETE"}
                  autoComplete={hasPassword ? "current-password" : "off"}
                  autoCapitalize={hasPassword ? undefined : "characters"}
                  disabled={loading}
                />
                <p className="mt-1 text-sm text-muted">{helperHint}</p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="secondary"
                  className="w-full sm:flex-1"
                  onClick={() => {
                    setExpanded(false);
                    setConfirmation("");
                    setError("");
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button variant="danger" className="w-full sm:flex-1" onClick={handleDelete} loading={loading}>
                  Permanently delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
