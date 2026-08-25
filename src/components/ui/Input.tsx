interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium" style={{ color: "rgb(var(--muted))" }}>
          {label}
        </label>
      )}
      <input
        className={`w-full rounded-xl border px-4 py-3 text-base outline-none transition-all focus:ring-2 focus:ring-primary/30 sm:text-sm ${className}`}
        style={{
          backgroundColor: "rgb(var(--surface))",
          borderColor: error ? "rgb(220 38 38)" : "rgb(var(--border))",
          color: "rgb(var(--text))",
        }}
        {...props}
      />
      {error && (
        <p className="text-xs" style={{ color: "rgb(220 38 38)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
