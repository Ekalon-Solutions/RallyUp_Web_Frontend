"use client"

import React from "react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"
import { FadeIn } from "@/components/fade-in"
import { Button } from "@/components/ui/button"
import { ChevronDown, ArrowRight } from "lucide-react"
import Link from "next/link"
import { ContactForm } from "@/components/contact-form"

export default function ContactPage() {

  return (
    <main className="min-h-screen bg-white text-foreground relative overflow-x-hidden public-theme">
      <SiteNavbar />
      
      {/* Main Content */}
      <section className="bg-white py-16 md:py-20 lg:py-24" id="contact">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
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
          <ContactForm />
        </div>
      </div>
    </section>
      
      <SiteFooter />
      <ScrollToTop />
    </main>
  )
}


