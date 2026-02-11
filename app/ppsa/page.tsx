import type React from "react"
import Link from "next/link"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"

export const metadata = {
  title: "Platform Partner Service Agreement | Wingman Pro",
  description: "Platform Partner Service Agreement (PPSA) - Commercial and operational framework between RallyUp Solutions and Supporters' Clubs.",
}

export default function PPSAPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 text-slate-900 dark:text-white">
      <SiteNavbar />
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">PLATFORM PARTNER SERVICE AGREEMENT</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
          Issued By: RallyUp Solutions Private Limited (Wingman Pro)
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
          Date: 05/02/2026
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-10">
          Document Version: 1.0.0
        </p>

        <section className="space-y-6 text-slate-700 dark:text-slate-300">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">1. Executive Summary</h2>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">1.1 Purpose of Agreement</h3>
          <p>
            This document establishes a binding commercial and operational framework between RallyUp Solutions Private
            Limited (hereinafter referred to as the &quot;Technology Partner&quot; or &quot;Vendor&quot;) and Supporters&apos; Club/Fan Club
            (hereinafter referred to as the &quot;Club Partner&quot;). It governs the licensing, usage, and service levels
            associated with the Wingman Pro platform.
          </p>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">1.2 Scope of Partnership</h3>
          <p>
            RallyUp Solutions is appointed as the Official Technology Partner to the Club. The Club is granting the
            mandate to digitize its operations using the Wingman Pro ecosystem, which encompasses:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>The Administrative Dashboard:</strong> For committee members to manage membership databases,
              compliance, financial reporting, and inventory.</li>
            <li><strong>The Member Experience:</strong> A unified Web (and future Mobile) interface for fans to purchase
              memberships, buy event tickets, participate in gamification, and access club news.</li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">1.3 Operational Model</h3>
          <p>
            The partnership operates on a &quot;Club-First&quot; SaaS (Software as a Service) model.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Brand Ownership:</strong> The platform is white-labelled to prioritize the Club&apos;s identity. The
              Club retains full ownership of its brand, community IP, and member data.</li>
            <li><strong>Role of Vendor:</strong> RallyUp Solutions manages the backend infrastructure, server security,
              payment gateway integrations (RazorPay), and feature updates.</li>
            <li><strong>Role of Partner:</strong> The Club remains responsible for community management, event hosting,
              and marketing, utilizing the tools provided by the Vendor.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">2. Subscription Tiers &amp; Commercials</h2>
          <p>
            The Club may select one of the following tiers based on their operational needs. All plans include the core
            Wingman Pro Dashboard (Member Database, Event Ticketing, Finance Module).
          </p>

          <div className="overflow-x-auto my-6">
            <table className="min-w-full border-collapse border border-slate-300 dark:border-slate-700">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800">
                  <th className="border border-slate-300 dark:border-slate-700 px-4 py-2 text-left">Plan Name</th>
                  <th className="border border-slate-300 dark:border-slate-700 px-4 py-2 text-left">Monthly Subscription</th>
                  <th className="border border-slate-300 dark:border-slate-700 px-4 py-2 text-left">Features Included</th>
                  <th className="border border-slate-300 dark:border-slate-700 px-4 py-2 text-left">Best For</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2 font-medium">BASIC</td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">FREE (₹0)</td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                    Full Dashboard Access, Core Member Management, Event Ticketing, Standard Support
                  </td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">New clubs starting their digital journey.</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2 font-medium">PLUS</td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">₹499 / month</td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">Everything in Basic, Dedicated Group Website (SEO optimized landing page for your club)</td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">Clubs wanting a professional web presence.</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2 font-medium">SILVER</td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">₹1,499 / month</td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">Everything in Plus, Priority Managed Support*</td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">Clubs that need hands-on help running operations.</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2 font-medium">GOLD</td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">₹1,699 / month</td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">Everything in Plus, AI Chatbot Integration (Auto-answers member queries)</td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">Clubs with high volume of member questions.</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2 font-medium">PLATINUM</td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">₹1,999 / month</td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">Everything in Gold, Priority Managed Support*, AI Chatbot Integration</td>
                  <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">Large clubs wanting full automation and support.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-sm italic">
            *Definition of Priority Managed Support: Unlike standard support (technical fixes only), Priority Managed
            Support means we do the work for you. You do not need to create events or news posts manually. Send the
            details to your dedicated account manager, and RallyUp Solutions will handle the data entry, formatting, and
            publishing on your behalf.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">3. Transaction &amp; Processing Fees</h2>
          <p>
            Regardless of the Subscription Tier selected, the following &quot;Success Fees&quot; apply only when a transaction
            occurs (e.g., a member buys a ticket or pays a membership fee).
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Platform Fee:</strong> 4.5% of the transaction value + GST.</li>
            <li><strong>Payment Gateway Fee:</strong> 2.5% of the transaction value + GST.</li>
            <li>Note: These fees are automatically deducted from the gross amount collected before settlement.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">4. Financial Settlement Terms</h2>
          <p>
            We understand that cash flow is critical for supporter clubs. The Partner may choose their preferred Payout
            Cycle for funds collected via the platform:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Next Day (T+1):</strong> Funds settled to Club Bank Account 24 hours after transaction (Subject to banking holidays).</li>
            <li><strong>Weekly:</strong> Funds settled every Monday.</li>
            <li><strong>Monthly:</strong> Funds settled on the 1st of every month.</li>
            <li><strong>Quarterly / Annually:</strong> Available upon request for long-term savings planning.</li>
          </ul>
          <p>
            To change your settlement cycle, a written request to the Finance Team is required with 7 days&apos; notice.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">5. Operational Inclusions</h2>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">5.1 Onboarding &amp; Training</h3>
          <p>
            Every new Partner Club, regardless of Tier, is entitled to:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Initial Setup:</strong> Configuration of the Club Profile, Payment Gateway linkage, and Domain setup (for Plus tier and above).</li>
            <li><strong>Admin Training:</strong> A 60-minute virtual training session for the Club Committee (President, Treasurer, Admin) to master the dashboard.</li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">5.2 Subscription Billing Cycle</h3>
          <p>
            The Partner may choose to pay their Subscription Fee (Plus/Silver/Gold/Platinum) via:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Monthly:</strong> Billed via auto-debit on the 1st of the month.</li>
            <li><strong>Quarterly:</strong> Pre-paid every 3 months.</li>
            <li><strong>Annually:</strong> Pre-paid for 12 months (Eligible for 1 month free discount).</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">6. Cancellation &amp; Termination</h2>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">6.1 Notice Period</h3>
          <p>
            The Partner implies a &quot;Vendor-Partner&quot; relationship that can be terminated by either party.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Cancellation Notice:</strong> The Club must provide a 30-Day Written Notice via email to cancel their subscription.</li>
            <li><strong>Data Handover:</strong> Upon termination, RallyUp Solutions guarantees a full export of all Club Member Data (CSV/Excel) and financial transaction logs to the Club within 7 working days.</li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">6.2 Refund of Subscription</h3>
          <p>
            Subscription fees are non-refundable. If a cancellation request is made mid-month, the service will remain
            active until the end of the current billing cycle, after which no further charges will be levied.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">7. Acceptance of Terms</h2>
          <p>
            By selecting a Plan on the Wingman Pro Dashboard, the Club agrees to the commercials and terms defined above
            and as agreed in the Master Service Agreement signed.
          </p>
          <p className="mt-4">
            For RallyUp Solutions Pvt. Ltd.<br />
            Chief Executive Officer<br />
            Authorized Signatory<br />
            <br />
            Date: 05/02/2026
          </p>
        </section>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/terms" className="text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200">View our Terms of Service</Link>
          <Link href="/refund" className="text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200">View our Refund Policy</Link>
          <Link href="/privacy" className="text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200">View our Privacy Policy</Link>
        </div>
      </div>
      <SiteFooter />
      <ScrollToTop />
    </main>
  )
}
