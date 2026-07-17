import type { Metadata } from "next";
import LegalPageShell from "@/components/legal/LegalPageShell";
import { LegalSection, LegalCallout, LegalList, LegalContact } from "@/components/legal/LegalSection";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | DoonMeet",
  description:
    "DoonMeet's refund and cancellation policy for current and upcoming paid features.",
};

const LAST_UPDATED = "17 July 2026";

const TOC = [
  { id: "overview", number: "01", label: "Overview" },
  { id: "no-refunds", number: "02", label: "All sales are final" },
  { id: "what-this-covers", number: "03", label: "What this covers" },
  { id: "exceptions", number: "04", label: "Limited exceptions" },
  { id: "subscriptions", number: "05", label: "Cancelling a subscription" },
  { id: "events", number: "06", label: "Paid events" },
  { id: "how-to-request", number: "07", label: "How to reach us" },
  { id: "chargebacks", number: "08", label: "Chargebacks" },
  { id: "changes", number: "09", label: "Changes to this policy" },
  { id: "contact", number: "10", label: "Contact us" },
];

export default function RefundPolicyPage() {
  return (
    <LegalPageShell
      active="refund"
      title="Refund & Cancellation Policy"
      description="DoonMeet is free today. This policy explains how payments will work once paid features launch, and what to expect if something goes wrong with a charge."
      lastUpdated={LAST_UPDATED}
      toc={TOC}
    >
      <LegalSection id="overview" number="01" title="Overview">
        <p>
          DoonMeet is currently <strong>free to use</strong> — there are no paid features today,
          so there is nothing to refund. We&apos;re publishing this policy ahead of time so it&apos;s
          clear and in place before we introduce paid features (such as premium account features,
          paid event tools, or similar upgrades) on the platform.
        </p>
        <p>
          Once paid features go live, this policy will govern all payments made on DoonMeet,
          alongside our{" "}
          <a href="/terms" className="font-semibold underline" style={{ color: "rgb(var(--primary))" }}>
            Terms of Service
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="no-refunds" number="02" title="All sales are final">
        <LegalCallout tone="danger" title="No refunds once a payment is completed">
          <p>
            Except for the limited situations described in Section 4, all payments made on
            DoonMeet are <strong>final and non-refundable</strong>. This applies regardless of
            whether you use the paid feature, forget to cancel a renewing subscription before it
            bills, or change your mind after paying.
          </p>
        </LegalCallout>
        <p>
          We&apos;d rather be upfront about this now than surprise you later: DoonMeet does not
          offer refunds, credits, or exchanges for completed payments. Please review what you&apos;re
          paying for carefully before confirming any purchase.
        </p>
      </LegalSection>

      <LegalSection id="what-this-covers" number="03" title="What this covers">
        <p>This no-refund policy applies to all current and future paid offerings on DoonMeet, including but not limited to:</p>
        <LegalList
          items={[
            <>Premium account features or subscription plans.</>,
            <>Paid tools for creating or promoting events (e.g. boosted listings, ticketing).</>,
            <>Any one-time purchase, add-on, or in-app upgrade we introduce.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="exceptions" number="04" title="Limited exceptions">
        <p>
          We want the no-refund policy to be strict but fair. We will consider a refund only in
          these narrow cases, and only if you contact us within <strong>7 days</strong> of the
          charge:
        </p>
        <LegalList
          items={[
            <><strong>Duplicate charge</strong> — you were billed more than once for the same purchase due to a technical error.</>,
            <><strong>Unauthorised charge</strong> — a payment was made on your account without your authorisation, verified through our standard account-security process.</>,
            <><strong>Complete non-delivery</strong> — you paid for a feature that never activated on your account due to a fault on our end, and it&apos;s confirmed not to be a user-side issue (e.g. browser cache, incorrect account).</>,
          ]}
        />
        <p>
          Outside of these cases — including simply not using a feature you paid for, forgetting
          to cancel before renewal, or dissatisfaction with a feature that worked as described —
          no refund will be issued. Approved exceptions are refunded to the original payment
          method through our payment gateway and may take several business days to reflect.
        </p>
      </LegalSection>

      <LegalSection id="subscriptions" number="05" title="Cancelling a subscription">
        <p>Once subscription plans are available, the following will apply:</p>
        <LegalList
          items={[
            <>You can cancel a recurring subscription at any time from your account settings.</>,
            <>Cancelling stops the <strong>next</strong> billing cycle — it does not refund the current, already-paid period. You&apos;ll keep access to the paid feature until the end of the period you&apos;ve already paid for.</>,
            <>There are no partial refunds or credits for unused time within a billing period.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="events" number="06" title="Paid events">
        <p>
          If DoonMeet introduces paid event tickets in the future, please note that event
          cancellations, rescheduling, and refunds for the event itself are the responsibility of
          the individual event organiser, not DoonMeet — consistent with Section 7 of our{" "}
          <a href="/terms" className="font-semibold underline" style={{ color: "rgb(var(--primary))" }}>
            Terms of Service
          </a>
          , which explains that DoonMeet is a listing platform and not the organiser of user-created
          events. Any platform fee charged by DoonMeet itself for facilitating a paid event follows
          the no-refund policy in Section 2.
        </p>
      </LegalSection>

      <LegalSection id="how-to-request" number="07" title="How to reach us">
        <p>
          If you believe your situation falls under one of the limited exceptions in Section 4,
          email us with:
        </p>
        <LegalList
          items={[
            <>The email address linked to your DoonMeet account.</>,
            <>The date and approximate amount of the charge.</>,
            <>A short description of what happened.</>,
          ]}
        />
        <p>We&apos;ll review and respond within a reasonable time. Submitting a request does not guarantee a refund will be approved.</p>
      </LegalSection>

      <LegalSection id="chargebacks" number="08" title="Chargebacks">
        <p>
          Please contact us before filing a chargeback or dispute with your bank or payment
          provider — most issues can be resolved faster this way. Filing a chargeback without
          first reaching out may result in suspension of your DoonMeet account while the dispute
          is investigated.
        </p>
      </LegalSection>

      <LegalSection id="changes" number="09" title="Changes to this policy">
        <p>
          We may update this policy as we launch new paid features or payment methods. We&apos;ll
          update the &quot;Last updated&quot; date above, and the policy in effect at the time of
          your payment will apply to that transaction.
        </p>
      </LegalSection>

      <LegalSection id="contact" number="10" title="Contact us">
        <p>Questions about a charge, or about this policy in general? Reach out any time.</p>
      </LegalSection>

      <LegalContact />
    </LegalPageShell>
  );
}