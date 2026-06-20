import AuthBrandPanel from "@/components/auth/AuthBrandPanel";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata = {
  title: "Forgot Password | DoonMeet",
  description: "Reset your DoonMeet account password.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="grid min-h-[calc(100vh-64px)] lg:grid-cols-[1fr_480px]">
      <AuthBrandPanel />
      <div
        className="flex items-center justify-center px-8 py-12"
        style={{ backgroundColor: "rgb(var(--background))" }}
      >
        <div className="w-full max-w-sm">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}