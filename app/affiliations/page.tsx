import type React from "react"
import Image from "next/image"
import {
  CreditCard,
  Cloud,
  ShieldCheck,
  Users,
  Building2,
  Sprout,
  Banknote,
  Globe,
  ArrowRight,
} from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import SvgIcon from "@/components/svg-icon"
import Button from "@/components/landing/button"

export const metadata = {
  title: "Affiliations | Wingman Pro",
  description: "Our affiliation ecosystem: partnerships, technology and global reach for supporter groups and sports clubs",
}

const TEAL = "text-[#19e6c8]"

const stats = [
  { value: "4+", label: "Continents", valueClass: "text-cyan-300" },
  { value: "10+", label: "Markets", valueClass: "text-fuchsia-400" },
  { value: "35+", label: "Tech Pillars", valueClass: "text-[#19e6c8]" },
]

const paymentChips = ["RazorPay", "AMEX", "Credit Cards", "UPI", "Pay Later"]

const benefits = [
  {
    title: "Club Solutions",
    text: "Dedicated platforms for professional clubs to manage membership, ticketing, and fan engagement — everything in one place.",
  },
  {
    title: "Community Building",
    text: "Features designed to strengthen connections between fans, clubs, and local communities.",
  },
  {
    title: "Supporter Tools",
    text: "Complete toolkit for independent fan clubs — member management, events, and merchandise built in.",
  },
  {
    title: "Custom Partnerships",
    text: "Tailored solutions and integrations for organizations with specific needs and requirements.",
  },
]

const partners = [
  {
    icon: "/new-wingman/icons/user-group.svg",
    title: "Supporter Group Networks",
    text: "Collaborations with global supporter networks — sharing best practices in member management and delivering shared knowledge among Wingman Pro communities.",
    iconClass: "bg-wingman-cyan",
  },
  {
    icon: "/new-wingman/icons/industry.svg",
    title: "Corporate Sponsors",
    text: "Streamlined engagement channels between sponsors and our network of engaged supporter groups — unlocking new revenue opportunities for partner clubs.",
    iconClass: "bg-[#DFB7FF]", // Adjust color class as needed (e.g., purple)
  },
  {
    icon: "/new-wingman/icons/award.svg",
    title: "Youth & Grassroots Programs",
    text: "Purpose-built tracking for attendance and engagement scoring — documenting development, supporting grant obligations, and growing local communities.",
    iconClass: "bg-[#19e6c8]",
  },
]

const regions = [
  {
    name: "Asia-Pacific",
    lines: ["India • Singapore", "Malaysia • Indonesia", "Thailand • Australia"],
    nameClass: "text-[#19e6c8]",
  },
  {
    name: "Middle East",
    lines: ["UAE", "& expanding regionally"],
    nameClass: "text-fuchsia-300",
  },
  {
    name: "Americas",
    lines: ["United States", "Mexico"],
    nameClass: "text-violet-300",
  },
  {
    name: "Europe",
    lines: ["United Kingdom", "Germany", "& growing presence"],
    nameClass: "text-cyan-300",
  },
]

/* ---------- Mobile-only content (from mobile Figma frames) ---------- */
const mobileStats = [
  {
    value: "4+",
    label: "CONTINENTS",
    leftBarGradient: "#A8E8FF",
    style: {
      border: "0.0625rem solid rgba(255, 255, 255, 0.08)",
      borderLeft: "none",
      boxShadow: "0 0 1.25rem 0 #00D4FF26",
      backdropFilter: "blur(1rem)",
      backgroundColor: "#121212",
    },
  },
  {
    value: "10+",
    label: "MARKETS",
    leftBarGradient: "#DFB7FF",
    style: {
      border: "0.0625rem solid rgba(255, 255, 255, 0.08)",
      borderLeft: "none",
      boxShadow: "0 0 1.25rem 0 #9D00FF26",
      backdropFilter: "blur(1rem)",
      backgroundColor: "#121212",
    },
  },
  {
    value: "35+",
    label: "TECH PILLARS",
    spanClass: "col-span-2",
    leftBarGradient: "#00FADC",
    style: {
      border: "0.0625rem solid rgba(255, 255, 255, 0.08)",
      borderLeft: "none",
      backdropFilter: "blur(1rem)",
      backgroundColor: "#121212",
    },
  },
]

const mobileScale = [
  {
    icon: "/new-wingman/icons/cash.svg",
    title: "Seamless Payments",
    text: "Secure integrations with RazorPay and international processors. Multi-currency support including UPI.",
    iconColor: "bg-wingman-cyan",
    iconBox: "bg-[#00D4FF1A]",
    borderBox: "border-[#A8E8FF33]",
    chips: ["Ticketing", "Membership", "Merchandise"],
  },
  {
    icon: "/new-wingman/icons/cloud.svg",
    title: "Always On",
    text: "Built on leading global cloud providers guaranteeing data security, low latency, and resilient operations.",
    iconColor: "bg-[#DFB7FF]",
    iconBox: "bg-[#9D05FF1A]",
    borderBox: "border-[#DFB7FF33]",
    chips: ["Security", "Compliance"],
  },
  {
    icon: "/new-wingman/icons/lock.svg",
    title: "Trusted Identity",
    text: "Integrated with Meta, Google Firebase and AWS to deliver secure, rapid OTP-based authentication for every user.",
    iconColor: "bg-[#00FADC]",
    iconBox: "bg-[#00DBC01A]",
    borderBox: "border-[#00FADC33]",
    chips: [],
  },
]
const mobilePartners = [
  {
    title: "Supporter Group Networks",
    text: "Collaborations with global supporter networks — sharing best practices in member management.",
  },
  {
    title: "Corporate Sponsors",
    text: "Streamlined engagement channels between sponsors and our network of engaged supporter groups.",
  },
  {
    title: "Youth & Grassroots Programs",
    text: "Purpose-built tracking for attendance and engagement scoring — documenting development.",
  },
]

const mobileRegions = [
  { name: "Asia-Pacific", text: "India • Singapore • Malaysia • Indonesia • Thailand • Australia", color: "text-[#00FADC]" },
  { name: "Middle East", text: "UAE & expanding regionally", color: "text-[#DFB7FF]" },
  { name: "Americas", text: "United States • Mexico", color: "text-[#00FADC]" },
  { name: "Europe", text: "United Kingdom • Germany & growing presence", color: "text-[#00FADC]" },
]

const mobileEyebrow =
  "font-['SF_Compact',sans-serif] text-[0.8125rem] font-[656] uppercase tracking-[0.0875rem]"
const mobileTitle = "font-['SF_Pro',sans-serif] text-[1.5rem] font-[590] leading-[2rem] text-wingman-primary-text"
const mobileBody =
  "font-['SF_Compact',sans-serif] text-[0.9375rem] font-[457] leading-[1.5rem] text-wingman-secondary-text"

const card = "rounded-2xl border border-white/10 bg-white/[0.02]"
const gradientText = "bg-gradient-to-r from-[#7be3ff] via-[#b8c4ff] to-[#e0b4ff] bg-clip-text text-transparent"

function SectionHeading({
  label,
  title,
  labelClass = "text-cyan-300",
}: {
  label: string
  title: string
  labelClass?: string
}): React.JSX.Element {
  return (
    <div className="text-center">
      <p className={`text-[0.625rem] font-semibold uppercase tracking-[0.25em] ${labelClass}`}>{label}</p>
      <h2 className={`mt-3 text-4xl font-bold mobile:text-5xl ${gradientText}`}>{title}</h2>
    </div>
  )
}

export default function AffiliationsPage(): React.JSX.Element {
  return (
    <main
      className="min-h-screen overflow-x-clip bg-wingman-light-surface-text text-white"
    >
      <SiteNavbar />

      {/* Hero */}
      <section className="relative">
        {/* Mobile hero */}

        <div className="relative flex flex-col items-start gap-4 px-4 pb-6 pt-8 text-left mobile:hidden">
          <h1 className="font-sf text-[1.5rem] font-[700] leading-[2.1875rem] tracking-[0rem]">
            <span className="bg-gradient-to-r from-[#7be3ff] to-[#c4b5fd] bg-clip-text pr-1 text-transparent">
              Our Affiliation{" "}
            </span>
            <span className="bg-gradient-to-r from-purple-500 to-fuchsia-400 bg-clip-text pr-1 text-transparent">
              Ecosystem.
            </span>
          </h1>

          <p className="font-sf-compact text-[1.125rem] font-[457] leading-[1.75rem] text-wingman-secondary-text">
            Connecting supporter groups and sports organizations with the technology, infrastructure, and
            partnerships they need to thrive.
          </p>

          <div className="mt-[1rem] grid w-full grid-cols-2 gap-[0.75rem] text-left">
            {mobileStats.map(({ value, label, spanClass, leftBarGradient, style }) => (
              <div
                key={label}
                className={`relative flex flex-col gap-[0.25rem] overflow-hidden p-[1rem] ${spanClass || ""}`}
                style={style}
              >
                <div
                  className="pointer-events-none absolute bottom-0 left-0 top-0 w-[0.25rem]"
                  style={{
                    background: leftBarGradient,
                  }}
                />
                <p className="font-sf text-[1.75rem] font-[700] leading-[2.25rem] text-wingman-primary-text">
                  {value}
                </p>
                <p className="font-sf-compact text-[0.75rem] font-[556] uppercase leading-[1rem] text-wingman-secondary-text">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop hero */}
        <div className="relative mx-auto hidden max-w-6xl flex-col items-center gap-6 px-4 pb-12 pt-14 text-center mobile:flex mobile:px-8">
          <h1 className="align-middle font-sf text-[4rem] font-[860] leading-[5rem] tracking-[-0.08rem] text-transparent bg-clip-text bg-gradient-to-r from-[#ABE8FF] to-[#DFB7FF] drop-shadow-[0_0_0.75rem_#A8E8FF66]">
            Our Affiliation Ecosystem
          </h1>

          <span className="rounded-full border border-wingman-green-button/30 bg-wingman-green-button/10 px-3 text-xs font-medium uppercase text-wingman-green-button-text py-1">
            Partnerships &amp; Affiliations
          </span>

          <p className="subheading-main">
            Connecting supporter groups and sports organizations with the technology, infrastructure, and
            partnerships they need to thrive.
          </p>

          <div className="mx-auto w-full max-w-4xl border-t border-[#FFFFFF1F] pt-[2rem]">
            <dl className="flex w-full items-start justify-between gap-[4rem] text-left max-mobile:flex-wrap max-mobile:justify-center">
              {stats.map(({ value, label }) => (
                <div key={label} className="flex flex-col gap-1">
                  <dt className="align-middle font-sf text-[2rem] font-bold leading-[2.5rem] tracking-[-0.02rem] text-wingman-cyan">
                    {value}
                  </dt>
                  <dd className="align-middle font-sf-compact text-[0.75rem] font-[556] uppercase leading-[1rem] tracking-[0.0375rem] text-wingman-secondary-text">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ================= MOBILE ONLY: Built to Scale ================= */}
      <section className="px-4 py-10 mobile:hidden">
        <p className="font-['SF_Compact',sans-serif] text-[0.875rem] font-[656] uppercase leading-[1.25rem] tracking-[0.04375rem] text-[#DFB7FF]">
          INFRASTRUCTURE
        </p>
        <h2 className="mt-[0.5rem] font-['SF_Pro',sans-serif] text-[1.5rem] font-[700] leading-[2.25rem] text-wingman-primary-text">
          Built to Scale.
        </h2>
        <p className="mt-[0.75rem] font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-secondary-text">
          These alliances keep our platform secure, scalable, and always-on for supporter communities across the globe.
        </p>

        <div className="mt-[1.5rem] flex flex-col gap-[1rem]">
          {mobileScale.map(({ icon, title, text, iconColor, iconBox, borderBox, chips }) => (
            <div key={title} className="rounded-[1rem] border border-[#FFFFFF1F] bg-[#121212] p-[1.25rem]">
              <div className="flex items-center gap-[1rem]">
                <span className={`flex h-[3rem] w-[3rem] shrink-0 items-center justify-center rounded-[0.75rem] border ${borderBox} ${iconBox}`}>
                  <SvgIcon
                    src={icon}
                    className={`h-[1rem] w-[1.375rem] shrink-0 ${iconColor}`}
                  />
                </span>
                <h3 className="font-['SF_Pro',sans-serif] text-[1.5rem] font-[590] leading-[2rem] text-wingman-primary-text">
                  {title}
                </h3>
              </div>
              <p className="mt-[1rem] font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-secondary-text">
                {text}
              </p>
              {chips.length > 0 && (
                <div className="mt-[1rem] flex flex-wrap gap-[0.5rem]">
                  {chips.map((chip) => (
                    <span
                      key={chip}
                      className="flex h-[1.5rem] items-center justify-center rounded-full border border-[#FFFFFF1F] bg-[#201F1F] px-[0.75rem] font-['Inter',sans-serif] text-[0.625rem] font-[700] uppercase leading-[0.9375rem] text-wingman-primary-text"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Built to Scale (desktop) */}
      <section className="hidden px-4 pb-24 mobile:block mobile:px-8">
        <div className="mx-auto max-w-8xl">
          <p className="align-middle text-[0.875rem] font-[656] uppercase leading-[1.25rem] tracking-[-0.04375rem] text-[#DFB7FF]">
            CORE FEATURES
          </p>
          <h2 className="mt-2 align-middle text-[2rem] font-bold leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
            Built to Scale.
          </h2>
          <p className="mt-3 max-w-md align-middle text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
            These alliances keep our platform secure, scalable, and always-on for
            supporter communities across the globe.
          </p>

          <div className="mt-8 grid gap-4 aside-hide:grid-cols-3">
            {/* Payment Gateways */}
            <div className="glass-panel flex h-full flex-col p-[2.5rem] aside-hide:col-span-2">
              <div className="flex items-center gap-3">
                <SvgIcon
                  src="/new-wingman/icons/cash.svg"
                  className="h-[1.5rem] w-[2.0625rem] shrink-0 bg-wingman-cyan"
                />                <h3 className="align-middle text-[1.5rem] font-[590] leading-[2rem] tracking-[0rem] text-wingman-primary-text">
                  Payment Gateways
                </h3>
              </div>
              <p className="mt-5 max-w-md align-middle text-[1.125rem] font-[457] leading-[1.75rem] tracking-[0rem] text-wingman-secondary-text">
                Secure integrations with RazorPay and international processors. Multi-currency support including
                UPI — covering membership fees, merchandise, and ticketing.
              </p>
              <div className="mt-auto flex flex-wrap gap-2.5 pt-8">
                {paymentChips.map((chip) => (
                  <span
                    key={chip}
                    className="flex h-[3rem] w-[7.5rem] items-center justify-center rounded-[0.5rem] border border-[#FFFFFF1F] bg-[#FFFFFF0D] align-middle text-[1rem] font-[656] leading-[1.5rem] text-wingman-secondary-text"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            {/* Cloud Hosting */}
            <div className="flex h-[24.1875rem] flex-col justify-between rounded-[1rem] border border-[#FFFFFF1F] bg-gradient-to-br from-[#121212] to-[#1C1B1B] p-[2.5rem] backdrop-blur-[1.25rem]">
              <div>
                <span className="flex h-[4rem] w-[4rem] items-center justify-center rounded-[0.75rem] border border-[#DFB7FF33] bg-[#DFB7FF1A]">
                  <SvgIcon
                    src="/new-wingman/icons/cloud.svg"
                    className="h-[1.25rem] w-[1.71875rem] shrink-0 bg-[#DFB7FF]"
                  />
                </span>
                <h3 className="mt-5 align-middle text-[1.5rem] font-[590] leading-[2rem] tracking-[0rem] text-wingman-primary-text">
                  Cloud Hosting
                </h3>
                <p className="mt-3 align-middle text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
                  Built on leading global providers guaranteeing data security and low latency.
                </p>
              </div>
              <div className="border-t border-[#FFFFFF1F] pt-4">
                <p className="align-middle text-[1rem] font-[457] uppercase leading-[1.5rem] tracking-[0.05rem] text-[#DFB7FF]">
                  Always On
                </p>
              </div>
            </div>

            {/* Authentication */}
            <div className="flex h-[24.1875rem] flex-col justify-between rounded-[1rem] border border-[#FFFFFF1F] bg-gradient-to-br from-[#121212] to-[#1C1B1B] p-[2.5rem] backdrop-blur-[1.25rem]">
              <div>
                <span className="flex h-[4rem] w-[4rem] items-center justify-center rounded-[0.75rem] border border-[#00FADC33] bg-[#00FADC1A]">
                  <SvgIcon
                    src="/new-wingman/icons/shield-check.svg"
                    className="h-[1.5rem] w-[1.5rem] shrink-0 bg-[#00FADC]"
                  />
                </span>
                <h3 className="mt-5 align-middle text-[1.5rem] font-[590] leading-[2rem] tracking-[0rem] text-wingman-primary-text">
                  Authentication
                </h3>
                <p className="mt-3 align-middle text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
                  Integrated with Google Firebase for secure OTP-based identity management.
                </p>
              </div>
              <div className="border-t border-[#FFFFFF1F] pt-4">
                <p className="align-middle text-[1rem] font-[457] uppercase leading-[1.5rem] tracking-[0.05rem] text-[#00FADC]">
                  TRUSTED IDENTITY
                </p>
              </div>
            </div>

            {/* Infrastructure */}
            <div className="flex h-[24.1875rem] items-center justify-between gap-[2.5rem] rounded-[1rem] border border-[#FFFFFF1F] bg-[#12121299] p-[2.5rem] backdrop-blur-[1.25rem] aside-hide:col-span-2 max-mobile:h-auto max-mobile:flex-col">
              <div className="flex-1">
                <h3 className="align-middle text-[1.5rem] font-[590] leading-[2rem] tracking-[0rem] text-wingman-primary-text">
                  Infrastructure
                </h3>
                <p className="mt-3 align-middle text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
                  Scalable cloud architecture purpose-built for high-traffic fan communities and
                  international compliance standards.
                </p>
              </div>
              <div className="relative hidden h-[19.0625rem] w-[21.875rem] shrink-0 opacity-60 mobile:block">
                {/* Export this image from Figma and save it as /public/affiliations-infrastructure.jpg */}
                <Image
                  src="/new-wingman/images/affiliation-image.jpg"
                  alt="Global network infrastructure"
                  fill
                  className="rounded-lg object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= MOBILE ONLY: What You Get ================= */}
      <section className="bg-[#1C1B1B4D] px-4 py-10 mobile:hidden">
        <p className="font-['SF_Compact',sans-serif] text-[0.875rem] font-[656] uppercase leading-[1.25rem] tracking-[0.04375rem] text-wingman-cyan">
          PARTNERSHIP BENEFITS
        </p>
        <h2 className="mt-[0.5rem] font-['SF_Pro',sans-serif] text-[1.5rem] font-[700] leading-[2.25rem] text-wingman-primary-text">
          What You Get.
        </h2>
        <ol className="mt-[1.5rem] flex flex-col gap-[1.5rem]">
          {benefits.map(({ title, text }, i) => (
            <li key={title} className="flex gap-[1rem]">
              <span className="w-[2rem] shrink-0 font-['SF_Pro',sans-serif] text-[1.5rem] font-[590] leading-[2rem] text-wingman-cyan">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-['SF_Compact',sans-serif] text-[0.875rem] font-[656] leading-[1.25rem] text-wingman-primary-text">
                  {title}
                </h3>
                {/* Note: Ensure your 'benefits' array text matches your Figma prompt for exact length */}
                <p className="mt-[0.5rem] font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-secondary-text">
                  {text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* What You Get (desktop) */}
      <section className="hidden bg-[#1C1B1B4D] px-4 py-[6rem] mobile:block mobile:px-8">
        <div className="mx-auto w-full max-w-8xl">
          <div className="text-center">
            <p className="align-middle text-[0.875rem] font-[656] uppercase leading-[1.25rem] tracking-[0.0875rem] text-wingman-cyan">
              PARTNERSHIP BENEFITS
            </p>
            <h2 className="mt-2 align-middle text-[4rem] font-[860] leading-[4.5rem] tracking-[-0.08rem] text-transparent bg-clip-text bg-gradient-to-r from-[#ABE8FF] to-[#DFB7FF]">
              What You Get.
            </h2>
          </div>

          {/* Switched to CSS grid and removed the fixed max-w-[272px] on cards so they expand to fill the 8xl container */}
          <div className="mt-12 grid gap-[1rem] mobile:grid-cols-2 aside-hide:grid-cols-4">
            {benefits.map(({ title, text }, i) => (
              <div key={title} className="flex h-[22.125rem] w-full flex-col gap-[1rem] rounded-[1rem] border border-[#FFFFFF1F] bg-[#121212] p-[2rem]">
                <p className="align-middle text-[4rem] font-[860] leading-[4.5rem] tracking-[-0.08rem] text-[#BBC9CF1A]">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="align-middle text-[1.5rem] font-[590] leading-[2rem] tracking-[0rem] text-wingman-primary-text">
                  {title}
                </h3>
                <p className="align-middle text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= MOBILE ONLY: Who We Work With ================= */}
      <section className="px-4 py-10 mobile:hidden">
        <p className="font-['SF_Compact',sans-serif] text-[0.875rem] font-[656] uppercase leading-[1.25rem] tracking-[0.04375rem] text-[#DFB7FF]">
          LEAGUE & ORGANIZATIONAL
        </p>
        <h2 className="mt-[0.5rem] font-['SF_Pro',sans-serif] text-[1.5rem] font-[700] leading-[2.25rem] text-wingman-primary-text">
          Who We Work With.
        </h2>
        <div className="mt-[1.5rem] flex flex-col gap-[1rem]">
          {mobilePartners.map(({ title, text }) => (
            <div key={title} className="rounded-[1rem] border border-[#FFFFFF1F] bg-[#121212] p-[1.25rem]">
              <h3 className="font-['SF_Compact',sans-serif] text-[0.875rem] font-[656] leading-[1.25rem] text-wingman-primary-text">
                {title}
              </h3>
              <p className="mt-[0.5rem] font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-secondary-text">
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Who We Work With (desktop) */}
      <section className="hidden px-4 py-24 mobile:block mobile:px-8">
        <div className="mx-auto grid w-full max-w-8xl gap-12 aside-hide:grid-cols-[1fr_1.7fr]">
          <div>
            <p className="align-middle text-[0.875rem] font-[656] uppercase leading-[1.25rem] tracking-[-0.04375rem] text-[#00FADC]">
              LEAGUE &amp; ORGANIZATIONAL AFFILIATES
            </p>
            <h2 className="mt-3 align-middle text-[2rem] font-bold leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
              Who We Work With.
            </h2>
            <p className="mt-4 max-w-xs align-middle text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
              Wingman Pro fosters a collaborative network designed to uplift every tier of the sporting world.
            </p>
          </div>

          <ul className="space-y-8">
            {partners.map(({ icon, title, text }) => (
              <li key={title} className="flex gap-[1rem]">
                <span className="flex h-[4rem] w-[4rem] shrink-0 items-center justify-center rounded-full border border-[#A8E8FF33] bg-[#A8E8FF1A]">
                  <SvgIcon
                    src={icon}
                    className="h-[0.9375rem] w-[1.875rem] shrink-0 bg-wingman-cyan"
                  />
                </span>
                <div>
                  <h3 className="align-middle text-[1.5rem] font-[590] leading-[2rem] tracking-[0rem] text-wingman-primary-text">
                    {title}
                  </h3>
                  <p className="mt-2 align-middle text-[1rem] font-[457] leading-[1.625rem] tracking-[0rem] text-wingman-secondary-text">
                    {text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ================= MOBILE ONLY: We're Everywhere ================= */}
      <section className="bg-[#121212] px-4 py-10 mobile:hidden">
        <div className="flex items-start justify-between gap-[1rem]">
          <div>
            <p className="font-['SF_Compact',sans-serif] text-[0.875rem] font-[656] uppercase leading-[1.25rem] tracking-[0.04375rem] text-[#00FADC]">
              GLOBAL REACH
            </p>
            <h2 className="mt-[0.5rem] font-['SF_Pro',sans-serif] text-[1.75rem] font-[700] leading-[2.25rem] text-wingman-primary-text">
              We&apos;re Everywhere.
            </h2>
          </div>
          <SvgIcon
            src="/new-wingman/icons/earth.svg"
            className="h-[3.3125rem] w-[3.3125rem] shrink-0 bg-wingman-secondary-text"
          />
        </div>
        <div className="mt-[1.5rem] flex flex-col gap-[1.5rem]">
          {mobileRegions.map(({ name, text }) => (
            <div key={name} className="border-l border-[#FFFFFF1F] pl-[1rem]">
              <h3 className="font-['SF_Compact',sans-serif] text-[0.875rem] font-[656] leading-[1.25rem] text-wingman-cyan">
                {name}
              </h3>
              <p className="mt-[0.5rem] font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-primary-text">
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* We're Everywhere (desktop) */}
      <section className="hidden bg-wingman-light-surface-text px-4 py-[6rem] mobile:block mobile:px-8">
        <div className="mx-auto w-full max-w-8xl">
          <div className="text-center">
            <p className="align-middle text-[0.875rem] font-[656] uppercase leading-[1.25rem] tracking-[0.0875rem] text-wingman-cyan">
              GLOBAL REACH
            </p>
            <h2 className="mt-2 align-middle text-[4rem] font-[860] leading-[4.5rem] tracking-[-0.08rem] text-transparent bg-clip-text bg-gradient-to-r from-[#ABE8FF] to-[#DFB7FF]">
              We're Everywhere.
            </h2>
          </div>

          <div className="mt-12 grid gap-[1rem] mobile:grid-cols-2 aside-hide:grid-cols-4">
            {regions.map(({ name, lines }) => (
              <div key={name} className="flex h-[12.625rem] w-full flex-col gap-[1rem] rounded-[0.75rem] border border-[#FFFFFF1F] bg-[#12121299] p-[2rem] backdrop-blur-[1.25rem]">
                <h3 className="align-middle text-[1.5rem] font-[590] leading-[2rem] tracking-[0rem] text-wingman-cyan">
                  {name}
                </h3>
                <div className="flex flex-col">
                  {lines.map((line) => (
                    <p key={line} className="align-middle text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ================= MOBILE ONLY: CTA ================= */}
      <section className="px-4 pb-[4rem] pt-[1.5rem] mobile:hidden">
        <div className="flex flex-col items-center rounded-[1rem] border border-[#FFFFFF1F] bg-[#121212] p-[1.5rem] text-center">
          <h2 className="font-['SF_Pro',sans-serif] text-[1.5rem] font-[700] leading-[2.25rem] text-center text-wingman-primary-text">
            Let&apos;s Build Together.
          </h2>
          <p className="mt-[0.75rem] font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-center text-wingman-secondary-text">
            Whether you&apos;re a football club, supporter group, or organization — we&apos;d love to explore how Wingman Pro can support you.
          </p>
          <Button
            variant="primary"
            href="mailto:response@wingman-pro.com"
            className="
    mt-[1.5rem] h-[3.5rem] w-full gap-[0.5rem] uppercase
    !font-sf-compact !text-[0.875rem] !font-[656] !leading-[1.25rem]
    !tracking-[0.0875rem] !text-[#001F27]
  "
          >
            CONTACT US
            <SvgIcon
              src="/new-wingman/icons/arrow-right.svg"
              className="h-[1rem] w-[1rem] shrink-0 bg-[#001F27]"
            />
          </Button>
        </div>
      </section>

      {/* CTA Section (desktop) */}
      <section className="hidden px-4 pb-24 mobile:block mobile:px-8">
        <div className="mx-auto w-full max-w-8xl">
          <div className="rounded-[1.5rem] bg-gradient-to-r from-[#00D4FF] to-[#9D05FF] p-[1px]">
            <div className="flex h-auto min-h-[27.125rem] flex-col items-center justify-center rounded-[1.4375rem] bg-[#121212] p-[4rem] text-center max-mobile:p-[2rem]">
              <p className="align-middle text-[0.875rem] font-[656] uppercase leading-[1.25rem] tracking-[0.175rem] text-wingman-cyan">
                INTERESTED IN PARTNERING?
              </p>
              <h2 className="mt-4 align-middle text-[4rem] font-[860] leading-[4.5rem] tracking-[-0.08rem] text-wingman-primary-text max-mobile:text-[2.5rem] max-mobile:leading-[3rem]">
                Let&apos;s Build Together.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl align-middle text-[1.125rem] font-[457] leading-[1.75rem] tracking-[0rem] text-wingman-secondary-text">
                Whether you&apos;re a football club, supporter group, or football organization —
                we&apos;d love to explore how Wingman Pro can support your community.
              </p>
              <Button
                variant="primary"
                href="mailto:response@wingman-pro.com"
                className="
    mt-8 h-[3.125rem] w-[9.4375rem] whitespace-nowrap px-[2rem] py-[0.8125rem]
    !text-[1rem] !font-[656] !leading-[1.5rem] !text-wingman-emphasis-text
  "
              >
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main >
  )
}