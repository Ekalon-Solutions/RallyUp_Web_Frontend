import type React from "react"
import Image from "next/image"
import {
  FileText,
  Landmark,
  Rocket,
  CircleX,
  BadgeCheck,
  Gavel,
  LayoutDashboard,
  UserCheck,
  Zap,
  CalendarRange,
  CalendarDays,
  Info,
  Settings,
  GraduationCap,
  BellRing,
  Download,
  Mail,
  Check,
} from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import SvgIcon from "@/components/svg-icon"
import Button from "@/components/ui/button"

export const metadata = {
  title: "Platform Partner Service Agreement | Wingman Pro",
  description: "Platform Partner Service Agreement between RallyUp Solutions and Club Partners",
}

// const tocItems = [
//   { id: "executive-summary", label: "Executive Summary", icon: FileText },
//   { id: "financial-settlement", label: "Financial Settlement", icon: Landmark },
//   { id: "operational-inclusions", label: "Operational Inclusions", icon: Rocket },
//   { id: "cancellation", label: "Cancellation", icon: CircleX },
//   { id: "acceptance-of-terms", label: "Acceptance of Terms", icon: BadgeCheck },
// ]

const tocItems = [
  { id: "executive-summary", label: "Executive Summary", icon: "/new-wingman/icons/doc.svg" },
  { id: "financial-settlement", label: "Financial Settlement", icon: "/new-wingman/icons/cash.svg" },
  { id: "operational-inclusions", label: "Operational Inclusions", icon: "/new-wingman/icons/rocket.svg" },
  { id: "cancellation", label: "Cancellation", icon: "/new-wingman/icons/circle-cross.svg" },
  { id: "acceptance-of-terms", label: "Acceptance of Terms", icon: "/new-wingman/icons/checklist.svg" },
]

const scopeItems = [
  {
    icon: "/new-wingman/icons/dashboard.svg",
    title: "Administrative Dashboard",
    text: "Manage membership databases, compliance, and financial reporting.",
  },
  {
    icon: "/new-wingman/icons/profile.svg",
    title: "Member Experience",
    text: "Unified Web interface for membership, ticketing, and gamification.",
  },
]

const settlementCycles = [
  {
    icon: "/new-wingman/icons/speedometer.svg",
    title: "Next Day",
    tag: "T + 1 Cycle",
    text: "Settled to Club Bank Account 24 hours after transaction (Excl. banking holidays).",
  },
  {
    icon: "/new-wingman/icons/grid.svg",
    title: "Weekly",
    tag: "Every Monday",
    text: "Predictable weekly cash flow for operational expenses and planning.",
  },
  {
    icon: "/new-wingman/icons/calender.svg",
    title: "Monthly",
    tag: "1st of Month",
    text: "Consolidated settlement for large clubs with significant volume.",
  },
]

const onboardingItems = [
  {
    icon: "/new-wingman/icons/settings.svg",
    title: "Initial Setup",
    text: "Configuration of Club Profile, Payment Gateway, and Domain linkage.",
  },
  {
    icon: "/new-wingman/icons/graduation-cap.svg",
    title: "Admin Training",
    text: "60-minute virtual session for the Club Committee (President, Treasurer, Admin).",
  },
]

/* ---- Content for the small-screen layout (from the mobile design) ---- */

const mobileCycles = [
  {
    eyebrow: "HIGH PERFORMANCE",
    title: "Next Day (T+1)",
    text: "24h Settlement after transaction",
    selected: true,
  },
  { title: "Weekly", text: "Settled every Monday", selected: false },
  { title: "Monthly", text: "Settled on the 1st of every month", selected: false },
]

const mobileOnboardingItems = [
  {
    icon: "/new-wingman/icons/smart-settings.svg",
    title: "Initial Setup",
    text: "Configuration of Profile, Payment Gateway, and Domain linkage.",
  },
  {
    icon: "/new-wingman/icons/graduation-cap.svg",
    title: "Admin Training",
    text: "60-minute virtual session for President, Treasurer, and Admin.",
  },
]

function SectionHeading({
  number,
  title,
  numberClass = "text-[#DFB7FF4D]",
}: {
  number: string
  title: string
  numberClass?: string
}): React.JSX.Element {
  return (
    <h2 className="flex items-baseline gap-3 text-[2rem] font-bold leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
      <span className={numberClass}>{number}</span>
      {title}
    </h2>
  )
}

// Heading with a coloured bar on the left (small screens only)

function MobileHeading({ title, barClass }: { title: string; barClass: string }): React.JSX.Element {
  return (
    <div className="flex items-center gap-4">
      <span className={`h-[2rem] w-[0.25rem] shrink-0 rounded-full ${barClass}`} />
      <h2 className="text-[1.5rem] font-semibold leading-[2rem] text-wingman-primary-text">{title}</h2>
    </div>
  )
}

// All sections of the small-screen layout (hidden on 768px and above)
function MobileSections(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-10 order-first mobile:hidden">
      {/* 1. Executive Summary */}
      <section className="glass-panel !p-5 !gap-5">
        <MobileHeading title="1. Executive Summary" barClass="bg-wingman-cyan" />
        <div>
          <h3 className="text-[1rem] font-normal leading-[1.5rem] text-wingman-primary-text">1.1 Purpose</h3>
          <p className="mt-2 text-[0.875rem] font-semibold leading-[1.421875rem] text-wingman-secondary-text">
            This document establishes a binding framework between RallyUp Solutions (Technology
            Partner) and the Supporters&apos; Club (Club Partner).
          </p>
        </div>
        <div>
          <h3 className="text-[1rem] font-normal leading-[1.5rem] text-wingman-primary-text">1.2 Scope</h3>
          <p className="mt-2 text-[0.875rem] font-semibold leading-[1.421875rem] text-wingman-secondary-text">
            The mandate digitizes operations via Wingman Pro Administrative Dashboards and the
            Member Experience Web interface.
          </p>
        </div>
      </section>

      {/* 2. Financial Settlement */}
      <section className="flex flex-col gap-4">
        <MobileHeading title="2. Financial Settlement" barClass="bg-[#DFB7FF]" />
        <p className="text-[0.875rem] font-normal leading-[1.5rem] text-wingman-secondary-text">
          Select your preferred Payout Cycle. Funds are collected via RazorPay and settled directly
          to the Club Bank Account.
        </p>

        <div className="flex flex-col gap-3">
          {mobileCycles.map((cycle) => (
            <div
              key={cycle.title}
              className={`flex items-center justify-between gap-4 rounded-[0.5rem] px-4 py-4 ${cycle.selected
                ? "backdrop-blur-[1.25rem]"
                : "border border-[#ffffff1f] bg-[#ffffff0d]"
                }`}
              style={
                cycle.selected
                  ? {
                    background:
                      "linear-gradient(#121212, #121212) padding-box, linear-gradient(90deg, #A8E8FF 0%, #9D05FF 100%) border-box",
                    border: "1px solid transparent",
                  }
                  : undefined
              }
            >
              <div className="flex flex-col gap-1">
                {cycle.eyebrow && (
                  <span className="text-[1rem] font-normal uppercase leading-[1.5rem] tracking-[0.05rem] text-wingman-cyan">
                    {cycle.eyebrow}
                  </span>
                )}
                <span className="text-[1rem] font-normal leading-[1.5rem] text-wingman-primary-text">
                  {cycle.title}
                </span>
                <span className="text-[0.75rem] font-medium leading-[1rem] text-wingman-secondary-text">
                  {cycle.text}
                </span>
              </div>

              {cycle.selected ? (
                <span className="flex h-[1.25rem] w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-wingman-cyan">
                  <Check className="h-[0.75rem] w-[0.75rem] text-black" strokeWidth={3} />
                </span>
              ) : (
                <span className="h-[1.25rem] w-[1.25rem] shrink-0 rounded-full border-2 border-white/70" />
              )}
            </div>
          ))}
        </div>

        <p className="text-[0.75rem] font-medium italic leading-[1rem] text-wingman-secondary-text">
          Note: To change your settlement cycle, 7 days&apos; written notice to the Finance Team is
          required.
        </p>
      </section>

      {/* 3. Onboarding */}
      <section className="glass-panel !gap-0 !p-0 overflow-hidden">
        <div className="flex h-[4.5625rem] items-center gap-3 border-b border-[#FFFFFF1F] bg-[#2A2A2A] px-5">
          <Rocket className="h-[1.25rem] w-[1.25rem] shrink-0 text-[#00fadc]" />
          <h2 className="text-[1.5rem] font-semibold leading-[2rem] text-wingman-primary-text">3. Onboarding</h2>
        </div>
        <ul className="flex flex-col gap-5 p-5">
          {mobileOnboardingItems.map(({ icon, title, text }) => (
            <li key={title} className="flex items-center gap-4">
              <span className="flex h-[2.5rem] w-[2.5rem] shrink-0 items-center justify-center rounded-[0.5rem] bg-[#353534]">
                <SvgIcon
                  src={icon}
                  className="h-[1.0625rem] w-[1.0625rem] shrink-0 bg-wingman-cyan"
                />
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-[1rem] font-normal leading-[1.5rem] text-wingman-primary-text">{title}</p>
                <p className="text-[0.75rem] font-medium leading-[1rem] text-wingman-secondary-text">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 4. Cancellation */}
      <section className="flex flex-col gap-4">
        <MobileHeading title="4. Cancellation" barClass="bg-[#ffb4ab]" />
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1 rounded-[0.75rem] border border-solid border-[#A8E8FF80] border-l-[0.25rem] bg-[#121212B2] p-4 backdrop-blur-[1.25rem]">
            <p className="text-[1rem] font-normal leading-[1.5rem] text-wingman-primary-text">Notice Period</p>
            <p className="text-[0.75rem] font-medium leading-[1rem] text-wingman-secondary-text">
              30-Day Written Notice via email is mandatory for subscription termination.
            </p>

          </div>
          <div className="flex flex-col gap-1 rounded-[0.75rem] border border-solid border-[#A8E8FF80] border-l-[0.25rem] bg-[#121212B2] p-4 backdrop-blur-[1.25rem]">
            <p className="text-[1rem] font-normal leading-[1.5rem] text-wingman-primary-text">Data Handover</p>
            <p className="text-[0.75rem] font-medium leading-[1rem] text-wingman-secondary-text">
              Guaranteed full export of Member Data (CSV) within 7 working days post-termination.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default function PartnerAgreementPage(): React.JSX.Element {
  return (
    <main
      className="min-h-screen overflow-x-clip bg-wingman-light-surface-text text-white"
      style={{
        backgroundImage: `
                  radial-gradient(ellipse 30% 28.125rem at top right, #DFB7FF1A 0%, transparent 100%)
                `,
        backgroundRepeat: "no-repeat"
      }}
    >
      <SiteNavbar />

      {/* Hero */}
      <div className="relative">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[21.25rem] w-[56.25rem] max-w-full -translate-x-1/2 rounded-full" />

        <div className="relative mx-auto max-w-8xl px-4 pb-10 pt-10 mobile:px-8 mobile:pb-16 mobile:pt-12">
          {/* Desktop hero (visible 768px+) */}
          <div className="hidden mobile:flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-wingman-green-button/30 bg-wingman-green-button/10 px-3 py-1 text-xs font-medium text-wingman-green-button-text">
              Document Version 1.0.0
            </span>
            <span className="text-xs font-medium text-wingman-secondary-text">
              Issued 05/02/2026
            </span>
          </div>

          <div className="heading-group-desktop hidden mobile:flex mx-auto mt-10 max-w-4xl text-center">
            <h1 className="heading-main">
              Platform Partner Service Agreement
            </h1>

            <p className="subheading-main">
              Establishing the professional framework between RallyUp Solutions and our valued Club Partners.
              High-performance digitisation for modern supporter groups.
            </p>
          </div>

          {/* Small-screen hero (hidden 768px+) */}
          <div className="flex flex-col gap-4 mobile:hidden">
            <h1 className="heading-main text-left text-[1.5rem] font-bold leading-[2.1875rem] tracking-[0rem]">
              Platform Partner Service Agreement
            </h1>

            <span className="inline-flex w-fit rounded-full border border-wingman-green-button/30 bg-wingman-green-button/10 px-4 py-1.5 text-[1rem] font-medium uppercase leading-[1.5rem] tracking-[0.1rem] text-wingman-green-button-text">
              Legal Document
            </span>

            <div className="flex flex-col gap-1 text-[1rem] font-medium leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
              <p>Issued By: RallyUp Solutions Private Limited</p>
              <div className="flex items-center justify-between">
                <span>Version 1.0.0</span>
                <span>05/02/2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body: Single column below 1024px, Two columns at 1024px+ */}
      <div className="mx-auto grid grid-cols-1 max-w-8xl px-4 pb-10 mobile:px-8 mobile:pb-20 aside-hide:grid-cols-[17.375rem_minmax(0,1fr)] aside-hide:gap-8">

        {/* Sticky sidebar (hidden strictly below 1024px) */}
        <aside className="hidden aside-hide:block space-y-4 aside-hide:sticky aside-hide:top-28 aside-hide:self-start">
          {/* On this page box */}
          <div className="glass-panel w-[17.375rem]">
            <p className="text-sm font-semibold uppercase tracking-[0.0875rem] text-wingman-cyan">
              On this page
            </p>
            <nav className="flex flex-col gap-3">
              {tocItems.map(({ id, label, icon }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="flex items-center gap-2 text-sm font-semibold text-wingman-cyan transition-opacity hover:opacity-80"
                >
                  <span
                    className="h-[0.84375rem] w-[0.84375rem] shrink-0 bg-wingman-cyan"
                    style={{
                      WebkitMaskImage: `url(${icon})`,
                      maskImage: `url(${icon})`,
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      maskPosition: "center",
                    }}
                  />
                  {label}
                </a>
              ))}
            </nav>
          </div>

          {/* Need Clarification box */}
          <div className="flex w-[17.375rem] flex-col gap-2 rounded-xl border border-[#ffffff1f] bg-gradient-to-br from-[#00d4ff]/10 to-[#00d4ff]/0 p-6">
            <p className="text-sm font-semibold text-wingman-primary-text">
              Need Clarification?
            </p>
            <p className="text-xs font-medium leading-4 text-wingman-secondary-text">
              Our legal and finance teams are available for virtual consultations.
            </p>
            <Button
              variant="ghost"
              href="mailto:response@wingman-pro.com"
              className="mt-2 h-[2.375rem] w-full py-2"
            >
              Contact Us
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex flex-col gap-10 mobile:gap-20 mt-0 mobile:mt-12 aside-hide:ml-4 aside-hide:mt-0">

          {/* 01 Executive Summary (Hidden <768px) */}
          <section id="executive-summary" className="hidden mobile:block scroll-mt-28 space-y-8">
            <SectionHeading number="01" title="Executive Summary" />

            {/* 1.1 Purpose of Agreement Container */}
            <div className="glass-panel">

              {/* Background Gavel Icon */}
              <div className="absolute right-0 top-0 flex h-[5.541875rem] w-[5rem] items-center justify-center pl-[1rem] pr-[1rem] pt-[1rem] pb-[1.375rem] opacity-10">
                <span
                  className="h-[3.166875rem] w-[3rem] shrink-0 bg-wingman-primary-text"
                  style={{
                    WebkitMaskImage: "url(/new-wingman/icons/hammer.svg)",
                    maskImage: "url(/new-wingman/icons/hammer.svg)",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                  }}
                />
              </div>

              {/* Heading */}
              <h3 className="text-[1.5rem] font-semibold leading-[2rem] text-wingman-cyan">
                1.1 Purpose of Agreement
              </h3>

              {/* Paragraph content */}
              <p className="relative z-10 mt-4 text-[1rem] font-normal leading-[1.625rem] text-wingman-secondary-text">
                This document establishes a binding commercial and operational framework between{" "}
                <strong className="font-semibold text-wingman-primary-text">
                  RallyUp Solutions Private Limited
                </strong>{" "}
                (Technology Partner) and{" "}
                <strong className="font-semibold text-wingman-primary-text">
                  Supporters&apos; Club/Fan Club
                </strong>{" "}
                (Club Partner). It governs the licensing, usage, and service levels associated with the Wingman Pro platform.
              </p>
            </div>


            {/* 1.2 and 1.3 Container */}
            <div className="grid gap-12 md:grid-cols-2">

              {/* 1.2 Scope of Partnership */}
              <div>
                <h3 className="text-[1.5rem] font-semibold leading-[2rem] text-wingman-cyan">
                  1.2 Scope of Partnership
                </h3>
                <p className="mt-3 text-[1rem] font-normal leading-[1.5rem] text-wingman-secondary-text">
                  RallyUp Solutions is the Official Technology Partner, digitizing operations through:
                </p>
                <ul className="mt-6 space-y-4">
                  {scopeItems.map(({ icon, title, text }) => (
                    <li key={title} className="flex gap-3">
                      <span
                        className="mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0 bg-wingman-cyan"
                        style={{
                          WebkitMaskImage: `url(${icon})`,
                          maskImage: `url(${icon})`,
                          WebkitMaskSize: "contain",
                          maskSize: "contain",
                          WebkitMaskRepeat: "no-repeat",
                          maskRepeat: "no-repeat",
                          WebkitMaskPosition: "center",
                          maskPosition: "center",
                        }}
                      />
                      <div className="flex flex-col gap-1">
                        <p className="text-[0.875rem] font-semibold leading-[1.25rem] text-wingman-primary-text">
                          {title}
                        </p>
                        <p className="text-[0.75rem] font-medium leading-[1rem] text-wingman-secondary-text">
                          {text}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 1.3 Operational Model */}
              <div>
                <h3 className="text-[1.5rem] font-semibold leading-[2rem] text-wingman-cyan">
                  1.3 Operational Model
                </h3>
                <p className="mt-3 text-[1rem] font-normal leading-[1.5rem] text-wingman-secondary-text">
                  Operating on a &ldquo;Club-First&rdquo; SaaS model prioritizing brand identity.
                </p>

                {/* Brand Ownership Box */}
                <div className="mt-6 flex w-full max-w-[24.875rem] flex-col gap-[0.25rem] rounded-[0.5rem] border-l-[0.25rem] border-wingman-cyan bg-[#1c1b1b] p-[1.25rem]">
                  <p className="text-[0.75rem] font-medium uppercase leading-[1rem] tracking-[0.0375rem] text-wingman-primary-text">
                    Brand Ownership
                  </p>
                  <p className="text-[1rem] font-normal leading-[1.5rem] text-wingman-secondary-text">
                    The Club retains full ownership of its brand, community IP, and member data.
                  </p>
                </div>
              </div>

            </div>
          </section>


          {/* 02 Financial Settlement (Hidden <768px) */}
          <section id="financial-settlement" className="hidden mobile:block scroll-mt-28 space-y-6">
            <SectionHeading number="02" title="Financial Settlement Terms" />
            <p className="max-w-xl text-[1.125rem] font-normal leading-[1.75rem] text-wingman-secondary-text">
              Cash flow is critical for supporter clubs. Select your preferred Payout Cycle for funds collected
              via the platform.
            </p>

            <div className="grid gap-6 sm:grid-cols-3">
              {settlementCycles.map(({ icon, title, tag, text }) => (
                <div key={title} className="glass-panel">
                  {/* Icon Box */}
                  <span className="flex h-[2.5rem] w-[2.5rem] items-center justify-center rounded-lg bg-wingman-cyan/10">
                    <span
                      className="mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0 bg-wingman-cyan"
                      style={{
                        WebkitMaskImage: `url(${icon})`,
                        maskImage: `url(${icon})`,
                        WebkitMaskSize: "contain",
                        maskSize: "contain",
                        WebkitMaskRepeat: "no-repeat",
                        maskRepeat: "no-repeat",
                        WebkitMaskPosition: "center",
                        maskPosition: "center",
                      }}
                    />
                  </span>

                  <div className="flex flex-col gap-1">
                    <p className="text-[1.5rem] font-semibold leading-[2rem] text-wingman-primary-text">
                      {title}
                    </p>
                    <p className="text-[0.875rem] font-semibold leading-[1.25rem] text-wingman-cyan">
                      {tag}
                    </p>
                  </div>

                  <p className="text-[1rem] font-normal leading-[1.5rem] text-wingman-secondary-text">
                    {text}
                  </p>
                </div>
              ))}
            </div>

            {/* Info Notice Container (Removed max-w constraint) */}
            <div className="flex w-full items-center gap-[0.75rem] rounded-[0.5rem] border border-white/10 bg-[#2a2a2a] p-[1rem]">
              <span
                className="mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0 bg-wingman-cyan"
                style={{
                  WebkitMaskImage: "url(/new-wingman/icons/info.svg)",
                  maskImage: "url(/new-wingman/icons/info.svg)",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                }}
              />
              <p className="text-[0.75rem] font-medium leading-[1rem] text-wingman-secondary-text">
                To change your settlement cycle, a written request to the Finance Team is required with 7 days&apos; notice.
              </p>
            </div>
          </section>

          {/* 03 Operational Inclusions (Hidden <768px) */}
          <section id="operational-inclusions" className="hidden mobile:block scroll-mt-28 space-y-8">
            <SectionHeading number="03" title="Operational Inclusions" />

            <div className="flex flex-col gap-10 mobile:flex-row mobile:items-start mobile:gap-12">

              {/* Image Container */}
              <div className="relative h-[20rem] w-full max-w-[26.8125rem] shrink-0 overflow-hidden rounded-[1rem] border border-[#ffffff1f] bg-white/[0.02]">
                <Image
                  src="/new-wingman/images/platform-partner-image.jpg"
                  alt="Admin working on the Wingman Pro dashboard"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Text & List Content */}
              <div className="flex w-full flex-col">
                <h3 className="text-[1.5rem] font-semibold leading-[2rem] text-wingman-primary-text">
                  Onboarding &amp; Training
                </h3>
                <p className="mt-3 text-[1rem] font-normal leading-[1.5rem] text-wingman-secondary-text">
                  Every new Partner Club, regardless of Tier, is entitled to comprehensive setup services.
                </p>

                {/* Items List */}
                <ul className="mt-6 flex flex-col gap-[1rem]">
                  {onboardingItems.map(({ icon: Icon, title, text }) => (
                    <li key={title} className="flex gap-4">
                      {/* Icon */}
                      {/* <Icon className="mt-0.5 h-[1.25rem] w-[1.323125rem] shrink-0 text-[#00fadc]" /> */}

                      {/* Text */}
                      <div className="flex flex-col gap-1">
                        <p className="text-[0.875rem] font-semibold leading-[1.25rem] text-wingman-primary-text">
                          {title}
                        </p>
                        <p className="text-[0.75rem] font-medium leading-[1rem] text-wingman-secondary-text">
                          {text}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </section>

          {/* 04 Cancellation & Termination (Hidden <768px) */}
          <section id="cancellation" className="hidden mobile:block scroll-mt-28 space-y-8">
            <SectionHeading number="04" title="Cancellation & Termination" />

            <div className="grid w-full gap-[1.5rem] md:grid-cols-2">

              {/* 4.1 Notice Period */}
              <div className="glass-panel">
                <h3 className="text-[1.5rem] font-semibold leading-[2rem] text-wingman-primary-text">
                  4.1 Notice Period
                </h3>
                <ul className="mt-2 flex flex-col gap-5">
                  <li className="flex items-start gap-4">
                    <span
                      className="mt-1 h-[1.04125rem] w-[0.833125rem] shrink-0 bg-[#ffb4ab]"
                      style={{
                        WebkitMaskImage: "url(/new-wingman/icons/bell.svg)",
                        maskImage: "url(/new-wingman/icons/bell.svg)",
                        WebkitMaskSize: "contain",
                        maskSize: "contain",
                        WebkitMaskRepeat: "no-repeat",
                        maskRepeat: "no-repeat",
                        WebkitMaskPosition: "center",
                        maskPosition: "center",
                      }}
                    />
                    <p className="text-[1rem] font-normal leading-[1.5rem] text-wingman-secondary-text">
                      <strong className="font-semibold text-wingman-primary-text">
                        30-Day Written Notice:
                      </strong>{" "}
                      Required via email for any subscription cancellation.
                    </p>
                  </li>
                  <li className="flex items-start gap-4">
                    <span
                      className="mt-1 h-[1.04125rem] w-[0.833125rem] shrink-0 bg-[#ffb4ab]"
                      style={{
                        WebkitMaskImage: "url(/new-wingman/icons/download.svg)",
                        maskImage: "url(/new-wingman/icons/download.svg)",
                        WebkitMaskSize: "contain",
                        maskSize: "contain",
                        WebkitMaskRepeat: "no-repeat",
                        maskRepeat: "no-repeat",
                        WebkitMaskPosition: "center",
                        maskPosition: "center",
                      }}
                    />
                    <p className="text-[1rem] font-normal leading-[1.5rem] text-wingman-secondary-text">
                      <strong className="font-semibold text-wingman-primary-text">
                        Data Handover:
                      </strong>{" "}
                      Full export of member data (CSV) and transaction logs within 7 working days.
                    </p>
                  </li>
                </ul>
              </div>

              {/* 4.2 Refund Policy */}
              <div className="glass-panel">
                <h3 className="text-[1.5rem] font-semibold leading-[2rem] text-wingman-primary-text">
                  4.2 Refund Policy
                </h3>
                <p className="mt-2 text-[1rem] font-normal leading-[1.625rem] text-wingman-secondary-text">
                  Subscription fees are non-refundable. If a cancellation request is made mid-month, the
                  service will remain active until the end of the current billing cycle.
                </p>
              </div>

            </div>
          </section>

          {/* Acceptance of Terms (Shared between Mobile & Desktop) */}
          <section id="acceptance-of-terms" className="scroll-mt-28">
            <div className="glass-panel relative overflow-hidden flex w-full items-center justify-center !px-5 !pb-8 !pt-14 mobile:!px-0 mobile:!py-16">

              {/* Top Right Glow/Blur Overlay (Mobile only) */}
              <div className="absolute -right-[1.25rem] -top-[2.4375rem] h-[10rem] w-[10rem] rounded-full bg-[#A8E8FF33] blur-[3.75rem] mobile:hidden" />

              <div className="relative z-10 flex w-full max-w-[42rem] flex-col items-center">

                <span
                  className="hidden h-[2.625rem] w-[2.75rem] shrink-0 bg-wingman-cyan mobile:block"
                  style={{
                    WebkitMaskImage: "url(/new-wingman/icons/verified.svg)",
                    maskImage: "url(/new-wingman/icons/verified.svg)",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                  }}
                />

                <h2 className="mt-0 text-center text-[1.5rem] font-semibold leading-[2rem] tracking-[0rem] text-wingman-primary-text mobile:mt-6 mobile:text-[2rem] mobile:font-bold mobile:leading-[2.5rem] mobile:tracking-[-0.02rem] mobile:text-wingman-primary-text">
                  Acceptance of Terms
                </h2>

                <p className="mt-2 mx-auto max-w-[19rem] text-center text-[0.75rem] font-medium leading-[1rem] text-wingman-secondary-text mobile:mt-4 mobile:max-w-none mobile:px-[2rem] mobile:text-[1.125rem] mobile:font-normal mobile:leading-[1.75rem] mobile:text-wingman-secondary-text">
                  {/* Mobile-only text variant */}
                  <span className="inline mobile:hidden">
                    By proceeding, the Club agrees to the commercials defined above and the Master Service Agreement.
                  </span>
                  {/* Desktop-only text variant */}
                  <span className="hidden mobile:inline">
                    By selecting a Plan on the Wingman Pro Dashboard, the Club agrees to the
                    commercials and terms defined above and as agreed in the Master Service
                    Agreement signed.
                  </span>
                </p>

                {/* Button Container */}
                <div className="mt-8 flex w-full max-w-[42rem] justify-center border-t-0 border-[#ffffff1f] pt-0 mobile:mt-10 mobile:border-t mobile:pt-[3.5rem]">
                  <Button
                    variant="primary"
                    href="mailto:response@wingman-pro.com?subject=Schedule%20a%20Demo"
                    className="
    h-[4rem] w-[16.6875rem] !font-semibold !text-wingman-emphasis-text
    max-[767px]:h-[3.25rem] max-[767px]:w-[12.875rem] max-[767px]:!rounded-[0.5rem]
    max-[767px]:!text-wingman-light-accent-text max-[767px]:!leading-[2rem] max-[767px]:!tracking-[-0.0375rem]
  "
                  >
                    Schedule Demo
                  </Button>
                </div>

              </div>
            </div>
          </section>

          {/* Small-screen sections (Appears first visually due to order-first in function) */}
          <MobileSections />
        </div>
      </div>

      <SiteFooter />
    </main>
  )
}