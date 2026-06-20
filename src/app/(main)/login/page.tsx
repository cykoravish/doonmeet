import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-6">
      <div className="w-full">
        <h1 className="mb-2 text-4xl font-bold">Welcome Back</h1>

        <p
          className="mb-8"
          style={{
            color: "rgb(var(--muted))",
          }}
        >
          Login to continue to DoonMeet.
        </p>

        <div className="space-y-4">
          <input type="email" placeholder="Email" className="w-full rounded-xl border p-4" />

          <input type="password" placeholder="Password" className="w-full rounded-xl border p-4" />

          <button
            className="w-full rounded-xl py-4 font-medium"
            style={{
              backgroundColor: "rgb(var(--primary))",
              color: "#fff",
            }}
          >
            Login
          </button>

          <button className="w-full rounded-xl border py-4">Continue as Guest</button>
        </div>

        <p className="mt-6 text-center">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            style={{
              color: "rgb(var(--primary))",
            }}
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
