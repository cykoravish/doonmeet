import { Suspense } from "react";
import AuthBrandPanel from "@/components/auth/AuthBrandPanel";
import VerifyEmailHandler from "@/components/auth/VerifyEmailHandler";

export const metadata = {
  title: "Verify Email | DoonMeet",
};

export default function VerifyEmailPage() {
  return (
    <div className="grid min-h-[calc(100vh-64px)] lg:grid-cols-[1fr_480px]">
      <AuthBrandPanel />
      <div
        className="flex items-center justify-center px-8 py-12"
        style={{ backgroundColor: "rgb(var(--background))" }}
      >
        <div className="w-full max-w-sm">
          <Suspense fallback={null}>
            <VerifyEmailHandler />
          </Suspense>
        </div>
      </div>
    </div>
  );
}