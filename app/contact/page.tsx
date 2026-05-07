"use client"

import React, { useState } from "react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"
import { FadeIn } from "@/components/fade-in"
import { Button } from "@/components/ui/button"
import { ChevronDown, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", topic: "Product Support", message: "" })
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <main className="min-h-screen bg-white text-foreground relative overflow-x-hidden">
      <SiteNavbar />
      
      {/* Main Content */}
      <section className="bg-white py-16 md:py-20 lg:py-24" id="contact">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-stretch">
          {/* Left */}
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-3">
                <span className="text-background">Ready to</span>{" "}
                <span className="text-primary">Upgrade Your Club?</span>
              </h2>
              <p className="text-secondary text-lg leading-relaxed max-w-md">
                Book a consultation or join the wait-list. Takes two minutes.
              </p>
            </div>

            <div className="mt-auto border-t border-border/30 pt-8">
              <p className="text-secondary font-semibold text-base mb-1">Need urgent help?</p>
              <p className="text-[#888] text-sm">Contact your Sales POC directly for fastest resolution.</p>
            </div>
          </div>

          {/* Right — form */}
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary-purple text-primary flex items-center justify-center text-3xl">✓</div>
              <p className="text-background font-bold text-xl">Thanks! We&apos;ll be in touch shortly.</p>
              <Button
                variant="outline"
                className="border-0 bg-primary rounded-md text-xs font-medium uppercase tracking-wide"
                onClick={() => setSubmitted(false)}
              >
                Submit another
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 bg-secondary-purple/50 p-4 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-secondary text-xs font-semibold">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full h-11 px-4 border rounded-lg text-xs placeholder-[#888] focus:outline-none focus:border-secondary bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-secondary text-xs font-semibold">Email</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full h-11 px-4 border rounded-lg text-xs placeholder-[#888] focus:outline-none focus:border-secondary bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-secondary text-xs font-semibold">Topic</label>
                <select
                  value={form.topic}
                  onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                  className="w-full h-11 px-4 border rounded-lg text-xs text-[#888] focus:outline-none focus:border-secondary appearance-none bg-white"
                >
                  <option>Product Support</option>
                  <option>Sales Inquiry</option>
                  <option>Partnership</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-secondary text-xs font-semibold">Message</label>
                <textarea
                  placeholder="Tell us what you need..."
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border rounded-lg text-xs text-[#888] placeholder-[#888] focus:outline-none focus:border-secondary resize-none bg-white"
                />
              </div>

              <div className="flex flex-col gap-3 pt-1">
                <Button
                  type="submit"
                  variant="secondary"
                  className="bg-secondary/40"
                >
                  Submit
                </Button>
                <Link href="/clubs" className="flex-1">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                  >
                    Join Waiting List
                  </Button>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
      
      <SiteFooter />
      <ScrollToTop />
    </main>
  )
}


