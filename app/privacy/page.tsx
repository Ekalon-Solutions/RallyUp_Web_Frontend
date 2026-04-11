import type React from "react"
import Link from "next/link"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"

export const metadata = {
  title: "Privacy Policy | Wingman Pro",
  description: "Wingman Pro Privacy Policy",
}

export default function PrivacyPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 text-slate-900 dark:text-white">
      <SiteNavbar />
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          PRIVACY POLICY: RALLYUP SOLUTIONS PRIVATE LIMITED (For Wingman Pro)
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-10">Effective Date: March 15, 2026</p>

        <section className="space-y-6 text-slate-700 dark:text-slate-300">
          <p>
            This Privacy Policy explains how RallyUp Solutions Private Limited (&quot;RallyUp Solutions,&quot; &quot;we,&quot;
            &quot;us,&quot; or &quot;our,&quot; the parent company) collects, uses, protects, and discloses personal data related to
            your use of our web application platform, Wingman Pro (the &quot;Service&quot; or &quot;Wingman Pro&quot;). We are
            committed to protecting your privacy and handling your data in a transparent manner, consistent with applicable
            global and local laws.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">1. SCOPE AND APPLICATION</h2>
          <p>
            This Policy applies to all members, administrators, and users (&quot;Users&quot;) of Wingman Pro. Given the
            international nature of supporter groups, we detail specific privacy rights based on location in Section 6.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">2. DATA COLLECTED</h2>
          <p>We collect information required for account authentication and service operation.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Identity and Contact Data:</strong> Name, email address, and phone number (collected via Twilio SendGrid
              for OTP authentication).
            </li>
            <li>
              <strong>Authentication Data:</strong> OTP (transmitted via Email/SMS), Encrypted Password, User Session IDs,
              Access Logs.
            </li>
            <li>
              <strong>Engagement Data (Non-Sensitive):</strong> Leaderboard performance, Purchase Reports, Event Attendance
              records, Poll responses.
            </li>
            <li>
              <strong>Technical Data:</strong> IP Address, Device type, Operating System, Browser type, and usage data
              (collected via Google Analytics for non-identifiable, aggregated reporting to improve functionality).
            </li>
            <li>
              <strong>Financial Data:</strong> Transaction records for merchandise and tickets, Payment reference numbers,
              and non-sensitive masked payment details (e.g., last four digits of the card). (Note: We do not store full
              payment card details; these are handled by our Payment Partner – RazorPay – payment gateway and processed
              securely as per their Privacy and Compliance guidelines.)
            </li>
            <li>
              <strong>Location Data:</strong> Approximate location (to show nearby clubs) and precise location (only when you
              check-in to a matchday venue).
            </li>
            <li>
              <strong>App Activity:</strong> Crash logs and performance metrics (via Firebase/Google Analytics) to improve the
              Service.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">3. PURPOSE AND LEGAL BASIS FOR PROCESSING</h2>
          <p>We process data only for defined, legitimate purposes.</p>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-2">How We Share Your Data</h3>
          <p>We do not sell your data. We share it only with trusted service providers essential to our operations:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Authentication:</strong> Phone numbers/emails are shared with Twilio SendGrid to deliver secure 6-digit
              OTP codes.
            </li>
            <li>
              <strong>Payments:</strong> Transaction details are shared with Razorpay to process tickets and membership dues.
            </li>
            <li>
              <strong>Club Admins:</strong> Your name and membership status are shared with the specific sports club you join
              on the platform.
            </li>
            <li>
              <strong>Cross-Border Transfers:</strong> Data may be transferred outside your country of residence (e.g., for
              cloud hosting). We ensure that any country receiving the data maintains a comparable standard of protection or
              that appropriate safeguards (e.g., standard contractual clauses) are in place, as required by applicable law.
              Our primary cloud service providers and servers are located in India and on cloud.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">4. DATA SECURITY</h2>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-2">4.1 Data Security &amp; Encryption</h3>
          <p>
            We implement industry-standard security measures to protect your data. All data transmitted between the Wingman
            Pro app and our servers is encrypted in transit using Secure Socket Layer (SSL/HTTPS) technology.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Security:</strong> We implement technical safeguards, including encryption, access controls, and
              vulnerability assessments, to protect against unauthorized access or loss.
            </li>
            <li>
              <strong>Retention:</strong> We retain personal data only for as long as is necessary to serve the purpose for
              which it was collected, or as required by law. Data is securely deleted or anonymized when no longer required.
            </li>
          </ul>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-2">4.2 Your Rights &amp; Account Deletion</h3>
          <p>You have the right to access, correct, or delete your data at any time.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>In-App Deletion:</strong> You can delete your account by navigating to Settings &gt; Account &gt; Delete
              Account.
            </li>
            <li>
              <strong>Web Request:</strong> If you cannot access the app, you may request account and data deletion via our{" "}
              <Link className="underline" href="/delete-account">
                Data Deletion Request Form
              </Link>{" "}
              or by emailing{" "}
              <a className="underline" href="mailto:support@wingmanpro.tech">
                support@wingmanpro.tech
              </a>
            </li>
            <li>
              <strong>Retention:</strong> Upon deletion, all personal identifiers are purged from our active databases within
              30 days, except where retention is required for legal or financial auditing (e.g., past payment records).
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">5. CHILDREN&apos;S PRIVACY</h2>
          <p>
            Wingman Pro is not intended for individuals under the age of 13. We do not knowingly collect personal data from
            children. If we become aware of such collection, we will take immediate steps to delete the data.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">6. COUNTRY-SPECIFIC PRIVACY RIGHTS</h2>
          <p>
            This section outlines additional rights and legal requirements applicable to Users residing in the following
            jurisdictions, overriding any conflicting terms in Sections 1–5.
          </p>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">
            6.1. 🇮🇳 India (Digital Personal Data Protection Act, 2023 - DPDPA)
          </h3>
          <p>You are a &quot;Data Principal&quot; under the DPDPA.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Consent and Notice:</strong> Consent must be free, specific, informed, unconditional, and unambiguous
              with a clear affirmative action. When collecting data, you will be informed of the purpose, how to exercise your
              rights, and the complaint mechanism.
            </li>
            <li>
              <strong>Right to Nominate:</strong> You have the right to nominate another individual to exercise your rights in
              the event of your death or incapacity.
            </li>
            <li>
              <strong>Right to Erasure:</strong> You may request the deletion of your data when the purpose for which it was
              collected is no longer being served, and you may withdraw consent at any time.
            </li>
            <li>
              <strong>Complaint:</strong> You may file a complaint with the Data Protection Board of India.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">
            6.2. 🇬🇧 United Kingdom (UK GDPR) &amp; 🇩🇪 Germany (GDPR)
          </h3>
          <p>As residents of the UK and an EU member state (Germany), you are &quot;Data Subjects.&quot;</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Legal Basis:</strong> We must identify one of six lawful bases for processing your data (e.g., Consent,
              Contractual Necessity, Legitimate Interests).
            </li>
            <li>
              <strong>Core Rights:</strong> You have the Right of Access (to confirm if data is processed and obtain a copy),
              the Right to Rectification, the Right to Erasure (&quot;Right to be Forgotten&quot;), the Right to Restriction of
              Processing, and the Right to Data Portability.
            </li>
            <li>
              <strong>Right to Object:</strong> You have the right to object to processing based on legitimate interests or for
              direct marketing purposes.
            </li>
            <li>
              <strong>Complaint:</strong> You have the right to lodge a complaint with a supervisory authority (e.g., the
              Information Commissioner&apos;s Office (ICO) in the UK or the relevant State supervisory authority in Germany).
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">
            6.3. 🇸🇬 Singapore (Personal Data Protection Act 2012 - PDPA)
          </h3>
          <p>Your rights are governed by the PDPA.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Consent Obligation:</strong> We must obtain your consent before collecting, using, or disclosing your
              personal data, unless legally exempted or where consent is deemed. Consent can be withdrawn at any time.
            </li>
            <li>
              <strong>Access and Correction:</strong> You have the right to request access to your personal data and information
              on its use/disclosure in the prior year. You also have the right to request correction of errors or omissions.
            </li>
            <li>
              <strong>Protection and Retention:</strong> We must make reasonable efforts to ensure data accuracy and protect
              data with reasonable security arrangements. Data must be retained only as long as necessary for business or legal
              purposes.
            </li>
            <li>
              <strong>Transfer Limitation:</strong> We must ensure a comparable standard of protection is maintained for any
              data transferred outside Singapore.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">
            6.4. 🇺🇸 USA (California Consumer Privacy Act/CPRA)
          </h3>
          <p>
            If you are a California resident, the CCPA/CPRA grants you specific rights (assuming RallyUp Solutions meets the
            required revenue/data thresholds).
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Right to Know/Access:</strong> You have the right to know what personal information is being collected
              about you, for what purpose, and whether it is sold or shared.
            </li>
            <li>
              <strong>Right to Delete:</strong> You can request the deletion of your personal information, subject to
              exceptions.
            </li>
            <li>
              <strong>Right to Opt-Out:</strong> You have the right to opt out of the sale or sharing of your personal
              information.
            </li>
            <li>
              <strong>Sensitive Personal Information:</strong> You have the right to limit the use and disclosure of sensitive
              personal information.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">
            6.5. 🇲🇾 Malaysia (Personal Data Protection Act 2010 - PDPA) &amp; 🇮🇩 Indonesia (PDP Law 2022)
          </h3>
          <p>Both countries rely heavily on consent and have laws mirroring GDPR principles.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Indonesia PDP Law:</strong> Grants rights to access, rectify, terminate processing (including deletion),
              and data portability.
            </li>
            <li>
              <strong>Malaysia PDPA:</strong> Requires consent for processing (especially sensitive data) and has recently
              introduced mandatory breach reporting and rules regarding Data Protection Officers (DPOs). You have rights to
              access and correction.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">
            6.6. 🇹🇭 Thailand (PDPA) &amp; 🇻🇳 Vietnam (PDPL - pending)
          </h3>
          <p>These jurisdictions rely on consent and have detailed obligations.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Thailand PDPA:</strong> Your consent is required for processing. You have the Right to be Informed,
              Right to Access, Right to Correction, and Right to Data Portability.
            </li>
            <li>
              <strong>Vietnam (pending):</strong> Consent remains the primary basis for processing. The framework is currently
              transitioning towards incorporating clearer legal bases for processing other than consent.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">
            6.7. 🇦🇺 Australia (Privacy Act 1988 - APPs)
          </h3>
          <p>
            Your data is governed by the Australian Privacy Principles (APPs). We must give you Notice regarding collection,
            use, and disclosure. You have rights to Access and Correction.
          </p>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">
            6.8. 🇱🇰 Sri Lanka (PDPA) &amp; 🇵🇰 Pakistan (PDPB - Draft)
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Sri Lanka PDPA:</strong> You have rights to Access, Rectification, and the right to respond to your
              request within 3 months. The law applies to both controllers and processors.
            </li>
            <li>
              <strong>Pakistan (Draft PDPB):</strong> Grants rights including Access, Correction, Data Portability, and the Right
              to Erasure. Data can only be transferred outside Pakistan with equivalent protection or explicit consent.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">
            6.9. 🇳🇵 Nepal (Individual Privacy Act &amp; Data Act)
          </h3>
          <p>
            Nepal&apos;s framework is based on the constitutional right to privacy. We must obtain consent before collecting your
            personal information.
          </p>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">
            6.10. 🇦🇪 UAE (Federal PDPL) &amp; 🇲🇽 Mexico (LFPD)
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>UAE Federal PDPL:</strong> Your rights include Access, Rectification, Erasure (Right to be Forgotten), and
              Data Portability. Consent is the default legal basis and must be clear, specific, and unambiguous.
            </li>
            <li>
              <strong>Mexico (LFPD):</strong> Grants ARCO rights (Access, Rectification, Cancellation, and Opposition) to the
              processing of personal data.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">6.11. 🇧🇩 Bangladesh</h3>
          <p>
            Bangladesh has a draft Data Protection Act, but the framework is still emerging. We operate based on the general
            principles of Notice and Consent.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">7. CONTACT US</h2>
          <p>
            For questions or concerns regarding this Privacy Policy or to exercise your privacy rights, please contact our Data
            Protection Officer/Grievance Officer:
          </p>
          <p className="mt-2">
            <strong>Grievance Officer/Data Protection Officer (DPO):</strong>
          </p>
          <p className="mt-2">
            Dr. Sunil Acharya
            <br />
            RallyUp Solutions Private Limited
            <br />
            Email:{" "}
            <a className="underline" href="mailto:support@wingmanpro.tech">
              support@wingmanpro.tech
            </a>
            <br />
            Phone: +91 9819 889 882
            <br />
            Address: DLH Orchid, Apna, Ghar Unit No. 13 CHS L, Andheri, Mumbai, Maharashtra, India, 400053
          </p>
        </section>

        <div className="mt-10">
          <Link href="/terms" className="text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200">
            View our Terms of Service
          </Link>
        </div>
      </div>
      <SiteFooter />
      <ScrollToTop />
    </main>
  )
}
