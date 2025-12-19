"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Menu, X } from "lucide-react"
import { useTheme } from "next-themes"

type SiteNavbarProps = {
  brandName?: string
}

export function SiteNavbar({ brandName = "Wingman Pro" }: SiteNavbarProps) {
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-slate-900/70 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/60 dark:border-white/10 shadow-sm">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between h-20">
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="relative h-11 w-11 md:h-12 md:w-12 overflow-hidden rounded-xl bg-white shadow-md border group-hover:scale-105 transition-transform duration-300">
            <Image
              src="/WingmanPro Logo (White BG).svg"
              alt="Wingman Pro logo"
              fill
              sizes="48px"
              className="object-contain p-2"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-black dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-200 transition-colors leading-none">
              {brandName}
            </span>
            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-[0.2em] mt-1.5 opacity-80">Platform</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-8 text-slate-700 dark:text-slate-200 font-bold text-sm uppercase tracking-wider">
          <Link href="/" className="hover:text-sky-600 dark:hover:text-sky-400 transition-all hover:-translate-y-0.5">Wingman Pro</Link>
          <Link href="/affiliations" className="hover:text-sky-600 dark:hover:text-sky-400 transition-all hover:-translate-y-0.5">Affiliations</Link>
          <Link href="/faqs" className="hover:text-sky-600 dark:hover:text-sky-400 transition-all hover:-translate-y-0.5">FAQs</Link>
          <Link href="/about" className="hover:text-sky-600 dark:hover:text-sky-400 transition-all hover:-translate-y-0.5">About Us</Link>
        </nav>

        <div className="flex items-center gap-5">
          <div className="hidden lg:flex items-center gap-4">
            <Button variant="ghost" asChild className="font-bold text-sm uppercase tracking-wide hover:bg-slate-100 dark:hover:bg-white/5">
              <Link href="/login">Log In</Link>
            </Button>
            <Button variant="outline" asChild className="h-11 px-6 border-2 font-bold text-sm uppercase tracking-wide shadow-sm hover:shadow-md transition-all active:scale-95">
              <Link href="/clubs">Browse Clubs</Link>
            </Button>
            <Button asChild className="h-11 px-8 bg-sky-600 text-white hover:bg-sky-500 dark:bg-sky-500 dark:text-slate-900 dark:hover:bg-sky-400 font-bold text-sm uppercase tracking-wide shadow-lg shadow-sky-500/20 transition-all active:scale-95">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              className="text-slate-700 dark:text-slate-200 h-11 w-11 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-6 w-6 dark:hidden" />
              <Moon className="h-6 w-6 hidden dark:block" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Menu"
              className="lg:hidden text-slate-900 dark:text-white h-11 w-11 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </Button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 animate-slide-up shadow-2xl">
          <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col gap-6 text-slate-900 dark:text-white">
            <Link href="/" onClick={() => setMobileOpen(false)} className="text-xl font-bold hover:text-sky-600 transition-colors">Wingman Pro</Link>
            <Link href="/affiliations" onClick={() => setMobileOpen(false)} className="text-xl font-bold hover:text-sky-600 transition-colors">Affiliations</Link>
            <Link href="/faqs" onClick={() => setMobileOpen(false)} className="text-xl font-bold hover:text-sky-600 transition-colors">FAQs</Link>
            <Link href="/about" onClick={() => setMobileOpen(false)} className="text-xl font-bold hover:text-sky-600 transition-colors">About Us</Link>
            
            <div className="border-t border-slate-200 dark:border-white/10 pt-10 flex flex-col gap-4">
              <Button variant="outline" asChild className="w-full h-14 justify-center text-lg font-bold border-2 rounded-2xl">
                <Link href="/login" onClick={() => setMobileOpen(false)}>Log In</Link>
              </Button>
              <Button variant="outline" asChild className="w-full h-14 justify-center text-lg font-bold border-2 rounded-2xl">
                <Link href="/clubs" onClick={() => setMobileOpen(false)}>Browse Clubs</Link>
              </Button>
              <Button asChild className="w-full h-14 justify-center bg-sky-600 text-white hover:bg-sky-500 text-lg font-bold shadow-xl shadow-sky-500/20 rounded-2xl">
                <Link href="/contact" onClick={() => setMobileOpen(false)}>Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}


