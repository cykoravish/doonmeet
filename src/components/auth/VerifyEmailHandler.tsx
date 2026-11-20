"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

const OTP_LENGTH = 4;
const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyEmailHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (next.every((d) => d) && next.join("").length === OTP_LENGTH) {
      handleVerify(next.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    if (pasted.length === OTP_LENGTH) handleVerify(pasted);
  }

  async function handleVerify(otp: string) {
    if (!email) {
      setError("Missing email — please sign up again.");
      return;
    }

    setVerifying(true);
    setError("");
    setInfo("");

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Verification failed.");
        setDigits(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        return;
      }

      // Verified + logged in — cookies are already set by the server
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (!email || cooldown > 0) return;
    setResending(true);
    setError("");
    setInfo("");

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Couldn't resend code.");
        return;
      }
      setInfo("New code sent! Check your email.");
      setDigits(Array(OTP_LENGTH).fill(""));
      setCooldown(RESEND_COOLDOWN_SECONDS);
      inputRefs.current[0]?.focus();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[28px] leading-tight font-extrabold">Check your email</h1>
        <p className="mt-1 text-[15px] text-muted">
          {email ? (
            <>
              Enter the 4-digit code we sent to <span className="font-semibold break-all text-text">{email}</span>
            </>
          ) : (
            "Enter the 4-digit code we emailed you"
          )}
        </p>
        <p className="mt-1 text-sm text-muted">Can&apos;t find it? Check your spam folder.</p>
      </header>

      {error && <Alert type="error" message={error} />}
      {info && <Alert type="success" message={info} />}

      <div className="flex justify-center gap-3" onPaste={handlePaste} role="group" aria-label="Verification code">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            // Lets iOS/Android offer the code from the email/SMS above the keyboard.
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
            maxLength={1}
            value={digit}
            disabled={verifying}
            autoFocus={i === 0}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="h-16 w-16 rounded-[16px] border-[1.5px] border-transparent bg-surface-2 text-center font-display text-3xl font-extrabold text-text outline-none focus:border-primary focus:bg-surface disabled:opacity-50"
          />
        ))}
      </div>

      <Button size="lg" onClick={() => handleVerify(digits.join(""))} loading={verifying}>
        Verify & continue
      </Button>

      <div className="flex flex-col items-center gap-1 text-[15px] text-muted">
        <p>
          Didn&apos;t get a code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="min-h-10 font-semibold text-primary-fg hover:underline disabled:text-muted disabled:no-underline"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </p>
        <p>
          Wrong email?{" "}
          <Link href="/signup" className="font-semibold text-primary-fg hover:underline">
            Sign up again
          </Link>
        </p>
      </div>
    </div>
  );
}
