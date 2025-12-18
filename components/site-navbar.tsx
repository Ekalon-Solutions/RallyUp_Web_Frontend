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
    <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-slate-900/60 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-10 w-10 md:h-11 md:w-11 overflow-hidden rounded-lg bg-white shadow">
            <Image
              src="/WingmanPro Logo (White BG).svg"
              alt="Wingman Pro logo"
              fill
              sizes="44px"
              className="object-contain p-1.5"
              priority
            />
          </div>
          <span className="h-10 flex items-center font-semibold text-slate-900 dark:text-white tracking-tight group-hover:text-sky-600 dark:group-hover:text-sky-200 transition-colors">
            {brandName}
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-slate-700 dark:text-slate-200">
          <Link href="/" className="h-10 flex items-center hover:text-slate-900 dark:hover:text-white transition-colors">Wingman Pro</Link>
          <Link href="/affiliations" className="h-10 flex items-center hover:text-slate-900 dark:hover:text-white transition-colors">Affiliations</Link>
          <Link href="/faqs" className="h-10 flex items-center hover:text-slate-900 dark:hover:text-white transition-colors">FAQs</Link>
          <Link href="/about" className="h-10 flex items-center hover:text-slate-900 dark:hover:text-white transition-colors">About Us</Link>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-3">
            <Button variant="outline" asChild className="border-slate-300 dark:border-white/20 bg-white text-slate-900 hover:bg-slate-100 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
              <Link href="/login">Log In</Link>
            </Button>
            <Button variant="outline" asChild className="border-slate-300 dark:border-white/20 bg-white text-slate-900 hover:bg-slate-100 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
              <Link href="/clubs">Browse Clubs</Link>
            </Button>
            <Button asChild className="bg-sky-500 text-white hover:bg-sky-400 dark:bg-sky-400 dark:text-slate-900 dark:hover:bg-sky-300">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              className="text-slate-700 dark:text-slate-200"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 dark:hidden" />
              <Moon className="h-5 w-5 hidden dark:block" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Menu"
              className="lg:hidden text-slate-700 dark:text-slate-200"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col gap-4 text-slate-700 dark:text-slate-200">
            <Link href="/" onClick={() => setMobileOpen(false)} className="hover:text-slate-900 dark:hover:text-white font-medium">Wingman Pro</Link>
            <Link href="/affiliations" onClick={() => setMobileOpen(false)} className="hover:text-slate-900 dark:hover:text-white font-medium">Affiliations</Link>
            <Link href="/faqs" onClick={() => setMobileOpen(false)} className="hover:text-slate-900 dark:hover:text-white font-medium">FAQs</Link>
            <Link href="/about" onClick={() => setMobileOpen(false)} className="hover:text-slate-900 dark:hover:text-white font-medium">About Us</Link>
            
            <div className="border-t border-slate-200 dark:border-white/10 pt-6 flex flex-col gap-3">
              <Button variant="outline" asChild className="w-full justify-center border-slate-300 dark:border-white/20 bg-white text-slate-900 hover:bg-slate-100 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                <Link href="/login" onClick={() => setMobileOpen(false)}>Log In</Link>
              </Button>
              <Button variant="outline" asChild className="w-full justify-center border-slate-300 dark:border-white/20 bg-white text-slate-900 hover:bg-slate-100 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                <Link href="/clubs" onClick={() => setMobileOpen(false)}>Browse Clubs</Link>
              </Button>
              <Button asChild className="w-full justify-center bg-sky-500 text-white hover:bg-sky-400 dark:bg-sky-400 dark:text-slate-900 dark:hover:bg-sky-300">
                <Link href="/contact" onClick={() => setMobileOpen(false)}>Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}


