// Date formatting for things that happen in Dehradun (events).
//
// Pages render on the server, and the server may run in UTC — formatting
// without an explicit timeZone would show a 6:00 pm event as 12:30 pm.
// Always format event dates in IST.

export const IST = "Asia/Kolkata";

const fmt = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: IST, ...options });

const dayFmt = fmt({ day: "2-digit" });
const monthFmt = fmt({ month: "short" });
const shortDateFmt = fmt({ weekday: "short", day: "numeric", month: "short" });
const longDateFmt = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
const timeFmt = fmt({ hour: "numeric", minute: "2-digit" });

type DateInput = Date | string;
const toDate = (d: DateInput) => (d instanceof Date ? d : new Date(d));

/** "07" */
export const eventDay = (d: DateInput) => dayFmt.format(toDate(d));
/** "Oct" */
export const eventMonth = (d: DateInput) => monthFmt.format(toDate(d));
/** "Sat, 12 Oct" */
export const eventShortDate = (d: DateInput) => shortDateFmt.format(toDate(d));
/** "Saturday, 12 October 2026" */
export const eventLongDate = (d: DateInput) => longDateFmt.format(toDate(d));
/** "6:00 pm" */
export const eventTime = (d: DateInput) => timeFmt.format(toDate(d));

/** Google Maps search link for a venue in Dehradun (no API key needed). */
export function mapsSearchUrl(...parts: (string | null | undefined)[]): string {
  const query = [...parts.filter(Boolean), "Dehradun"].join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
