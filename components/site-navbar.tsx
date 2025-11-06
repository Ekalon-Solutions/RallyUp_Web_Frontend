"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, Sun, Moon, Menu, X } from "lucide-react"
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
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-300 to-blue-400 dark:from-sky-200 dark:to-blue-300 flex items-center justify-center shadow">
            <Shield className="h-5 w-5 text-white dark:text-slate-900" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-white tracking-tight group-hover:text-sky-600 dark:group-hover:text-sky-200 transition-colors">{brandName}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-slate-700 dark:text-slate-200">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Wingman Pro</Link>
          <Link href="/affiliations" className="hover:text-slate-900 dark:hover:text-white transition-colors">Affiliations</Link>
          <Link href="/faqs" className="hover:text-slate-900 dark:hover:text-white transition-colors">FAQs</Link>
          <Link href="/about" className="hover:text-slate-900 dark:hover:text-white transition-colors">About Us</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Menu"
            className="md:hidden text-slate-700 dark:text-slate-200"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
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
          <Link href="/login">
            <Button variant="outline" className="border-slate-300 dark:border-white/20 bg-white text-slate-900 hover:bg-slate-100 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">Log in</Button>
          </Link>
          <Link href="/contact">
            <Button className="bg-sky-500 text-white hover:bg-sky-400 dark:bg-sky-400 dark:text-slate-900 dark:hover:bg-sky-300">Contact Us</Button>
          </Link>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-4 grid gap-3 text-slate-700 dark:text-slate-200">
            <Link href="/" onClick={() => setMobileOpen(false)} className="hover:text-slate-900 dark:hover:text-white">Wingman</Link>
            <Link href="/" onClick={() => setMobileOpen(false)} className="hover:text-slate-900 dark:hover:text-white">Wingman Pro</Link>
            <Link href="/affiliations" onClick={() => setMobileOpen(false)} className="hover:text-slate-900 dark:hover:text-white">Affiliations</Link>
            <Link href="/faqs" onClick={() => setMobileOpen(false)} className="hover:text-slate-900 dark:hover:text-white">FAQs</Link>
            <Link href="/about" onClick={() => setMobileOpen(false)} className="hover:text-slate-900 dark:hover:text-white">About Us</Link>
          </div>
        </div>
      )}
    </header>
  )
}


