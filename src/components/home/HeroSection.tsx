import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative h-[calc(100vh-64px)] overflow-hidden">
      <Image
        src="/images/hero-clock-tower.webp"
        alt="Clock Tower Dehradun"
        fill
        priority
        className="object-cover"
      />

      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-6">
        <div className="max-w-2xl rounded-2xl bg-black/20 p-6 backdrop-blur-xs">
          <div className="max-w-3xl">
            <p className="mb-4 font-medium" style={{ color: "rgb(var(--primary))" }}>
              📍 Built for Dehradun
            </p>

            <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-5xl">
              Discover Events,
              <br />
              Communities & People
              <br />
              in Dehradun
            </h1>

            <p className="mb-8 max-w-2xl text-lg text-gray-200">
              Connect with locals, join communities, explore events, and meet like-minded people
              across Dehradun.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="rounded-lg px-6 py-3 font-medium"
                style={{
                  backgroundColor: "rgb(var(--primary))",
                  color: "white",
                }}
              >
                Explore Locations
              </button>

              <button className="rounded-lg border border-white/30 bg-white/10 px-6 py-3 font-medium text-white backdrop-blur-sm">
                Join Communities
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
