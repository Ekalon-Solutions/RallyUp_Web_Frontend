import type React from "react"
import Link from "next/link"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"

export const metadata = {
  title: "Global Child Safety Standards & CSAE Compliance Policy | Wingman Pro",
  description:
    "RallyUp Solutions Private Limited global child safety standards, CSAE/CSAM prevention, reporting, enforcement, mandatory reporting, and compliance contacts for Wingman Pro.",
}

export default function ChildSafetyPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 text-slate-900 dark:text-white">
      <SiteNavbar />
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Global Child Safety Standards &amp; CSAE Compliance Policy
        </h1>

        <section className="space-y-8 text-slate-700 dark:text-slate-300">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">1. Mission statement &amp; scope</h2>
            <p>
              RallyUp Solutions Private Limited (&quot;The Company&quot;) is committed to providing a safe, inclusive, and
              secure digital environment for the global sports community. We maintain a zero-tolerance policy toward any
              content or behaviour that exploits, harms, or endangers minors.
            </p>
            <p className="mt-3">
              This policy applies to all users, club administrators, and content creators across the Wingman Pro platform
              globally. It specifically addresses the prevention, detection, and reporting of Child Sexual Abuse Material
              (CSAM) and Child Sexual Abuse and Exploitation (CSAE).
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">2. Global regulatory alignment</h2>
            <p className="mb-3">Wingman Pro operates in strict accordance with international frameworks, including but not limited to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">International:</span> UN Convention on the
                Rights of the Child.
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">India:</span> Protection of Children from
                Sexual Offences (POCSO) Act (2012) and Information Technology Rules (2021).
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">United States:</span> 18 U.S.C. Section 2258A
                (mandatory reporting to NCMEC).
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">European Union:</span> Digital Services Act
                (DSA) and the European Strategy for a Better Internet for Kids (BIK+).
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">United Kingdom:</span> Online Safety Act
                (2023).
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">3. Prohibited content &amp; conduct</h2>
            <p className="mb-3">
              Regardless of a user&apos;s geographic location, the following are strictly prohibited on Wingman Pro:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">CSAM:</span> Any visual depiction
                (photographic, video, or AI-generated) of a minor engaging in sexually explicit conduct.
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">Grooming:</span> Any behavior intended to
                establish an emotional connection with a minor to lower their inhibitions for the purpose of sexual
                exploitation.
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">Solicitation:</span> Attempts to obtain
                private contact information, personal schedules, or explicit imagery from minors.
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">Extortion (sextortion):</span> Using
                sensitive information or imagery to threaten or coerce a minor.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
              4. Operational procedures &amp; enforcement
            </h2>

            <h3 className="text-lg font-medium text-slate-900 dark:text-white mt-4 mb-2">4.1 Detection &amp; monitoring</h3>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">Automated scanning:</span> We utilize
                metadata analysis and automated keyword filtering to identify and block potentially harmful content on
                community walls and prediction leagues.
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">Manual moderation:</span> Our internal
                safety team performs periodic audits of high-activity club subdomains to ensure community guidelines are
                upheld.
              </li>
            </ul>

            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">4.2 In-app reporting</h3>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>
                Wingman Pro provides a native &quot;Report&quot; feature on every piece of user-generated content.
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">Reporting flow:</span> Users can select the
                three-dot menu on any post or profile and select &quot;Report Child Safety Concern.&quot;
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">SLA:</span> Reports involving child safety are
                flagged as Priority 1 and reviewed by our safety team within 2 hours.
              </li>
            </ul>

            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">4.3 Enforcement actions</h3>
            <p className="mb-2">Upon confirmation of a violation:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">Immediate removal:</span> Content is
                permanently purged from our production servers (Firebase).
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">Permanent ban:</span> The associated User ID,
                phone number, and device fingerprint are blacklisted across the RallyUp ecosystem.
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">Data preservation:</span> Evidence is
                encrypted and preserved for law enforcement, overriding standard data deletion requests in accordance with
                global legal mandates.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">5. Mandatory reporting protocols</h2>
            <p className="mb-4">
              RallyUp complies with mandatory reporting requirements. Confirmed cases of CSAE/CSAM will be reported to the
              following authorities based on the jurisdiction of the user or the incident:
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                    <th className="px-4 py-2 font-semibold text-slate-900 dark:text-white">Region</th>
                    <th className="px-4 py-2 font-semibold text-slate-900 dark:text-white">Authority</th>
                    <th className="px-4 py-2 font-semibold text-slate-900 dark:text-white">Reporting portal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  <tr>
                    <td className="px-4 py-2">Global / USA</td>
                    <td className="px-4 py-2">NCMEC</td>
                    <td className="px-4 py-2">
                      <a
                        href="https://report.cybertip.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200 underline break-all"
                      >
                        report.cybertip.org
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">India</td>
                    <td className="px-4 py-2">National Cyber Crime</td>
                    <td className="px-4 py-2">
                      <a
                        href="https://cybercrime.gov.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200 underline break-all"
                      >
                        cybercrime.gov.in
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">European Union</td>
                    <td className="px-4 py-2">Europol / INHOPE</td>
                    <td className="px-4 py-2">
                      <a
                        href="https://www.inhope.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200 underline break-all"
                      >
                        inhope.org
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">United Kingdom</td>
                    <td className="px-4 py-2">IWF / NCA</td>
                    <td className="px-4 py-2">
                      <a
                        href="https://www.iwf.org.uk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200 underline break-all"
                      >
                        iwf.org.uk
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">6. Contact information</h2>
            <p className="mb-3">The designated point of contact for Wingman Pro&apos;s child safety compliance is:</p>
            <ul className="list-none space-y-1 pl-0">
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">Name:</span> Dr. Sunil Acharya
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">Title:</span> Chief Compliance Officer
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">Email:</span>{" "}
                <a
                  className="text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200 font-semibold underline"
                  href="mailto:response@wingmanpro.tech"
                >
                  response@wingmanpro.tech
                </a>
              </li>
            </ul>
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
