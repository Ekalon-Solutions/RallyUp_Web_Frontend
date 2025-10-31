import type React from "react"
import Link from "next/link"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"

export const metadata = {
  title: "Privacy Policy | Wingman Pro",
  description: "Wingman Pro Privacy Policy",
}

export default function PrivacyPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 text-slate-900 dark:text-white">
      <SiteNavbar />
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-10">
          Last updated: {new Date().getFullYear()}
        </p>

        <section className="space-y-6 text-slate-700 dark:text-slate-300">
          <p>
            This Privacy Policy explains how Wingman Pro ("we", "us", "our") collects, uses, and shares your information
            when you use our websites, apps, and services (the "Services").
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">1. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Account information (name, email, phone, profile details)</li>
            <li>Usage information (activity within the app, device and technical data)</li>
            <li>Payment information processed by third-party providers (e.g., Stripe)</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">2. How We Use Information</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Provide, maintain, and improve the Services</li>
            <li>Personalize features (e.g., club schedules, matchday tools)</li>
            <li>Communicate with you about updates, security, and support</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">3. Sharing</h2>
          <p>
            We may share information with trusted third parties that help us operate the Services (e.g., hosting,
            payments, analytics). We do not sell your personal information.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">4. Data Retention</h2>
          <p>
            We retain information for as long as necessary to provide the Services, comply with legal obligations, or
            resolve disputes.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">5. Your Rights</h2>
          <p>
            Depending on your location, you may have rights to access, correct, or delete your personal information.
            Contact us to exercise these rights.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">6. Security</h2>
          <p>
            We implement reasonable safeguards to protect your information. However, no method of transmission or
            storage is 100% secure.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">7. International Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your own.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">8. Children</h2>
          <p>
            The Services are not directed to children under 13. If you believe a child provided personal data to us,
            please contact us to remove it.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">9. Changes</h2>
          <p>
            We may update this Privacy Policy from time to time. We will post the updated version here and update the
            date above.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">10. Contact</h2>
          <p>
            Questions about this Policy? Contact us at <a className="underline" href="mailto:support@wingman.tech">support@wingman.tech</a>.
          </p>
        </section>

        <div className="mt-10">
          <Link href="/terms" className="text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200">View our Terms of Service</Link>
        </div>
      </div>
      <SiteFooter />
      <ScrollToTop />
    </main>
  )
}


