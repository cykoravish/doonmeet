import { Suspense } from "react";
import AuthBrandPanel from "@/components/auth/AuthBrandPanel";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata = {
  title: "Reset Password | DoonMeet",
};

export default function ResetPasswordPage() {
  return (
    <div className="grid min-h-[calc(100vh-64px)] lg:grid-cols-[1fr_480px]">
      <AuthBrandPanel />
      <div
        className="flex items-center justify-center px-8 py-12"
        style={{ backgroundColor: "rgb(var(--background))" }}
      >
        <div className="w-full max-w-sm">
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}