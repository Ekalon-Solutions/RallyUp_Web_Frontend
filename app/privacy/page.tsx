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
        <h1 className="text-3xl md:text-4xl font-bold mb-4">PRIVACY POLICY: RALLYUP SOLUTIONS PRIVATE LIMITED (For Wingman Pro)</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-10">
          Effective Date: October 31, 2025
        </p>

        <section className="space-y-6 text-slate-700 dark:text-slate-300">
          <p>
            This Privacy Policy explains how RallyUp Solutions Private Limited ("RallyUp Solutions," "we," "us," or "our," the parent company) collects, uses, protects, and discloses personal data related to your use of our web application platform, Wingman Pro (the "Service" or "Wingman Pro"). We are committed to protecting your privacy and handling your data in a transparent manner, consistent with applicable global and local laws.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">1. SCOPE AND APPLICATION</h2>
          <p>
            This Policy applies to all members, administrators, and users ("Users") of Wingman Pro. Given the international nature of supporter groups, we detail specific privacy rights based on location in Section 7.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">2. DATA COLLECTED</h2>
          <p>
            We collect information required for account authentication and service operation.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Identity Data:</strong> Full Name, Date of Birth.</li>
            <li><strong>Contact Data:</strong> Mobile Phone Number and Email Address (required for OTP authentication).</li>
            <li><strong>Authentication Data:</strong> OTP (transmitted via Email/SMS), Encrypted Password, User Session IDs, Access Logs.</li>
            <li><strong>Engagement Data (Non-Sensitive):</strong> Leaderboard performance, Purchase Reports, Event Attendance records, Poll responses.</li>
            <li><strong>Technical Data:</strong> IP Address, Device type, Operating System, Browser type, and usage data (collected via Google Analytics for non-identifiable, aggregated reporting to improve functionality).</li>
            <li><strong>Financial Data:</strong> Transaction records for merchandise and tickets, Payment reference numbers, and non-sensitive masked payment details (e.g., last four digits of the card). (Note: We do not store full payment card details; these are handled by our Payment Partner payment gateway.)</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">3. PURPOSE AND LEGAL BASIS FOR PROCESSING</h2>
          <p>
            We process data only for defined, legitimate purposes.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-slate-300 dark:border-slate-700 my-4">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800">
                  <th className="border border-slate-300 dark:border-slate-700 px-4 py-2 text-left">Purpose of Processing</th>
                  <th className="border border-slate-300 dark:border-slate-700 px-4 py-2 text-left">Data Used</th>
                  <th className="border border-slate-300 dark:border-slate-700 px-4 py-2 text-left">Legal Basis (General)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">Account Creation & Access</td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">Contact, Identity, Authentication Data</td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">Contractual Necessity: Necessary to provide the OTP login service.</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">Service Delivery</td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">Engagement Data, Identity Data</td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">Contractual Necessity: Required to manage member profiles and display correct data (e.g., Leaderboards, Purchase Reports).</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">Commerce</td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">Financial Data, Contact Data</td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">Legal Obligation/Contractual Necessity: Processing orders and payments through the store and ticketing sections.</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">Analytics & Improvement</td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">Technical Data, Usage Data</td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">Legitimate Interests: Analyzing performance and usage patterns to improve Wingman Pro functionality.</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">Marketing</td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">Contact Data</td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">Consent: Sending promotional materials (subject to user consent and opt-out rights).</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">4. DATA SECURITY AND RETENTION</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Security:</strong> We implement technical safeguards, including encryption, access controls, and vulnerability assessments, to protect against unauthorized access or loss.</li>
            <li><strong>Retention:</strong> We retain personal data only for as long as is necessary to serve the purpose for which it was collected, or as required by law. Data is securely deleted or anonymized when no longer required.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">5. DISCLOSURE AND TRANSFER OF DATA</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Third-Party Processors:</strong> We utilize third-party services to operate Wingman Pro, including:
              <ul className="list-circle pl-5 mt-2 space-y-1">
                <li>Google Firebase Authentication: For OTP delivery and user identification.</li>
                <li>Payment Partner: For processing all transactions (merchandise, tickets).</li>
                <li>Google Analytics: For measuring application usage.</li>
              </ul>
            </li>
            <li><strong>Cross-Border Transfers:</strong> Data may be transferred outside your country of residence (e.g., for cloud hosting). We ensure that any country receiving the data maintains a comparable standard of protection or that appropriate safeguards (e.g., standard contractual clauses) are in place, as required by applicable law. Our primary cloud service providers and servers are located in India and on cloud.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">6. CHILDREN'S PRIVACY</h2>
          <p>
            Wingman Pro is intended for use by individuals who are at least 18 years of age or the age of legal majority in their respective jurisdiction. We do not knowingly allow our clients/clubs/partners to collect personal data from children without parental consent.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">7. COUNTRY-SPECIFIC PRIVACY RIGHTS</h2>
          <p>
            This section outlines additional rights and legal requirements applicable to Users residing in the following jurisdictions, overriding any conflicting terms in Sections 1-6.
          </p>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">7.1. 🇮🇳 India (Digital Personal Data Protection Act, 2023 - DPDPA)</h3>
          <p>
            You are a "Data Principal" under the DPDPA.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Consent and Notice:</strong> Consent must be free, specific, informed, unconditional, and unambiguous with a clear affirmative action. When collecting data, you will be informed of the purpose, how to exercise your rights, and the complaint mechanism.</li>
            <li><strong>Right to Nominate:</strong> You have the right to nominate another individual to exercise your rights in the event of your death or incapacity.</li>
            <li><strong>Right to Erasure:</strong> You may request the deletion of your data when the purpose for which it was collected is no longer being served, and you may withdraw consent at any time.</li>
            <li><strong>Complaint:</strong> You may file a complaint with the Data Protection Board of India.</li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">7.2. 🇬🇧 United Kingdom (UK GDPR) & 🇩🇪 Germany (GDPR)</h3>
          <p>
            As residents of the UK and an EU member state (Germany), you are "Data Subjects."
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Legal Basis:</strong> We must identify one of six lawful bases for processing your data (e.g., Consent, Contractual Necessity, Legitimate Interests).</li>
            <li><strong>Core Rights:</strong> You have the Right of Access (to confirm if data is processed and obtain a copy), the Right to Rectification, the Right to Erasure ("Right to be Forgotten"), the Right to Restriction of Processing, and the Right to Data Portability.</li>
            <li><strong>Right to Object:</strong> You have the right to object to processing based on legitimate interests or for direct marketing purposes.</li>
            <li><strong>Complaint:</strong> You have the right to lodge a complaint with a supervisory authority (e.g., the Information Commissioner's Office (ICO) in the UK or the relevant State supervisory authority in Germany).</li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">7.3. 🇸🇬 Singapore (Personal Data Protection Act 2012 - PDPA)</h3>
          <p>
            Your rights are governed by the PDPA.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Consent Obligation:</strong> We must obtain your consent before collecting, using, or disclosing your personal data, unless legally exempted or where consent is deemed. Consent can be withdrawn at any time.</li>
            <li><strong>Access and Correction:</strong> You have the right to request access to your personal data and information on its use/disclosure in the prior year. You also have the right to request correction of errors or omissions.</li>
            <li><strong>Protection and Retention:</strong> We must make reasonable efforts to ensure data accuracy and protect data with reasonable security arrangements. Data must be retained only as long as necessary for business or legal purposes.</li>
            <li><strong>Transfer Limitation:</strong> We must ensure a comparable standard of protection is maintained for any data transferred outside Singapore.</li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">7.4. 🇺🇸 USA (California Consumer Privacy Act/CPRA)</h3>
          <p>
            If you are a California resident, the CCPA/CPRA grants you specific rights (assuming RallyUp Solutions meets the required revenue/data thresholds).
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Right to Know/Access:</strong> You have the right to know what personal information is being collected about you, for what purpose, and whether it is sold or shared.</li>
            <li><strong>Right to Delete:</strong> You can request the deletion of your personal information, subject to exceptions.</li>
            <li><strong>Right to Opt-Out:</strong> You have the right to opt out of the sale or sharing of your personal information.</li>
            <li><strong>Sensitive Personal Information:</strong> You have the right to limit the use and disclosure of sensitive personal information.</li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">7.5. 🇲🇾 Malaysia (Personal Data Protection Act 2010 - PDPA) & 🇮🇩 Indonesia (PDP Law 2022)</h3>
          <p>
            Both countries rely heavily on consent and have laws mirroring GDPR principles.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Indonesia PDP Law:</strong> Grants rights to access, rectify, terminate processing (including deletion), and data portability.</li>
            <li><strong>Malaysia PDPA:</strong> Requires consent for processing (especially sensitive data) and has recently introduced mandatory breach reporting and rules regarding Data Protection Officers (DPOs). You have rights to access and correction.</li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">7.6. 🇹🇭 Thailand (PDPA) & 🇻🇳 Vietnam (PDPL - pending)</h3>
          <p>
            These jurisdictions rely on consent and have detailed obligations.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Thailand PDPA:</strong> Your consent is required for processing. You have the Right to be Informed, Right to Access, Right to Correction, and Right to Data Portability.</li>
            <li><strong>Vietnam (pending):</strong> Consent remains the primary basis for processing. The framework is currently transitioning towards incorporating clearer legal bases for processing other than consent.</li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">7.7. 🇦🇺 Australia (Privacy Act 1988 - APPs)</h3>
          <p>
            Your data is governed by the Australian Privacy Principles (APPs). We must give you Notice regarding collection, use, and disclosure. You have rights to Access and Correction.
          </p>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">7.8. 🇱🇰 Sri Lanka (PDPA) & 🇵🇰 Pakistan (PDPB - Draft)</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Sri Lanka PDPA:</strong> You have rights to Access, Rectification, and the right to respond to your request within 3 months. The law applies to both controllers and processors.</li>
            <li><strong>Pakistan (Draft PDPB):</strong> Grants rights including Access, Correction, Data Portability, and the Right to Erasure. Data can only be transferred outside Pakistan with equivalent protection or explicit consent.</li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">7.9. 🇳🇵 Nepal (Individual Privacy Act & Data Act)</h3>
          <p>
            Nepal's framework is based on the constitutional right to privacy. We must obtain consent before collecting your personal information.
          </p>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">7.10. 🇦🇪 UAE (Federal PDPL) & 🇲🇽 Mexico (LFPD)</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>UAE Federal PDPL:</strong> Your rights include Access, Rectification, Erasure (Right to be Forgotten), and Data Portability. Consent is the default legal basis and must be clear, specific, and unambiguous.</li>
            <li><strong>Mexico (LFPD):</strong> Grants ARCO rights (Access, Rectification, Cancellation, and Opposition) to the processing of personal data.</li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">7.11. 🇧🇩 Bangladesh</h3>
          <p>
            Bangladesh has a draft Data Protection Act, but the framework is still emerging. We operate based on the general principles of Notice and Consent.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">8. CONTACT US</h2>
          <p>
            For questions or concerns regarding this Privacy Policy or to exercise your privacy rights, please contact our Data Protection Officer/Grievance Officer:
          </p>
          <p className="mt-2">
            <strong>Grievance Officer/Data Protection Officer (DPO):</strong>
          </p>
          <p className="mt-2">
            Dr. Sunil Acharya<br />
            RallyUp Solutions Private Limited<br />
            Email: <a className="underline" href="mailto:response@wingmanpro.tech">response@wingmanpro.tech</a><br />
            Phone: +91 9819 889 882<br />
            Address: A 602, DLH Orchid, Apna, Ghar Unit No. 13 CHS L, Andheri, Mumbai, Maharashtra, India, 400053
          </p>
        </section>

        <div className="mt-10">
          <Link href="/terms" className="text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200">View our Terms of Service</Link>
        </div>
      </div>
      <SiteFooter />
      <ScrollToTop />
    </main>
  )
}


