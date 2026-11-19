import type React from "react"
import Link from "next/link"
import { ArrowRight, ChevronDown, ShieldCheck, TriangleAlert } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import SvgIcon from "@/components/svg-icon"
import Button from "@/components/ui/button"

export const metadata = {
  title: "Data Deletion & Privacy Request | Wingman Pro",
  description: "Request permanent deletion of your Wingman Pro account and personal data",
}

const requestTypes = [
  "Delete my account and all data",
  "Delete specific personal data",
  "Export my data before deletion",
]

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"

const labelClass = "mb-2 block text-xs font-medium text-zinc-300"

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

export default function DeleteAccountPage(): React.JSX.Element {
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
        <div className="pointer-events-none absolute right-0 top-10 h-[18.75rem] w-[25rem] rounded-full bg-purple-600/10 blur-[8.125rem]" />

        <div className="relative mx-auto flex max-w-8xl flex-col items-start gap-4 px-4 pb-6 pt-12 text-left mobile:items-center mobile:gap-6 mobile:px-8 mobile:pb-12 mobile:pt-14 mobile:text-center">
          {/* Mobile Heading */}
          <h1 className="heading-main text-left text-[1.5rem] font-bold leading-[2.1875rem] tracking-[0rem] mobile:hidden">
            Delete Account
          </h1>

          {/* Desktop Heading */}
          <h1 className="heading-main hidden mobile:block">
            Data Deletion &amp; Privacy Request
          </h1>

          <span className="hidden rounded-full border border-wingman-green-button/30 bg-wingman-green-button/10 px-3 text-xs font-medium text-wingman-green-button-text mobile:inline-block py-1">
            PRIVACY CONTROLS
          </span>

          {/* Mobile Subtext */}
          <p className="w-full text-left text-[1rem] font-medium leading-[1.5rem] tracking-[0rem] text-wingman-secondary-text mobile:hidden">
            At Wingman Pro, you are in control of your data. Use this form to request the permanent deletion of
            your account and personal information.
          </p>

          {/* Desktop Subtext */}
          <p className="subheading-main hidden mobile:block">
            At Wingman Pro, you are in control of your data. Use this form to request the permanent deletion of
            your account and personal information from our systems. Once processed, this action cannot be
            undone.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="px-4 pb-16 mobile:px-8 mobile:pb-24">
        <div className="mx-auto w-full max-w-2xl border-0 bg-transparent p-0 mobile:rounded-2xl mobile:border mobile:border-white/10 mobile:bg-white/[0.03] mobile:p-9">

          {/* Mobile-only warning box */}
          <div className="mb-6 flex w-full items-start gap-3 rounded-[0.75rem] border border-solid border-[#FFB4AB4D] bg-[#93000A0D] p-4 shadow-[0_0_0.9375rem_0_#FFB4AB33] backdrop-blur-[1.25rem] mobile:hidden">
            <TriangleAlert className="mt-0.5 h-[1.1875rem] w-[1.375rem] shrink-0 text-[#ffb4ab]" />
            <div className="flex flex-col gap-1">
              <p className="text-[1rem] font-normal leading-[1.5rem] text-[#ffb4ab]">Permanent Action Required</p>
              <p className="text-[0.75rem] font-normal leading-[1rem] text-wingman-secondary-text">
                This action cannot be undone. Once processed, all your ticket history, memberships, and profile
                data will be permanently removed from our systems.
              </p>
            </div>
          </div>

          <form action="/api/data-deletion" method="post" className="space-y-5 mobile:space-y-6">
            <div className="grid gap-5 mobile:grid-cols-2 mobile:gap-6">
              <div className="flex w-full flex-col mobile:h-[4.8125rem] mobile:max-w-[18.6875rem]">
                <label htmlFor="fullName" className="text-[1rem] font-normal leading-[1.5rem] text-wingman-primary-text/80 mobile:text-[0.875rem] mobile:leading-[1.25rem]">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Enter your full name"
                  className="mt-[0.5rem] h-[3.0625rem] w-full rounded-[0.75rem] border border-[#ffffff1f] bg-[#121212] px-4 text-[1rem] font-normal leading-none text-wingman-secondary-text placeholder:text-[1rem] placeholder:font-normal placeholder:leading-none placeholder:text-wingman-secondary-text/40 focus:border-wingman-cyan focus:outline-none focus:ring-1 focus:ring-wingman-cyan transition-colors"
                />
              </div>

              <div className="flex w-full flex-col mobile:h-[4.8125rem] mobile:max-w-[18.6875rem]">
                <label htmlFor="email" className="text-[1rem] font-normal leading-[1.5rem] text-wingman-primary-text/80 mobile:text-[0.875rem] mobile:leading-[1.25rem]">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="john@example.com"
                  className="mt-[0.5rem] h-[3.0625rem] w-full rounded-[0.75rem] border border-[#ffffff1f] bg-[#121212] px-4 text-[1rem] font-normal leading-none text-wingman-secondary-text placeholder:text-[1rem] placeholder:font-normal placeholder:leading-none placeholder:text-wingman-secondary-text/40 focus:border-wingman-cyan focus:outline-none focus:ring-1 focus:ring-wingman-cyan transition-colors"
                />
              </div>
            </div>

            <div className="grid gap-5 mobile:grid-cols-2 mobile:gap-6">
              <div className="flex w-full flex-col mobile:h-[4.8125rem] mobile:max-w-[18.6875rem]">
                <label htmlFor="phone" className="text-[1rem] font-normal leading-[1.5rem] text-wingman-primary-text/80 mobile:text-[0.875rem] mobile:leading-[1.25rem]">
                  Phone number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+1 (555) 000-0000"
                  className="mt-[0.5rem] h-[3.0625rem] w-full rounded-[0.75rem] border border-[#ffffff1f] bg-[#121212] px-4 text-[1rem] font-normal leading-none text-wingman-secondary-text placeholder:text-[1rem] placeholder:font-normal placeholder:leading-none placeholder:text-wingman-secondary-text/40 focus:border-wingman-cyan focus:outline-none focus:ring-1 focus:ring-wingman-cyan transition-colors"
                />
              </div>
              <div className="flex w-full flex-col mobile:h-[4.8125rem] mobile:max-w-[18.6875rem]">
                <label htmlFor="requestType" className="text-[1rem] font-normal leading-[1.5rem] text-wingman-primary-text/80 mobile:text-[0.875rem] mobile:leading-[1.25rem]">
                  Type of request
                </label>
                <div className="relative mt-[0.5rem]">
                  <select
                    id="requestType"
                    name="requestType"
                    required
                    defaultValue=""
                    className="h-[3.0625rem] w-full appearance-none rounded-[0.75rem] border border-[#ffffff1f] bg-[#121212] px-4 pr-10 text-[1rem] font-normal leading-[1.5rem] text-wingman-primary-text invalid:text-wingman-primary-text focus:border-wingman-cyan focus:outline-none focus:ring-1 focus:ring-wingman-cyan transition-colors"
                  >
                    <option value="" disabled className="text-[1rem] font-normal leading-[1.5rem] text-wingman-primary-text">Select one option</option>
                    <option value="Data Deletion" className="bg-[#121212] text-wingman-primary-text">Data Deletion</option>
                    <option value="Data Export" className="bg-[#121212] text-wingman-primary-text">Data Export</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-[1.25rem] w-[1.5625rem] -translate-y-1/2 text-wingman-secondary-text" />
                </div>
              </div>
            </div>

            {/* Reason Textarea */}
            <div className="flex w-full flex-col">
              <label htmlFor="reason" className="text-[1rem] font-normal leading-[1.5rem] text-wingman-primary-text/80 mobile:text-[0.875rem] mobile:leading-[1.25rem]">
                Reason for deletion (optional)
              </label>
              <textarea
                id="reason"
                name="reason"
                placeholder="Please let us know why you'd like to leave..."
                className="mt-[0.5rem] h-[7.625rem] w-full resize-none rounded-[0.75rem] border border-[#ffffff1f] bg-[#121212] p-4 text-[1rem] font-normal leading-[1.5rem] text-wingman-secondary-text placeholder:text-[1rem] placeholder:font-normal placeholder:leading-[1.5rem] placeholder:text-wingman-secondary-text/40 focus:border-wingman-cyan focus:outline-none focus:ring-1 focus:ring-wingman-cyan transition-colors"
              />
            </div>

            {/* Consent Checkbox Container */}
            <label
              htmlFor="confirm"
              className="flex w-full cursor-pointer items-start gap-3 rounded-[0.75rem] border border-[#ffb4ab]/20 bg-[#ffb4ab]/[0.05] px-4 py-3 mobile:h-[5.125rem] mobile:min-h-0 mobile:items-center mobile:gap-4 mobile:py-0"
            >
              {/* Checkbox Input */}
              <div className="relative mt-[0.125rem] flex h-[1.25rem] w-[1.25rem] shrink-0 items-center justify-center mobile:mt-0 mobile:h-[1.5rem] mobile:w-[1.5rem]">
                <input
                  id="confirm"
                  name="confirm"
                  type="checkbox"
                  required
                  className="peer h-[1.25rem] w-[1.25rem] appearance-none rounded-[0.25rem] border border-[#ffffff1f] bg-[#121212] transition-colors checked:bg-[#ffb4ab] focus:outline-none focus:ring-1 focus:ring-[#ffb4ab]/50 mobile:h-[1.5rem] mobile:w-[1.5rem] mobile:border-[#ffb4ab]/50"
                />
                {/* Custom Checkmark (visible when checked) */}
                <svg
                  className="pointer-events-none absolute hidden h-3.5 w-3.5 text-[#121212] peer-checked:block mobile:h-4 mobile:w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span className="text-[0.75rem] font-normal leading-[1.21875rem] text-wingman-secondary-text mobile:text-[1rem] mobile:leading-[1.5rem]">
                I understand that this action is permanent and my ticket history, memberships, and profile cannot be recovered.
              </span>
            </label>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="
    mt-2 h-[4rem] w-full
    focus:outline-none focus:ring-2 focus:ring-wingman-cyan/50
    max-[767px]:h-[3.5rem] max-[767px]:gap-2
    max-[767px]:!text-[1.125rem] max-[767px]:!leading-[1.75rem] max-[767px]:!text-wingman-light-accent-text
  "
            >
              Submit request
              <span className="flex h-5 w-5 shrink-0 items-center justify-center mobile:hidden">
                <SvgIcon
                  src="/new-wingman/icons/arrow-right.svg"
                  className="h-5 w-5 bg-wingman-light-accent-text"
                />
              </span>
            </Button>

            {/* Footer Links */}
            <div className="mx-auto mt-4 flex w-full max-w-[28.9375rem] flex-col items-center gap-4 text-center">
              <p className="text-center text-[0.75rem] font-normal leading-[1rem] text-wingman-secondary-text mobile:italic">
                No phone call or postal mail is required. If you need help, you can still reach us at{" "}
                <a href="mailto:support@wingmanpro.tech" className="hover:underline">
                  support@wingmanpro.tech.
                </a>
              </p>

              <Link
                href="/privacy"
                className="hidden mobile:flex items-center justify-center gap-2 text-[0.875rem] font-normal leading-[1.25rem] text-wingman-cyan transition-colors hover:opacity-80"
              >
                <SvgIcon
                  src="/new-wingman/icons/shield-check.svg"
                  className="h-5 w-5 shrink-0 bg-wingman-secondary-text/40"
                />
                Privacy Policy
              </Link>
            </div>
          </form>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}