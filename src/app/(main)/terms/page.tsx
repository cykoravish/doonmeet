import type { Metadata } from "next";
import LegalPageShell from "@/components/legal/LegalPageShell";
import { LegalSection, LegalCallout, LegalList, LegalContact } from "@/components/legal/LegalSection";

export const metadata: Metadata = {
  title: "Terms of Service | DoonMeet",
  description:
    "The terms that govern your use of DoonMeet — Dehradun's local social platform for events, communities, chat and the live map.",
};

const LAST_UPDATED = "17 July 2026";

const TOC = [
  { id: "acceptance", number: "01", label: "Acceptance of terms" },
  { id: "eligibility", number: "02", label: "Eligibility" },
  { id: "accounts", number: "03", label: "Your account" },
  { id: "the-service", number: "04", label: "The service" },
  { id: "conduct", number: "05", label: "Acceptable use" },
  { id: "content", number: "06", label: "Your content" },
  { id: "events", number: "07", label: "Events & meetups" },
  { id: "location-safety", number: "08", label: "Location & safety" },
  { id: "guest-accounts", number: "09", label: "Guest accounts" },
  { id: "paid-features", number: "10", label: "Paid features (upcoming)" },
  { id: "ip", number: "11", label: "Intellectual property" },
  { id: "termination", number: "12", label: "Suspension & termination" },
  { id: "disclaimers", number: "13", label: "Disclaimers" },
  { id: "liability", number: "14", label: "Limitation of liability" },
  { id: "indemnity", number: "15", label: "Indemnification" },
  { id: "governing-law", number: "16", label: "Governing law" },
  { id: "changes", number: "17", label: "Changes to these terms" },
  { id: "contact", number: "18", label: "Contact us" },
];

export default function TermsPage() {
  return (
    <LegalPageShell
      active="terms"
      title="Terms of Service"
      description="The rules for using DoonMeet — please read them, especially the sections on user conduct, in-person events, and location sharing."
      lastUpdated={LAST_UPDATED}
      toc={TOC}
    >
      <LegalSection id="acceptance" number="01" title="Acceptance of terms">
        <p>
          These Terms of Service (&quot;Terms&quot;) form a binding agreement between you and
          DoonMeet governing your access to and use of doonmeet.in and any related apps
          (collectively, the &quot;Service&quot;). By creating an account, joining as a guest, or
          otherwise using the Service, you agree to these Terms and to our{" "}
          <a href="/privacy" className="font-semibold underline" style={{ color: "rgb(var(--primary))" }}>
            Privacy Policy
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="eligibility" number="02" title="Eligibility">
        <p>
          You must be at least <strong>18 years old</strong> to use DoonMeet, whether as a
          registered user or a guest. By using the Service you confirm that you meet this
          requirement and that you have the legal capacity to enter into these Terms.
        </p>
      </LegalSection>

      <LegalSection id="accounts" number="03" title="Your account">
        <LegalList
          items={[
            <>You&apos;re responsible for keeping your password secure and for all activity that happens under your account.</>,
            <>You agree to provide accurate information when signing up, and to keep it up to date.</>,
            <>You may sign in using an email/password or with Google. If you use Google, we rely on Google to verify your identity.</>,
            <>Only one account per person. Impersonating someone else, or creating accounts to evade a suspension, is not allowed.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="the-service" number="04" title="The service">
        <p>DoonMeet currently provides:</p>
        <LegalList
          items={[
            <>A public, real-time chat room (&quot;Doon Public Chat&quot;) and private direct messages between users.</>,
            <>A live map where users can voluntarily check in and see who else is nearby.</>,
            <>Communities organised around shared interests.</>,
            <>User-created local events, with comments and discovery by tag.</>,
          ]}
        />
        <p>
          We may add, change, or remove features at any time. We&apos;ll try to give notice for
          significant changes, but we don&apos;t guarantee that every feature will remain available
          indefinitely.
        </p>
      </LegalSection>

      <LegalSection id="conduct" number="05" title="Acceptable use">
        <p>You agree not to use DoonMeet to:</p>
        <LegalList
          items={[
            <>Harass, threaten, stalk, or intimidate any other user, including through the location or chat features.</>,
            <>Post or send content that is illegal, hateful, sexually explicit, or that exploits or endangers minors.</>,
            <>Impersonate any person or organisation, or misrepresent your affiliation with anyone.</>,
            <>Spam, flood, or send unsolicited commercial messages through chat, comments, or events.</>,
            <>Scrape, reverse engineer, or use automated tools to access the Service beyond normal use.</>,
            <>Circumvent guest message limits, rate limits, or account suspensions.</>,
            <>Upload malicious files, or attempt to interfere with the security or normal operation of the Service.</>,
            <>Use another user&apos;s check-in location or profile information to track, locate, or contact them outside the platform without consent.</>,
          ]}
        />
        <p>
          We may remove content and suspend or terminate accounts that violate these rules, with
          or without notice, as described in Section 12.
        </p>
      </LegalSection>

      <LegalSection id="content" number="06" title="Your content">
        <p>
          You retain ownership of the content you post — profile details, chat messages, event
          listings, comments, and photos. By posting content on DoonMeet, you grant us a
          non-exclusive, worldwide, royalty-free licence to host, store, display, and distribute
          that content as necessary to operate and promote the Service (for example, showing your
          message to other chat participants, or your event on the public events page).
        </p>
        <p>
          You&apos;re solely responsible for the content you post, and you confirm that you have
          the right to post it and that it doesn&apos;t violate these Terms or any law.
        </p>
      </LegalSection>

      <LegalSection id="events" number="07" title="Events & in-person meetups">
        <LegalCallout tone="accent" title="DoonMeet is a listing platform, not an organiser">
          <p>
            Events on DoonMeet are created and hosted by individual users, not by DoonMeet
            itself. We don&apos;t vet, supervise, or guarantee the safety, legality, or quality of
            any event, and we&apos;re not a party to arrangements made between an event creator
            and attendees.
          </p>
        </LegalCallout>
        <p>
          If you create an event, you&apos;re responsible for its accuracy, for obtaining any
          permits or permissions it requires, and for the safety of anyone who attends. If you
          attend an event you found on DoonMeet, you do so at your own risk and are responsible
          for exercising your own judgement about the event and the people involved.
        </p>
      </LegalSection>

      <LegalSection id="location-safety" number="08" title="Location & safety">
        <p>
          The live map shares your real, current location with other users when you check in.
          Please use common-sense precautions:
        </p>
        <LegalList
          items={[
            <>Check in at public places, not your home or workplace.</>,
            <>Meet new people in public, well-lit places, and consider telling a friend where you&apos;re going.</>,
            <>Trust your judgement — you can hide your location or leave the map at any time.</>,
            <>Report any user who makes you feel unsafe.</>,
          ]}
        />
        <p>
          DoonMeet does not run background checks on users and cannot guarantee the identity,
          intentions, or conduct of anyone you meet through the platform.
        </p>
      </LegalSection>

      <LegalSection id="guest-accounts" number="09" title="Guest accounts">
        <p>
          Guest access lets you try DoonMeet&apos;s public chat without creating a full account.
          Guest accounts:
        </p>
        <LegalList
          items={[
            <>Expire automatically 24 hours after creation.</>,
            <>Are limited to 20 messages in the public chat.</>,
            <>Cannot check in on the map, send direct messages, create events, or update a profile.</>,
            <>May be removed, along with associated messages, once the session expires.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="paid-features" number="10" title="Paid features (upcoming)">
        <p>
          DoonMeet is currently free. We plan to introduce paid features (such as premium account
          capabilities or paid event tools) in the future. Once available, pricing, billing terms,
          and any subscription details will be shown clearly before you pay, and will be governed
          by these Terms together with our{" "}
          <a href="/refund-policy" className="font-semibold underline" style={{ color: "rgb(var(--primary))" }}>
            Refund &amp; Cancellation Policy
          </a>
          . Payments will be processed through a licensed third-party payment gateway.
        </p>
      </LegalSection>

      <LegalSection id="ip" number="11" title="Intellectual property">
        <p>
          The DoonMeet name, logo, and the design, code, and branding of the Service belong to
          DoonMeet and are protected by applicable intellectual property laws. You may not copy,
          modify, or use them without our written permission. This doesn&apos;t affect your
          ownership of the content you post, as described in Section 6.
        </p>
      </LegalSection>

      <LegalSection id="termination" number="12" title="Suspension & termination">
        <p>
          We may suspend or terminate your access to DoonMeet, at our discretion, if you violate
          these Terms, misuse the Service, or if we&apos;re required to do so by law. You may stop
          using DoonMeet and request account deletion at any time by contacting us. Sections of
          these Terms that by their nature should survive termination (such as intellectual
          property, disclaimers, and limitation of liability) will continue to apply.
        </p>
      </LegalSection>

      <LegalSection id="disclaimers" number="13" title="Disclaimers">
        <p>
          DoonMeet is provided &quot;as is&quot; and &quot;as available,&quot; without warranties
          of any kind, whether express or implied, including warranties of merchantability,
          fitness for a particular purpose, or non-infringement. We don&apos;t guarantee that the
          Service will be uninterrupted, error-free, or that content posted by other users is
          accurate, safe, or lawful.
        </p>
      </LegalSection>

      <LegalSection id="liability" number="14" title="Limitation of liability">
        <p>
          To the maximum extent permitted by law, DoonMeet and its creator will not be liable for
          any indirect, incidental, special, consequential, or punitive damages, or any loss of
          data, revenue, or goodwill, arising from your use of the Service — including any
          interaction, event, or meetup arranged through DoonMeet with another user. Our total
          liability for any claim relating to the Service will not exceed the amount you&apos;ve
          paid us, if any, in the 12 months before the claim arose.
        </p>
      </LegalSection>

      <LegalSection id="indemnity" number="15" title="Indemnification">
        <p>
          You agree to indemnify and hold harmless DoonMeet and its creator from any claims,
          damages, losses, or expenses (including reasonable legal fees) arising from your use of
          the Service, your content, or your violation of these Terms or applicable law.
        </p>
      </LegalSection>

      <LegalSection id="governing-law" number="16" title="Governing law & disputes">
        <p>
          These Terms are governed by the laws of India. Any dispute arising out of or relating to
          these Terms or the Service will be subject to the exclusive jurisdiction of the courts
          in Dehradun, Uttarakhand, India.
        </p>
      </LegalSection>

      <LegalSection id="changes" number="17" title="Changes to these terms">
        <p>
          We may update these Terms from time to time, particularly as we introduce new features
          like paid plans. We&apos;ll update the &quot;Last updated&quot; date above, and continued
          use of DoonMeet after changes take effect means you accept the updated Terms.
        </p>
      </LegalSection>

      <LegalSection id="contact" number="18" title="Contact us">
        <p>Questions about these Terms? Reach out any time.</p>
      </LegalSection>

      <LegalContact />
    </LegalPageShell>
  );
}