import type React from "react"
import Link from "next/link"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"
import { DataDeletionRequestForm } from "./data-deletion-request-form"

export const metadata = {
  title: "Data Deletion & Privacy Request",
  description:
    "Request permanent deletion of your Wingman Pro account and data, or request a copy of your data. Public form; no login required.",
}

export default function DeleteAccountPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 text-slate-900 dark:text-white">
      <SiteNavbar />
      <div className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Data Deletion &amp; Privacy Request</h1>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-10">
          At Wingman Pro, you are in control of your data. Use this form to request the permanent deletion of your
          account and personal information from our systems. Once processed, this action cannot be undone.
        </p>

        <div className="rounded-xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
          <DataDeletionRequestForm />
        </div>

        <p className="mt-8 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          No phone call or postal mail is required. If you need help, you can still reach us at{" "}
          <a className="underline text-sky-700 dark:text-sky-300" href="mailto:support@wingmanpro.tech">
            support@wingmanpro.tech
          </a>
          .
        </p>

        <div className="mt-8">
          <Link href="/privacy" className="text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200">
            Privacy Policy
          </Link>
        </div>
      </div>
      <SiteFooter />
      <ScrollToTop />
    </main>
  )
}
