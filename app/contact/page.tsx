import type React from "react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"
import { FadeIn } from "@/components/fade-in"

export const metadata = {
  title: "Contact Us | Wingman Pro",
  description: "Get in touch with the Wingman Pro team",
}

export default function ContactPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 text-slate-900 dark:text-white">
      <SiteNavbar />
      <div className="mx-auto max-w-7xl px-4 py-16">
        <FadeIn>
        <div className="max-w-2xl mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Contact Us</h1>
          <p className="text-slate-700 dark:text-slate-300">
            Have questions about Wingman Pro or need help with your supporters group? Send us a message and we’ll get back
            to you.
          </p>
        </div>
        </FadeIn>

        <FadeIn>
        <div className="grid md:grid-cols-2 gap-8">
          <form className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="grid gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">Full Name</label>
                <input id="name" name="name" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-transparent" placeholder="Jane Doe" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                <input id="email" name="email" type="email" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-transparent" placeholder="you@club.com" />
              </div>
              <div>
                <label htmlFor="topic" className="block text-sm font-medium mb-1">Topic</label>
                <select id="topic" name="topic" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-transparent">
                  <option value="support">Product Support</option>
                  <option value="pricing">Pricing & Billing</option>
                  <option value="partnerships">Partnerships/Affiliations</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1">Message</label>
                <textarea id="message" name="message" rows={5} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-transparent" placeholder="How can we help?" />
              </div>
              <button className="mt-2 inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 dark:bg-sky-400 dark:text-slate-900 dark:hover:bg-sky-300">
                Send Message
              </button>
            </div>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h2 className="text-xl font-semibold mb-4">Reach us directly</h2>
            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <p>
                Email: <a className="underline" href="mailto:support@wingman.tech">support@wingman.tech</a>
              </p>
              <p>Hours: Mon–Fri, 9:00–18:00 (IST)</p>
              <p>For urgent issues during matchdays, include your group name and club in the subject.</p>
            </div>
            <div className="mt-6 grid gap-2 text-xs">
              <span className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 w-max">Response within 1 business day</span>
              <span className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 w-max">Priority support for Wingman Pro</span>
            </div>
          </div>
        </div>
        </FadeIn>
      </div>
      <SiteFooter />
      <ScrollToTop />
    </main>
  )
}


