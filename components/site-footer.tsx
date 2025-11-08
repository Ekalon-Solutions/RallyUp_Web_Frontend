"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"

type SiteFooterProps = {
  brandName?: string
}

export function SiteFooter({ brandName = "Wingman Pro" }: SiteFooterProps) {
  return (
    <footer className="border-t border-white/10 bg-slate-900/80">
      <div className="mx-auto max-w-7xl px-4 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-slate-300">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-md bg-white">
              <Image
                src="/WingmanPro Logo (White BG).svg"
                alt="Wingman Pro logo"
                fill
                sizes="36px"
                className="object-contain p-1.5"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-white font-semibold">{brandName}</span>
              <span className="text-xs text-slate-400">Powered by RallyUp Solutions</span>
            </div>
          </div>
          <div className="relative h-6 w-48">
            <Image
              src="/RallyUpSolutions Logo (Transparent Background).svg"
              alt="RallyUp Solutions logo"
              fill
              sizes="192px"
              className="object-contain"
            />
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/" className="hover:text-white">Home</Link>
          <Link href="/about" className="hover:text-white">About Us</Link>
          <Link href="/affiliations" className="hover:text-white">Affiliations</Link>
          <Link href="/faqs" className="hover:text-white">FAQs</Link>
          <Link href="/contact" className="hover:text-white">Contact Us</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
        </nav>
      </div>
      <div className="px-4 py-4 text-center text-xs text-slate-400">©️ 2025 RallyUp Solutions Private Limited. All rights reserved. Wingman Pro is a proprietary service of RallyUp Solutions Pvt. Ltd.</div>
    </footer>
  )
}


