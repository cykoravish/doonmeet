import { MapPin } from "lucide-react";

export default function AuthBrandPanel() {
  return (
    <div className="relative hidden lg:flex flex-col justify-between overflow-hidden h-full min-h-screen">
      
      {/* Background image */}
      <img
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80"
        alt="Dehradun hills"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/50 to-transparent" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: "linear-gradient(135deg, rgb(var(--primary)) 0%, transparent 60%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full p-12">
        
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: "rgb(var(--primary))" }}
          >
            <MapPin size={18} color="white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">DoonMeet</span>
        </div>

        {/* Main content */}
        <div>
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className="h-px w-8"
              style={{ backgroundColor: "rgb(var(--accent))" }}
            />
            <span
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: "rgb(var(--accent))" }}
            >
              Dehradun&apos;s own
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-5xl font-black text-white leading-[1.1] mb-6">
            Where Doon
            <br />
            <span style={{ color: "rgb(var(--primary-light))" }}>
              comes alive.
            </span>
          </h2>

          {/* Stats row */}
          <div className="flex items-center gap-6">
            {[
              { value: "10K+", label: "People" },
              { value: "500+", label: "Events" },
              { value: "50+", label: "Communities" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs" style={{ color: "rgb(255 255 255 / 0.5)" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p className="text-xs" style={{ color: "rgb(255 255 255 / 0.35)" }}>
          © 2025 DoonMeet · Built for Dehradun
        </p>
      </div>
    </div>
  );
}