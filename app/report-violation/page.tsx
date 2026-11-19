import type React from "react"
import Image from "next/image"
import {
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  CloudUpload,
  Headset,
  Lock,
  ShieldCheck,
  ShieldOff,
  Zap,
} from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import SvgIcon from "@/components/svg-icon"
import Button from "@/components/ui/button"

export const metadata = {
  title: "Report a Violation | Wingman Pro",
  description: "Report a violation of Wingman Pro's conduct and child safety policies",
}

const violationTypes = [
  "Child safety (CSAM / Grooming)",
  "Harassment or abuse",
  "Impersonation or fraud",
  "Illegal activity",
  "Other policy violation",
]

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"

const labelClass = "mb-2 block text-[0.6875rem] font-semibold text-zinc-300"

const card = "rounded-xl border border-white/10 bg-white/[0.03]"

/* Mobile-only form styles (from mobile Figma) */
const mLabel = "text-[0.875rem] font-semibold leading-[1.25rem] text-wingman-secondary-text"
const mFieldBase =
  "w-full rounded-[0.75rem] border border-[#ffffff1f] bg-[#121212] text-[1rem] font-normal text-wingman-primary-text placeholder:text-[1rem] placeholder:font-normal placeholder:leading-none placeholder:text-[#859398] transition-colors focus:border-wingman-cyan focus:outline-none focus:ring-1 focus:ring-wingman-cyan"
const mInput = `${mFieldBase} h-[3.0625rem] px-4 leading-[1.5rem]`
const mTextarea = `${mFieldBase} h-[8rem] resize-none p-4 leading-[1.5rem]`

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

export default function ReportViolationPage(): React.JSX.Element {
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
      <section className="relative px-4 mobile:px-8">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[22.5rem] w-[56.25rem] max-w-full -translate-x-1/2 rounded-full " />
        <div className="pointer-events-none absolute right-0 top-10 h-[18.75rem] w-[25rem] rounded-full bg-purple-600/10 blur-[8.125rem]" />

        <div className="relative mx-auto w-full max-w-4xl pb-10 pt-8 text-left mobile:pb-12 mobile:pt-14 mobile:text-center">

          {/* Desktop Title Block */}
          <div className="heading-group-desktop mx-auto max-[767px]:hidden">
            <h1 className="heading-main">
              Report a Violation
            </h1>
            <p className="subheading-main">
              Wingman Pro maintains a zero-tolerance policy for conduct that compromises the safety or integrity
              of our community. Your report is a vital step in ensuring a professional and secure environment for
              all supporters.
            </p>
          </div>

          {/* Mobile Title Block */}
          <div className="heading-group-mobile hidden max-[767px]:flex my-4">
            <h1 className="heading-main-mobile">
              Report a Violation
            </h1>
            <p className="subheading-main-mobile">
              Your safety and professional integrity are our top priorities. Use this secure form to report any
              conduct that violates our community standards.
            </p>
          </div>

          {/* Mobile-only: Safety Commitment box (from mobile design) */}
          <div className="mt-8 flex w-full items-start gap-4 rounded-[1rem] border border-[#ffffff1f] bg-[#ffffff0d] p-4 text-left backdrop-blur-[1.25rem] max-[767px]:flex mobile:hidden">
            <div className="flex h-[2.8125rem] w-[2.3125rem] shrink-0 items-start justify-center rounded-[0.5rem] bg-[#A8E8FF1A] px-[0.5rem] pb-[1rem] pt-[0.5rem]">
              <SvgIcon
                src="/new-wingman/icons/warning-off.svg"
                className="h-[1.3125rem] w-[1.3125rem] shrink-0 bg-wingman-cyan"
              />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[0.875rem] font-semibold leading-[1.25rem] text-wingman-cyan">Safety Commitment</p>
              <p className="text-[0.75rem] font-medium leading-[1rem] text-wingman-secondary-text">
                Priority (P1) safety reports are reviewed by our specialized team within{" "}
                <span className="font-semibold text-wingman-primary-text">2 hours.</span>
              </p>
            </div>
          </div>

          {/* Desktop: Important box (hidden on mobile) */}
          <div className="mt-8 hidden h-auto min-h-[6.8125rem] w-full rounded-[0.75rem] border border-[#FFB4AB33] bg-[#FFB4AB1A] p-[1rem] text-left max-[767px]:hidden mobile:block">
            <p className="text-[0.875rem] font-normal leading-[1.3125rem] tracking-[0rem] text-[#E5E7EB]">
              Important
            </p>
            <p className="mt-[0.5rem] text-[1rem] font-normal leading-[1.5rem] tracking-[0rem] text-[#E5E7EB]">
              Never attach or paste child sexual abuse material. Describe it and give the link. If a child is in immediate danger, contact your local emergency number.
            </p>
          </div>

        </div>
      </section>

      <section className="px-4 pb-16 mobile:px-8 mobile:pb-24">
        <div className="mx-auto w-full max-w-4xl">
          {/* Form */}
          <div className="w-full p-0 mobile:rounded-2xl mobile:border mobile:border-white/10 mobile:bg-white/[0.03] mobile:p-9">
            {/* ───────────── Mobile-only form (from mobile design) ───────────── */}
            {/* Separate form so hidden desktop fields never block validation/submission */}
            <form
              action="/api/report-violation"
              method="post"
              encType="multipart/form-data"
              className="flex flex-col gap-6 mobile:hidden"
            >
              {/* Type of Violation */}
              <div className="flex flex-col gap-2">
                <label htmlFor="m-violationType" className={mLabel}>
                  Type of Violation
                </label>
                <div className="relative">
                  <select
                    id="m-violationType"
                    name="violationType"
                    required
                    defaultValue=""
                    className={`${mInput} appearance-none pr-10 invalid:text-[#859398]`}
                  >
                    <option value="" disabled className="text-[1rem] font-normal leading-[1.5rem] text-wingman-primary-text">
                      Choose a violation type
                    </option>
                    <option value="Professional Misconduct" className="bg-[#121212] text-wingman-primary-text">Professional Misconduct</option>
                    {violationTypes.map((type) => (
                      <option key={type} value={type} className="bg-[#121212] text-wingman-primary-text">
                        {type}
                      </option>
                    ))}
                  </select>
                  <SvgIcon
                    src="/new-wingman/icons/arrow-down.svg"
                    className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 bg-wingman-primary-text"
                  />
                </div>
              </div>

              {/* Date of Incident */}
              <div className="flex flex-col gap-2">
                <label htmlFor="m-incidentDate" className={mLabel}>
                  Date of Incident
                </label>
                <input
                  id="m-incidentDate"
                  name="incidentDate"
                  type="date"
                  className={`${mInput} [color-scheme:dark]`}
                />
              </div>

              {/* Target User */}
              <div className="flex flex-col gap-2">
                <label htmlFor="m-targetUser" className={mLabel}>
                  Target User (ID or Name)
                </label>
                <input
                  id="m-targetUser"
                  name="targetUser"
                  type="text"
                  placeholder="@username or full name"
                  className={mInput}
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <label htmlFor="m-reason" className={mLabel}>
                  Description
                </label>
                <textarea
                  id="m-reason"
                  name="reason"
                  required
                  minLength={20}
                  maxLength={3000}
                  placeholder="Please provide specific details about the incident..."
                  className={mTextarea}
                />
              </div>

              {/* Evidence upload */}
              <div className="flex flex-col gap-2">
                <p className={mLabel}>Evidence (Optional)</p>
                <label
                  htmlFor="m-evidence"
                  className="flex h-[8.75rem] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-[0.75rem] border-2 border-dashed border-[#ffffff1f] bg-[#1212124D] text-center transition-colors hover:border-wingman-cyan/60"
                >
                  <SvgIcon
                    src="/new-wingman/icons/upload.svg"
                    className="h-[1.5rem] w-[2.0625rem] shrink-0 bg-wingman-cyan"
                  />
                  <span className="mt-1 text-[0.875rem] font-semibold leading-[1.25rem] text-wingman-primary-text">
                    Tap to upload files
                  </span>
                  <span className="text-[0.75rem] font-medium leading-[1rem] text-wingman-secondary-text">
                    Images, PDFs or Videos (Max 20MB)
                  </span>
                  <input
                    id="m-evidence"
                    name="evidence"
                    type="file"
                    multiple
                    accept="image/*,application/pdf,video/*"
                    className="sr-only"
                  />
                </label>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="primary"
                className="
    mx-auto mt-4 h-[3.5rem] w-full max-w-8xl
    focus:outline-none focus:ring-2 focus:ring-wingman-cyan/50
    !font-sf-compact !text-[1rem] !font-[656] !leading-[1.625rem]
  "
              >
                Submit Secure Report
              </Button>
            </form>

            {/* ───────────── Desktop form (unchanged, hidden on mobile) ───────────── */}
            <div className="hidden mobile:block">
              {/* Create this endpoint (or change the action) to receive the report */}
              <form
                action="/api/report-violation"
                method="post"
                className="space-y-5 mobile:space-y-6"
              >
                {/* Violation type */}
                <div className="flex h-[4.8125rem] w-full flex-col">
                  <label htmlFor="violationType" className="text-[0.875rem] font-normal leading-[1.25rem] text-wingman-primary-text/80">
                    Violation type <span className="text-wingman-secondary-text/60">(required)</span>
                  </label>
                  <div className="relative mt-[0.5rem]">
                    <select
                      id="violationType"
                      name="violationType"
                      required
                      defaultValue=""
                      className="h-[3.0625rem] w-full appearance-none rounded-[0.75rem] border border-[#ffffff1f] bg-[#121212] px-4 pr-10 text-[1rem] font-normal leading-none text-wingman-secondary-text invalid:text-wingman-secondary-text/40 focus:border-wingman-cyan focus:outline-none focus:ring-1 focus:ring-wingman-cyan transition-colors"
                    >
                      <option value="" disabled>
                        Choose a violation type
                      </option>
                      {violationTypes.map((type) => (
                        <option key={type} value={type} className="bg-[#121212] text-wingman-secondary-text">
                          {type}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-[1.25rem] w-[1.5625rem] -translate-y-1/2 text-wingman-secondary-text" />
                  </div>
                </div>

                {/* Where did you see it */}
                <div className="flex h-[4.8125rem] w-full flex-col">
                  <label htmlFor="location" className="text-[0.875rem] font-normal leading-[1.25rem] text-wingman-primary-text/80">
                    Where did you see it? <span className="text-wingman-secondary-text/60">(optional)</span>
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="Page address, club name, username, or profile link"
                    className="mt-[0.5rem] h-[3.0625rem] w-full rounded-[0.75rem] border border-[#ffffff1f] bg-[#121212] px-4 text-[1rem] font-normal leading-none text-wingman-secondary-text placeholder:text-wingman-secondary-text/40 focus:border-wingman-cyan focus:outline-none focus:ring-1 focus:ring-wingman-cyan transition-colors"
                  />
                </div>

                {/* Description */}
                <div className="flex w-full flex-col">
                  <div className="flex items-center justify-between">
                    <label htmlFor="reason-desktop" className="text-[0.875rem] font-normal leading-[1.25rem] text-wingman-primary-text/80">
                      Description of violation <span className="text-wingman-secondary-text/60">(required)</span>
                    </label>
                    <span className="text-[0.8125rem] font-normal leading-[1.25rem] tracking-[0rem] text-[#E5E7EB]">
                      0 / 3,000
                    </span>
                  </div>
                  <textarea
                    id="reason-desktop"
                    name="reason"
                    required
                    placeholder="Provide as much detail as possible, including context and any specific actions taken..."
                    className="mt-[0.5rem] h-[10.625rem] w-full resize-none rounded-[0.75rem] border border-[#ffffff1f] bg-[#121212] p-4 text-[1rem] font-normal leading-[1.5rem] text-wingman-secondary-text placeholder:text-wingman-secondary-text/40 focus:border-wingman-cyan focus:outline-none focus:ring-1 focus:ring-wingman-cyan transition-colors"
                  />
                  <p className="mt-2 text-[0.8125rem] font-normal leading-[1.25rem] tracking-[0rem] text-[#E5E7EB]">
                    Minimum 20 characters required.
                  </p>
                </div>

                {/* Links to evidence */}
                <div className="flex w-full flex-col">
                  <label htmlFor="evidenceLinks" className="text-[0.875rem] font-normal leading-[1.25rem] text-wingman-primary-text/80">
                    Links to evidence <span className="text-wingman-secondary-text/60">(optional)</span>
                  </label>
                  <textarea
                    id="evidenceLinks"
                    name="evidenceLinks"
                    placeholder="One link per line. Use http:// or https:// format."
                    className="mt-[0.5rem] h-[5.25rem] w-full resize-none rounded-[0.75rem] border border-[#ffffff1f] bg-[#121212] p-4 text-[1rem] font-normal leading-[1.5rem] text-wingman-secondary-text placeholder:text-wingman-secondary-text/40 focus:border-wingman-cyan focus:outline-none focus:ring-1 focus:ring-wingman-cyan transition-colors"
                  />
                  <p className="mt-2 text-[0.8125rem] font-normal leading-[1.25rem] tracking-[0rem] text-[#E5E7EB]">
                    Maximum 5 links.
                  </p>
                </div>

                {/* Email */}
                <div className="flex h-[4.8125rem] w-full flex-col">
                  <label htmlFor="email" className="text-[0.875rem] font-normal leading-[1.25rem] text-wingman-primary-text/80">
                    Your email <span className="text-wingman-secondary-text/60">(required)</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@example.com"
                    className="mt-[0.5rem] h-[3.0625rem] w-full rounded-[0.75rem] border border-[#ffffff1f] bg-[#121212] px-4 text-[1rem] font-normal leading-none text-wingman-secondary-text placeholder:text-wingman-secondary-text/40 focus:border-wingman-cyan focus:outline-none focus:ring-1 focus:ring-wingman-cyan transition-colors"
                  />
                </div>

                {/* Name */}
                <div className="flex h-[4.8125rem] w-full flex-col">
                  <label htmlFor="name" className="text-[0.875rem] font-normal leading-[1.25rem] text-wingman-primary-text/80">
                    Your name <span className="text-wingman-secondary-text/60">(optional)</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    maxLength={100}
                    autoComplete="name"
                    placeholder="Maximum 100 characters"
                    className="mt-[0.5rem] h-[3.0625rem] w-full rounded-[0.75rem] border border-[#ffffff1f] bg-[#121212] px-4 text-[1rem] font-normal leading-none text-wingman-secondary-text placeholder:text-wingman-secondary-text/40 focus:border-wingman-cyan focus:outline-none focus:ring-1 focus:ring-wingman-cyan transition-colors"
                  />
                </div>

                <p className="text-[0.8125rem] font-normal leading-[1.25rem] tracking-[0rem] text-[#E5E7EB]">
                  We use these details only to review your report. See our{" "}
                  <a href="/privacy-policy" className="underline underline-offset-2 hover:text-wingman-emphasis-text">
                    Privacy Policy
                  </a>
                  .
                </p>

                <div>
                  <Button
                    type="submit"
                    variant="primary"
                    className="
    mt-2 h-[4rem] w-full
    focus:outline-none focus:ring-2 focus:ring-wingman-cyan/50
    max-[767px]:h-[3.5rem]
    max-[767px]:!text-[1.125rem] max-[767px]:!leading-[1.75rem]
  "
                  >
                    Submit report
                  </Button>
                  <p className="mt-4 text-center text-[0.8125rem] font-normal leading-[1.25rem] tracking-[0rem] text-[#E5E7EB]">
                    Protected by reCAPTCHA.{" "}
                    <a href="https://policies.google.com/privacy" className="underline underline-offset-2 hover:text-wingman-emphasis-text">
                      Google Privacy Policy
                    </a>{" "}
                    and{" "}
                    <a href="https://policies.google.com/terms" className="underline underline-offset-2 hover:text-wingman-emphasis-text">
                      Terms
                    </a>{" "}
                    apply.
                  </p>
                </div>
              </form>
            </div>

            {/* Mobile-only blocks (from mobile design) */}
            <div className="mt-12 flex flex-col items-center gap-5 mobile:hidden">
              <span className="inline-flex h-[2rem] items-center gap-2 rounded-full bg-[#201F1F] px-4 text-[0.75rem] font-medium leading-[1rem] text-wingman-primary-text">
                <Lock className="h-[0.75rem] w-[0.75rem] text-wingman-cyan" />
                End-to-End Encrypted
              </span>
              <p className="text-center text-[1rem] font-normal leading-[1.5rem] text-wingman-secondary-text">
                Your report is strictly confidential. Information shared here is only accessible by the Wingman
                Pro Safety and Compliance Officers.
              </p>
            </div>

            <div className="mt-9 w-full rounded-[1rem] border border-[#ffffff1f] bg-[#ffffff0d] px-6 pb-6 pt-10 backdrop-blur-[1.25rem] mobile:hidden">
              <h2 className="text-[1.5rem] font-semibold leading-[2rem] text-wingman-primary-text">Need Immediate Help?</h2>
              <div className="mt-5 flex flex-col gap-4">
                <a
                  href="mailto:support@wingmanpro.tech"
                  className="flex h-[3.25rem] w-full items-center justify-between rounded-[0.75rem] bg-[#FFFFFF0D] px-4 text-[0.875rem] font-semibold leading-[1.25rem] text-[#E5E7EB]"
                >
                  <span className="flex items-center gap-3">
                    <SvgIcon
                      src="/new-wingman/icons/headset.svg"
                      className="h-[1.25rem] w-[1rem] shrink-0 bg-wingman-cyan"
                    />
                    Contact Safety Team
                  </span>
                  <SvgIcon
                    src="/new-wingman/icons/arrow-down.svg"
                    className="h-[0.4625rem] w-[0.75rem] shrink-0 bg-wingman-secondary-text -rotate-90"
                  />
                </a>
                <a
                  href="mailto:support@wingmanpro.tech"
                  className="flex h-[3.25rem] w-full items-center justify-between rounded-[0.75rem] bg-[#FFFFFF0D] px-4 text-[0.875rem] font-semibold leading-[1.25rem] text-[#E5E7EB]"
                >
                  <span className="flex items-center gap-3">
                    <SvgIcon
                      src="/new-wingman/icons/shield-check.svg"
                      className="h-[1.25rem] w-[1rem] shrink-0 bg-wingman-cyan"
                    />
                    Chief Compliance Officer
                  </span>
                  <SvgIcon
                    src="/new-wingman/icons/arrow-down.svg"
                    className="h-[0.4625rem] w-[0.75rem] shrink-0 bg-wingman-secondary-text -rotate-90"
                  />
                </a>
              </div>
            </div>
          </div>

        </div>
      </section>

      <SiteFooter />
    </main>
  )
}