import Link from "next/link";
import LegalPageShell from "@/components/legal/LegalPageShell";
import { LegalSection, LegalCallout, LegalList, LegalContact } from "@/components/legal/LegalSection";
import { GAC_PORTAL_URL, GRIEVANCE_OFFICER, GRIEVANCE_TIMELINES } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Grievance Redressal",
  description:
    "How to raise a complaint about content or conduct on DoonMeet, our Grievance Officer's contact details, response timelines and how to appeal.",
  path: "/grievance",
});

const LAST_UPDATED = "20 November 2026";

const TOC = [
  { id: "officer", number: "01", label: "Grievance Officer" },
  { id: "in-app", number: "02", label: "Report inside the app" },
  { id: "how-to-complain", number: "03", label: "How to file a complaint" },
  { id: "timelines", number: "04", label: "What happens next" },
  { id: "urgent", number: "05", label: "Urgent: intimate or impersonating content" },
  { id: "appeal", number: "06", label: "Appeal" },
];

const linkStyle = { color: "rgb(var(--primary-fg))" };

export default function GrievancePage() {
  const t = GRIEVANCE_TIMELINES;

  return (
    <LegalPageShell
      active="grievance"
      title="Grievance Redressal"
      description="Something on DoonMeet that shouldn't be there — harassment, a fake profile, unlawful or private content? Here's exactly how to tell us and what we'll do."
      lastUpdated={LAST_UPDATED}
      toc={TOC}
    >
      <LegalSection id="officer" number="01" title="Grievance Officer">
        <p>
          In accordance with the Information Technology Act, 2000 and the Information Technology
          (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, DoonMeet has
          appointed a Grievance Officer to receive and resolve complaints from users and the public.
        </p>
        <LegalCallout tone="primary" title="Contact the Grievance Officer">
          <p>
            <strong>Name:</strong> {GRIEVANCE_OFFICER.name}
            <br />
            <strong>Email:</strong>{" "}
            <a href={`mailto:${GRIEVANCE_OFFICER.email}`} className="font-semibold underline" style={linkStyle}>
              {GRIEVANCE_OFFICER.email}
            </a>
            <br />
            <strong>Location:</strong> {GRIEVANCE_OFFICER.location}
          </p>
        </LegalCallout>
      </LegalSection>

      <LegalSection id="in-app" number="02" title="Report inside the app (fastest)">
        <p>
          If someone is bothering you, the quickest way is the <strong>Report</strong> option built
          into DoonMeet. Reports are private — the person won&apos;t know who reported them.
        </p>
        <LegalList
          items={[
            <>
              <strong>Public chat:</strong> tap the person&apos;s name or photo → <em>Report</em> or{" "}
              <em>Block</em>.
            </>,
            <>
              <strong>Direct messages:</strong> open the conversation → the <strong>⋮</strong> menu →{" "}
              <em>Report</em> or <em>Block</em>.
            </>,
            <>
              <strong>Profiles:</strong> the <strong>⋯</strong> button next to <em>Message</em>.
            </>,
          ]}
        />
        <p>
          Blocking stops direct messages in both directions immediately. When several different
          people report the same person, they are automatically muted from the public chat while we
          review.
        </p>
      </LegalSection>

      <LegalSection id="how-to-complain" number="03" title="How to file a complaint">
        <p>
          You can also email the Grievance Officer at{" "}
          <a href={`mailto:${GRIEVANCE_OFFICER.email}`} className="font-semibold underline" style={linkStyle}>
            {GRIEVANCE_OFFICER.email}
          </a>
          . You don&apos;t need an account to complain. To help us act quickly, please include:
        </p>
        <LegalList
          items={[
            "Your name and a way to reach you (email or phone).",
            "A link to the content or profile (or a screenshot), and roughly when you saw it.",
            "What's wrong — e.g. harassment, impersonation, private images, spam, or unlawful content.",
            "If you are complaining on someone else's behalf, how you are connected to them.",
          ]}
        />
      </LegalSection>

      <LegalSection id="timelines" number="04" title="What happens next">
        <LegalList
          items={[
            <>
              We <strong>acknowledge</strong> your complaint within <strong>{t.acknowledgeHours} hours</strong>.
            </>,
            <>
              We aim to <strong>resolve</strong> it within <strong>{t.resolveDays} days</strong> of
              receiving it, and tell you what action we took.
            </>,
            <>
              Requests to remove <strong>unlawful content</strong> are acted on within{" "}
              <strong>{t.removalRequestHours} hours</strong>.
            </>,
          ]}
        />
        <p>
          Depending on what we find, actions can include removing content, muting someone from the
          public chat, suspending or permanently banning an account, or — where the law requires —
          sharing information with the authorities.
        </p>
      </LegalSection>

      <LegalSection id="urgent" number="05" title="Urgent: intimate or impersonating content">
        <LegalCallout tone="danger" title={`Removed within ${t.urgentRemovalHours} hours`}>
          <p>
            If content shows you (or someone you represent) in a private or sexual way without
            consent, including morphed images, or someone is impersonating you, email the Grievance
            Officer with &quot;URGENT&quot; in the subject. We will remove or disable access to it
            within {t.urgentRemovalHours} hours of your complaint.
          </p>
        </LegalCallout>
      </LegalSection>

      <LegalSection id="appeal" number="06" title="Appeal">
        <p>
          If you&apos;re not satisfied with the Grievance Officer&apos;s decision, you can appeal to
          the Government of India&apos;s <strong>Grievance Appellate Committee</strong> within{" "}
          <strong>{t.appealDays} days</strong> of receiving our decision, through{" "}
          <a href={GAC_PORTAL_URL} target="_blank" rel="noopener noreferrer" className="font-semibold underline" style={linkStyle}>
            gac.gov.in
          </a>
          .
        </p>
        <p>
          See also our{" "}
          <Link href="/terms" className="font-semibold underline" style={linkStyle}>
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-semibold underline" style={linkStyle}>
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalContact />
    </LegalPageShell>
  );
}
