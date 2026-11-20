interface WelcomeHeaderProps {
  name: string;
}

function greetingFor(date: Date): string {
  // Server may run in UTC — always greet in Dehradun's time.
  const hour = Number(
    new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(date)
  );
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function WelcomeHeader({ name }: WelcomeHeaderProps) {
  const firstName = name.trim().split(/\s+/)[0] || "there";

  return (
    <header>
      <p className="text-[15px] text-muted">
        {greetingFor(new Date())}, {firstName}
      </p>
      <h1 className="mt-0.5 text-[28px] leading-tight font-extrabold sm:text-4xl">
        What&apos;s happening in Doon?
      </h1>
    </header>
  );
}
