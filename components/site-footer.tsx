"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { EkalonAttribution } from "@/components/ekalon-attribution"

type SiteFooterProps = {
  brandName?: string
}

export function SiteFooter({ brandName = "Wingman Pro" }: SiteFooterProps) {
  return (
    <footer className="border-t border-[#6668A1A1] bg-[#BED6F8] py-12 md:py-16 public-theme">
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 text-[#0D0D0D]">
        {/* Brand */}
        <div className="flex flex-col gap-4 col-span-2 md:col-span-1 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <div className="relative w-10 h-10">
              <Image
                src="/Logo.svg"
                alt="Wingman Pro logo"
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex flex-row text-sm font-bold uppercase tracking-wide">
                <span className="text-[#1761CA]">Wingman</span>
                <span className="text-primary ml-1">Pro</span>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-medium text-[#0D0D0D]/70 tracking-wider">Powered by RallyUp Solutions</span>
          <p className="text-sm leading-relaxed text-[#0D0D0D]/80">
            The world's first AI-enhanced platform built for Supporter Groups and Sports Clubs.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-semibold text-[#0D0D0D] uppercase tracking-widest">Navigation</h4>
          <nav className="flex flex-col gap-3 text-sm text-[#0D0D0D]/80">
            <Link href="/" className="hover:text-[#0D0D0D] transition-colors">Home</Link>
            <Link href="/features" className="hover:text-[#0D0D0D] transition-colors">Features</Link>
            <Link href="/affiliations" className="hover:text-[#0D0D0D] transition-colors">Affiliations</Link>
            <Link href="/about" className="hover:text-[#0D0D0D] transition-colors">About Us</Link>
            <Link href="/faqs" className="hover:text-[#0D0D0D] transition-colors">FAQs</Link>
          </nav>
        </div>

        {/* Legal */}
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-semibold text-[#0D0D0D] uppercase tracking-widest">Legal</h4>
          <nav className="flex flex-col gap-3 text-sm text-[#0D0D0D]/80">
            <Link href="/privacy" className="hover:text-[#0D0D0D] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#0D0D0D] transition-colors">Terms of Service</Link>
            <Link href="/refund" className="hover:text-[#0D0D0D] transition-colors">Refund Policy</Link>
            <Link href="/ppsa" className="hover:text-[#0D0D0D] transition-colors">Partner Agreement</Link>
            <Link href="/child-safety" className="hover:text-[#0D0D0D] transition-colors">Child Safety &amp; CSAE</Link>
            <Link href="/delete-account" className="hover:text-[#0D0D0D] transition-colors">Data Deletion Request</Link>
          </nav>
        </div>

        {/* Support */}
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-semibold text-[#0D0D0D] uppercase tracking-widest">Support</h4>
          <div className="flex flex-col gap-3 text-sm text-[#0D0D0D]/80">
            <Link href="/help" className="hover:text-[#0D0D0D] transition-colors">Help Center</Link>
            <Link href="/contact" className="hover:text-[#0D0D0D] transition-colors">Contact Us</Link>
            <a
              href="mailto:support@wingmanpro.tech"
              className="underline underline-offset-2 hover:text-[#0D0D0D] transition-colors"
            >
              support@wingmanpro.tech
            </a>
          </div>
        </div>

        {/* Follow */}
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-semibold text-[#0D0D0D] uppercase tracking-widest">Follow</h4>
          <div className="flex flex-col gap-3 text-sm text-[#0D0D0D]/80">
            <a href="https://x.com/wingmanpro" target="_blank" rel="noopener noreferrer" className="hover:text-[#0D0D0D] transition-colors">Twitter / X</a>
            <a href="https://linkedin.com/company/wingmanpro" target="_blank" rel="noopener noreferrer" className="hover:text-[#0D0D0D] transition-colors">LinkedIn</a>
            <a href="https://instagram.com/wingmanpro" target="_blank" rel="noopener noreferrer" className="hover:text-[#0D0D0D] transition-colors">Instagram</a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl mt-4 px-2 pt-4 border-t border-[#6668A1] flex flex-col items-center gap-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 w-full">
          <p className="text-sm text-[#0D0D0D] text-center md:text-left">
            © 2025 RallyUp Solutions Private Limited. All rights reserved.
          </p>
          {/* <p className="text-xs text-[#0D0D0D] uppercase tracking-widest">
            Proprietary Service of RallyUp Solutions Pvt. Ltd.
          </p> */}
        </div>
        {/* <EkalonAttribution className="text-center" /> */}
      </div>
    </footer>
  )
}
