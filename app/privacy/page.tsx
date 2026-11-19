import type React from "react"
import Link from "next/link"
import SvgIcon from "@/components/svg-icon"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import Image from 'next/image';

export const metadata = {
  title: "Privacy Policy | Wingman Pro",
  description: "Wingman Pro Privacy Policy",
}

const tocItems = [
  { id: "scope", label: "1. Scope" },
  { id: "data-collected", label: "2. Data Collected" },
  { id: "purpose-sharing", label: "3. Purpose & Sharing" },
  { id: "security-rights", label: "4. Security & Rights" },
  { id: "childrens-privacy", label: "5. Children's Privacy" },
  {
    id: "country-specifics",
    label: "6. Country Specifics",
    children: [
      { id: "india", label: "India (DPDPA)" },
      { id: "uk-eu", label: "UK/EU (GDPR)" },
      { id: "singapore", label: "Singapore (PDPA)" },
      { id: "usa", label: "USA (CCPA/CPRA)" },
    ],
  },
  { id: "contact-dpo", label: "7. Contact DPO" },
]

const dataCards = [
  {
    title: "Identity & Auth",
    text: "Name, email, phone (Meta OTP), encrypted passwords, and session logs for secure access.",
    borderColor: "border-l-[#00D4FF]",
  },
  {
    title: "Engagement & Technical",
    text: "Leaderboards, poll responses, IP Address, Device type, and Google Analytics technical logs.",
    borderColor: "border-l-[#9D05FF]",
  },
  {
    title: "Financial Records",
    text: "Masked payment details processed via RazorPay. We never store full credit card numbers.",
    borderColor: "border-l-[#00FADC]",
  },
  {
    title: "Location & Activity",
    text: "Approximate club locations and precise venue check-ins. Crash logs via Firebase.",
    borderColor: "border-l-wingman-cyan",
  },
]

const sharingItems = [
  {
    title: "Authentication",
    text: "Emails/Phones shared with Twilio SendGrid and META for secure 6-digit OTP codes.",
  },
  {
    title: "Payments",
    text: "Transaction details via Razorpay for tickets and dues.",
  },
  {
    title: "Personal Information",
    text: "Membership status related information for members that includes Name, Mobile Number, Email Address, Home Address (where asked by clubs), ID Proof (where asked by clubs) are shared with the specific sports club you join. This information is guarded at all times through data encryption and Club Admins remain the custodians of the data at all times.",
  },
]

const indiaRights = ["Right to Nominate", "Right to Erasure", "Complaint to Data Board", "Withdrawal of Consent"]
const gdprRights = ["Right to be Forgotten", "Data Portability", "Right to Object"]

const otherRegions = [
  { name: "Australia", text: "Privacy Act 1988 (APPs)", icon: "/new-wingman/icons/australia-flag.svg" },
  { name: "Malaysia", text: "PDPA 2010 Compliance", icon: "/new-wingman/icons/malaysia-flag.svg" },
  { name: "UAE", text: "Federal PDPL Standards", icon: "/new-wingman/icons/uae-flag.svg" },
]

/* ---------- Mobile-only content (from mobile Figma frame) ---------- */
const mobileDataItems = [
  {
    icon: "/new-wingman/icons/i-card.svg",
    title: "Identity & Contact",
    text: "Name, email, and phone via Twilio SendGrid for OTP authentication.",
  },
  {
    icon: "/new-wingman/icons/lock.svg",
    title: "Authentication",
    text: "Encrypted passwords, Session IDs, and Access logs.",
  },
  {
    icon: "/new-wingman/icons/cash.svg",
    title: "Financial Data",
    text: "Processed by RazorPay. We do not store full payment card details.",
  },
  {
    icon: "/new-wingman/icons/map-pin.svg",
    title: "Location",
    text: "Approximate for clubs, precise for venue check-ins only.",
  },
]

const mobileRegionChips = [
  { id: "m-india", label: "India (DPDPA)", icon: "/new-wingman/icons/india-flag.svg", alt: "India" },
  { id: "m-uk-eu", label: "UK/EU (GDPR)", icon: "/new-wingman/icons/europe-flag.svg", alt: "UK/EU" },
  { id: "m-usa", label: "USA (CCPA/CPRA)", icon: "/new-wingman/icons/usa-flag.svg", alt: "USA" },
]

const mobileRegions = [
  {
    id: "m-india",
    title: "India (DPDPA 2023)",
    text: 'As a "Data Principal," you have the Right to Nominate, Right to Erasure, and the right to file complaints with the Data Protection Board of India.',
  },
  {
    id: "m-uk-eu",
    title: "UK & Germany (GDPR)",
    text: '"Data Subjects" hold core rights including Access, Rectification, Erasure ("Right to be Forgotten"), and Data Portability.',
  },
  {
    id: "m-usa",
    title: "USA (CCPA/CPRA)",
    text: "California residents have the Right to Know, Delete, and Opt-Out of the sale or sharing of personal information.",
  },
]

export default function PrivacyPage(): React.JSX.Element {
  return (
    <main
      className="min-h-screen overflow-x-clip bg-wingman-light-surface-text text-white"
      style={{
        backgroundImage: `
                    radial-gradient(ellipse 30% 28.125rem at top left, #9D05FF1A 10%, transparent 100%),
                    radial-gradient(ellipse 30% 28.125rem at top right, #A8E8FF1A 20%, transparent 100%)
                `,
        backgroundRepeat: "no-repeat"
      }}
    >
      <SiteNavbar />

      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[21.25rem] w-[56.25rem] max-w-full -translate-x-1/2 rounded-full" />

        <div className="relative mx-auto flex max-w-3xl flex-col items-start gap-4 px-4 pb-6 pt-8 text-left mobile:items-center mobile:gap-6 mobile:px-8 mobile:pb-16 mobile:pt-16 mobile:text-center">
          {/* Mobile heading */}
          <h1 className="font-sf text-[1.5rem] font-[700] leading-[2.25rem] mobile:hidden">
            Privacy Policy
          </h1>

          {/* Desktop heading */}
          <h1 className="heading-main hidden mobile:block">
            Privacy Policy
          </h1>

          {/* Mobile meta */}
          <div className="flex flex-col items-start gap-3 mobile:hidden">
            <span className="flex h-[1.625rem] w-[8.125rem] items-center justify-center rounded-full border border-[#A8E8FF4D] font-sf-compact text-[0.75rem] font-[457] uppercase leading-[1rem] text-wingman-cyan">
              Legal Document
            </span>
            <span className="flex h-[2.375rem] w-[14.75rem] items-center justify-center gap-2 rounded-full border border-[#A8E8FF33] bg-[#A8E8FF1A] font-sf-compact text-[0.75rem] font-[457] leading-[1.5rem] text-wingman-cyan">
              <SvgIcon
                src="/new-wingman/icons/history.svg"
                className="h-[0.75rem] w-[0.75rem] shrink-0 bg-wingman-cyan"
              />
              Last Updated: March 15, 2026
            </span>
          </div>
        </div>
      </section>

      {/* ================= MOBILE ONLY BODY ================= */}
      <div className="flex flex-col gap-8 px-4 pb-12 mobile:hidden">

        {/* Overview */}
        <section>
          <h2 className="font-['SF_Pro',sans-serif] text-[1rem] font-[590] leading-[1.5rem] text-wingman-cyan">
            Overview
          </h2>
          <p className="mt-3 font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.625rem] text-wingman-secondary-text">
            This Privacy Policy explains how RallyUp Solutions Private Limited collects, uses,
            protects, and discloses personal data related to your use of <strong className="font-[656]">Wingman Pro</strong>.
            We are committed to transparency and the highest standards of data protection.
          </p>
        </section>

        {/* Accordions */}
        <div className="flex flex-col gap-3">

          {/* 1. Scope */}
          <details className="group rounded-[0.75rem] border border-[#FFFFFF1F] bg-[#12121299] backdrop-blur-[1.25rem]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-[1.0625rem] py-[1rem] [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-3">
                <SvgIcon
                  src="/new-wingman/icons/photo-graph.svg"
                  className="h-[1.125rem] w-[1.125rem] shrink-0 bg-wingman-cyan"
                />
                <span className="font-['SF_Pro',sans-serif] text-[1.125rem] font-[590] leading-[1.6875rem] text-wingman-primary-text">
1. Scope and Application
                </span>
              </span>
              <SvgIcon
                src="/new-wingman/icons/arrow-down.svg"
                className="h-[0.4625rem] w-[0.75rem] shrink-0 bg-wingman-secondary-text transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="border-t border-[#FFFFFF1F] px-[1.0625rem] py-[1rem]">
              <p className="font-['SF_Compact',sans-serif] text-[0.875rem] font-[457] leading-[1.25rem] text-wingman-secondary-text">
                This Policy applies to all members, administrators, and users of Wingman Pro. Given the
                international nature of supporter groups, we detail specific privacy rights based on location.
                RallyUp Solutions Private Limited is committed to protecting your privacy in a transparent manner.
              </p>
            </div>
          </details>

          {/* 2. Data Collected */}
          <details open className="group rounded-[0.75rem] border border-[#FFFFFF1F] bg-[#12121299] backdrop-blur-[1.25rem]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-[1.0625rem] py-[1rem] [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-3">
                <SvgIcon
                  src="/new-wingman/icons/database.svg"
                  className="h-[1.125rem] w-[1.125rem] shrink-0 bg-wingman-cyan"
                />
                <span className="font-['SF_Pro',sans-serif] text-[1.125rem] font-[590] leading-[1.6875rem] text-wingman-primary-text">
2. Data Collected
                </span>
              </span>
              <SvgIcon
                src="/new-wingman/icons/arrow-down.svg"
                className="h-[0.4625rem] w-[0.75rem] shrink-0 bg-wingman-secondary-text transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="flex flex-col gap-[1.25rem] border-t border-[#FFFFFF1F] px-[1.0625rem] py-[1.25rem]">
              {mobileDataItems.map(({ icon, title, text }, index) => (
                <div key={title} className="flex items-start gap-[0.75rem]">
                  <SvgIcon
                    src={icon}
                    className={
                      index === 3
                        ? "h-[1.25rem] w-[1rem] shrink-0 bg-wingman-cyan"
                        : "h-[1.25rem] w-[1.25rem] shrink-0 bg-wingman-cyan"
                    }
                  />
                  <div>
                    <p className="font-['SF_Compact',sans-serif] text-[1rem] font-[656] leading-[1.5rem] text-wingman-primary-text">
                      {title}
                    </p>
                    <p className="mt-[0.25rem] font-['SF_Compact',sans-serif] text-[0.875rem] font-[457] leading-[1.25rem] text-wingman-secondary-text">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </details>

          {/* 3. Purpose & Data Sharing */}
          <details className="group rounded-[0.75rem] border border-[#FFFFFF1F] bg-[#12121299] backdrop-blur-[1.25rem]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-[1.0625rem] py-[1rem] [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-3">
                <SvgIcon
                  src="/new-wingman/icons/share.svg"
                  className="h-[1.125rem] w-[1.125rem] shrink-0 bg-wingman-cyan"
                />
                <span className="font-['SF_Pro',sans-serif] text-[1.125rem] font-[590] leading-[1.6875rem] text-wingman-primary-text">
3. Purpose &amp; Data Sharing
                </span>
              </span>
              <SvgIcon
                src="/new-wingman/icons/arrow-down.svg"
                className="h-[0.4625rem] w-[0.75rem] shrink-0 bg-wingman-secondary-text transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="flex flex-col gap-[1.25rem] border-t border-[#FFFFFF1F] px-[1.0625rem] py-[1.25rem]">
              <p className="font-['SF_Compact',sans-serif] text-[1rem] font-[457] italic leading-[1.5rem] text-wingman-secondary-text">
                &ldquo;We do not sell your data. We share it only with trusted service providers essential to our
                operations.&rdquo;
              </p>
              {sharingItems.map(({ title, text }) => (
                <div key={title} className="flex items-start gap-[0.75rem]">
                  <SvgIcon
                    src="/new-wingman/icons/circle-check.svg"
                    className="mt-0.5 h-[1.25rem] w-[1.25rem] shrink-0 bg-wingman-cyan"
                  />
                  <div>
                    <p className="font-['SF_Compact',sans-serif] text-[1rem] font-[656] leading-[1.5rem] text-wingman-primary-text">
                      {title}
                    </p>
                    <p className="mt-[0.25rem] font-['SF_Compact',sans-serif] text-[0.875rem] font-[457] leading-[1.25rem] text-wingman-secondary-text">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </details>

          {/* 4. Security & Deletion */}
          <details className="group rounded-[0.75rem] border border-[#FFFFFF1F] bg-[#12121299] backdrop-blur-[1.25rem]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-[1.0625rem] py-[1rem] [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-3">
                <SvgIcon
                  src="/new-wingman/icons/shield-lock.svg"
                  className="h-[1.125rem] w-[1.125rem] shrink-0 bg-wingman-cyan"
                />
                <span className="font-['SF_Pro',sans-serif] text-[1.125rem] font-[590] leading-[1.6875rem] text-wingman-primary-text">
4. Security &amp; Deletion
                </span>
              </span>
              <SvgIcon
                src="/new-wingman/icons/arrow-down.svg"
                className="h-[0.4625rem] w-[0.75rem] shrink-0 bg-wingman-secondary-text transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="flex flex-col gap-[1.25rem] border-t border-[#FFFFFF1F] px-[1.0625rem] py-[1.25rem]">
              <div>
                <p className="font-['SF_Compact',sans-serif] text-[1rem] font-[656] leading-[1.5rem] text-wingman-primary-text">
                  Encryption
                </p>
                <p className="mt-[0.25rem] font-['SF_Compact',sans-serif] text-[0.875rem] font-[457] leading-[1.25rem] text-wingman-secondary-text">
                  We implement technical safeguards including SSL/HTTPS encryption for all data in transit and
                  rigorous access controls for our India-based cloud servers.
                </p>
              </div>
              <div>
                <p className="font-['SF_Compact',sans-serif] text-[1rem] font-[656] leading-[1.5rem] text-wingman-primary-text">
                  Account Deletion
                </p>
                <p className="mt-[0.25rem] font-['SF_Compact',sans-serif] text-[0.875rem] font-[457] leading-[1.25rem] text-wingman-secondary-text">
                  Users can delete accounts via Settings &gt; Account &gt; Delete Account. Data is purged within 30
                  days except where legally required for auditing.
                </p>
              </div>
            </div>
          </details>
        </div>

        {/* Global Rights */}
        <section>
          <div className="border-b border-[#FFFFFF1F] pb-[1rem]">
            <h2 className="font-['SF_Pro',sans-serif] text-[1rem] font-[590] leading-[1.5rem] text-[#00FADC]">
              Global Rights
            </h2>
            <p className="mt-[0.25rem] font-['SF_Compact',sans-serif] text-[0.875rem] font-[457] leading-[1.25rem] text-wingman-secondary-text">
              Country-specific privacy rights and jurisdictional compliance.
            </p>
          </div>
          <div className="-mx-4 mt-[1rem] flex flex-nowrap gap-[0.5rem] overflow-x-auto px-4 pb-1">
            {mobileRegionChips.map(({ id, label, icon, alt }) => (
              <a
                key={id}
                href={`#${id}`}
                className="flex h-[2.375rem] shrink-0 items-center justify-center gap-[0.5rem] rounded-full border border-[#FFFFFF1F] bg-[#1C1B1B] px-[1.25rem] whitespace-nowrap"
              >
                <Image
                  src={icon}
                  alt={alt}
                  width={20}
                  height={15}
                  className="h-[1rem] w-auto shrink-0 object-contain"
                />
                <span className="font-['SF_Compact',sans-serif] text-[0.875rem] font-[457] leading-[1.25rem] text-wingman-primary-text">
                  {label}
                </span>
              </a>
            ))}
          </div>

          <div className="mt-[1rem] flex flex-col gap-[1rem]">
            {mobileRegions.map(({ id, title, text }) => (
              <div
                key={id}
                id={id}
                className="scroll-mt-24 rounded-[0.75rem] border border-[#FFFFFF1F] bg-[#12121299] p-[1.25rem] backdrop-blur-[1.25rem]"
              >
                <h3 className="font-['SF_Pro',sans-serif] text-[1.125rem] font-[590] leading-[1.6875rem] text-wingman-primary-text">
                  {title}
                </h3>
                <p className="mt-[0.75rem] font-['SF_Compact',sans-serif] text-[0.875rem] font-[457] leading-[1.421875rem] text-wingman-secondary-text">
                  {text}
                </p>
              </div>
            ))}

            <div className=" bg-[#12121299] rounded-[0.75rem] border border-dashed border-[#FFFFFF33] p-[1.25rem] text-center">
              <p className="font-['SF_Compact',sans-serif] text-[0.875rem] font-[457] italic leading-[1.375rem] text-wingman-secondary-text">
                Additional sections for SE Asia, Australia, and Middle East available in our full documentation.
              </p>
              <a
                href="#"
                className="mt-[0.75rem] inline-block font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-cyan underline underline-offset-4"
              >
                Download full PDF
              </a>
            </div>
          </div>
        </section>

        {/* Contact DPO */}
        <section>
          <h2 className="font-['SF_Pro',sans-serif] text-[1rem] font-[590] leading-[1.5rem] text-wingman-cyan">
            Contact DPO
          </h2>
          <div className="mt-[0.75rem] rounded-[0.75rem] border border-[#FFFFFF1F] bg-[#12121299] p-[1.25rem] backdrop-blur-[1.25rem]">
            <p className="font-['SF_Pro',sans-serif] text-[1.125rem] font-[590] leading-[1.6875rem] text-wingman-primary-text">
              Dr. Sunil Acharya
            </p>
            <a
              href="mailto:compliance@wingman-pro.com"
              className="mt-[0.75rem] flex items-center gap-[0.75rem] break-words font-['SF_Compact',sans-serif] text-[0.875rem] font-[457] leading-[1.25rem] text-wingman-secondary-text"
            >
              <SvgIcon
                src="/new-wingman/icons/mail.svg"
                className="h-[1.25rem] w-[1rem] shrink-0 bg-wingman-cyan"
              />
              compliance@wingman-pro.com
            </a>
            <div className="mt-[0.75rem] flex items-start gap-[0.75rem]">
              <SvgIcon
                src="/new-wingman/icons/map-pin.svg"
                className="mt-[0.125rem] h-[1.25rem] w-[1rem] shrink-0 bg-wingman-cyan"
              />
              <address className="not-italic font-['SF_Compact',sans-serif] text-[0.875rem] font-[457] leading-[1.25rem] text-wingman-secondary-text">
                Apna Ghar Unit No. 13 CHS L, Andheri, Mumbai - 400053, MH, INDIA
              </address>
            </div>
          </div>
        </section>
      </div>

      {/* Body (desktop) */}
      <div className="mx-auto hidden max-w-8xl gap-10 px-4 pb-24 mobile:px-8 mobile:block aside-hide:grid aside-hide:grid-cols-[12.5rem_minmax(0,1fr)] aside-hide:gap-14">
        {/* Sticky nav */}
        <aside className="hidden aside-hide:block aside-hide:sticky aside-hide:top-28 aside-hide:self-start">
          <nav className="flex flex-col gap-[1rem]">
            {tocItems.map((item) => (
              <div key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="flex h-[1.25rem] w-[16.5rem] items-center border-l-[0.125rem] border-[#00D4FF] pl-[0.75rem] align-middle font-['SF_Compact',sans-serif] text-[0.875rem] font-[656] leading-[1.25rem] tracking-[0rem] text-wingman-secondary-text transition-colors hover:text-wingman-emphasis-text"
                >
                  {item.label}
                </a>

                {item.children && (
                  <div className="mt-[0.5rem] flex h-[5.5rem] w-[16.5rem] flex-col gap-[0.5rem] border-l border-[#FFFFFF0D] pl-[1rem]">
                    {item.children.map((child) => (
                      <a
                        key={child.id}
                        href={`#${child.id}`}
                        className="flex h-[1rem] w-[15.4375rem] items-center border-l-[0.125rem] border-[#00D4FF] pl-[0.75rem] align-middle font-['SF_Compact',sans-serif] text-[0.75rem] font-[556] leading-[1rem] tracking-[0rem] text-[#859398] transition-colors hover:text-wingman-secondary-text"
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="mx-auto w-full max-w-8xl space-y-16 aside-hide:max-w-none min-w-0">
          {/* 1 Scope */}
          {/* 1 Scope */}
          <section id="scope" className="scroll-mt-28 space-y-6">
            <h2 className="flex items-center gap-4 align-middle font-['SF_Pro',sans-serif] text-[2rem] font-[700] leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
              <SvgIcon
                src="/new-wingman/icons/shield-search.svg"
                className="h-[1.25rem] w-[1rem] shrink-0 bg-wingman-cyan"
              />
1. Scope and Application
            </h2>

            <div className="glass-panel">
              <p className="align-middle font-['SF_Compact',sans-serif] text-[1.125rem] font-[457] leading-[1.828125rem] tracking-[0rem] text-wingman-secondary-text">
                This Policy applies to all members, administrators, and users (&ldquo;Users&rdquo;) of Wingman Pro. Given
                the international nature of supporter groups, we detail specific privacy rights based on location
                in Section 6. RallyUp Solutions Private Limited is committed to protecting your privacy in a
                transparent manner.
              </p>
            </div>
          </section>

          {/* 2 Data Collected */}
          <section id="data-collected" className="scroll-mt-28 space-y-6">
            <h2 className="flex items-center gap-4 align-middle font-['SF_Pro',sans-serif] text-[2rem] font-[700] leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
              <SvgIcon
                src="/new-wingman/icons/database.svg"
                className="h-[1.25rem] w-[1rem] shrink-0 bg-wingman-cyan"
              />
2. Data Collected
            </h2>

            <div className="grid gap-[1rem] sm:grid-cols-2">
              {dataCards.map(({ title, text, borderColor }) => (
                <div
                  key={title}
                  className={`glass-panel flex w-full flex-col gap-[0.25rem] rounded-[0.5rem] border border-[rgba(255,255,255,0.12)] border-l-[0.25rem] p-[1.5rem] backdrop-blur-[1.25rem] ${borderColor}`}
                >
                  <p className="align-middle font-['SF_Compact',sans-serif] text-[0.875rem] font-[656] leading-[1.25rem] tracking-[0rem] text-wingman-cyan">
                    {title}
                  </p>
                  <p className="align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 3 Purpose & Sharing */}
          <section id="purpose-sharing" className="scroll-mt-28 space-y-6">
            <h2 className="flex items-center gap-4 align-middle font-['SF_Pro',sans-serif] text-[2rem] font-[700] leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
              <SvgIcon
                src="/new-wingman/icons/share.svg"
                className="h-[1.25rem] w-[1rem] shrink-0 bg-wingman-cyan"
              />
3. Purpose & Data Sharing
            </h2>

            <div className="border-l-[0.125rem] border-l-[#A8E8FF66] pl-[1.5rem]">
              <p className="align-middle font-['SF_Compact',sans-serif] text-[1.125rem] font-[457] italic leading-[1.75rem] tracking-[0rem] text-wingman-secondary-text">
                &ldquo;We do not sell your data. We share it only with trusted service providers essential to our
                operations.&rdquo;
              </p>
            </div>

            <div className="flex flex-col gap-[1.5rem] rounded-[1rem] border border-[#FFFFFF1F] bg-[#1C1B1B] p-[2rem]">
              {sharingItems.map(({ title, text }) => (
                <div key={title} className="flex gap-[0.75rem]">
                  <SvgIcon
                    src="/new-wingman/icons/info.svg"
                    className="mt-[0.125rem] h-[1.25rem] w-[1.25rem] shrink-0 bg-wingman-cyan"
                  />
                  <div className="flex flex-col">
                    <p className="align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[656] leading-[1.5rem] tracking-[0rem] text-wingman-primary-text">
                      {title}
                    </p>
                    <p className="align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4 Security & Rights */}
          <section id="security-rights" className="scroll-mt-28 space-y-6">
            <h2 className="flex items-center gap-4 align-middle font-['SF_Pro',sans-serif] text-[2rem] font-[700] leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
              <SvgIcon
                src="/new-wingman/icons/shield-check-fill.svg"
                className="h-[1.25rem] w-[1rem] shrink-0 bg-wingman-cyan"
              />
4. Data Security & Your Rights
            </h2>

            <div className="grid gap-[2rem] sm:grid-cols-2">
              <div className="flex flex-col gap-[0.5rem]">
                <h3 className="align-middle font-['SF_Pro',sans-serif] text-[1.5rem] font-[590] leading-[2rem] tracking-[0rem] text-wingman-primary-text">
                  Encryption
                </h3>
                <p className="align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
                  We implement technical safeguards including SSL/HTTPS encryption for all data in transit and
                  rigorous access controls for our India-based cloud servers.
                </p>
              </div>

              <div className="flex flex-col gap-[0.5rem]">
                <h3 className="align-middle font-['SF_Pro',sans-serif] text-[1.5rem] font-[590] leading-[2rem] tracking-[0rem] text-wingman-primary-text">
                  Account Deletion
                </h3>
                <p className="align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
                  Users can delete accounts via Settings &gt; Account &gt; Delete Account. Data is purged within
                  30 days except where legally required for auditing.
                </p>
              </div>
            </div>
          </section>

          {/* 6 Country-Specific */}

          <section id="country-specifics" className="scroll-mt-28 space-y-6">
            <h2 className="align-middle font-['SF_Pro',sans-serif] text-[2rem] font-[700] leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
6. Country-Specific Privacy Rights
            </h2>
            <p className="align-middle font-['SF_Compact',sans-serif] text-[1.125rem] font-[457] leading-[1.828125rem] tracking-[0rem] text-wingman-secondary-text">
              Specific rights applicable to your jurisdiction override general terms.
            </p>

            {/* India (DPDPA 2023) */}
            <div
              id="india"
              className="flex flex-col gap-[1rem] p-[2rem] scroll-mt-28"
              style={{
                borderRadius: "1rem",
                borderWidth: "1px",
                borderStyle: "solid",
                borderImageSource: "linear-gradient(90deg, #00D4FF 0%, #9D05FF 100%)",
                borderImageSlice: 1,
                boxShadow: "0 0 1.875rem 0 #00D4FF1A",
                backgroundColor: "#121212"
              }}
            >
              <div className="flex items-center gap-[0.5rem]">
                <img
                  src="/new-wingman/icons/india-flag.svg"
                  alt="India Flag"
                  className="h-[1.5rem] w-[1.5rem] shrink-0 object-contain"
                />
                <h3 className="align-middle font-['SF_Pro',sans-serif] text-[1.5rem] font-[590] leading-[2rem] tracking-[0rem] text-wingman-primary-text">
                  India (DPDPA 2023)
                </h3>
              </div>
              <p className="align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
                As a &ldquo;Data Principal&rdquo;, your consent must be specific, informed, and unambiguous.
              </p>
              <ul className="mt-2 grid gap-[0.5rem] sm:grid-cols-2">
                {indiaRights.map((right) => (
                  <li key={right} className="flex items-center gap-[0.5rem]">
                    <span className="h-[0.375rem] w-[0.375rem] rounded-full bg-[#00D4FF]" />
                    <span className="align-middle font-['SF_Compact',sans-serif] text-[0.875rem] font-[656] leading-[1.25rem] tracking-[0rem] text-wingman-primary-text">
                      {right}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* UK & EU (GDPR) */}
            <div id="uk-eu" className="glass-panel flex flex-col gap-[1rem] p-[2rem] scroll-mt-28">
              <div className="flex items-center gap-[0.5rem]">
                <img
                  src="/new-wingman/icons/europe-flag.svg"
                  alt="Europe Flag"
                  className="h-[3rem] w-[3rem] shrink-0 object-contain"
                />
                <h3 className="align-middle font-['SF_Pro',sans-serif] text-[1.5rem] font-[590] leading-[2rem] tracking-[0rem] text-wingman-primary-text">
                  UK & EU (GDPR)
                </h3>
              </div>
              <p className="align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
                You are &ldquo;Data Subjects&rdquo; with powerful rights to restriction and portability.
              </p>
              <div className="flex flex-wrap gap-[0.5rem]">
                {gdprRights.map((right) => (
                  <div
                    key={right}
                    className="flex h-[2.125rem] items-center justify-center rounded-[0.5rem] border border-[#FFFFFF1F] bg-[#2A2A2A] px-[1rem] py-[0.5rem]"
                  >
                    <span className="align-middle font-['SF_Compact',sans-serif] text-[0.75rem] font-[556] leading-[1rem] tracking-[0rem] text-wingman-primary-text">
                      {right}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Singapore & USA */}
            <div className="grid gap-[1rem] sm:grid-cols-2">
              <div id="singapore" className="glass-panel flex flex-col gap-[0.5rem] p-[1.5rem] scroll-mt-28">
                <div className="flex items-center gap-[0.5rem]">
                  <img
                    src="/new-wingman/icons/singapore-flag.svg"
                    alt="Singapore Flag"
                    className="h-[1.25rem] w-[1.25rem] shrink-0 object-contain"
                  />
                  <h3 className="align-middle font-['SF_Compact',sans-serif] text-[0.875rem] font-[656] leading-[1.25rem] tracking-[0rem] text-wingman-primary-text">
                    Singapore (PDPA)
                  </h3>
                </div>
                <p className="align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
                  Consent obligation and access to usage info from the prior year.
                </p>
              </div>
              <div id="usa" className="glass-panel flex flex-col gap-[0.5rem] p-[1.5rem] scroll-mt-28">
                <div className="flex items-center gap-[0.5rem]">
                  <img
                    src="/new-wingman/icons/usa-flag.svg"
                    alt="USA Flag"
                    className="h-[1.25rem] w-[1.25rem] shrink-0 object-contain"
                  />
                  <h3 className="align-middle font-['SF_Compact',sans-serif] text-[0.875rem] font-[656] leading-[1.25rem] tracking-[0rem] text-wingman-primary-text">
                    USA (CCPA/CPRA)
                  </h3>
                </div>
                <p className="align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
                  California residents&apos; right to know, delete, and opt-out of sharing.
                </p>
              </div>
            </div>

            {/* Other regions */}
            <div className="grid gap-[1rem] sm:grid-cols-3">
              {otherRegions.map(({ name, text, icon }) => (
                <div
                  key={name}
                  className="flex h-[4.875rem] flex-col justify-center gap-[0.25rem] rounded-[0.5rem] border border-[#FFFFFF1F] bg-[#0E0E0E] p-[1rem]"
                >
                  <h4 className="flex items-center gap-[0.5rem] align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-primary-text">
                    <img
                      src={icon}
                      alt={`${name} flag`}
                      className="h-[1rem] w-[1rem] shrink-0 object-contain"
                    />
                    {name}
                  </h4>
                  <p className="align-middle font-['SF_Compact',sans-serif] text-[0.75rem] font-[556] leading-[1rem] tracking-[0rem] text-wingman-secondary-text">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 7 Contact DPO */}
          <section id="contact-dpo" className="glass-panel scroll-mt-28 p-[2rem]">
            <h2 className="align-middle font-['SF_Pro',sans-serif] text-[2rem] font-[700] leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
7. Contact Our DPO
            </h2>
            <div className="mt-[1.5rem] grid gap-[2rem] sm:grid-cols-2">
              <div className="flex flex-col gap-[1rem]">
                <div>
                  <p className="align-middle font-['SF_Compact',sans-serif] text-[0.875rem] font-[656] leading-[1.25rem] tracking-[0rem] text-wingman-cyan">
                    Grievance Officer
                  </p>
                  <p className="mt-[0.25rem] align-middle font-['SF_Pro',sans-serif] text-[1.5rem] font-[590] leading-[2rem] tracking-[0rem] text-wingman-primary-text">
                    Dr. Sunil Acharya
                  </p>
                  <p className="align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
                    RallyUp Solutions Private Limited
                  </p>
                </div>

                <div className="flex flex-col gap-[0.75rem]">
                  <a
                    href="mailto:support@wingmanpro.tech"
                    className="flex items-center gap-[0.5rem] align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text transition-colors hover:text-wingman-cyan"
                  >
                    <SvgIcon
                      src="/new-wingman/icons/mail.svg"
                      className="h-[0.8125rem] w-[1rem] shrink-0 bg-wingman-cyan"
                    />
                    support@wingmanpro.tech
                  </a>
                  <a
                    href="tel:+919819889882"
                    className="flex items-center gap-[0.5rem] align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text transition-colors hover:text-wingman-cyan"
                  >
                    <SvgIcon
                      src="/new-wingman/icons/phone.svg"
                      className="h-[0.8125rem] w-[1rem] shrink-0 bg-wingman-cyan"
                    />
                    +91 9819 889 882
                  </a>
                </div>
              </div>

              <div className="flex flex-col justify-between">
                <div className="flex flex-col gap-[0.5rem]">
                  <p className="align-middle font-['SF_Compact',sans-serif] text-[0.875rem] font-[656] leading-[1.25rem] tracking-[0rem] text-wingman-cyan">
                    Location
                  </p>
                  <address className="not-italic align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.625rem] tracking-[0rem] text-wingman-secondary-text">
                    DLH Orchid, Apna Ghar Unit No. 13 CHS L,
                    <br />
                    Andheri, Mumbai, Maharashtra,
                    <br />
                    India, 400053
                  </address>
                </div>

                <div className="mt-[1.5rem] border-t border-[#FFFFFF1F] pt-[1rem]">
                  <Link
                    href="/terms"
                    className="align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-cyan transition-opacity hover:opacity-80"
                  >
                    View Terms of Service
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <SiteFooter />
    </main>
  )
}