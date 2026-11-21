import Link from "next/link";
import { CircleCheck, Clock, XCircle } from "lucide-react";
import { getSessionUser } from "@/lib/getSessionUser";
import { settleSupportOrder, type SupportStatus } from "@/lib/support";
import { supportOrderIdSchema } from "@/validations/support";
import { noIndexMetadata } from "@/lib/seo";
import { buttonClasses } from "@/components/ui/Button";

export const metadata = noIndexMetadata("Thank you");

// Cashfree sends people here after paying in a new window / UPI app.
export default async function SupportThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id } = await searchParams;
  const user = await getSessionUser();
  const parsed = supportOrderIdSchema.safeParse(order_id);

  let status: SupportStatus = "not_found";
  if (user && parsed.success) {
    try {
      status = await settleSupportOrder(parsed.data, String(user._id));
    } catch {
      status = "pending";
    }
  }

  const view = {
    paid: {
      icon: <CircleCheck size={44} className="text-primary-fg" aria-hidden="true" />,
      title: "Thank you! ☕",
      text: "Your support keeps DoonMeet free and growing. A Supporter badge now shows on your profile.",
    },
    pending: {
      icon: <Clock size={44} className="text-accent-fg" aria-hidden="true" />,
      title: "Confirming your payment…",
      text: "This can take a minute. If money was deducted, it will be confirmed shortly — no need to pay again.",
    },
    failed: {
      icon: <XCircle size={44} className="text-danger" aria-hidden="true" />,
      title: "Payment not completed",
      text: "Nothing was charged. You can try again any time.",
    },
    not_found: {
      icon: <XCircle size={44} className="text-muted" aria-hidden="true" />,
      title: "We couldn't find this payment",
      text: user ? "Check the link, or contact us if money was deducted." : "Log in with the account you paid from to see it.",
    },
  }[status];

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 pt-10 pb-16 text-center">
      {view.icon}
      <h1 className="mt-3 text-2xl font-extrabold">{view.title}</h1>
      <p className="mt-1 text-[15px] text-muted">{view.text}</p>
      <div className="mt-6 flex gap-2">
        {status === "pending" && (
          <Link href={`/support/thanks?order_id=${order_id ?? ""}`} className={buttonClasses("outline", "md")}>
            Check again
          </Link>
        )}
        <Link href={status === "paid" ? "/profile" : "/support"} className={buttonClasses("primary", "md")}>
          {status === "paid" ? "See your badge" : "Back to Support"}
        </Link>
      </div>
    </div>
  );
}
