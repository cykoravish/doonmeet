import LegalHero, { LegalDocKey } from "./LegalHero";
import LegalToc, { LegalTocItem } from "./LegalToc";

interface LegalPageShellProps {
  active: LegalDocKey;
  title: string;
  description: string;
  lastUpdated: string;
  toc: LegalTocItem[];
  children: React.ReactNode;
}

export default function LegalPageShell({
  active,
  title,
  description,
  lastUpdated,
  toc,
  children,
}: LegalPageShellProps) {
  return (
    <div className="min-h-screen">
      <LegalHero
        active={active}
        title={title}
        description={description}
        lastUpdated={lastUpdated}
      />

      <div className="mx-auto max-w-5xl px-6 py-10 md:py-14">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
          <LegalToc items={toc} />
          <div className="min-w-0 flex-1 space-y-10 md:space-y-12">{children}</div>
        </div>
      </div>
    </div>
  );
}
