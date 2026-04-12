import type React from "react"
import Link from "next/link"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"

export const metadata = {
  title: "Child Safety & CSAE Policy | Wingman Pro",
  description:
    "Wingman Pro zero-tolerance policy on child sexual abuse and exploitation (CSAE), reporting, enforcement, and contact information.",
}

export default function ChildSafetyPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 text-slate-900 dark:text-white">
      <SiteNavbar />
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Child Safety &amp; CSAE Policy</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-10">
          RALLYUP SOLUTIONS PRIVATE LIMITED (for Wingman Pro)
        </p>

        <section className="space-y-8 text-slate-700 dark:text-slate-300">
          <p>
            Wingman Pro is committed to maintaining a safe and respectful platform. We have a strict zero-tolerance policy
            against child sexual abuse and exploitation (CSAE).
          </p>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Zero tolerance</h2>
            <p className="mb-3">We strictly prohibit:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Child sexual abuse material (CSAM)</li>
              <li>Any form of grooming or exploitation of minors</li>
              <li>Uploading, sharing, or promoting harmful content involving minors</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Reporting &amp; moderation</h2>
            <p>
              Users can report inappropriate content or behavior directly within the app. Our team reviews all reports
              promptly and takes necessary action.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Enforcement actions</h2>
            <p className="mb-3">Violations of this policy may result in:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Immediate removal of content</li>
              <li>Permanent suspension or banning of accounts</li>
              <li>Reporting to relevant law enforcement authorities where required</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Legal compliance</h2>
            <p>
              We comply with all applicable child safety and protection laws and cooperate with law enforcement agencies
              as necessary.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Contact</h2>
            <p className="mb-2">For any child safety concerns or reports, please contact:</p>
            <p>
              <a
                className="text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200 font-semibold underline"
                href="mailto:nabilm@wingmanpro.tech"
              >
                nabilm@wingmanpro.tech
              </a>
            </p>
          </div>
        </section>

        <div className="mt-10 flex flex-col gap-2 sm:flex-row sm:gap-6">
          <Link href="/privacy" className="text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200">
            Terms of Service
          </Link>
        </div>
      </div>
      <SiteFooter />
      <ScrollToTop />
    </main>
  )
}
