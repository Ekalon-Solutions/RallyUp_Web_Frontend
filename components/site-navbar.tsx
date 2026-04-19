"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Menu, X } from "lucide-react"
import { useTheme } from "next-themes"
import { LoginModal } from "@/components/login-modal"

type SiteNavbarProps = {
  brandName?: string
}

export function SiteNavbar({ brandName = "Wingman Pro" }: SiteNavbarProps) {
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <>
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      <header className="sticky top-0 z-50 bg-background border-b border-slate-200/60 dark:border-white/10 shadow-sm">
        <div className="mx-auto max-w-7xl px-2 py-4 flex items-center justify-between h-14 lg:h-20">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="relative w-12 h-12">
              <Image
                src="/Logo.svg"
                alt="Wingman Pro logo"
                fill
                className="object-contain"
                priority
              />
            </div>

            <div className="flex flex-row text-md lg:text-xl gap-1 font-bold uppercase">
              <span className="text-white">Wingman</span>
              <span className="text-primary">Pro</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-slate-700 dark:text-slate-200 font-bold text-sm uppercase tracking-wider">
            <Link href="/affiliations" className="text-white transition-all hover:-translate-y-0.5">Affiliations</Link>
            <Link href="/faqs" className="text-white transition-all hover:-translate-y-0.5">FAQs</Link>
            <Link href="/about" className="text-white transition-all hover:-translate-y-0.5">About Us</Link>
          </nav>

          <div className="flex items-center gap-5">
            <div className="hidden lg:flex items-center gap-4">
              <Button variant="outline" onClick={() => setLoginOpen(true)} className="font-bold text-sm uppercase tracking-wide">
                Log In
              </Button>
              <Button variant="outline" asChild className="h-11 px-6 border-2 font-bold text-sm uppercase tracking-wide active:scale-95">
                <Link href="/clubs">Browse Clubs</Link>
              </Button>
              <Button variant="default" asChild className="h-11 px-8 font-bold text-sm uppercase tracking-wide active:scale-95">
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
              <Link href="/affiliations" onClick={() => setMobileOpen(false)} className="text-xl font-bold hover:text-sky-600 transition-colors">Affiliations</Link>
              <Link href="/faqs" onClick={() => setMobileOpen(false)} className="text-xl font-bold hover:text-sky-600 transition-colors">FAQs</Link>
              <Link href="/about" onClick={() => setMobileOpen(false)} className="text-xl font-bold hover:text-sky-600 transition-colors">About Us</Link>

              <div className="border-t border-slate-200 dark:border-white/10 pt-10 flex flex-col gap-4">
                <Button variant="outline" onClick={() => setLoginOpen(true)} className="font-bold text-sm uppercase tracking-wide">
                  Log In
                </Button>
                <Button variant="outline" asChild className="h-11 px-6 border-2 font-bold text-sm uppercase tracking-wide transition-all active:scale-95">
                  <Link href="/clubs">Browse Clubs</Link>
                </Button>
                <Button variant="default" asChild className="h-11 px-8 font-bold text-sm uppercase tracking-wide transition-all active:scale-95">
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  )
}


