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
        <div className="mx-auto px-2 py-4 flex items-center justify-between h-14 lg:h-20">
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
                className="hidden text-slate-700 dark:text-slate-200 h-11 w-11 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10"
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
          <div className="fixed inset-0 z-[100] flex justify-end lg:hidden transition-opacity">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />

            {/* Sidebar */}
            <div className="relative w-[340px] max-w-[85vw] h-full flex flex-col justify-center px-10 animate-slide-up pointer-events-auto overflow-hidden">

              {/* Background Shape */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Main block */}
                <div className="absolute top-[80px] left-0 right-0 bottom-0 bg-background rounded-tl-[32px]" />
                {/* Top-right block */}
                <div className="absolute top-0 right-0 w-[90px] h-[80px] bg-background rounded-t-[48px]" />
                {/* Perfect SVG Fillet Connection */}
                <svg className="absolute top-[40px] right-[90px] w-[40px] h-[40px]" viewBox="0 0 40 40">
                  <path d="M 0 40 C 22.09 40 40 22.09 40 0 L 40 40 Z" className="fill-background" />
                </svg>
              </div>

              {/* Close / Menu Button area */}
              <div className="absolute top-[16px] right-[20px] z-10">
                <Button
                  variant="ghost"
                  className="w-12 h-12 p-0 text-white hover:bg-white/10 rounded-full bg-white/5 flex items-center justify-center transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <Menu className="w-6 h-6" strokeWidth={2.5} />
                </Button>
              </div>

              {/* Nav Links & Buttons */}
              <div className="relative z-10 flex flex-col text-center text-white pb-8 h-full justify-between">

                <div className="flex flex-col gap-10 font-extrabold tracking-widest text-[15px] mt-32">
                  <Link href="/#features" onClick={() => setMobileOpen(false)} className="hover:text-primary transition-colors">FEATURES</Link>
                  <Link href="/affiliations" onClick={() => setMobileOpen(false)} className="hover:text-primary transition-colors">AFFILIATIONS</Link>
                  <Link href="/pricing" onClick={() => setMobileOpen(false)} className="hover:text-primary transition-colors">PRICING</Link>
                  <Link href="/about" onClick={() => setMobileOpen(false)} className="hover:text-primary transition-colors">ABOUT</Link>
                  <Link href="/faqs" onClick={() => setMobileOpen(false)} className="hover:text-primary transition-colors">FAQS</Link>
                </div>

                <div className="flex flex-col gap-4 mt-auto pt-10">
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
              </div>

            </div>
          </div>
        )}
      </header>
    </>
  )
}


