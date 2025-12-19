"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"

type SiteFooterProps = {
  brandName?: string
}

export function SiteFooter({ brandName = "Wingman Pro" }: SiteFooterProps) {
  return (
    <footer className="border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/90 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-slate-600 dark:text-slate-300">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3.5">
            <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-white shadow-md border">
              <Image
                src="/WingmanPro Logo (White BG).svg"
                alt="Wingman Pro logo"
                fill
                sizes="44px"
                className="object-contain p-2"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-slate-900 dark:text-white leading-none">{brandName}</span>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 mt-1 uppercase tracking-wider">Powered by RallyUp</span>
            </div>
          </div>
          <p className="text-base leading-relaxed font-medium">
            The world's first AI-enhanced platform built exclusively for Supporter Groups and Sports Clubs.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Navigation</h4>
          <nav className="flex flex-col gap-4 text-base font-bold">
            <Link href="/" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">Home</Link>
            <Link href="/about" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">About Us</Link>
            <Link href="/affiliations" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">Affiliations</Link>
            <Link href="/faqs" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">FAQs</Link>
          </nav>
        </div>

        <div className="flex flex-col gap-6">
          <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Legal</h4>
          <nav className="flex flex-col gap-4 text-base font-bold">
            <Link href="/privacy" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">Terms of Service</Link>
          </nav>
        </div>

        <div className="flex flex-col gap-6">
          <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Support</h4>
          <div className="flex flex-col gap-4">
            <p className="text-base font-medium">Need help? Contact our strategy team.</p>
            <a href="mailto:support@wingmanpro.tech" className="text-lg font-black text-sky-600 dark:text-sky-400 hover:text-sky-500 transition-colors">
              support@wingmanpro.tech
            </a>
          </div>
        </div>
      </div>
      
      <div className="mx-auto max-w-7xl px-6 mt-16 pt-8 border-t border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 text-center md:text-left">
          © 2025 RallyUp Solutions Private Limited. All rights reserved.
        </p>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Proprietary Service of RallyUp Solutions Pvt. Ltd.
        </p>
      </div>
    </footer>
  )
}


