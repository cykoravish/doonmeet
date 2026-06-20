interface AlertProps {
  type: "success" | "error";
  message: string;
}

export default function Alert({ type, message }: AlertProps) {
  const styles = {
    success: {
      backgroundColor: "rgb(var(--primary) / 0.08)",
      borderColor: "rgb(var(--primary) / 0.2)",
      color: "rgb(var(--primary))",
    },
    error: {
      backgroundColor: "rgb(220 38 38 / 0.08)",
      borderColor: "rgb(220 38 38 / 0.2)",
      color: "rgb(220 38 38)",
    },
  };

  return (
    <div
      className="rounded-xl border px-4 py-3 text-sm"
      style={styles[type]}
    >
      {message}
    </div>
  );
}