export default function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3" role={label ? undefined : "separator"}>
      <div className="h-px flex-1 bg-border" />
      {label && <span className="text-sm text-muted">{label}</span>}
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
