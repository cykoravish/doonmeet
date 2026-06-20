"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

export default function VerifyEmailHandler() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.message);
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, [token]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Email verification</h1>
        <p className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
          Verifying your email address...
        </p>
      </div>

      {status === "loading" && (
        <div className="flex items-center gap-2" style={{ color: "rgb(var(--muted))" }}>
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Verifying...</span>
        </div>
      )}

      {status === "success" && (
        <>
          <Alert type="success" message={message} />
          <Link href="/login">
            <Button>Go to login</Button>
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <Alert type="error" message={message} />
          <Link href="/signup">
            <Button variant="outline">Back to signup</Button>
          </Link>
        </>
      )}
    </div>
  );
}