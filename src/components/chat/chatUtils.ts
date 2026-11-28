// Shared helpers for the public room and DM windows.

export interface ChatMessageLike {
  _id: string;
  createdAt: string;
  sender: { _id: string; name: string; avatar: string | null };
}

export interface ChatRow<T extends ChatMessageLike> {
  msg: T;
  /** Position in the full message list. */
  index: number;
  /** Day label ("Today", "Yesterday", "12 March") — shown when it changes. */
  dayLabel: string;
  showDivider: boolean;
  firstInGroup: boolean;
  lastInGroup: boolean;
  time: string;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getDayLabel(date: Date, today = new Date()): string {
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Pre-computes everything the message list needs (dividers, grouping, time
 * strings) in one pass. Call inside useMemo so a new incoming message doesn't
 * re-format every date in a long history — that matters on low-end phones.
 */
export function buildChatRows<T extends ChatMessageLike>(messages: T[]): ChatRow<T>[] {
  const today = new Date();
  const dates = messages.map((m) => new Date(m.createdAt));
  const labels = dates.map((d) => getDayLabel(d, today));

  return messages.map((msg, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const showDivider = i === 0 || labels[i] !== labels[i - 1];
    return {
      msg,
      index: i,
      dayLabel: labels[i],
      showDivider,
      firstInGroup: showDivider || prev?.sender._id !== msg.sender._id,
      lastInGroup: !next || next.sender._id !== msg.sender._id || labels[i + 1] !== labels[i],
      time: dates[i].toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }),
    };
  });
}

export interface ChatDay<T extends ChatMessageLike> {
  /** "Today", "Yesterday", "12 March" — unique per day, so it doubles as the React key. */
  label: string;
  rows: ChatRow<T>[];
}

/**
 * Splits rows into one group per day. Each day is rendered as its own block
 * so its date pill can be `position: sticky` — it stays on top while you
 * scroll through that day and the next day's pill pushes it out (WhatsApp-style).
 */
export function groupRowsByDay<T extends ChatMessageLike>(rows: ChatRow<T>[]): ChatDay<T>[] {
  const days: ChatDay<T>[] = [];
  for (const row of rows) {
    const last = days[days.length - 1];
    if (!last || row.showDivider) days.push({ label: row.dayLabel, rows: [row] });
    else last.rows.push(row);
  }
  return days;
}

/** Appends a message unless one with the same id is already in the list (reconnect/REST-fallback safety). */
export function appendUnique<T extends { _id: string }>(list: T[], message: T): T[] {
  return list.some((m) => m._id === message._id) ? list : [...list, message];
}

/** Prepends an older page, dropping anything already present. */
export function prependUnique<T extends { _id: string }>(list: T[], older: T[]): T[] {
  const existing = new Set(list.map((m) => m._id));
  return [...older.filter((m) => !existing.has(m._id)), ...list];
}
