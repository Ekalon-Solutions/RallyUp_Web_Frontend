import type React from "react"
import Image from "next/image"
import { ArrowRight, ChevronDown, Headset, Zap, Globe } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import SvgIcon from "@/components/svg-icon"
import Button from "@/components/ui/button"

export const metadata = {
  title: "Contact Us | Wingman Pro",
  description: "Book a consultation or join the Wingman Pro wait-list",
}

const topics = ["Sales Inquiry", "Product Support", "Request a Demo", "Partnerships", "Technical Support", "Other"]

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"

const labelClass = "mb-2 block text-[0.6875rem] font-semibold text-zinc-300"

const card = "rounded-xl border border-white/10 bg-white/[0.03]"

function Field({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
    </div>
  )
}

export default function ContactPage(): React.JSX.Element {
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
        {/* Blur glow: hsla(196, 100%, 83%, 0.1) */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-[22.5rem] w-[56.25rem] max-w-full -translate-x-1/2 rounded-full" />
        <div className="pointer-events-none absolute right-0 top-10 h-[18.75rem] w-[25rem] rounded-full" />

        <div className="relative mx-auto flex max-w-3xl flex-col items-start gap-4 px-4 pb-6 pt-8 text-left mobile:items-center mobile:gap-8 mobile:px-8 mobile:pb-12 mobile:pt-14 mobile:text-center">
          {/* Mobile heading */}
          <h1 className="pr-2 font-sf text-[1.5rem] font-[700] leading-[2.25rem] mobile:hidden">
            Ready to Upgrade Your Club?
          </h1>

          {/* Desktop heading */}
          <h1 className="heading-main hidden mobile:block">
            Ready to Upgrade Your Club?
          </h1>

          {/* Mobile badge */}
          <span className="flex h-[2.375rem] items-center justify-center gap-2 rounded-full border border-wingman-green-button/30 bg-wingman-green-button/10 px-4 font-sf-compact text-[0.75rem] font-[457] leading-[1.5rem] text-wingman-green-button-text mobile:hidden">
            <SvgIcon
              src="/new-wingman/icons/zap.svg"
              className="h-[0.75rem] w-[0.75rem] shrink-0 bg-wingman-cyan"
            />
            Next-Gen Sports Tech
          </span>

          {/* Desktop badge */}
          <span className="hidden rounded-full border border-wingman-green-button/30 bg-wingman-green-button/10 px-3 text-xs font-medium uppercase text-wingman-green-button-text mobile:inline-block py-1">
            Available for Pilots
          </span>

          <p className="subheading-main">
            <span className="mobile:hidden">
              Book a consultation or join the wait-list. Takes two minutes. Our AI-enhanced platform is built
              for Supporter Groups and Sports Clubs looking for the professional edge.
            </span>
            <span className="hidden mobile:inline">
              Book a consultation or join the wait-list. Takes two minutes. Our AI-driven ecosystem is built to
              scale your supporter engagement.
            </span>
          </p>
        </div>
      </section>

      {/* Form + sidebar */}
      <section className="px-4 pb-16 mobile:px-8 mobile:pb-24">

        {/* Mobile-only: Need urgent help card */}
        <div className="mb-6 flex flex-col gap-4 rounded-[0.75rem] border border-[#FFFFFF1F] bg-[#121212CC] p-5 backdrop-blur-[1.25rem] mobile:hidden">
          <div className="flex items-center gap-3">
            <span className="flex h-[2.5rem] w-[2.5rem] shrink-0 items-center justify-center rounded-full border border-[#A8E8FF4D] bg-[#A8E8FF33]">
              <SvgIcon
                src="/new-wingman/icons/headset.svg"
                className="h-[1.125rem] w-[1.25rem] shrink-0 bg-wingman-cyan"
              />
            </span>
            <h2 className="font-['SF_Pro',sans-serif] text-[1.25rem] font-[400] leading-[1.875rem] text-wingman-primary-text">
              Need urgent help?
            </h2>
          </div>
          <p className="font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-secondary-text">
            Contact your Sales POC directly for fastest resolution. Our dedicated team is available 24/7 for Pro tier partners.
          </p>
          <a
            href="mailto:support@wingman-pro.com?subject=Urgent%20Help"
            className="inline-flex items-center gap-2 break-words font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-cyan"
          >
            support@wingman-pro.com
            <ArrowRight className="h-[0.75rem] w-[0.75rem] shrink-0 text-wingman-cyan" />
          </a>
        </div>

        {/* Desktop Layout - Using grid below 1024px, right column fills space */}
        <div className="mx-auto w-full max-w-8xl min-w-0 aside-hide:grid aside-hide:gap-6 aside-hide:grid-cols-[1.6fr_1fr]">
          {/* Form */}
          <div className="h-fit w-full p-0 mobile:rounded-2xl mobile:border mobile:border-white/10 mobile:bg-white/[0.03] mobile:p-9">
            {/* Create this endpoint (or change the action) to receive the inquiry */}
            <form action="/api/contact" method="post" className="space-y-5 mobile:space-y-6">
              <div className="grid gap-5 mobile:grid-cols-2 mobile:gap-6">

                {/* Full Name */}
                <div className="flex h-[4.8125rem] w-full flex-col">
                  <label htmlFor="fullName" className="font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-secondary-text">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Enter your name"
                    className="mt-[0.5rem] h-[3.0625rem] w-full rounded-[0.75rem] border border-[#ffffff1f] bg-[#121212] px-4 font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[100%] text-wingman-secondary-text placeholder:text-[#85939880] transition-colors focus:border-wingman-cyan focus:outline-none focus:ring-1 focus:ring-wingman-cyan"
                  />
                </div>

                {/* Email */}
                <div className="flex h-[4.8125rem] w-full flex-col">
                  <label htmlFor="email" className="font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-secondary-text">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="Enter your email"
                    className="mt-[0.5rem] h-[3.0625rem] w-full rounded-[0.75rem] border border-[#ffffff1f] bg-[#121212] px-4 font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[100%] text-wingman-secondary-text placeholder:text-[#85939880] transition-colors focus:border-wingman-cyan focus:outline-none focus:ring-1 focus:ring-wingman-cyan"
                  />
                </div>
              </div>

              {/* Topic Select */}
              <div className="flex h-[4.8125rem] w-full flex-col">
                <label htmlFor="topic" className="font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-secondary-text">
                  Topic
                </label>
                <div className="relative mt-[0.5rem]">
                  <select
                    id="topic"
                    name="topic"
                    defaultValue="Product Support"
                    className="h-[3.0625rem] w-full appearance-none rounded-[0.75rem] border border-[#ffffff1f] bg-[#121212] px-4 pr-10 font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-primary-text transition-colors focus:border-wingman-cyan focus:outline-none focus:ring-1 focus:ring-wingman-cyan"
                  >
                    {topics.map((topic) => (
                      <option key={topic} value={topic} className="bg-[#121212] text-wingman-primary-text">
                        {topic}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-[1.25rem] w-[1.5625rem] -translate-y-1/2 text-wingman-secondary-text" />
                </div>
              </div>

              {/* Message Textarea */}
              <div className="flex w-full flex-col">
                <label htmlFor="message" className="font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-secondary-text">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  placeholder="Tell us about your club needs..."
                  className="mt-[0.5rem] h-[10.625rem] w-full resize-none rounded-[0.75rem] border border-[#ffffff1f] bg-[#121212] p-4 font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-secondary-text placeholder:text-[#85939880] transition-colors focus:border-wingman-cyan focus:outline-none focus:ring-1 focus:ring-wingman-cyan"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                className="
    mt-2 h-[4rem] w-full
    focus:outline-none focus:ring-2 focus:ring-wingman-cyan/50
    max-[767px]:h-[3.5rem] max-[767px]:gap-2
    max-[767px]:!text-[1.125rem] max-[767px]:!leading-[1.6875rem]
  "
              >
                Submit Inquiry
                <span className="flex shrink-0 items-center justify-center mobile:hidden">
                  <SvgIcon
                    src="/new-wingman/icons/arrow-right.svg"
                    className="h-[1rem] w-[1.1875rem] bg-[#001F27]"
                  />
                </span>
              </Button>
            </form>

            {/* Mobile-only: demo prompt */}
            <div className="mt-8 flex flex-col items-center border-t border-[#FFFFFF1F] pt-[2rem] mobile:hidden">
              <p className="text-center font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-secondary-text">
                Want to be the first to know about new features?
              </p>
              <a
                href="mailto:response@wingman-pro.com?subject=Request%20a%20Demo"
                className="mt-[1.5rem] flex h-[3.5rem] w-[16.8125rem] items-center justify-center rounded-[0.75rem] border border-[#A8E8FF66] font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] text-wingman-cyan transition-colors hover:bg-white/5"
              >
                Request a Demo
              </a>
            </div>
          </div>

          {/* Sidebar (desktop only) */}
          <aside className="hidden space-y-[1rem] aside-hide:block">
            {/* Urgent help */}
            <div className="glass-panel relative flex flex-col gap-[1.5rem] overflow-hidden p-[2rem]">
              {/* Figma blur glow */}
              <div className="pointer-events-none absolute -bottom-[10%] -right-[10%] h-[12.5rem] w-[12.5rem] rounded-full bg-[#9D05FF33] blur-[4rem]" />

              <div className="relative flex items-start gap-[1rem]">
                <span className="flex h-[3rem] w-[3rem] shrink-0 items-center justify-center rounded-full bg-[#A8E8FF1A]">
                  <SvgIcon
                    src="/new-wingman/icons/zap.svg"
                    className="h-[1.25rem] w-[1rem] shrink-0 bg-wingman-cyan"
                  />
                </span>
                <div className="flex flex-col gap-[0.5rem]">
                  <h2 className="align-middle font-['SF_Pro',sans-serif] text-[1.5rem] font-[400] leading-[2rem] tracking-[0rem] text-wingman-emphasis-text">
                    Need urgent help?
                  </h2>
                  <p className="align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
                    Contact your Sales POC directly for fastest resolution. Dedicated support is available for
                    Pro tier members 24/7.
                  </p>
                  <a
                    href="mailto:response@wingman-pro.com?subject=Urgent%20Help"
                    className="mt-[0.5rem] inline-block align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-cyan transition-opacity hover:opacity-80"
                  >
                    Contact Sales POC
                  </a>
                </div>
              </div>
            </div>

            {/* Join the queue */}
            <div
              className="glass-panel relative flex flex-col gap-[1.5rem] overflow-hidden p-[2rem]"
              style={{
                background: "linear-gradient(135deg, rgba(157, 5, 255, 0.1) 0%, rgba(157, 5, 255, 0) 100%)"
              }}
            >
              {/* Figma blur glow */}
              <div className="pointer-events-none absolute -bottom-[10%] -right-[10%] h-[12.5rem] w-[12.5rem] rounded-full bg-[#9D05FF33] blur-[4rem]" />

              <div className="relative flex flex-col gap-[0.5rem]">
                <h2 className="align-middle font-['SF_Pro',sans-serif] text-[1.5rem] font-[400] leading-[2rem] tracking-[0rem] text-wingman-emphasis-text">
                  Join the Queue
                </h2>
                <p className="align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text">
                  Not ready for a full consultation? Join our 2025 club waitlist to secure early-bird pricing and
                  feature priority.
                </p>
                <div className="mt-[1rem]">
                  <a
                    href="mailto:response@wingman-pro.com?subject=Request%20a%20Demo"
                    className="inline-flex h-[3.125rem] w-[11.875rem] items-center justify-center gap-[0.5rem] rounded-[0.75rem] border border-[#DFB7FF] px-[2rem] py-[0.75rem] align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-[#DFB7FF] transition-colors hover:bg-[#DFB7FF]/10"
                  >
                    Request a Demo
                  </a>
                </div>
              </div>
            </div>

            {/* Image card */}
            <div className="h-[12rem] w-full overflow-hidden rounded-[0.75rem]">
              <div className="relative h-full w-full">
                <Image
                  src="/new-wingman/images/contact-image.jpg"
                  alt="Team working on the Wingman Pro dashboard"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <p className="absolute bottom-[1rem] left-[1rem] flex items-center gap-[0.5rem] align-middle font-['SF_Compact',sans-serif] text-[1rem] font-[457] leading-[1.5rem] tracking-[0rem] text-wingman-emphasis-text">
                  <SvgIcon
                    src="/new-wingman/icons/globe.svg"
                    className="h-[0.833125rem] w-[0.833125rem] shrink-0 bg-wingman-cyan"
                  />                  Powering Supporters&apos; Clubs Globally
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}