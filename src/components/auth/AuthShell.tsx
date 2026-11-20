import AuthBrandPanel from "./AuthBrandPanel";

// Shared layout for login / signup / verify / forgot / reset.
// Phones: just the form, top-aligned (keyboard-friendly — no vertical
// centring that jumps when the keyboard opens). Desktop: photo panel + form.
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[calc(100dvh-3.5rem)] md:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1fr_480px]">
      <AuthBrandPanel />
      <div className="flex justify-center px-4 pt-6 pb-10 sm:items-center sm:px-8 sm:py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
