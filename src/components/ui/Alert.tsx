import { CircleAlert, CircleCheck, Info } from "lucide-react";

interface AlertProps {
  type: "success" | "error" | "info";
  message: string;
}

const STYLES = {
  success: { box: "bg-primary-soft text-primary-fg", Icon: CircleCheck },
  error: { box: "bg-danger/10 text-danger", Icon: CircleAlert },
  info: { box: "bg-accent-soft text-accent-fg", Icon: Info },
} as const;

export default function Alert({ type, message }: AlertProps) {
  const { box, Icon } = STYLES[type];

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-[14px] px-4 py-3 text-sm font-medium ${box}`}
    >
      <Icon size={18} className="mt-px shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
