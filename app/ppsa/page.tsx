import type React from"react"
import Link from"next/link"
import Image from"next/image"
import { SiteNavbar } from"@/components/site-navbar"
import { SiteFooter } from"@/components/site-footer"
import { ScrollToTop } from"@/components/scroll-to-top"

export const metadata = {
 title:"Platform Partner Service Agreement | Wingman Pro",
 description:"Platform Partner Service Agreement (PPSA) - Commercial and operational framework between RallyUp Solutions and Supporters' Clubs.",
}

export default function PPSAPage(): React.JSX.Element {
 return (
 <main className="min-h-screen bg-white text-background relative overflow-x-hidden public-theme">
 <SiteNavbar />
 <div className="bg-secondary-purple/40 px-4 py-16 relative z-10">
 <div className="max-w-3xl mx-auto">
 <div className="absolute inset-0 -z-10"/>
 <div className="absolute -bottom-8 -left-10 w-80 h-80 opacity-60 pointer-events-none select-none z-[-5]">
 <Image src="/Vector.svg"alt=""fill className="object-contain"/>
 </div>
 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background border border-primary/20 mb-6 animate-scale-in">
 <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 animate-pulse"/>
 <span className="text-[10px] font-medium leading-[14px] text-primary uppercase tracking-normal">Partner Agreement</span>
 </div>
 <h1 className="text-3xl md:text-4xl font-bold z-10 relative mb-4">PLATFORM PARTNER SERVICE AGREEMENT</h1>
 <p className="text-sm text-secondary mb-2">
 Issued By: RallyUp Solutions Private Limited (Wingman Pro)
 </p>
 <p className="text-sm text-secondary mb-2">
 Date: 05/02/2026
 </p>
 <p className="text-sm text-secondary mb-10">
 Document Version: 1.0.0
 </p>

 <section className="space-y-6 text-secondary">
 <h2 className="text-xl font-semibold text-secondary">1. Executive Summary</h2>

 <h3 className="text-lg font-semibold text-secondary mt-4">1.1 Purpose of Agreement</h3>
 <p>
 This document establishes a binding commercial and operational framework between RallyUp Solutions Private
 Limited (hereinafter referred to as the &quot;Technology Partner&quot; or &quot;Vendor&quot;) and Supporters&apos; Club/Fan Club
 (hereinafter referred to as the &quot;Club Partner&quot;). It governs the licensing, usage, and service levels
 associated with the Wingman Pro platform.
 </p>

 <h3 className="text-lg font-semibold text-secondary mt-4">1.2 Scope of Partnership</h3>
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

 <h3 className="text-lg font-semibold text-secondary mt-4">1.3 Operational Model</h3>
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


 <h2 className="text-xl font-semibold text-secondary">2. Financial Settlement Terms</h2>
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

 <h2 className="text-xl font-semibold text-secondary">3. Operational Inclusions</h2>

 <h3 className="text-lg font-semibold text-secondary mt-4">3.1 Onboarding &amp; Training</h3>
 <p>
 Every new Partner Club, regardless of Tier, is entitled to:
 </p>
 <ul className="list-disc pl-5 space-y-2">
 <li><strong>Initial Setup:</strong> Configuration of the Club Profile, Payment Gateway linkage, and Domain setup (for Plus tier and above).</li>
 <li><strong>Admin Training:</strong> A 60-minute virtual training session for the Club Committee (President, Treasurer, Admin) to master the dashboard.</li>
 </ul>

 <h2 className="text-xl font-semibold text-secondary">4. Cancellation &amp; Termination</h2>

 <h3 className="text-lg font-semibold text-secondary mt-4">4.1 Notice Period</h3>
 <p>
 The Partner implies a &quot;Vendor-Partner&quot; relationship that can be terminated by either party.
 </p>
 <ul className="list-disc pl-5 space-y-2">
 <li><strong>Cancellation Notice:</strong> The Club must provide a 30-Day Written Notice via email to cancel their subscription.</li>
 <li><strong>Data Handover:</strong> Upon termination, RallyUp Solutions guarantees a full export of all Club Member Data (CSV/Excel) and financial transaction logs to the Club within 7 working days.</li>
 </ul>

 <h3 className="text-lg font-semibold text-secondary mt-4">4.2 Refund of Subscription</h3>
 <p>
 Subscription fees are non-refundable. If a cancellation request is made mid-month, the service will remain
 active until the end of the current billing cycle, after which no further charges will be levied.
 </p>

 <h2 className="text-xl font-semibold text-secondary">5. Acceptance of Terms</h2>
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
 <Link href="/terms"className="text-primary hover:text-primary">View our Terms of Service</Link>
 <Link href="/refund"className="text-primary hover:text-primary">View our Refund Policy</Link>
 <Link href="/privacy"className="text-primary hover:text-primary">View our Privacy Policy</Link>
 </div>
 </div>
 </div>
 <SiteFooter />
 <ScrollToTop />
 </main>
 )
}
