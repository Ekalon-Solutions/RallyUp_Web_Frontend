import type React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Users,
  Flag,
  Target,
  Eye,
  Rocket,
  Banknote,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import SvgIcon from "@/components/svg-icon"
import Button from "@/components/landing/button"

export const metadata = {
  title: "About | Wingman Pro",
  description: "About RallyUp Solutions and Wingman Pro: built for the game",
}

const aboutCards = [
  {
    icon: "/new-wingman/icons/user-settings.svg",
    iconClass: "bg-wingman-cyan",
    title: "RallyUp Solutions",
    watermark: "R",
    text: "We engineer robust, scalable, and intelligent software for the global sports ecosystem — eliminating fragmentation and administrative overload that hinder growth and engagement. From grassroots groups to professional bodies, we empower organizations to operate with efficiency and insight.",
  },
  {
    icon: "/new-wingman/icons/checkerboard.svg",
    iconClass: "bg-[#9D05FF]",
    title: "Wingman Pro",
    watermark: "W",
    text: "The realization of our mission: a single, secure platform that brings membership management, payments, communications, and events into one seamless system. Wingman Pro replaces multiple tools with an intuitive experience, freeing managers to focus on delivering great matchday moments.",
  },
]

const northStar = [
  {
    icon: "/new-wingman/icons/target.svg",
    iconWrap: "bg-[#A8E8FF1A]",
    iconClass: "h-[1.25rem] w-[1.25rem] bg-wingman-cyan",
    label: "MISSION",
    lines: [
      { text: "Unified.", color: "text-wingman-cyan" },
      { text: "Efficient.", color: "text-[#A8E8FFCC]" },
      { text: "Compliant.", color: "text-[#A8E8FF99]" },
    ],
    text: "To eliminate administrative fragmentation in sports organizations globally by providing a unified, intelligent platform that maximizes operational efficiency, compliance, and member engagement.",
  },
  {
    icon: "/new-wingman/icons/eye.svg",
    iconWrap: "bg-[#9D05FF1A]",
    iconClass: "h-[0.9375rem] w-[1.375rem] bg-[#9D05FF]",
    label: "VISION",
    lines: [
      { text: "Leading.", color: "text-[#9D05FF]" },
      { text: "Global.", color: "text-[#9D05FFCC]" },
      { text: "Trusted.", color: "text-[#9D05FF99]" },
    ],
    text: "To become the leading global technology partner for sports clubs and supporter groups, recognized for transforming community management through innovation and unparalleled user experience.",
  },
]
const features = [
  {
    title: "Membership Management",
    text: "Handle enrollment, maintain data integrity, manage access, and track member status from a single control center.",
    span: "lg:col-span-2",
  },
  {
    title: "Integrated Commerce",
    text: "Manage ticketing, merchandise, and payments with full reporting and compliance.",
    span: "",
  },
  {
    title: "Seamless Engagement",
    text: "Activate events, communications, and content—like OTP via Email/SMS, polls, and leaderboards.",
    span: "",
  },
  {
    title: "Compliance & Security",
    text: "Meet stringent security standards and global data protection requirements, including DPDPA and GDPR.",
    span: "",
  },
  {
    title: "Gamification & AI",
    text: "Deliver intelligent engagement, performance leaderboards, actionable insights, and automated content curation.",
    span: "",
    highlight: true,
  },
]

const team = [
  {
    name: "Dr. Sunil Acharya",
    role: "Managing Director, COO & CCO",
    roleClass: "text-zinc-300",
    bio: "Over 40 years leading quality, audits, compliance, and operations. Guides global security standards.",
    image: "/new-wingman/images/about-image-1.jpg",
  },
  {
    name: "Dr. Neeta Acharya",
    role: "Managing Director, CMO & CFO",
    roleClass: "text-purple-400",
    bio: "Expert in marketing, finance, and strategy. Shaping the platform growth and corporate brand health.",
    image: "/new-wingman/images/about-image-2.jpg",
  },
  {
    name: "Mihir Chheda",
    role: "CTO & Co-Founder",
    roleClass: "text-zinc-300",
    bio: "FinTech veteran. Designs the platform architecture aligning engineering with operational needs.",
    image: "/new-wingman/images/about-image-3.png",
  },
  {
    name: "Ankit Ameria",
    role: "CSO & Co-Founder",
    roleClass: "text-purple-400",
    bio: "Leads market strategy and sales. Specializes in scaling startups and delivering measurable impacts and value for clients.",
    image: "/new-wingman/images/about-image-4.jpg",
  },
]

/* ---------- Mobile-only content (from mobile Figma frame) ---------- */
const mobileMissionVision = [
  {
    label: "OUR MISSION",
    labelColor: "text-wingman-cyan",
    icon: "/new-wingman/icons/rocket.svg",
    headline: "Unified. Efficient.\nCompliant.",
    text: "To eliminate administrative fragmentation in sports organizations globally by providing a unified, intelligent platform that maximizes operational efficiency, compliance, and member engagement.",
  },
  {
    label: "OUR VISION",
    labelColor: "text-[#DFB7FF]",
    icon: "/new-wingman/icons/eye.svg",
    headline: "Leading. Global.\nTrusted.",
    text: "To become the leading global technology partner for sports clubs and supporter groups, recognized for transforming community management through innovation and unparalleled user experience.",
  },
]
const mobileFeatures = [
  {
    icon: "/new-wingman/icons/user-group.svg",
    title: "Membership Management",
    text: "Handle enrollment, data integrity, and track member status from a single control center.",
    bg: "bg-[#A8E8FF1A]",
    border: "border-[#A8E8FF33]",
    iconColor: "bg-wingman-cyan",
  },
  {
    icon: "/new-wingman/icons/cash.svg",
    title: "Integrated Commerce",
    text: "Manage ticketing, merchandise, and payments with full reporting and compliance.",
    bg: "bg-[#DFB7FF1A]",
    border: "border-[#DFB7FF33]",
    iconColor: "bg-[#DFB7FF]",
  },
  {
    icon: "/new-wingman/icons/message.svg",
    title: "Seamless Engagement",
    text: "Activate events, communications via OTP, polls, and leaderboards with ease.",
    bg: "bg-[#00FADC1A]",
    border: "border-[#00FADC33]",
    iconColor: "bg-[#00FADC]",
  },
  {
    icon: "/new-wingman/icons/shield-check.svg",
    title: "Compliance & Security",
    text: "Meeting global data protection standards including DPDPA and GDPR-aligned principles.",
    bg: "bg-[#FFB4AB1A]",
    border: "border-[#FFB4AB33]",
    iconColor: "bg-[#FFB4AB]",
  },
  {
    icon: "/new-wingman/icons/ai.svg",
    title: "Gamification & AI",
    text: "Deliver performance leaderboards and optimized communications using advanced AI.",
    bg: "bg-[#00D4FF1A]",
    border: "border-[#00D4FF33]",
    iconColor: "bg-[#00D4FF]",
  },
]
const card = "rounded-2xl border border-white/10 bg-white/[0.02]"

export default function AboutPage(): React.JSX.Element {
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
        {/* Blur glows */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-[22.5rem] w-[56.25rem] max-w-full -translate-x-1/2 rounded-full" />
        <div className="pointer-events-none absolute right-0 top-10 h-[18.75rem] w-[25rem] rounded-full" />

        {/* Mobile hero */}
        <div className="relative flex flex-col items-start gap-4 px-4 pb-8 pt-8 text-left mobile:hidden">
          <h1 className="font-sf text-[1.5rem] font-[700] leading-[2.1875rem] tracking-[0rem]">
            <span className="bg-gradient-to-r from-[#7be3ff] to-[#c4b5fd] bg-clip-text pr-1 text-transparent">
              Built for{" "}
            </span>
            <span className="bg-gradient-to-r from-purple-500 to-fuchsia-400 bg-clip-text pr-1 text-transparent">
              The Game.
            </span>
          </h1>

          <span className="flex h-[1.625rem] w-[13.375rem] items-center justify-center rounded-full border border-[#A8E8FF33] bg-[#121212B2] font-sf-compact text-[0.75rem] font-[556] uppercase leading-[1rem] tracking-[0.075rem] text-wingman-cyan backdrop-blur-[1rem]">
            About RallyUp Solutions
          </span>

          <p className="font-sf-compact text-[1.125rem] font-[457] leading-[1.75rem] text-wingman-secondary-text">
            RallyUp Solutions was founded to match the passion of sports communities with seamless, modern operations. Wingman Pro is how we deliver on that promise.
          </p>
        </div>

        {/* Desktop hero */}
        <div className="relative mx-auto hidden max-w-3xl flex-col items-center gap-6 px-4 pb-20 pt-14 text-center mobile:flex mobile:px-8">
          <p className="align-middle font-sf-compact text-[1rem] font-[656] uppercase leading-[1.25rem] tracking-[0.0875rem] text-wingman-cyan">
            ABOUT RALLYUP SOLUTIONS
          </p>

          <h1 className="align-middle font-sf text-[4rem] font-[860] leading-[5rem] tracking-[-0.08rem]">
            {/* pr-2 on spans prevents clipping on the heavy font */}
            <span className="bg-gradient-to-r from-[#7be3ff] to-[#c4b5fd] bg-clip-text pr-2 text-transparent">
              Built for{" "}
            </span>
            <span className="bg-gradient-to-r from-purple-500 to-fuchsia-400 bg-clip-text pr-2 text-transparent">
              The Game.
            </span>
          </h1>

          <p className="subheading-main">
            RallyUp Solutions was founded to match the passion of sports communities with seamless, modern
            solutions — and Wingman Pro is how we deliver on that promise.
          </p>
        </div>
      </section>

      {/* ================= MOBILE ONLY: Mission & Vision ================= */}

      <section className="flex flex-col gap-[1rem] px-4 pb-10 mobile:hidden">
        {mobileMissionVision.map(({ label, labelColor, icon, headline, text }) => (
          <div
            key={label}
            className="relative overflow-hidden rounded-[1rem] border border-[#FFFFFF1F] bg-[#121212] p-[1.25rem]"
          >
            <SvgIcon
              src={icon}
              className="pointer-events-none absolute right-[1rem] top-[1rem] h-[3.0625rem] w-[3.0625rem] shrink-0 bg-wingman-primary-text opacity-20"
            />            <p className={`font-['SF_Compact',sans-serif] text-[0.875rem] font-[656] uppercase leading-[1.25rem] tracking-[0.0875rem] ${labelColor}`}>
              {label}
            </p>
            <h2 className="mt-[0.75rem] whitespace-pre-line font-['SF_Pro',sans-serif] text-[1.5rem] font-[590] leading-[2rem] text-wingman-primary-text">
              {headline}
            </h2>
            <p className="mt-[1rem] font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-secondary-text">
              {text}
            </p>
          </div>
        ))}
      </section>

      {/* RallyUp & Wingman Pro (desktop) */}
      <section className="hidden px-4 pb-24 mobile:block mobile:px-8">
        <div className="mx-auto grid max-w-8xl gap-6 md:grid-cols-2">
          {aboutCards.map(({ icon, title, watermark, text }, i) => (
            <div key={title} className="glass-panel relative overflow-hidden p-[2rem]">
              {/* Watermark R / W */}
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute bottom-0 right-0 translate-x-[20%] translate-y-[60%] select-none align-middle font-['SF_Pro',sans-serif] text-[7.5rem] font-[590] leading-none tracking-[0rem] opacity-10 ${i === 0 ? "text-wingman-cyan" : "text-[#9D05FF]"
                  }`}
              >
                {watermark}
              </span>

              {/* Heading */}
              <h2 className="relative z-10 flex items-center gap-[0.75rem] align-middle font-['SF_Pro',sans-serif] text-[1.5rem] font-[590] leading-[2rem] tracking-[0rem] text-wingman-primary-text">
                <SvgIcon
                  src={icon}
                  className={
                    i === 0
                      ? "h-[1.125rem] w-[1.36875rem] shrink-0 bg-wingman-cyan" // First card icon
                      : "h-[1rem] w-[0.875rem] shrink-0 bg-[#9D05FF]"   // Second card icon
                  }
                />
                {title}
              </h2>

              {/* Description */}
              <p className="relative z-10 mt-[1.25rem] align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.625rem] tracking-[0rem] text-wingman-secondary-text">
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Our North Star (desktop) */}
      <section className="hidden px-4 pb-24 mobile:block mobile:px-8">
        <div className="mx-auto max-w-8xl">
          {/* Section Header */}
          <div className="flex flex-col items-center gap-[0.5rem]">
            <h2 className="align-middle font-['SF_Pro',sans-serif] text-[2rem] font-[700] leading-[2.5rem] tracking-[-0.02rem] text-center text-wingman-primary-text">
              Our North Star
            </h2>
            <p className="align-middle font-['SF_Compact',sans-serif] text-[1.125rem] font-[457] leading-[1.75rem] tracking-[0rem] text-center text-wingman-cyan">
              Why We Exist.
            </p>
          </div>

          {/* Cards */}
          <div className="mt-[2.5rem] grid gap-[1.5rem] md:grid-cols-2">
            {northStar.map(({ icon, iconWrap, iconClass, label, lines, text }) => (
              <div
                key={label}
                className="flex h-auto min-h-[28.625rem] w-full flex-col rounded-[0.75rem] border border-[#FFFFFF1F] bg-[#121212] p-[3rem]"
              >
                {/* Icon */}
                <span className={`flex h-[3rem] w-[3rem] shrink-0 items-center justify-center rounded-full ${iconWrap}`}>
                  <SvgIcon src={icon} className={iconClass} />
                </span>

                {/* Label */}
                <p className="mt-[2rem] align-middle font-['SF_Pro',sans-serif] text-[1.5rem] font-[590] uppercase leading-[2rem] tracking-[-0.075rem] text-wingman-primary-text">
                  {label}
                </p>

                {/* Fading Headlines */}
                <div className="mt-[1rem] flex flex-col">
                  {lines.map((line) => (
                    <span
                      key={line.text}
                      className={`align-middle font-['SF_Pro',sans-serif] text-[2rem] font-[700] leading-[2rem] tracking-[-0.02rem] ${line.color}`}
                    >
                      {line.text}
                    </span>
                  ))}
                </div>

                {/* Description */}
                <p className="mt-[1.5rem] align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= MOBILE ONLY: Five Core Features ================= */}
      <section className="px-4 pb-10 mobile:hidden">
        <h2 className="font-['SF_Pro',sans-serif] text-[1.5rem] font-[590] leading-[2rem] text-wingman-primary-text">
          Five Core Features.
        </h2>
        <p className="mt-[0.25rem] font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-secondary-text">
          One Intelligent Platform.
        </p>
        <div className="mt-[1.25rem] flex flex-col gap-[0.75rem]">
          {mobileFeatures.map(({ icon, title, text, bg, border, iconColor }) => (
            <div
              key={title}
              className="flex items-start gap-[1rem] rounded-[1rem] border border-[#FFFFFF1F] bg-[#121212] p-[1rem]"
            >
              <span className={`flex h-[2.5rem] w-[2.5rem] shrink-0 items-center justify-center rounded-[0.5rem] border ${border} ${bg}`}>
                <SvgIcon
                  src={icon}
                  className={`h-[1.5rem] w-[1.5rem] shrink-0 ${iconColor}`}
                />              </span>
              <div>
                <h3 className="font-['SF_Compact',sans-serif] text-[0.875rem] font-[656] leading-[1.25rem] text-wingman-primary-text">
                  {title}
                </h3>
                <p className="mt-[0.25rem] font-['SF_Compact',sans-serif] text-[0.75rem] font-[556] leading-[1rem] text-wingman-secondary-text">
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Five Core Features (desktop) */}
      <section className="hidden px-4 pb-24 mobile:block mobile:px-8">
        <div className="mx-auto max-w-8xl">
          {/* Section Header */}
          <div className="flex flex-col gap-[1.5rem] md:flex-row md:items-end md:justify-between">
            <div>
              <p className="align-middle font-['SF_Compact',sans-serif] text-[0.875rem] font-[656] uppercase leading-[1.25rem] tracking-[0.0875rem] text-wingman-cyan">
                PLATFORM FEATURES
              </p>
              <h2 className="mt-[0.75rem] align-middle font-['SF_Pro',sans-serif] text-[3rem] font-[590] leading-[3.75rem] tracking-[0rem] text-wingman-primary-text">
                Five Core Features.
                <br />
                One Platform.
              </h2>
            </div>
            <p className="max-w-[16rem] align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
              We&apos;ve distilled complex club management into five high-performance pillars designed for modern sports entities.
            </p>
          </div>

          {/* Features Grid */}
          <div className="mt-[2.5rem] grid gap-[1.5rem] lg:grid-cols-3">
            {features.map(({ title, text, span }, i) => {
              // Highlight ONLY Box 02 (index 1) and Box 05 (index 4)
              const isHighlight = i === 1 || i === 4;
              const bghighlight = i === 4;
              return (
                <div
                  key={title}
                  className={`flex min-h-[18.75rem] flex-col justify-between rounded-[0.75rem] p-[2rem] ${span} ${!isHighlight ? "glass-panel" : "bg-[#121212]"
                    }`}
                  style={
                    isHighlight
                      ? {
                        // Changed to backgroundImage and removed the dark 70% mask layer so the purple shows!
                        backgroundImage: bghighlight ? "linear-gradient(135deg, #121212 0%, rgba(157, 5, 255, 0.15) 100%)" : undefined,
                        border: "1px solid #9D05FF80",
                        backdropFilter: "blur(1.25rem)",
                        WebkitBackdropFilter: "blur(1.25rem)", // for Safari support
                      }
                      : undefined
                  }
                >
                  {/* Number */}
                  <p
                    className={`align-middle font-['SF_Pro',sans-serif] text-[1rem] font-[590] leading-[1.5rem] tracking-[0rem] ${isHighlight ? "text-[#9D05FF]" : "text-wingman-cyan"
                      }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </p>

                  {/* Content */}
                  <div className="mt-[2rem]">
                    <h3 className="align-middle font-['SF_Pro',sans-serif] text-[1.5rem] font-[590] leading-[2rem] tracking-[0rem] text-wingman-primary-text">
                      {title}
                    </h3>
                    <p className="mt-[0.5rem] max-w-md align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
                      {text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= MOBILE ONLY: Leadership Team ================= */}
      <section className="pb-10 mobile:hidden">
        <h2 className="px-4 font-['SF_Pro',sans-serif] text-[1.5rem] font-[590] leading-[2rem] text-wingman-primary-text">
          Leadership Team
        </h2>
        <div className="mt-[1.25rem] flex snap-x snap-mandatory gap-[1rem] overflow-x-auto px-4 pb-2">
          {team.map(({ name, role, bio, image }, i) => {
            // Keep alternating role colors matching your desktop logic
            const roleColor = (i === 1 || i === 3) ? "text-[#DFB7FF]" : "text-wingman-cyan";

            return (
              <article
                key={name}
                className="w-[18.875rem] shrink-0 snap-start overflow-hidden rounded-[1rem] border border-[#FFFFFF1F] bg-[#121212]"
              >
                <div className="relative h-[12rem] w-full">
                  <Image src={image} alt={name} fill className="object-cover object-top" />
                </div>
                <div className="p-[1rem]">
                  <h3 className="font-['SF_Pro',sans-serif] text-[1.5rem] font-[590] leading-[2rem] text-wingman-primary-text">
                    {name}
                  </h3>
                  <p className={`mt-[0.25rem] font-['SF_Compact',sans-serif] text-[0.75rem] font-[556] leading-[1rem] ${roleColor}`}>
                    {role}
                  </p>
                  <p className="mt-[0.75rem] font-['SF_Compact',sans-serif] text-[0.75rem] font-[556] leading-[1rem] text-wingman-secondary-text">
                    {bio}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* The People Behind It (desktop) */}
      <section className="hidden px-4 pb-24 mobile:block mobile:px-8">
        <div className="mx-auto max-w-8xl">
          <div className="text-center flex flex-col items-center">
            <h2 className="align-middle font-['SF_Pro',sans-serif] text-[2rem] font-[700] leading-[2.5rem] tracking-[-0.02rem] text-wingman-primary-text">
              The People Behind It.
            </h2>
            {/* 96x4 Gradient Divider */}
            <div
              className="mt-[1rem] h-[0.25rem] w-[6rem] rounded-full"
              style={{ background: "linear-gradient(90deg, #A8E8FF 0%, #9D05FF 100%)" }}
            />
          </div>

          <div className="mt-[3rem] grid gap-[2rem] sm:grid-cols-2 lg:grid-cols-4">
            {team.map(({ name, role, bio, image }, i) => {
              // 2nd (index 1) and 4th (index 3) use Purple, others use Cyan
              const roleColor = (i === 1 || i === 3) ? "text-[#9D05FF]" : "text-wingman-cyan";

              return (
                <article key={name} className="flex flex-col">
                  {/* Image Container */}
                  <div className="relative aspect-[278/347.5] w-full overflow-hidden rounded-[0.75rem] border border-[#FFFFFF1F]">
                    <Image
                      src={image}
                      alt={name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Name */}
                  <h3 className="mt-[1rem] align-middle font-['SF_Pro',sans-serif] text-[0.875rem] font-[590] leading-[1.25rem] tracking-[0rem] text-wingman-primary-text">
                    {name}
                  </h3>

                  {/* Role */}
                  <p className={`mt-[0.25rem] align-middle font-['SF_Compact',sans-serif] text-[0.75rem] font-[556] uppercase leading-[1rem] tracking-[0.0375rem] ${roleColor}`}>
                    {role}
                  </p>

                  {/* Bio */}
                  <p className="mt-[0.75rem] align-middle font-['SF_Compact',sans-serif] text-[0.75rem] font-[556] leading-[1.21875rem] tracking-[0rem] text-wingman-secondary-text">
                    {bio}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= MOBILE ONLY: CTA ================= */}
      <section className="px-4 pb-[4rem] mobile:hidden">
        <div className="flex flex-col items-center rounded-[1rem] border border-[#FFFFFF1F] bg-[#121212] p-[1.5rem] text-center">
          <h2 className="font-['SF_Pro',sans-serif] text-[1.5rem] font-[590] leading-[2rem] text-center text-wingman-primary-text">
            Let&apos;s Build The Future.
          </h2>
          <p className="mt-[0.75rem] font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-center text-wingman-secondary-text">
            Are you a sports league or governing body ready to integrate with the future of club management?
          </p>
          <Button
            variant="primary"
            href="mailto:response@wingman-pro.com"
            className="
    mt-[1.5rem] h-[3.5rem] w-full
    !font-sf-compact !text-[0.875rem] !font-[656] !leading-[1.25rem] !text-wingman-light-accent-text
  "
          >
            Contact Us
          </Button>
        </div>
      </section>

      {/* CTA (desktop) */}
      <section className="hidden px-4 pb-24 mobile:block mobile:px-8">
        <div className="glass-panel relative mx-auto max-w-8xl overflow-hidden rounded-[0.75rem] px-[1.5rem] py-[5rem] text-center">

          {/* Top Left Cyan Glow */}
          <div className="pointer-events-none absolute -left-[5.9375rem] -top-[5.9375rem] h-[16rem] w-[16rem] rounded-full bg-[#A8E8FF1A] blur-[5rem]" />

          {/* Bottom Right Purple Glow (Positioned responsively instead of hardcoded 1023px left) */}
          <div className="pointer-events-none absolute -bottom-[4.375rem] -right-[4.375rem] h-[16rem] w-[16rem] rounded-full bg-[#9D05FF1A] blur-[5rem]" />

          <div className="relative z-10 flex flex-col items-center">
            {/* Heading */}
            <h2 className="align-middle font-['SF_Pro',sans-serif] text-[3rem] font-[590] leading-[1.5rem] tracking-[0rem] text-wingman-primary-text">
              Let&apos;s Build The Future.
            </h2>

            {/* Subheading */}
            <p className="mt-[2rem] max-w-2xl align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
              Are you a sports league, governing body, or technology provider ready to integrate with
              the future of club and membership management?
            </p>

            {/* Action Buttons */}
            <div className="mt-[3rem] flex flex-wrap items-center justify-center gap-[1.5rem]">
              {/* Contact Us */}
              <Button
                variant="primary"
                href="mailto:response@wingman-pro.com"
                className="h-[4rem] w-[12.5625rem]"
              >
                Contact Us
              </Button>

              {/* Explore Affiliations */}
              <Link
                href="/affiliations"
                className="flex h-[4.125rem] w-[17.8125rem] items-center justify-center rounded-[0.75rem] border border-[#00D4FF] align-middle font-['SF_Pro',sans-serif] text-[1.5rem] font-[590] leading-[2rem] tracking-[0rem] text-wingman-cyan transition-colors hover:bg-[#00D4FF]/10"
              >
                Explore Affiliations
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}