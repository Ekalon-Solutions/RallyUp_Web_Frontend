import type React from "react"
import {
  CalendarDays,
  Tag,
  FileText,
  Info,
  Scale,
  Percent,
  Clock,
  Layers,
  Banknote,
  ReceiptText,
  Calculator,
  Minus,
  Equal,
  Landmark,
  TriangleAlert,
  Mail,
  UserRound,
  MapPin,
  Network,
  ShieldCheck,
  ChevronsRight,
} from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import SvgIcon from "@/components/svg-icon"

export const metadata = {
  title: "Refund and Cancellation Policy | Wingman Pro",
  description: "Wingman Pro Refund and Cancellation Policy",
}

const tocItems = [
  { id: "introduction", label: "Introduction" },
  { id: "role-of-platform", label: "Role of Platform" },
  { id: "eligibility", label: "Eligibility" },
  { id: "non-refundable", label: "Non-Refundable Items" },
  { id: "timelines", label: "Timelines" },
  { id: "disputes", label: "Disputes" },
  { id: "contact-support", label: "Contact Support" },
]

const eligibilityCards = [
  {
    icon: "/new-wingman/icons/cross-tick.svg",
    title: "3.1 Club Discretion",
    text: "Subject to the associated Supporters' Club opting to provide refunds for specific events or products.",
  },
  {
    icon: "/new-wingman/icons/split-view.svg",
    title: "3.2 Partial Refunds",
    text: "May be full or partial, depending on the specific policy configuration chosen by the Club.",
  },
  {
    icon: "/new-wingman/icons/clock.svg",
    title: "3.3 Time-Based",
    text: "Refund quantum depends on the date of request relative to the scheduled event date.",
  },
]

const nonRefundable = [
  { icon: "/new-wingman/icons/hexagon.svg", label: "4.1 Platform Fees" },
  { icon: "/new-wingman/icons/cash.svg", label: "4.2 Payment Gateway Fees (RazorPay)" },
  { icon: "/new-wingman/icons/wallet.svg", label: "4.3 Applicable Taxes (GST)" },
]

const bankingSteps = [
  "Club Approval & Initiation",
  "RazorPay Processing (Bank dependent)",
  "24h — 7 Working Days to credit",
]

const card = "rounded-xl border border-white/10 bg-white/[0.02]"

/* ---------- Mobile-only content (from mobile Figma frame) ---------- */
const mobileCard = "rounded-[0.75rem] border border-[#FFFFFF1F] bg-[#12121299] p-6 backdrop-blur-[1.25rem]"

const mobileEligibility = [
  {
    icon: "/new-wingman/icons/hammer.svg",
    title: "3.1 Club Discretion",
    text: "Refunds are subject to specific club options for events or memberships.",
  },
  {
    icon: "/new-wingman/icons/split-view.svg",
    title: "3.2 Partial Refunds",
    text: "Refunds may be full or partial depending on club configuration.",
  },
  {
    icon: "/new-wingman/icons/clock.svg",
    title: "3.3 Time Deductions",
    text: "Quantum depends on request date relative to event date.",
  },
]

function SectionHeader({ number, title }: { number: string; title: string }): React.JSX.Element {
  return (
    <div className="flex items-center gap-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-300/30 bg-[#0b2a2e] text-sm font-medium text-cyan-300">
        {number}
      </span>
      <h2 className="text-2xl font-medium text-wingman-emphasis-text">{title}</h2>
    </div>
  )
}

export default function RefundPage(): React.JSX.Element {
  return (
    <main
      className="min-h-screen overflow-x-clip bg-wingman-light-surface-text text-white"
      style={{
        backgroundImage: `
                    radial-gradient(ellipse 30% 28.125rem at top left, #A8E8FF1A 0%, transparent 100%),
                    radial-gradient(ellipse 30% 28.125rem at top right, #DFB7FF1A 0%, transparent 100%)
                `,
        backgroundRepeat: "no-repeat"
      }}
    >
      <SiteNavbar />

      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[22.5rem] w-[56.25rem] max-w-full -translate-x-1/2 rounded-full" />

        <div className="relative mx-auto flex max-w-8xl flex-col items-start gap-4 px-4 pb-6 pt-8 text-left mobile:items-center mobile:gap-6 mobile:px-8 mobile:pb-14 mobile:pt-14 mobile:text-center">
          {/* Mobile heading */}
          <h1 className="font-sf text-[1.5rem] font-bold leading-[2.25rem] mobile:hidden">
            Refund and Cancellation Policy
          </h1>

          {/* Desktop heading */}
          <h1 className="heading-main hidden mobile:block">
            Refund and Cancellation Policy
          </h1>

          {/* Mobile meta */}
          <div className="flex flex-col items-start gap-3 mobile:hidden">
            <span className="flex h-[1.625rem] w-[8.125rem] items-center justify-center rounded-full border border-[#A8E8FF4D] font-sf-compact text-[0.75rem] font-[457] uppercase leading-[1rem] text-wingman-cyan">
              Legal Document
            </span>
            <p className="font-sf-compact text-[0.875rem] font-[457] leading-[1.25rem] text-zinc-300">
              Version 1.0.0 • Last Updated Feb 05, 2026
            </p>
          </div>

          {/* Desktop meta */}
          <div className="hidden flex-wrap items-center justify-center gap-x-6 gap-y-2 font-sf-compact text-[0.875rem] font-[457] leading-[1.25rem] text-zinc-300 mobile:flex">
            <span className="flex items-center gap-1.5">
              <SvgIcon
                src="/new-wingman/icons/calender2.svg"
                className="h-[0.9375rem] w-[0.75rem] shrink-0 bg-cyan-300"
              />
              Last Updated: February 05, 2026
            </span>
            <span className="flex items-center gap-1.5">
              <SvgIcon
                src="/new-wingman/icons/verified-empty.svg"
                className="h-[0.9375rem] w-[0.75rem] shrink-0 bg-cyan-300"
              />
              Version: 1.3.1
            </span>
            <span className="flex items-center gap-1.5">
              <SvgIcon
                src="/new-wingman/icons/document.svg"
                className="h-[0.9375rem] w-[0.75rem] shrink-0 bg-cyan-300"
              />
              Effective Date: February 05, 2026
            </span>
          </div>
        </div>
      </section>

      {/* ================= MOBILE ONLY BODY ================= */}
      <div className="flex flex-col gap-4 px-4 pb-16 mobile:hidden">

        {/* 1. Introduction */}
        <section className={mobileCard}>
          <h2 className="flex items-center gap-3 font-['SF_Pro',sans-serif] text-[1.5rem] font-[400] leading-[2rem] text-wingman-cyan">
            <SvgIcon
              src="/new-wingman/icons/info.svg"
              className="h-5 w-5 shrink-0 bg-wingman-cyan"
            />
1. Introduction
          </h2>
          <p className="mt-4 font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.625rem] text-wingman-secondary-text">
            This Policy governs all transactions processed through the Wingman Pro platform, owned and operated
            by RallyUp Solutions Private Limited. By using our services, you acknowledge and agree to these
            terms.
          </p>
        </section>

        {/* 2. Role of the Platform */}
        <section className={mobileCard}>
          <h2 className="flex items-start gap-3 font-['SF_Pro',sans-serif] text-[1.5rem] font-[400] leading-[2rem] text-wingman-cyan">
            <SvgIcon
              src="/new-wingman/icons/network.svg"
              className="mt-1 h-5 w-5 shrink-0 bg-wingman-cyan"
            />
2. Role of the Platform
          </h2>
          <p className="mt-4 font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.625rem] text-wingman-secondary-text">
            Wingman Pro acts as a technology facilitator between the User and the respective Supporters&apos;
            Club.
          </p>
          <div className="mt-4 rounded-[0.5rem] border border-[#DFB7FF33] bg-[#DFB7FF1A] p-5">
            <p className="font-['SF_Compact',sans-serif] text-[1rem] font-[457] italic leading-[1.5rem] text-[#DFB7FF]">
              &ldquo;The decision to grant a refund rests primarily with the specific Club from which you
              purchased the service or product.&rdquo;
            </p>
          </div>
        </section>

        {/* Refund Calculation */}
        <section
          className="rounded-[0.75rem] p-5 shadow-[0_0_0.9375rem_0_#A8E8FF4D]"
          style={{ background: "linear-gradient(136.25deg, #A8E8FF 0%, #DFB7FF 100%)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-['SF_Pro',sans-serif] text-[1.5rem] font-[400] leading-[2rem] text-wingman-light-surface-text">
              Refund Calculation
            </h2>
            <SvgIcon
              src="/new-wingman/icons/calculator.svg"
              className="h-[1.6875rem] w-[1.6875rem] shrink-0 bg-wingman-light-surface-text/20"
            />
          </div>
          <p className="mt-2 font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-light-surface-text">
            Final amount back to your source account:
          </p>

          <div className="mt-4 rounded-[0.5rem] border border-[#FFFFFF33] bg-[#0505051A] p-4 backdrop-blur-[0.75rem]">
            <p className="font-['SF_Pro',sans-serif] text-[1.125rem] font-semibold leading-[1.75rem] text-[#1C1B1B]">
              Refund = (Total Paid) - (Platform + Gateway + GST)
            </p>
          </div>

          <div className="mt-4 flex flex-col items-start gap-2">
            <span className="flex h-[1.5rem] items-center rounded-[0.25rem] bg-wingman-light-surface-text px-3 font-['SF_Compact',sans-serif] text-[0.75rem] font-medium text-wingman-emphasis-text">
              Non-refundable: Platform Fees
            </span>
            <span className="flex h-[1.5rem] items-center rounded-[0.25rem] bg-wingman-light-surface-text px-3 font-['SF_Compact',sans-serif] text-[0.75rem] font-medium text-wingman-emphasis-text">
              Non-refundable: RazorPay Fees
            </span>
          </div>
        </section>

        {/* 3. Eligibility Criteria */}
        <section className="mt-4 flex flex-col gap-4">
          <h2 className="font-['SF_Pro',sans-serif] text-[1.375rem] font-[400] leading-[1.875rem] text-wingman-primary-text">
3. Eligibility Criteria
          </h2>
          {mobileEligibility.map(({ icon, title, text }) => (
            <div key={title} className="rounded-[0.75rem] border border-[#FFFFFF1F] bg-[#12121299] p-[1.3125rem] backdrop-blur-[1.25rem]">
              <SvgIcon
                src={icon}
                className="h-[1.25rem] w-[1.25rem] shrink-0 bg-wingman-cyan text-wingman-cyan"
              />
              <h3 className="mt-3 font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-primary-text">
                {title}
              </h3>
              <p className="mt-1 font-['SF_Compact',sans-serif] text-[0.75rem] font-[457] leading-[1rem] text-wingman-secondary-text">
                {text}
              </p>
            </div>
          ))}
        </section>

        {/* 5. Processing */}
        {/* Note: Ensure 'mobileCard' is updated from the previous step to match the backdrop blur and bg color */}
        <section className={`${mobileCard} mt-4`}>
          <h2 className="flex items-center gap-3 font-['SF_Pro',sans-serif] text-[1.5rem] font-[400] leading-[2rem] text-wingman-cyan">
            <SvgIcon
              src="/new-wingman/icons/bank.svg"
              className="h-5 w-5 shrink-0 bg-wingman-cyan"
            />
5. Processing
          </h2>

          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-[2.875rem] w-[2.875rem] shrink-0 items-center justify-center rounded-full bg-[#2A2A2A]">
              <SvgIcon
                src="/new-wingman/icons/cash.svg"
                className="h-[1rem] w-[1.375rem] shrink-0 bg-[#001F27]"
              />
            </span>
            <div>
              <p className="font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-primary-text">
                Payment Partner
              </p>
              <p className="font-['SF_Compact',sans-serif] text-[0.75rem] font-[457] leading-[1rem] text-wingman-secondary-text">
                All refunds processed via RazorPay.
              </p>
            </div>
          </div>

          <ol className="ml-2 mt-6 flex flex-col gap-6 border-l border-white/15 pl-6">
            <li className="relative">
              <span className="absolute -left-[1.875rem] top-1.5 h-[0.75rem] w-[0.75rem] rounded-full bg-wingman-cyan" />
              <p className="font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-cyan">
                Initiation
              </p>
              <p className="font-['SF_Compact',sans-serif] text-[0.75rem] font-[457] leading-[1rem] text-wingman-secondary-text">
                Refund initiated after Club approval.
              </p>
            </li>
            <li className="relative">
              <span className="absolute -left-[1.875rem] top-1.5 h-[0.75rem] w-[0.75rem] rounded-full bg-[#DFB7FF]" />
              <p className="font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-primary-text">
                Processing
              </p>
              <p className="font-['SF_Compact',sans-serif] text-[0.75rem] font-[457] leading-[1rem] text-wingman-secondary-text">
                Funds credited within 24h to 7 working days.
              </p>
            </li>
          </ol>
        </section>


        {/* 7. Disputes */}
        <section className={mobileCard}>
          <h2 className="flex items-center gap-3 font-['SF_Pro',sans-serif] text-[1.5rem] font-[400] leading-[2rem] text-[#FFB4AB]">
            <SvgIcon
              src="/new-wingman/icons/alert-triangle.svg"
              className="h-[1.1875rem] w-[1.375rem] shrink-0 bg-wingman-cyan"
            />
7. Disputes
          </h2>
          <p className="mt-4 font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.625rem] text-wingman-secondary-text">
            Any dispute regarding quality of event, merchandise, or membership must be
            taken up directly with the Supporters&apos; Club. Wingman Pro is not responsible for fulfilment.
          </p>
        </section>

        {/* 9. Contact Support */}
        <section
          className="rounded-[1rem] border border-[#FFFFFF1F] p-6 backdrop-blur-[1.25rem]"
          style={{ background: "linear-gradient(135deg, #121212 0%, #0E0E0E 100%)" }}
        >
          <h2 className="font-['SF_Pro',sans-serif] text-[1.5rem] font-[400] leading-[2rem] text-wingman-cyan">
9. Contact Support
          </h2>

          <div className="mt-4 flex flex-col gap-3">
            {/* Primary Support Box */}
            <div className="flex h-[4.625rem] items-center gap-3 rounded-[0.75rem] border border-[#FFFFFF1F] bg-[#1C1B1B] p-4">
              <SvgIcon
                src="/new-wingman/icons/mail.svg"
                className="h-[1rem] w-[1.25rem] shrink-0 bg-wingman-cyan"
              />              <div className="min-w-0">
                <p className="font-['SF_Compact',sans-serif] text-[0.75rem] font-[457] leading-[1rem] text-wingman-secondary-text">
                  Primary Support
                </p>
                <a
                  href="mailto:support@wingmanpro.tech"
                  className="block truncate font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-primary-text"
                >
                  support@wingmanpro.tech
                </a>
              </div>
            </div>

            {/* Escalation Box */}
            <div className="flex h-[4.625rem] items-center gap-3 rounded-[0.75rem] border border-[#FFFFFF1F] bg-[#1C1B1B] p-4">
              <SvgIcon
                src="/new-wingman/icons/shield-check.svg"
                className="h-[1rem] w-[1.25rem] shrink-0 bg-wingman-cyan"
              />              <div className="min-w-0">
                <p className="font-['SF_Compact',sans-serif] text-[0.75rem] font-[457] leading-[1rem] text-wingman-secondary-text">
                  Escalation (Ankit Ameria)
                </p>
                <a
                  href="mailto:ankit@wingmanpro.tech"
                  className="block truncate font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-primary-text"
                >
                  ankit@wingmanpro.tech
                </a>
              </div>
            </div>

            {/* Ticket Number Mandatory Box */}
            <div className="flex h-[3.125rem] items-center gap-2 rounded-[0.75rem] border border-[#FFB4AB33] bg-[#93000A1A] px-4">
              <SvgIcon
                src="/new-wingman/icons/arrow-right-2.svg"
                className="h-[0.5625rem] w-[0.75rem] shrink-0 bg-[#FFB4AB]"
              />              <p className="font-['SF_Compact',sans-serif] text-[0.75rem] font-[457] uppercase leading-[1rem] text-[#FFB4AB]">
                TICKET NUMBER IS MANDATORY
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="mt-5 flex items-start gap-3">
            <SvgIcon
              src="/new-wingman/icons/map-pin.svg"
              className="mt-[0.125rem] h-[0.75rem] w-[0.5625rem] shrink-0 bg-wingman-secondary-text"
            />            <p className="font-['SF_Compact',sans-serif] text-[0.75rem] font-[457] italic leading-[1rem] text-wingman-secondary-text">
              Apna Ghar Unit no. 13 CHS L, Andheri, Mumbai-400053, Maharashtra.
            </p>
          </div>
        </section>
      </div>

      {/* Body (desktop, modified for grid layout responsiveness) */}
      <div className="relative hidden mobile:block">
        {/* Purple ambient glow behind lower sections */}
        <div className="pointer-events-none absolute bottom-0 left-0 h-[37.5rem] w-[37.5rem] -translate-x-1/3 rounded-full bg-purple-900/20 blur-[8.75rem]" />

        <div className="relative mx-auto grid max-w-8xl gap-10 px-4 pb-24 mobile:px-8 aside-hide:grid-cols-[17.375rem_minmax(0,1fr)] aside-hide:gap-20">

          {/* Sticky contents (Hidden below 1024px) */}
          <aside className="hidden aside-hide:block aside-hide:sticky aside-hide:top-28 aside-hide:self-start">
            <div className="glass-panel h-[20.4375rem] w-[17.375rem] p-6">
              <p className="mb-5 font-['SF_Compact',sans-serif] text-[0.875rem] font-[457] uppercase leading-[1.25rem] tracking-[0.0875rem] text-wingman-cyan">
                Contents
              </p>
              <nav className="flex flex-col gap-4">
                {tocItems.map(({ id, label }) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="group flex h-[1.25rem] w-[14.25rem] items-center gap-[0.5rem] font-['SF_Compact',sans-serif] text-[0.875rem] font-[457] leading-[1.25rem] text-wingman-secondary-text transition-colors hover:text-wingman-cyan"
                  >
                    <span className="h-[1px] w-[1rem] bg-[#FFFFFF33] transition-all group-hover:w-[1.25rem] group-hover:bg-wingman-cyan" />
                    {label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content (Takes full width below 1024px, right column above) */}
          <div className="min-w-0 space-y-16">
            {/* 1 Introduction */}
            <section
              id="introduction"
              className="scroll-mt-28 flex w-full flex-col gap-[1.5rem]"
            >
              {/* Header Container */}
              <div className="flex items-center gap-4">
                {/* 1 Box */}
                <div className="flex h-[3rem] w-[3rem] shrink-0 items-center justify-center rounded-[0.5rem] border border-[#A8E8FF33] bg-[#00D4FF1A] pt-[0.40625rem] pb-[0.46875rem]">
                  <span className="font-['SF_Pro',sans-serif] text-[1.25rem] font-semibold text-wingman-cyan">
                    1
                  </span>
                </div>

                {/* Main Heading */}
                <h2 className="font-['SF_Pro',sans-serif] text-[2rem] font-[400] leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
                  Introduction
                </h2>
              </div>

              {/* Sub Content */}
              <div className="flex w-full flex-col gap-5">
                <p className="font-['SF_Compact',sans-serif] text-[1.125rem] font-[457] leading-[1.828125rem] text-wingman-secondary-text">
                  This Refund and Cancellation Policy (the &ldquo;Policy&rdquo;) governs all transactions
                  processed through the Wingman Pro platform (the &ldquo;Platform&rdquo;), owned and operated by
                  RallyUp Solutions Private Limited (&ldquo;Company&rdquo;, &ldquo;We&rdquo;, &ldquo;Us&rdquo;, or
                  &ldquo;Our&rdquo;).
                </p>
                <p className="font-['SF_Compact',sans-serif] text-[1.125rem] font-[457] leading-[1.828125rem] text-wingman-secondary-text">
                  By purchasing memberships, event tickets, merchandise, or other services on the Platform, you
                  (the &ldquo;User&rdquo; or &ldquo;Member&rdquo;) acknowledge and agree to the terms outlined
                  below.
                </p>
              </div>
            </section>

            {/* 2 Role of the Platform */}
            <section
              id="role-of-platform"
              className="scroll-mt-28 flex w-full flex-col gap-[1.5rem]"
            >
              {/* Header Container */}
              <div className="flex items-center gap-4">
                {/* 2 Box */}
                <div className="flex h-[3rem] w-[3rem] shrink-0 items-center justify-center rounded-[0.5rem] border border-[#A8E8FF33] bg-[#00D4FF1A] pt-[0.40625rem] pb-[0.46875rem]">
                  <span className="font-['SF_Pro',sans-serif] text-[1.25rem] font-semibold text-wingman-cyan">
                    2
                  </span>
                </div>

                {/* Main Heading */}
                <h2 className="font-['SF_Pro',sans-serif] text-[2rem] font-[400] leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
                  Role of the Platform
                </h2>
              </div>

              {/* Box 1: Glass Panel with 4px left border */}
              <div className="glass-panel flex w-full flex-col gap-[0.25rem] rounded-[0.5rem] border border-[rgba(255,255,255,0.12)] border-l-[0.25rem] border-l-wingman-cyan p-[1.5rem] backdrop-blur-[1.25rem]">
                <p className="font-['SF_Compact',sans-serif] text-[1.125rem] font-[457] leading-[1.828125rem] text-wingman-primary-text">
                  Wingman Pro acts as a technology facilitator and intermediary between the User and the
                  respective Supporters&apos; Club / Fan Group (the &ldquo;Club&rdquo;). We provide the infrastructure
                  for Clubs to manage their operations, including the collection of fees.
                </p>
              </div>

              {/* Box 2: Info Box */}
              <div className="flex w-full items-start gap-[1rem] rounded-[0.75rem] border border-[#A8E8FF1A] bg-[#00D4FF0D] p-[1rem]">
                <SvgIcon
                  src="/new-wingman/icons/info.svg"
                  className="mt-0.5 h-[1.25rem] w-[1.25rem] shrink-0 bg-wingman-cyan"
                />
                <p className="font-['SF_Compact',sans-serif] text-[1rem] font-[457] italic leading-[1.5rem] text-wingman-secondary-text">
                  Important: The decision to grant a refund rests primarily with the specific Club from which you
                  purchased the service or product, subject to their individual policies and the terms agreed upon
                  between the Company and the Club.
                </p>
              </div>
            </section>

            {/* 3 Eligibility */}

            <section
              id="eligibility"
              className="scroll-mt-28 flex w-full flex-col gap-[1.5rem]"
            >
              {/* Header Container */}
              <div className="flex items-center gap-4">
                {/* 3 Box */}
                <div className="flex h-[3rem] w-[3rem] shrink-0 items-center justify-center rounded-[0.5rem] border border-[#A8E8FF33] bg-[#00D4FF1A] pt-[0.40625rem] pb-[0.46875rem]">
                  <span className="font-['SF_Pro',sans-serif] text-[1.25rem] font-semibold text-wingman-cyan">
                    3
                  </span>
                </div>

                {/* Main Heading */}
                <h2 className="font-['SF_Pro',sans-serif] text-[2rem] font-[400] leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
                  Eligibility for Refunds
                </h2>
              </div>

              {/* Sub Content */}
              <p className="font-['SF_Compact',sans-serif] text-[1.125rem] font-[457] leading-[1.828125rem] text-wingman-secondary-text">
                Refunds are not automatic. Eligibility is determined based on the following criteria:
              </p>

              {/* Cards Grid */}
              <div className="grid w-full gap-4 md:grid-cols-3">
                {eligibilityCards.map(({ icon, title, text }) => (
                  <div key={title} className="glass-panel flex flex-col p-[1.5rem]">
                    {/* Icon Container */}
                    <span className="flex h-[2.5rem] w-[2.5rem] items-center justify-center rounded-full bg-[#A8E8FF33]">
                      <SvgIcon
                        src={icon}
                        className="h-[1rem] w-[1.25rem] shrink-0 bg-wingman-cyan"
                      />
                    </span>

                    {/* Card Title */}
                    <h3 className="mt-4 font-['SF_Pro',sans-serif] text-[0.875rem] font-[400] leading-[1.25rem] text-wingman-primary-text">
                      {title}
                    </h3>

                    {/* Card Text */}
                    <p className="mt-2 font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-secondary-text">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* 4 Non-Refundable */}
            <section
              id="non-refundable"
              className="scroll-mt-28 flex w-full flex-col gap-[1.5rem]"
            >
              {/* Header Container */}
              <div className="flex items-center gap-4">
                {/* 4 Box */}
                <div className="flex h-[3rem] w-[3rem] shrink-0 items-center justify-center rounded-[0.5rem] border border-[#A8E8FF33] bg-[#00D4FF1A] pt-[0.40625rem] pb-[0.46875rem]">
                  <span className="font-['SF_Pro',sans-serif] text-[1.25rem] font-semibold text-wingman-cyan">
                    4
                  </span>
                </div>

                {/* Main Heading */}
                <h2 className="font-['SF_Pro',sans-serif] text-[2rem] font-[400] leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
                  Non-Refundable Components
                </h2>
              </div>

              {/* Sub Content */}
              <p className="font-['SF_Compact',sans-serif] text-[1.125rem] font-[457] leading-[1.828125rem] text-wingman-secondary-text">
                Regardless of the Club&apos;s decision to approve a refund, certain processing costs incurred
                during the initial transaction are strictly non-refundable.
              </p>

              {/* 3 Box Items */}
              <div className="flex w-full flex-col gap-[0.75rem]">
                {nonRefundable.map(({ icon, label }) => (
                  <div
                    key={label}
                    className="glass-panel flex h-[3.375rem] w-full flex-row items-center justify-between rounded-[0.75rem] border border-[#FFFFFF1A] px-[1rem]"
                  >
                    <div className="flex flex-row items-center gap-[0.5rem]">
                      <SvgIcon
                        src={icon}
                        className="h-[1.25rem] w-[1.125rem] shrink-0 bg-[#DFB7FF]"
                      />
                      <span className="font-['SF_Compact',sans-serif] text-[0.875rem] font-[457] leading-[1.25rem] text-wingman-primary-text">
                        {label}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center justify-end">
                      <span className="font-['SF_Compact',sans-serif] text-[0.75rem] font-[457] uppercase leading-[1rem] tracking-[-0.0375rem] text-[#FFB4AB]">
                        Non-Refundable
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Formula Container */}
              <div
                className="flex h-auto w-full flex-col rounded-[1.5rem] border border-[#FFFFFF1A] pt-[3rem] pb-[2rem] pl-[1rem] pr-[1rem] md:min-h-[14.625rem] min-[1280px]:pl-[2rem] min-[1280px]:pr-[2rem]"
                style={{
                  background: "linear-gradient(90deg, rgba(0, 212, 255, 0.2) 0%, rgba(157, 5, 255, 0.2) 100%)"
                }}
              >

                {/* Formula Header */}
                <div className="flex w-full items-center gap-[0.5rem]">
                  <SvgIcon
                    src="/new-wingman/icons/calculator.svg"
                    className="h-[1.125rem] w-[1.125rem] shrink-0 bg-wingman-cyan"
                  />
                  <p className="font-['SF_Pro',sans-serif] text-[1.5rem] font-[400] leading-[2rem] text-wingman-cyan">
                    Refund Calculation Formula
                  </p>
                </div>

                {/* Calculation Row (one line, boxes shrink) */}
                <div className="mt-[1rem] flex w-full flex-nowrap items-center justify-center gap-[0.5rem] min-[1280px]:gap-[1rem]">

                  {/* Total Paid */}
                  <div className="flex min-h-[4.625rem] w-[9.770625rem] min-w-0 shrink flex-col items-center justify-center rounded-[0.75rem] border border-[#FFFFFF1A] bg-[#05050599] px-2">
                    <span className="text-center font-['SF_Compact',sans-serif] text-[0.875rem] font-[457] leading-[1.25rem] text-wingman-primary-text">
                      Total Paid<br />Amount
                    </span>
                  </div>

                  {/* Minus */}
                  <div className="flex h-[2.25rem] w-[1.125rem] shrink-0 items-center justify-center font-['SF_Compact',sans-serif] text-[1.875rem] font-[457] leading-[2.25rem] text-wingman-secondary-text">
                    −
                  </div>

                  {/* Fees Box */}
                  <div className="flex min-h-[4.625rem] w-[15.973125rem] min-w-0 shrink flex-col items-center justify-center rounded-[0.75rem] border border-[#FFB4AB33] bg-[#FFB4AB1A] px-2">
                    <span className="text-center font-['SF_Compact',sans-serif] text-[0.875rem] font-[457] leading-[1.25rem] text-wingman-emphasis-text">
                      (Platform Fee + Gateway Fee +<br />GST)
                    </span>
                  </div>

                  {/* Equals */}
                  <div className="flex h-[2.25rem] w-[1.125rem] shrink-0 items-center justify-center font-['SF_Compact',sans-serif] text-[1.875rem] font-[457] leading-[2.25rem] text-wingman-secondary-text">
                    =
                  </div>

                  {/* Refund Amount */}
                  <div className="flex min-h-[6rem] w-[12.593125rem] min-w-0 shrink flex-col items-center justify-center rounded-[0.75rem] bg-wingman-cyan px-2 shadow-[0_0_1.25rem_0_#A8E8FF66]">
                    <span className="text-center font-['SF_Pro',sans-serif] text-[1.5rem] font-[400] leading-[2rem] text-wingman-light-accent-text">
                      Refund<br />Amount
                    </span>
                  </div>

                </div>
              </div>
            </section>

            {/* 5 Processing and Timelines */}
            <section
              id="timelines"
              className="scroll-mt-28 flex w-full flex-col gap-[1.5rem]"
            >
              {/* Header Container */}
              <div className="flex items-center gap-4">
                {/* 5 Box */}
                <div className="flex h-[3rem] w-[3rem] shrink-0 items-center justify-center rounded-[0.5rem] border border-[#A8E8FF33] bg-[#00D4FF1A] pt-[0.40625rem] pb-[0.46875rem]">
                  <span className="font-['SF_Pro',sans-serif] text-[1.25rem] font-semibold text-wingman-cyan">
                    5
                  </span>
                </div>

                {/* Main Heading */}
                <h2 className="font-['SF_Pro',sans-serif] text-[2rem] font-[400] leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
                  Processing and Timelines
                </h2>
              </div>

              <div className="grid w-full gap-[1.5rem] md:grid-cols-[1.05fr_1fr]">

                {/* Banking Timeline Box */}
                <div className="glass-panel flex flex-col p-[1.5rem]">
                  <div className="flex items-center gap-[0.75rem]">
                    {/* Icon Container */}
                    <div className="flex h-[3.125rem] w-[2.75rem] shrink-0 items-center justify-center rounded-[0.5rem] bg-[#A8E8FF1A] pt-[0.75rem] pr-[0.75rem] pb-[1.125rem] pl-[0.75rem]">
                      <SvgIcon
                        src="/new-wingman/icons/bank.svg"
                        className="h-[1.25rem] w-[1.25rem] shrink-0 bg-wingman-cyan"
                      />
                    </div>
                    {/* Heading */}
                    <p className="font-['SF_Pro',sans-serif] text-[1.5rem] font-[400] leading-[2rem] text-wingman-primary-text">
                      Banking Timeline
                    </p>
                  </div>

                  {/* Timeline List */}
                  <ol className="mt-[1.5rem] flex flex-col gap-[1.25rem]">
                    {bankingSteps.map((step, i) => (
                      <li key={step} className="flex items-center gap-[0.75rem]">
                        {/* Number Icon */}
                        <span className="flex h-[2rem] w-[2rem] shrink-0 items-center justify-center rounded-full bg-wingman-cyan pt-[0.34375rem] pb-[0.40625rem] font-['SF_Compact',sans-serif] text-[0.875rem] font-[457] leading-[1.25rem] text-wingman-light-accent-text">
                          {i + 1}
                        </span>
                        {/* Text */}
                        <span className="font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-secondary-text">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Right side boxes */}
                <div className="flex flex-col gap-[1rem]">

                  {/* 5.1 Box */}
                  <div
                    className="glass-panel relative flex w-full flex-col gap-[0.5rem] overflow-hidden py-[1.25rem] pr-[1.25rem] pl-[1.5rem] backdrop-blur-[1.25rem]"
                    style={{
                      borderStyle: "solid",
                      borderWidth: "1px 1px 1px 0px", // 0px on left
                      borderColor: "rgba(255, 255, 255, 0.12)",
                    }}
                  >
                    {/* 4px Gradient Left Border */}
                    <div
                      className="pointer-events-none absolute bottom-0 left-0 top-0 w-[0.25rem]"
                      style={{
                        background: "radial-gradient(64.78% 50% at 0% 50%, #DFB7FF 100%, rgba(255, 255, 255, 0.12) 100%)",
                      }}
                    />
                    <p className="font-['SF_Compact',sans-serif] text-[0.875rem] font-[457] leading-[1.25rem] text-[#DFB7FF]">
                      5.1 Payment Partner
                    </p>
                    <p className="font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-secondary-text">
                      All refunds are processed via our authorized payment gateway partner, RazorPay.
                    </p>
                  </div>

                  {/* 5.3 Box */}
                  <div
                    className="glass-panel relative flex w-full flex-col gap-[0.5rem] overflow-hidden py-[1.25rem] pr-[1.25rem] pl-[1.5rem] backdrop-blur-[1.25rem]"
                    style={{
                      borderStyle: "solid",
                      borderWidth: "1px 1px 1px 0px", // 0px on left
                      borderColor: "rgba(255, 255, 255, 0.12)",
                    }}
                  >
                    {/* 4px Gradient Left Border */}
                    <div
                      className="pointer-events-none absolute bottom-0 left-0 top-0 w-[0.25rem]"
                      style={{
                        background: "radial-gradient(77.12% 50% at 0% 50%, #FFB4AB 100%, rgba(255, 255, 255, 0.12) 100%)",
                      }}
                    />
                    <p className="font-['SF_Compact',sans-serif] text-[0.875rem] font-[457] leading-[1.25rem] text-[#FFB4AB]">
                      5.3 Delays
                    </p>
                    <p className="font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-secondary-text">
                      The Company shall not be liable for delays caused by the banking system or the User&apos;s card issuing bank.
                    </p>
                  </div>

                </div>
              </div>
            </section>

            {/* 7 Fulfilment and Disputes */}
            <section
              id="disputes"
              className="scroll-mt-28 flex w-full flex-col gap-[1.5rem]"
            >
              {/* Header Container */}
              <div className="flex items-center gap-4">
                {/* 7 Box */}
                <div className="flex h-[3rem] w-[3rem] shrink-0 items-center justify-center rounded-[0.5rem] border border-[#A8E8FF33] bg-[#00D4FF1A] pt-[0.40625rem] pb-[0.46875rem]">
                  <span className="font-['SF_Pro',sans-serif] text-[1.25rem] font-semibold text-wingman-cyan">
                    7
                  </span>
                </div>

                {/* Main Heading */}
                <h2 className="font-['SF_Pro',sans-serif] text-[2rem] font-[400] leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
                  Fulfilment and Disputes
                </h2>
              </div>

              {/* Main Container */}
              <div className="flex h-auto w-full flex-col justify-center gap-[1.5rem] rounded-[1rem] border border-[#FFFFFF0D] bg-[#121212] p-[2rem] md:h-[12.9375rem]">

                {/* Primary Text */}
                <p className="font-['SF_Compact',sans-serif] text-[1.125rem] font-[457] leading-[1.828125rem] text-wingman-secondary-text">
                  Any dispute regarding the quality of the event, merchandise, or membership benefits
                  must be taken up directly with the respective Supporters&apos; Club.
                </p>

                {/* Inner Warning Box */}
                <div className="flex h-auto w-full items-center gap-[1rem] rounded-[0.5rem] border border-[#FFB4AB1A] bg-[#FFB4AB0D] p-[1rem] md:h-[3.625rem]">
                  <SvgIcon
                    src="/new-wingman/icons/alert-triangle.svg"
                    className="h-[1.1875rem] w-[1.375rem] shrink-0 bg-[#FFB4AB]"
                  />
                  <p className="font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-secondary-text">
                    Wingman Pro is not responsible for the fulfilment of the service deliverables.
                  </p>
                </div>

              </div>
            </section>

            {/* 9 Contact Information */}
            <section
              id="contact-support"
              className="scroll-mt-28 flex w-full flex-col gap-[1.5rem]"
            >
              {/* Header Container */}
              <div className="flex items-center gap-4">
                {/* 9 Box */}
                <div className="flex h-[3rem] w-[3rem] shrink-0 items-center justify-center rounded-[0.5rem] border border-[#A8E8FF33] bg-[#00D4FF1A] pt-[0.40625rem] pb-[0.46875rem]">
                  <span className="font-['SF_Pro',sans-serif] text-[1.25rem] font-semibold text-wingman-cyan">
                    9
                  </span>
                </div>

                {/* Main Heading */}
                <h2 className="font-['SF_Pro',sans-serif] text-[2rem] font-[400] leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
                  Contact Information
                </h2>
              </div>

              {/* Grid Container */}
              <div className="grid w-full gap-[1.5rem] md:grid-cols-2">

                {/* Support Channels Box */}
                <div className="glass-panel flex w-full flex-col p-[2rem]">
                  <h3 className="font-['SF_Pro',sans-serif] text-[1.5rem] font-[400] leading-[2rem] text-wingman-cyan">
                    Support Channels
                  </h3>

                  <ul className="mt-[2rem] flex flex-col gap-[2rem]">
                    {/* Email Support */}
                    <li className="flex gap-[1rem]">
                      <SvgIcon
                        src="/new-wingman/icons/mail.svg"
                        className="mt-[0.25rem] h-[1rem] w-[1.25rem] shrink-0 bg-[#B4EBFF]"
                      />
                      <div className="flex flex-col">
                        <p className="font-['SF_Compact',sans-serif] text-[0.75rem] font-[457] uppercase leading-[1rem] text-wingman-secondary-text">
                          Email Support
                        </p>
                        <a
                          href="mailto:support@wingman-pro.com"
                          className="mt-[0.25rem] font-['SF_Compact',sans-serif] text-[1.125rem] font-[457] leading-[1.75rem] text-wingman-primary-text hover:text-wingman-cyan"
                        >
                          support@wingman-pro.com
                        </a>
                      </div>
                    </li>

                    {/* Escalation Manager */}
                    <li className="flex gap-[1rem]">
                      <SvgIcon
                        src="/new-wingman/icons/profile.svg"
                        className="mt-[0.25rem] h-[1rem] w-[1.25rem] shrink-0 bg-[#B4EBFF]"
                      />
                      <div className="flex flex-col">
                        <p className="font-['SF_Compact',sans-serif] text-[0.75rem] font-[457] uppercase leading-[1rem] text-wingman-secondary-text">
                          Escalation Manager
                        </p>
                        <p className="mt-[0.25rem] font-['SF_Compact',sans-serif] text-[1.125rem] font-[457] leading-[1.75rem] text-wingman-primary-text">
                          Ankit Ameria
                        </p>
                        <a
                          href="mailto:ankit@wingman-pro.com"
                          className="font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-[#A8E8FFCC] hover:text-wingman-cyan"
                        >
                          ankit@wingman-pro.com
                        </a>
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Office Address Box */}
                <div className="glass-panel flex w-full flex-col p-[2rem]">
                  <h3 className="font-['SF_Pro',sans-serif] text-[1.5rem] font-[400] leading-[2rem] text-wingman-cyan">
                    Office Address
                  </h3>

                  <div className="mt-[2rem] flex gap-[1rem]">
                    <SvgIcon
                      src="/new-wingman/icons/map-pin.svg"
                      className="mt-[0.25rem] h-[1.25rem] w-[1rem] shrink-0 bg-[#B4EBFF]"
                    />
                    <address className="not-italic font-['SF_Compact',sans-serif] text-[1.125rem] font-[457] leading-[1.828125rem] text-wingman-primary-text">
                      Apna Ghar Unit no. 13 CHS L,
                      <br />
                      Andheri West,
                      <br />
                      Mumbai- 400053,
                      <br />
                      MH, India.
                    </address>
                  </div>

                  {/* Bottom Inner Box - Now fully fluid and responsive */}
                  <div className="mt-auto pt-[2rem]">
                    <div className="flex h-auto w-full items-center rounded-[0.75rem] border border-[#FFFFFF1A] bg-[#2A2A2A] p-[1rem]">
                      <p className="font-['SF_Compact',sans-serif] text-[0.875rem] font-[457] leading-[1.25rem] text-wingman-primary-text">
                        <span className="text-wingman-cyan">Mandatory:</span> A Support Ticket Number is required for any escalation requests.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </section>
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  )
}