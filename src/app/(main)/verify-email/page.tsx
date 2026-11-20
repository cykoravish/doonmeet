import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import VerifyEmailHandler from "@/components/auth/VerifyEmailHandler";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata("Verify Email");

export default function VerifyEmailPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <VerifyEmailHandler />
      </Suspense>
    </AuthShell>
  );
}
