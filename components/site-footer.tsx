"use client"

import React from "react"
import Link from "next/link"
import { Shield } from "lucide-react"

type SiteFooterProps = {
  brandName?: string
}

export function SiteFooter({ brandName = "Wingman Pro" }: SiteFooterProps) {
  return (
    <footer className="border-t border-white/10 bg-slate-900/80">
      <div className="mx-auto max-w-7xl px-4 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-slate-300">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-sky-200 to-blue-300 flex items-center justify-center">
            <Shield className="h-4 w-4 text-slate-900" />
          </div>
          <span className="text-white font-semibold">{brandName}</span>
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


