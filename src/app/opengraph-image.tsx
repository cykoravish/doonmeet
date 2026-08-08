import { ImageResponse } from "next/og";

// Runs on the Node.js runtime (this app uses a custom server, not Vercel
// Edge), and Next generates this once at build/first-request and caches it.
export const runtime = "nodejs";
export const alt = "DoonMeet — Connect with Dehradun";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0e0c",
        backgroundImage:
          "radial-gradient(circle at 25% 20%, rgba(40,160,100,0.35), transparent 45%), radial-gradient(circle at 80% 80%, rgba(194,140,74,0.18), transparent 40%)",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 20px",
          borderRadius: 999,
          border: "1px solid rgba(72,210,140,0.35)",
          color: "#48d28c",
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: 3,
          textTransform: "uppercase",
          marginBottom: 28,
        }}
      >
        Dehradun&apos;s Own Social Platform
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 104,
          fontWeight: 700,
          color: "#ffffff",
          letterSpacing: -2,
        }}
      >
        Doon<span style={{ color: "#48d28c" }}>Meet</span>
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 22,
          fontSize: 34,
          color: "#a8c0b4",
          textAlign: "center",
        }}
      >
        Meet people, events &amp; communities across Dehradun
      </div>
    </div>,
    { ...size }
  );
}
