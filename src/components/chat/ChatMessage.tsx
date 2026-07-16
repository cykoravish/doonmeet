import Image from "next/image";

interface ChatMessageProps {
  content: string;
  senderName: string;
  senderAvatar: string | null;
  isGuest: boolean;
  isOwn: boolean;
  createdAt: string;
}

export default function ChatMessage({
  content,
  senderName,
  senderAvatar,
  isGuest,
  isOwn,
  createdAt,
}: ChatMessageProps) {
  const time = new Date(createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      {senderAvatar ? (
        <Image
          src={senderAvatar}
          alt={senderName}
          width={32}
          height={32}
          className="h-8 w-8 shrink-0 rounded-full object-cover self-end"
        />
      ) : (
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center self-end rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: isGuest ? "rgb(var(--muted))" : "rgb(var(--primary))" }}
        >
          {senderName[0]?.toUpperCase()}
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {/* Name + badge */}
        <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold">{senderName}</span>
            {isGuest && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: "rgb(var(--muted) / 0.15)",
                  color: "rgb(var(--muted))",
                }}
              >
                guest
              </span>
            )}
          </div>

        <div
          className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
          style={{
            backgroundColor: isOwn
              ? "rgb(var(--primary))"
              : "rgb(var(--surface))",
            color: isOwn ? "white" : "rgb(var(--text))",
            borderBottomRightRadius: isOwn ? "4px" : undefined,
            borderBottomLeftRadius: !isOwn ? "4px" : undefined,
          }}
        >
          {content}
        </div>

        <span className="text-[10px]" style={{ color: "rgb(var(--muted))" }}>
          {time}
        </span>
      </div>
    </div>
  );
}   