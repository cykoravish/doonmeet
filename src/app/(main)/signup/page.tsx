import AuthShell from "@/components/auth/AuthShell";
import SignupForm from "@/components/auth/SignupForm";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata(
  "Sign Up",
  "Create your free DoonMeet account and connect with people across Dehradun."
);

export default function SignupPage() {
  return (
    <AuthShell>
      <SignupForm />
    </AuthShell>
  );
}
