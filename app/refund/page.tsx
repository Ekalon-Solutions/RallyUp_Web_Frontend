import type React from "react"
import Link from "next/link"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"

export const metadata = {
  title: "Refund and Cancellation Policy | Wingman Pro",
  description: "Wingman Pro Refund and Cancellation Policy - Terms governing refunds for memberships, event tickets, merchandise, and services.",
}

export default function RefundPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 text-slate-900 dark:text-white">
      <SiteNavbar />
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">REFUND AND CANCELLATION POLICY</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
          Last Updated: February 05, 2026
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
          Effective Date: February 05, 2026
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-10">
          Policy Document Version: 1.0.0
        </p>

        <section className="space-y-6 text-slate-700 dark:text-slate-300">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">1. Introduction</h2>
          <p>
            This Refund and Cancellation Policy (the &quot;Policy&quot;) governs all transactions processed through the
            Wingman Pro platform (the &quot;Platform&quot;), owned and operated by RallyUp Solutions Private Limited
            (&quot;Company&quot;, &quot;We&quot;, &quot;Us&quot;, or &quot;Our&quot;).
          </p>
          <p>
            By purchasing memberships, event tickets, merchandise, or other services on the Platform, you (the
            &quot;User&quot; or &quot;Member&quot;) acknowledge and agree to the terms outlined below.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">2. Role of the Platform</h2>
          <p>
            Wingman Pro acts as a technology facilitator and intermediary between the User and the respective
            Supporters&apos; Club / Fan Group (the &quot;Club&quot;). We provide the infrastructure for Clubs to manage their
            operations, including the collection of fees.
          </p>
          <p>
            <strong>Important:</strong> The decision to grant a refund rests primarily with the specific Club from which you
            purchased the service or product, subject to their individual policies and the terms agreed upon
            between the Company and the Club.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">3. Eligibility for Refunds</h2>
          <p>
            Refunds are not automatic. Eligibility is determined based on the following criteria:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>3.1 Club Discretion:</strong> The availability of a refund is strictly subject to the associated
              Supporters&apos; Club opting to provide such refunds for the specific event, membership, or product.</li>
            <li><strong>3.2 Partial vs. Complete Refunds:</strong> Refunds may be full or partial, depending on the specific
              policy configuration chosen by the Club for that transaction.</li>
            <li><strong>3.3 Time-Based Deductions:</strong> For event tickets or time-sensitive purchases, the quantum of a
              partial refund (if applicable) will depend on the date of purchase relative to the date of the refund request
              and the scheduled event date.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">4. Non-Refundable Components</h2>
          <p>
            Regardless of the Club&apos;s decision to approve a refund, certain processing costs incurred during the
            initial transaction are strictly non-refundable.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>4.1 Platform Fees:</strong> Service charges levied by Wingman Pro for the use of the Platform.</li>
            <li><strong>4.2 Payment Gateway Fees:</strong> Transaction fees charged by our payment partner (RazorPay).</li>
            <li><strong>4.3 Taxation:</strong> Any Goods and Services Tax (GST) or other applicable taxes collected on the
              Platform Fees and Gateway Fees.</li>
          </ul>
          <p>
            <strong>Calculation:</strong> Refund Amount = (Total Paid Amount) - (Platform Fee + Gateway Fee + GST).
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">5. Processing and Timelines</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>5.1 Payment Partner:</strong> All refunds are processed via our authorized payment gateway
              partner, RazorPay.</li>
            <li><strong>5.2 Timeline:</strong> Once a refund is approved by the Club and initiated by RallyUp Solutions, the
              processing time is subject to RazorPay&apos;s banking guidelines. Typically, funds are credited back to the
              source account within 24 hours to 7 working days.</li>
            <li><strong>5.3 Delays:</strong> The Company shall not be liable for delays caused by the banking system or the
              User&apos;s card issuing bank.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">6. Club-Specific Policies</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>6.1 Variance:</strong> Supporters&apos; Clubs retain the right to draft and enforce their own specific
              Refund &amp; Cancellation policies which may be stricter than the general terms of this Platform.</li>
            <li><strong>6.2 User Responsibility:</strong> Users are strictly advised to review the specific terms and
              conditions displayed by the Club on the checkout page before making a payment. In the event of a conflict,
              the Club&apos;s specific event/membership policy shall prevail regarding the eligibility of the refund, while
              this Policy shall prevail regarding the process and deductions.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">7. Fulfilment and Disputes</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>7.1 Processing Authority:</strong> RallyUp Solutions Private Limited will process refunds only as
              explicitly agreed upon with our Club Partners during the contractual agreement. We do not process refunds
              unilaterally without the Club&apos;s authorization.</li>
            <li><strong>7.2 Disputes:</strong> Any dispute regarding the quality of the event, merchandise, or membership
              benefits must be taken up directly with the respective Supporters&apos; Club. Wingman Pro is not responsible for
              the fulfilment of the service deliverables.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">8. Amendments to Policy</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>8.1 Right to Modify:</strong> This Policy is subject to change without prior notice. Modifications
              may be deemed necessary by:
              <ul className="list-circle pl-5 mt-2 space-y-1">
                <li>RallyUp Solutions Pvt. Ltd. (The Platform)</li>
                <li>RazorPay (The Payment Gateway)</li>
                <li>The Supporters&apos; Club (The Merchant)</li>
              </ul>
            </li>
            <li><strong>8.2 Acceptance:</strong> Continued use of the Platform following any changes constitutes acceptance
              of those changes.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">9. Contact Information</h2>
          <p>
            If you have questions regarding a specific transaction or wish to initiate a refund request (subject to
            eligibility), please contact:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Primary Point of Contact:</strong> Wingman Pro Support</li>
            <li><strong>Platform Email:</strong> <a className="underline" href="mailto:support@wingmanpro.tech">support@wingmanpro.tech</a></li>
            <li><strong>Primary Point of Escalation:</strong> Ankit Ameria</li>
            <li><strong>Platform Escalation:</strong> <a className="underline" href="mailto:ankit@wingmanpro.tech">ankit@wingmanpro.tech</a></li>
            <li><strong>Escalation Mandate:</strong> Support Ticket Number is mandatory for any escalation.</li>
            <li><strong>Registered Office:</strong> Apna Ghar Unit no. 13 CHS L, Andheri, Mumbai- 400053, Maharashtra.</li>
          </ul>
        </section>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/terms" className="text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200">View our Terms of Service</Link>
          <Link href="/privacy" className="text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200">View our Privacy Policy</Link>
        </div>
      </div>
      <SiteFooter />
      <ScrollToTop />
    </main>
  )
}
