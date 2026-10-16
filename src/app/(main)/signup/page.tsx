import AuthBrandPanel from "@/components/auth/AuthBrandPanel";
import SignupForm from "@/components/auth/SignupForm";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata("Sign Up", "Create your free DoonMeet account and connect with people across Dehradun.");

export default function SignupPage() {
  return (
    <div className="grid min-h-[calc(100vh-64px)] lg:grid-cols-[1fr_480px]">
      <AuthBrandPanel />
      <div
        className="flex items-center justify-center px-8 py-12"
        style={{ backgroundColor: "rgb(var(--background))" }}
      >
        <div className="w-full max-w-sm">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}