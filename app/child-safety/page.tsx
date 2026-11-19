import type React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Ban,
  CheckCircle2,
  Flag,
  Shield,
  ShieldCheck,
  Gavel,
  Lock,
  Mail,
  TriangleAlert,
  Eye,
  Contact,
  UserX,
} from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import SvgIcon from "@/components/svg-icon"
import Button from "@/components/ui/button"

export const metadata = {
  title: "Child Safety & CSAE Compliance | Wingman Pro",
  description: "Wingman Pro's zero-tolerance policy on Child Sexual Abuse Material (CSAM) and child safety compliance",
}

const ACCENT = "text-[#19e6c8]"

const missionCards = [
  {
    icon: "/new-wingman/icons/shield.svg",
    title: "Proactive Defense",
    text: "Automated hashing and scanning for known CSAM signatures.",
  },
  {
    icon: "/new-wingman/icons/hammer.svg",
    title: "Legal Adherence",
    text: "Full alignment with global regulatory reporting mandates.",
  },
]

const regulations = [
  {
    icon: "/new-wingman/icons/shield-search.svg",
    title: "POCSO",
    text: "India: Protection of Children from Sexual Offences Act",
  },
  {
    icon: "/new-wingman/icons/shield-check.svg",
    title: "DSA",
    text: "EU: Digital Services Act (Safety Obligations)",
  },
  {
    icon: "/new-wingman/icons/flag.svg",
    title: "NCMEC",
    text: "USA: Mandatory reporting to National Center for Missing & Exploited Children",
  },
  {
    icon: "/new-wingman/icons/lock.svg",
    title: "UK Online Safety",
    text: "UK: Proactive detection and removal mandates.",
  },
]

const prohibited = [
  {
    title: "CSAM & Exploitation",
    text: "Possession, distribution, or facilitation of child sexual abuse material in any digital format.",
    tag: "Zero Tolerance",
    icon: "/new-wingman/icons/alert-triangle.svg",
    titleClass: "text-[#FFB4AB]",
    tagClass: "text-[#FFB4AB]",
  },
  {
    title: "Grooming & Solicitation",
    text: "Behaviors intended to build trust with minors for sexual exploitation or illegal data acquisition.",
    tag: "Active Monitoring",
    icon: "/new-wingman/icons/colored-shield.svg",
    titleClass: "text-wingman-cyan",
    tagClass: "text-wingman-cyan",
  },
  {
    title: "Inappropriate Interaction",
    text: "Non-consensual sharing of personal information or suggestive imagery involving minor members.",
    tag: "Human Moderation",
    icon: "/new-wingman/icons/eye.svg",
    titleClass: "text-[#19e6c8]",
    tagClass: "text-[#19e6c8]",
  },
]

const procedures = [
  {
    title: "Detection & Hashing",
    text: "Automated systems scan all uploaded content against global databases of known harmful signatures (PhotoDNA and similar technologies).",
  },
  {
    title: "Priority 1 Reporting",
    text: "Confirmed CSAM incidents trigger a Priority 1 SLA, where authorities are notified within 2 hours of verification.",
  },
  {
    title: "Account Enforcement",
    text: "Immediate permanent ban of offending accounts, hardware ID blacklisting, and preservation of evidence for law enforcement.",
  },
]

const reportingRows = [
  { region: "USA / Global", authority: "NCMEC CyberTipline", timeline: "Immediate (< 24 hrs)" },
  { region: "India", authority: "NCRB / Local Police Authorities", timeline: "Statutory 24-48 hrs" },
  { region: "European Union", authority: "Europol / Member State Authorities", timeline: "Immediate" },
  { region: "United Kingdom", authority: "National Crime Agency (NCA/CEOP)", timeline: "Priority Notification" },
]

/* ---------- Mobile-only content (from mobile Figma frame) ---------- */
const mobileRegulations = [
  "National Center for Missing & Exploited Children (NCMEC)",
  "EU Digital Services Act (DSA) Compliance",
  "UK Online Safety Act Requirements",
]

const mobileProhibited = [
  {
    icon: "/new-wingman/icons/stop.svg",
    iconBox: "bg-[#93000A33] border border-[#93000A4D]",
    iconColor: "text-[#FFB4AB]",
    title: "CSAM Distribution",
    text: "The creation, sharing, or storage of any material depicting Child Sexual Abuse Material is strictly prohibited and subject to immediate federal reporting.",
  },
  {
    icon: "/new-wingman/icons/user-off.svg",
    iconBox: "bg-[#9D05FF33] border border-[#9D05FF4D]",
    iconColor: "text-[#DFB7FF]",
    title: "Grooming Behaviors",
    text: "Any interaction intended to gain the trust of a child for sexual exploitation or to desensitize them is banned across all communication channels.",
  },
  {
    icon: "/new-wingman/icons/alert-triangle.svg",
    iconBox: "bg-[#00DBC033] border border-[#00DBC04D]",
    iconColor: "text-[#19e6c8]",
    title: "Illegal Recruitment",
    text: "Solicitation of minors for illicit acts or organized criminal activities within fan groups is grounds for permanent exclusion and legal action.",
  },
]

const mobileProcedures = [
  {
    title: "AI-Powered Scanning",
    text: "Automated systems scan all uploaded media against known hashes of illegal material provided by global law enforcement agencies.",
  },
  {
    title: "Moderator Intervention",
    text: "Flagged content is prioritized for human review by a specialized safety team trained in CSAE detection and trauma-informed assessment.",
  },
  {
    title: "Law Enforcement Escalation",
    text: "Confirmed violations are reported to NCMEC and relevant local authorities within 24 hours of discovery, accompanied by necessary metadata.",
  },
  {
    title: "Account Suspension",
    text: "Offending accounts are permanently banned, and hardware-level identifiers are blacklisted to prevent re-entry into the Wingman Pro ecosystem.",
  },
]

const mobileCard = "rounded-[1rem] border border-white/10 bg-white/[0.03] p-5"

export default function ChildSafetyPage(): React.JSX.Element {
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
      <section className="relative pb-8">
        {/* Blur glow: hsla(196, 100%, 83%, 0.1) */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-[22.5rem] w-[56.25rem] max-w-full -translate-x-1/2 rounded-full" />

        <div className="relative mx-auto flex max-w-8xl flex-col items-start gap-4 px-4 pb-6 pt-12 text-left mobile:items-center mobile:gap-6 mobile:px-8 mobile:pb-12 mobile:pt-14 mobile:text-center">

          {/* Mobile-only heading */}
          <h1 className="w-full max-w-none self-stretch font-sf text-[1.5rem] font-[700] leading-[2.1875rem] tracking-[0rem] text-left text-wingman-primary-text mobile:hidden">
            Child Safety &amp; CSAE Compliance
          </h1>

          {/* Desktop heading */}
          <h1 className="heading-main hidden mobile:block">
            Child Safety &amp; CSAE Compliance
          </h1>

          {/* Mobile badge */}
          <span className="inline-flex items-center gap-2 rounded-full border border-wingman-green-button/30 bg-wingman-green-button/10 px-3 py-1 text-[0.75rem] font-medium leading-[1rem] text-wingman-green-button-text mobile:hidden">
            <SvgIcon
              src="/new-wingman/icons/shield-check-fill.svg"
              className="h-[0.9375rem] w-[0.75rem] shrink-0 bg-wingman-cyan"
            />
            Compliance &amp; Safety
          </span>

          {/* Desktop badge */}
          <span className="hidden h-[1.625rem] w-[12.5625rem] items-center justify-center rounded-full border border-[#A8E8FF4D] bg-[#A8E8FF1A] px-[1rem] py-[0.25rem] text-[0.75rem] font-medium uppercase leading-[1rem] tracking-[0.075rem] text-wingman-cyan mobile:inline-flex">
            SAFETY FIRST PLATFORM
          </span>

          {/* max-w-none on small screens overrides the 673px from .subheading-main */}
          <p className="subheading-main max-w-none mobile:max-w-[673px]">
            <span className="text-[1.125rem] font-normal leading-[1.75rem] tracking-[0rem] text-wingman-secondary-text mobile:hidden">
              Wingman Pro is committed to maintaining a safe environment for all supporters,
              especially children. Our Zero-Tolerance policy for Child Sexual Abuse and
              Exploitation (CSAE) ensures a secure digital ecosystem for high-performance
              sports groups.
            </span>
            <span className="hidden mobile:inline">
              Wingman Pro maintains a zero-tolerance policy regarding Child Sexual Abuse Material (CSAM). We are
              committed to a safe, compliant environment for all supporters and minor audiences globally.
            </span>
          </p>

          <div className="mt-8 hidden flex-wrap items-center justify-center gap-3 mobile:flex">
            <Button
              variant="primary"
              href="/report-violation"
              className="h-[3.5rem] w-auto gap-2 px-8 !text-[0.875rem] !font-semibold !leading-[1.25rem] !text-wingman-emphasis-text"
            >
              <SvgIcon
                src="/new-wingman/icons/curve-info.svg"
                className="h-[1.125rem] w-[1.125rem] shrink-0 bg-wingman-emphasis-text"
              />
              Report a Violation
            </Button>

            <a
              href="#regulatory-alignment"
              className="inline-flex h-[3.5rem] items-center justify-center rounded-[0.75rem] border border-white/50 bg-transparent px-8 text-[0.875rem] font-semibold text-wingman-primary-text transition-colors hover:bg-white/10"
            >
              View Compliance Framework
            </a>
          </div>
        </div>
      </section>

      {/* ================= MOBILE ONLY: Mission + Regulatory ================= */}
      <section className="flex flex-col gap-4 px-4 pb-8 mobile:hidden">
        <div className={mobileCard}>
          <h2 className="text-[1.5rem] font-semibold leading-[2rem] tracking-[0rem] text-wingman-primary-text">Mission Statement</h2>
          <p className="mt-4 text-[1rem] font-normal leading-[1.625rem] tracking-[0rem] text-wingman-secondary-text">
            To protect children from all forms of exploitation and abuse within the Wingman Pro platform by
            implementing rigorous monitoring, rapid response protocols, and strict adherence to global safety
            standards.
          </p>
        </div>

        <div className={mobileCard}>
          <h2 className="text-[1.5rem] font-semibold leading-[2rem] tracking-[0rem] text-wingman-primary-text">Regulatory Alignment</h2>
          <ul className="mt-4 flex flex-col gap-4">
            {mobileRegulations.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <SvgIcon
                  src="/new-wingman/icons/circle-check.svg"
                  className="mt-0.5 h-5 w-5 shrink-0 bg-[#19e6c8]"
                />
                <span className="text-[1rem] font-normal leading-[1.625rem] text-wingman-primary-text">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Mission Statement & Scope (desktop) */}
      <section className="hidden px-4 pb-8 mobile:block mobile:px-8">
        <div className="glass-panel mx-auto grid max-w-8xl gap-8 p-8 lg:grid-cols-2">
          <div className="flex flex-col justify-center">
            <h2 className="text-[2rem] font-bold leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
              Mission Statement &amp; Scope
            </h2>
            <p className="mt-4 text-base font-normal leading-[1.625rem] text-wingman-secondary-text">
              Our mission is to facilitate supporter engagement through cutting-edge technology without
              compromising the safety of children. Wingman Pro strictly adheres to the highest international
              standards for detecting and eliminating Child Sexual Abuse Material (CSAM) and Grooming
              behaviors. Our scope extends to all communications, digital asset transfers, and community
              interactions hosted on our infrastructure.
            </p>
          </div>
          <div className="grid gap-4 mobile:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {missionCards.map(({ icon, title, text }) => (
              <div key={title} className="flex flex-col gap-2 rounded-2xl border border-white/[0.12] bg-white/5 p-6">
                <SvgIcon
                  src={icon}
                  className="h-[1.875rem] w-6 shrink-0 bg-wingman-cyan"
                />
                <div className="mt-1">
                  <p className="text-sm font-semibold leading-5 text-wingman-primary-text">{title}</p>
                  <p className="mt-1 text-xs font-normal leading-4 text-wingman-secondary-text">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Regulatory Alignment (desktop) */}
      <section id="regulatory-alignment" className="hidden scroll-mt-24 px-4 py-20 mobile:block mobile:px-8">
        <div className="mx-auto max-w-8xl">
          <h2 className="text-center text-[2rem] font-bold leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
            Global Regulatory Alignment
          </h2>
          <p className="mt-3 text-center text-base font-normal leading-[1.5rem] text-wingman-secondary-text">
            We align our operations with the world&apos;s most stringent minor protection frameworks.
          </p>
          <div className="mt-10 grid gap-4 mobile:grid-cols-2 lg:grid-cols-4">
            {regulations.map(({ icon, title, text }) => (
              <div key={title} className="glass-panel flex flex-col items-center p-6 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-wingman-cyan/10">
                  <SvgIcon
                    src={icon}
                    className="h-[1.5625rem] w-5 shrink-0 bg-wingman-cyan"
                  />
                </span>
                <p className="mt-4 text-2xl font-semibold leading-8 text-wingman-primary-text">{title}</p>
                <p className="mt-2 text-xs font-medium leading-4 text-wingman-secondary-text">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= MOBILE ONLY: Prohibited Conduct ================= */}
      <section className="px-4 py-10 mobile:hidden">
        <h2 className="text-center text-[1.5rem] font-semibold leading-[2rem] tracking-[0rem] text-wingman-primary-text">Prohibited Conduct</h2>
        <div className="mt-6 flex flex-col gap-4">
          {mobileProhibited.map(({ icon, iconBox, iconColor, title, text }) => (
            <div key={title} className={mobileCard}>
              <span className={`flex h-[3rem] w-[3rem] items-center justify-center rounded-[0.5rem] ${iconBox}`}>
                <SvgIcon
                  src={icon}
                  className={`h-[1.25rem] w-[1.25rem] shrink-0 bg-[currentColor] ${iconColor}`}
                />
              </span>
              <p className="mt-4 text-[0.875rem] font-semibold leading-[1.25rem] text-wingman-emphasis-text">{title}</p>
              <p className="mt-2 text-[0.875rem] font-normal leading-[1.25rem] text-wingman-secondary-text">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prohibited Content & Conduct (desktop) */}
      <section className="hidden bg-[#0E0E0E] px-4 py-24 mobile:block mobile:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-[2rem] font-bold leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
            Prohibited Content &amp; Conduct
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {prohibited.map(({ title, text, tag, icon, titleClass, tagClass }) => (
              <div key={title} className="glass-panel flex flex-col p-8">
                <h3 className={`text-2xl font-semibold leading-8 ${titleClass}`}>{title}</h3>
                <p className="mt-4 flex-1 text-base font-normal leading-6 text-wingman-secondary-text">{text}</p>
                <p
                  className={`mt-8 flex items-center gap-2 text-base font-normal uppercase leading-6 tracking-[0.1rem] ${tagClass}`}
                >
                  <SvgIcon
                    src={icon}
                    className="h-[1.1875rem] w-[1.375rem] shrink-0 bg-wingman-cyan"
                  />
                  {tag}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= MOBILE ONLY: Operational Procedures ================= */}
      <section className="px-4 py-10 mobile:hidden">
        <h2 className="text-center text-[1.5rem] font-semibold leading-[2rem] tracking-[0rem] text-wingman-primary-text">
          Operational Procedures
        </h2>
        <ol className="mt-6">
          {mobileProcedures.map(({ title, text }, i) => (
            <li
              key={title}
              className={`relative flex gap-4 ${i === mobileProcedures.length - 1 ? "" : "pb-8"}`}
            >
              {i !== mobileProcedures.length - 1 && (
                <span className="absolute left-[0.9375rem] top-8 h-[calc(100%-2rem)] w-px bg-white/15" />
              )}
              <span className="relative z-10 flex h-[2rem] w-[2rem] shrink-0 items-center justify-center rounded-full bg-[#00D4FF] text-[1rem] font-semibold leading-[1.5rem] text-[#00586B]">
                {i + 1}
              </span>
              <div>
                <p className="text-[0.875rem] font-semibold leading-[1.25rem] text-wingman-emphasis-text">{title}</p>
                <p className="mt-1 text-[1rem] font-normal leading-[1.5rem] text-wingman-secondary-text">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Operational Procedures (desktop) */}
      <section className="hidden bg-black mobile:block">
        <div className="mx-auto grid max-w-8xl items-center gap-16 px-12 py-24 lg:grid-cols-2">
          <div>
            <h2 className="text-[2rem] font-bold leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
              Operational Procedures
            </h2>
            <ol className="mt-10 space-y-8">
              {procedures.map(({ title, text }, i) => (
                <li key={title} className="flex gap-6">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-wingman-cyan/30 text-lg font-semibold text-wingman-primary-text">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-2xl font-semibold leading-8 text-wingman-primary-text">{title}</p>
                    <p className="mt-2 text-base font-normal leading-[1.5rem] text-wingman-secondary-text">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="glass-panel flex w-full flex-col gap-6 rounded-[1.5rem] bg-wingman-cyan/10 p-8 backdrop-blur-[7.5rem]">
            <div className="relative h-[25rem] w-full overflow-hidden rounded-xl shadow-[0_1.5625rem_3.125rem_-0.75rem_rgba(0,0,0,0.25)]">
              {/* Export this image from Figma and save it as /public/child-safety-dashboard.jpg */}
              <Image
                src="/new-wingman/images/csae-image.jpg"
                alt="Wingman Pro threat monitoring dashboard"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex items-end justify-between px-2">
              <div>
                <p className="text-xs font-normal uppercase leading-4 tracking-[-0.0375rem] text-wingman-secondary-text">
                  System Status
                </p>
                <p className="mt-1 text-base font-normal leading-[1.5rem] text-wingman-cyan">Operational</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-normal uppercase leading-4 tracking-[-0.0375rem] text-wingman-secondary-text">
                  SLA Uptime
                </p>
                <p className="mt-1 text-base font-normal leading-[1.5rem] text-[#00FADC]">99.9%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mandatory Reporting Protocols (desktop only; not in the mobile design) */}
      <section className="hidden bg-[#1C1B1B] px-4 py-24 mobile:block mobile:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-[2rem] font-bold leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
            Mandatory Reporting Protocols
          </h2>
          <div className="mt-12 overflow-x-auto">
            <table className="w-full min-w-[43.75rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.12]">
                  {["Region", "Primary Authority", "Reporting Timeline"].map((head) => (
                    <th key={head} className="pb-4 text-2xl font-semibold leading-8 text-wingman-cyan">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportingRows.map((row) => (
                  <tr key={row.region} className="border-b border-white/[0.12] last:border-0">
                    <td className="py-6 text-sm font-semibold leading-5 text-wingman-primary-text">{row.region}</td>
                    <td className="py-6 text-base font-normal leading-[1.5rem] text-wingman-secondary-text">{row.authority}</td>
                    <td className="py-6 text-sm font-semibold leading-5 text-[#00FADC]">{row.timeline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ================= MOBILE ONLY: Dedicated Compliance Officer ================= */}
      <section className="px-4 pb-12 pt-6 mobile:hidden">
        <div className="glass-panel relative mx-auto flex min-h-[18.375rem] w-full max-w-8xl flex-col justify-center gap-4 overflow-hidden rounded-[1rem] border border-[#A8E8FF33] p-8 text-center">
          {/* Background icon box: 176 x 202, opacity 0.1, top-right like Figma */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-[0.875rem] z-0 h-[12.625rem] w-[11rem] pb-[3.375rem] pl-12 pr-12 pt-12 opacity-10"
          >
            {/* Icon: 80 x 100, #E5E2E1 */}
            <SvgIcon
              src="/new-wingman/icons/shield-checkered.svg"
              className="block h-[6.25rem] w-[5rem] bg-wingman-primary-text"
            />
          </div>

          <h2 className="relative z-10 text-[1.5rem] font-semibold leading-[2rem] tracking-[0rem] text-wingman-emphasis-text">
            Dedicated Compliance<br />Officer
          </h2>
          <p className="relative z-10 text-[1rem] font-normal leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
            For inquiries regarding our safety standards or to report specific concerns, please contact our
            compliance office directly.
          </p>
          <a
            href="mailto:compliance@wingman-pro.com"
            className="relative z-10 flex flex-wrap items-center justify-center gap-2 text-[0.875rem] font-semibold leading-[1.25rem] text-wingman-cyan"
          >
            <SvgIcon
              src="/new-wingman/icons/mail.svg"
              className="h-5 w-5 shrink-0 bg-wingman-cyan"
            />
            <span className="break-all">compliance@wingman-pro.com</span>
          </a>
        </div>
      </section>

      {/* Chief Compliance Officer (desktop) */}
      <section className="hidden bg-black px-4 py-24 mobile:block mobile:px-8">
        <div className="glass-panel mx-auto flex max-w-3xl flex-col items-center px-8 py-12 text-center">
          <span className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-gradient-to-br from-[#A8E8FF] to-[#00FADC] shadow-[0_0_1.875rem_0_rgba(0,212,255,0.3)]">
            <SvgIcon
              src="/new-wingman/icons/square-profile.svg"
              className="h-[2.625rem] w-[2.25rem] shrink-0 bg-wingman-light-accent-text"
            />
          </span>
          <h2 className="mt-6 text-[2rem] font-bold leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
            Chief Compliance Officer
          </h2>
          <p className="mt-2 text-base font-normal leading-[1.5rem] text-wingman-cyan">
            Dr. Sunil Acharya
          </p>
          <p className="mt-4 max-w-md text-base font-normal leading-[1.5rem] text-wingman-secondary-text">
            Responsible for global regulatory reporting, law enforcement liaison, and platform-wide safety protocols.
          </p>
          <a
            href="mailto:compliance@wingman-pro.com"
            className="mt-8 flex w-full max-w-[35.875rem] items-center justify-center rounded-xl border border-white/[0.12] bg-white/5 py-4 text-base font-normal leading-[1.5rem] text-wingman-primary-text transition-colors hover:bg-white/10"
          >
            compliance@wingman-pro.com
          </a>
          <p className="mt-4 text-xs font-normal leading-4 text-wingman-secondary-text">
            Standard response time for legal inquiries: 24-36 business hours.
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}