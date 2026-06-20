import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-6">
      <div className="w-full">
        <h1 className="mb-2 text-4xl font-bold">Join DoonMeet</h1>

        <p
          className="mb-8"
          style={{
            color: "rgb(var(--muted))",
          }}
        >
          Connect with people and communities across Dehradun.
        </p>

        <div className="space-y-4">
          <input type="text" placeholder="Full Name" className="w-full rounded-xl border p-4" />

          <input type="email" placeholder="Email" className="w-full rounded-xl border p-4" />

          <input type="password" placeholder="Password" className="w-full rounded-xl border p-4" />

          <button
            className="w-full rounded-xl py-4 font-medium"
            style={{
              backgroundColor: "rgb(var(--primary))",
              color: "#fff",
            }}
          >
            Create Account
          </button>

          <button className="w-full rounded-xl border py-4">Continue as Guest</button>
        </div>

        <p className="mt-6 text-center">
          Already have an account?{" "}
          <Link
            href="/login"
            style={{
              color: "rgb(var(--primary))",
            }}
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
