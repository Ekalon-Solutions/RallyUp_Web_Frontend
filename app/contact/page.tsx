"use client"

import React, { useState } from "react"
import Image from "next/image"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"
import { FadeIn } from "@/components/fade-in"
import { Button } from "@/components/ui/button"

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", topic: "Product Support", message: "" })
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <main className="min-h-screen bg-white text-background relative overflow-x-hidden">
      <SiteNavbar />
      <div className="bg-white py-16 md:py-20 lg:py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 -z-10 bg-white" />
          <div className="absolute -bottom-8 -left-10 w-80 h-80 opacity-60 pointer-events-none select-none">
            <Image src="/Vector.svg" alt="" fill className="object-contain" />
          </div>
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background border border-primary/20 mb-10 animate-scale-in">
            <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 animate-pulse" />
            <span className="text-[10px] font-medium leading-[14px] text-primary uppercase tracking-normal">Contact Us</span>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-stretch">
            {/* Left */}
            <FadeIn className="flex flex-col gap-8">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-3">
                  <span className="text-background">Contact</span>{" "}
                  <span className="text-primary">Us</span>
                </h1>
                <p className="text-secondary text-lg leading-relaxed max-w-md">
                  Have questions about Wingman Pro or need help with your supporters group? Send us a message and we'll get back to you.
                </p>
              </div>

              <div className="mt-auto border-t border-border/30 pt-8">
                <p className="text-secondary font-semibold text-base mb-1">Reach us directly</p>
                <div className="space-y-1 text-[#888] text-sm">
                  <p>
                    Email: <a className="underline hover:text-primary transition-colors" href="mailto:response@wingmanpro.tech">response@wingmanpro.tech</a>
                  </p>
                  <p>Timings: 10:00 to 19:00</p>
                  <p>For urgent issues, please reach out to your Sales POC.</p>
                </div>
                
                <div className="mt-6 flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1.5 rounded-[5px] border border-border bg-white text-secondary w-max">Response within 1 business day</span>
                  <span className="px-3 py-1.5 rounded-[5px] border border-border bg-white text-secondary w-max">Priority support for Wingman Pro</span>
                </div>
              </div>
            </FadeIn>

            {/* Right — form */}
            <FadeIn>
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center h-full">
                  <div className="w-16 h-16 rounded-full bg-secondary-purple text-primary flex items-center justify-center text-3xl">✓</div>
                  <p className="text-background font-bold text-xl">Thanks! We'll be in touch shortly.</p>
                  <Button
                    variant="outline"
                    className="border-0 bg-primary rounded-[5px] text-xs font-medium uppercase tracking-wide text-white hover:text-white"
                    onClick={() => setSubmitted(false)}
                  >
                    Submit another
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 bg-secondary-purple/50 p-4 rounded-[10px]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-secondary text-xs font-semibold">Full Name</label>
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full h-11 px-4 border rounded-[10px] text-xs placeholder-[#888] focus:outline-none focus:border-secondary bg-white"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-secondary text-xs font-semibold">Email</label>
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full h-11 px-4 border rounded-[10px] text-xs placeholder-[#888] focus:outline-none focus:border-secondary bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-secondary text-xs font-semibold">Topic</label>
                    <select
                      value={form.topic}
                      onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                      className="w-full h-11 px-4 border rounded-[10px] text-xs text-[#888] focus:outline-none focus:border-secondary appearance-none bg-white"
                    >
                      <option value="Product Support">Product Support</option>
                      <option value="Pricing & Billing">Pricing & Billing</option>
                      <option value="Partnerships/Affiliations">Partnerships/Affiliations</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-secondary text-xs font-semibold">Message</label>
                    <textarea
                      placeholder="How can we help?"
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 border rounded-[10px] text-xs text-[#888] placeholder-[#888] focus:outline-none focus:border-secondary resize-none bg-white"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-3 pt-1">
                    <Button
                      type="submit"
                      variant="secondary"
                      className="bg-secondary/40"
                    >
                      Send Message
                    </Button>
                  </div>
                </form>
              )}
            </FadeIn>
          </div>
        </div>
      </div>
      <SiteFooter />
      <ScrollToTop />
    </main>
  )
}


