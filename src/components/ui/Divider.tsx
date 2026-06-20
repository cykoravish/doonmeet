export default function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1" style={{ backgroundColor: "rgb(var(--border))" }} />
      {label && (
        <span className="text-xs" style={{ color: "rgb(var(--muted))" }}>
          {label}
        </span>
      )}
      <div className="h-px flex-1" style={{ backgroundColor: "rgb(var(--border))" }} />
    </div>
  );
}