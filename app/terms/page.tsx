import type React from "react"
import Link from "next/link"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"

export const metadata = {
  title: "Terms of Service | Wingman Pro",
  description: "Wingman Pro Terms of Service",
}

export default function TermsPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 text-slate-900 dark:text-white">
      <SiteNavbar />
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-10">
          Last updated: {new Date().getFullYear()}
        </p>

        <section className="space-y-6 text-slate-700 dark:text-slate-300">
          <p>
            These Terms of Service ("Terms") govern your access to and use of the Wingman Pro platform, websites, and
            services (collectively, the "Services"). By accessing or using the Services, you agree to be bound by these
            Terms.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">1. Eligibility</h2>
          <p>
            You must be at least 13 years old to use the Services. If you are using the Services on behalf of an
            organization, you represent that you have authority to bind that organization to these Terms.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">2. Accounts</h2>
          <p>
            You are responsible for safeguarding your account credentials and for any activities under your account.
            Notify us immediately of any unauthorized use or security breach.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">3. Acceptable Use</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Do not violate applicable laws or regulations.</li>
            <li>Do not attempt to disrupt or compromise the integrity of the Services.</li>
            <li>Do not upload content that is illegal, harmful, or infringing.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">4. Payments</h2>
          <p>
            Certain features may be paid. Prices, fees, and billing terms will be disclosed at the time of purchase. All
            payments are processed by third-party providers (e.g., Stripe, Apple Pay, Google Pay).
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">5. Intellectual Property</h2>
          <p>
            Wingman Pro and its licensors retain all rights, title, and interest in and to the Services, including but not
            limited to software, trademarks, and content provided by Wingman Pro.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">6. Termination</h2>
          <p>
            We may suspend or terminate access to the Services at any time for conduct that violates these Terms or is
            otherwise harmful to the Services or users.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">7. Disclaimers</h2>
          <p>
            The Services are provided "as is" without warranties of any kind, express or implied. We do not guarantee
            uninterrupted or error-free operation.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Wingman Pro shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages, or any loss of profits or revenues.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">9. Changes</h2>
          <p>
            We may modify these Terms from time to time. We will post the updated Terms on this page and update the
            date above. Continued use constitutes acceptance of the updated Terms.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">10. Contact</h2>
          <p>
            Questions about these Terms? Contact us at <a className="underline" href="mailto:support@wingman.tech">support@wingman.tech</a>.
          </p>
        </section>

        <div className="mt-10">
          <Link href="/privacy" className="text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200">View our Privacy Policy</Link>
        </div>
      </div>
      <SiteFooter />
      <ScrollToTop />
    </main>
  )
}


