import Image from "next/image";
import { MapPin } from "lucide-react";

// Desktop-only side panel for auth pages (display:none below lg, so phones
// download nothing for it — next/image is lazy by default). Uses our own
// optimised Clock Tower photo instead of a remote stock image, and no
// made-up stats.
export default function AuthBrandPanel() {
  return (
    <div className="relative hidden overflow-hidden lg:block">
      <Image
        src="/images/hero-clock-tower.webp"
        alt=""
        fill
        sizes="(min-width: 1024px) 60vw, 0px"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/10" aria-hidden="true" />

      <div className="relative flex h-full flex-col justify-end p-12 text-white">
        <p className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
          <MapPin size={15} aria-hidden="true" />
          Dehradun, Uttarakhand
        </p>
        <p className="font-display text-5xl leading-[1.05] font-extrabold">
          Where Doon
          <br />
          comes alive.
        </p>
        <p className="mt-4 max-w-md text-lg text-white/80">
          Chat with people nearby, find events and join communities — a free local space made for Dehradun.
        </p>
      </div>
    </div>
  );
}
