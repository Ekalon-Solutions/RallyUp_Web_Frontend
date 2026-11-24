"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import Button from "@/components/landing/button"
import { useTheme } from "next-themes"
import { getSafeRedirectPath } from "@/components/login-modal"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import {
  Search,
  Menu,
  X,
  Compass,
  Info,
  Handshake,
  HelpCircle,
  Mail,
  Play,
  Smartphone,
} from "lucide-react"
import SvgIcon from "./svg-icon"
import LoginModal from "./modals/login-modal"

type SiteNavbarProps = {
  brandName?: string
}

// First three = desktop nav links (hrefs unchanged). All five = mobile drawer.
const navLinks = [
  { label: "Discovery", href: "/discovery", iconSrc: "/new-wingman/icons/compass.svg", underline: true },
  { label: "About Wingman", href: "/discovery", iconSrc: "/new-wingman/icons/info.svg", underline: true },
  { label: "Affiliations", href: "/discovery", iconSrc: "/new-wingman/icons/handshake.svg", underline: true },
  { label: "FAQs", href: "/faqs", iconSrc: "/new-wingman/icons/help-circle.svg" },
  { label: "Contact Us", href: "/contact", iconSrc: "/new-wingman/icons/mail.svg" },
]
const desktopLinks = navLinks.slice(0, 3)

export function SiteNavbar({ brandName = "Wingman Pro" }: SiteNavbarProps) {
  const { theme, setTheme } = useTheme()
  const { isAuthenticated, user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)


  const activeIndex = navLinks.findIndex((l) => l.href === pathname)

  useEffect(() => {
    if (isLoading) return
    if (typeof window === "undefined") return
    const redirect = getSafeRedirectPath()
    if (!redirect) return
    if (isAuthenticated) {
      router.replace(redirect)
      return
    }
    setLoginOpen(true)
  }, [isAuthenticated, isLoading, router])

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // While drawer is open: lock page scroll, close on Escape, close when the
  // screen grows to desktop size (drawer is hidden from 768px upwards).
  useEffect(() => {
    if (!mobileOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false)
    }
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("resize", onResize)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("resize", onResize)
    }
  }, [mobileOpen])

  const handleLoginClick = () => {
    if (isAuthenticated && user) {
      const userAny = user as any
      const isAdmin = userAny.role === 'admin' || userAny.role === 'super_admin'
      const adminHasClub = !!(userAny.club?._id || userAny.club)

      if (isAdmin && adminHasClub) {
        router.push('/splash')
        return
      }

      const memberships = userAny.memberships || []
      const activeMemberships = memberships.filter((m: any) => m.status === 'active')
      const uniqueClubIds = new Set<string>()
      activeMemberships.forEach((membership: any) => {
        const clubId = membership.club_id?._id || membership.club_id
        if (clubId) uniqueClubIds.add(clubId)
      })
      const redirectPath = uniqueClubIds.size > 1 ? "/splash" : "/dashboard"
      router.push(redirectPath)
      return
    }

    if (!isLoading) {
      setLoginOpen(true)
    }
  }

  return (
    <>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      <header className="sticky top-0 z-50 bg-[#050505] md:bg-[hsl(var(--header-bg))] border-b border-white/10 shadow-sm">

        {/* ===================== MOBILE BAR (< 768px) ===================== */}
        {/* Updated grid to 3.75rem columns so the center brand stays perfectly aligned with the 60px right logo */}
        <div className="md:hidden grid grid-cols-[3.75rem_1fr_3.75rem] items-center h-16 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex items-center justify-start h-full w-full hover:opacity-80 transition-opacity"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-drawer"
          >
            {/* Exact 18x12 hamburger menu size */}
            <SvgIcon
              src="/new-wingman/icons/hamburger.svg"
              className="w-[1.125rem] h-[0.75rem] bg-white inline-block"
            />
          </button>

          <Link href="/" className="justify-self-center min-w-0">
            {/* Mobile Specs: SF Pro, Heavy (860), 28px, -1.4px spacing, #A8E8FF */}
            <span className="block whitespace-nowrap font-['SF_Pro',_sans-serif] font-[860] text-[1.75rem] leading-[2.25rem] tracking-[-0.0875rem] text-[#A8E8FF] pt-1 pb-2">
              {brandName}
            </span>
          </Link>

          {/* Mobile Specs: 60x60 logo size */}
          <Link href="/" className="relative justify-self-end w-[3.75rem] h-[3.75rem]" aria-label="Home">
            <Image
              src="/new-wingman/icons/logo.svg"
              alt="Wingman Pro logo"
              fill
              className="object-contain"
              priority
            />
          </Link>
        </div>

        {/* ============ DESKTOP BAR (>= 768px) (UNCHANGED) ============ */}
        <div className="hidden md:flex mx-auto px-5 items-center justify-between h-20 gap-4 border-b border-white backdrop-blur-[1.5rem]">
          <div
            className="flex flex-1 items-center justify-start min-w-0"
            style={{ "--brand": "clamp(1.625rem, 3vw, 2rem)" } as React.CSSProperties}
          >
            <Link href="/" className="flex items-center  group min-w-0">
              <div className="relative shrink-0 w-[calc(var(--brand)*1.85)] h-[calc(var(--brand)*2.0)] top-[calc(var(--brand)*0.01)]">
                <Image
                  src="/new-wingman/icons/logo.svg"
                  alt="Wingman Pro logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-row items-center gap-1 whitespace-nowrap font-sf text-[length:var(--brand)] leading-[1.25] tracking-[-0.05em] font-normal pr-1">
                <span className="text-wingman-primary-text">Wingman</span>
                <span className="text-wingman-primary-text">Pro</span>
              </div>
            </Link>
          </div>

          <nav className="flex shrink-0 items-center justify-center gap-8 whitespace-nowrap font-['SF_Compact',_sans-serif] font-[457] text-[max(0.875rem,14px)] leading-[1.25rem] tracking-[0rem]">
            {desktopLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-wingman-secondary-text transition-all hover:text-white hover:-translate-y-0.5 hover:underline decoration-2 decoration-white hover:underline-offset-8"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-4">
            <div className="group relative hidden lg:block w-[15rem] xl:w-[20.8125rem] h-[3rem] xl:h-[3.375rem]">
              <Search className="absolute left-[1.25rem] top-1/2 -translate-y-1/2 text-[#859398] w-[0.9375rem] h-[0.9375rem]" />
              <input
                type="text"
                placeholder="Search events..."
                className="w-full h-full bg-white/5 border border-white/10 rounded-[9999px] pl-[2.875rem] pr-5 font-['SF_Compact',_sans-serif] font-[457] text-[max(0.875rem,14px)] leading-[100%] tracking-[0rem] text-white placeholder:text-[#859398] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[9999px] p-[2.1px] opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100 bg-[linear-gradient(90deg,rgba(168,232,255,0.12)_42.31%,rgba(157,5,255,0.12)_100%)] [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude] [-webkit-mask-composite:xor]"
              />
            </div>

            <Button
              variant="primary"
              onClick={handleLoginClick}
              className="
    h-[2.25rem] min-w-[9.0625rem] shrink-0 whitespace-nowrap px-[1.5rem] py-[0.5rem]
    !font-sf-compact !text-[max(0.875rem,14px)] !font-[656] !leading-[1.25rem] !text-white
  "
            >
              Login/Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* ==================== SLIDE-IN DRAWER (< 768px) ==================== */}
      <div
        id="mobile-drawer"
        className={`fixed inset-0 z-[60] md:hidden ${mobileOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!mobileOpen}
      >
        {/* Overlay */}
        <div
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-black/70 transition-opacity duration-300 ${mobileOpen ? "opacity-100" : "opacity-0"}`}
        />

        {/* Drawer Panel: Specific backgrounds, blur, and border colors */}
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Main menu"
          className={`absolute left-0 top-0 h-full w-[85%] max-w-[20rem] bg-[#121212]/80 backdrop-blur-[24px] border-r border-[#FFFFFF1F] shadow-[0_0_1.25rem_0_#00D4FF26] flex flex-col overflow-y-auto overscroll-contain transition-transform duration-300 ease-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          {/* Brand row */}
          <div className="flex items-center justify-between h-[4.5rem] px-[1.25rem] shrink-0 border-b border-white/10">
            <Link href="/" className="flex items-center gap-[0.75rem]" onClick={() => setMobileOpen(false)}>
              {/* Icon container with flex centering */}
              <div className="relative flex items-center justify-center w-[2rem] h-[2rem]">
                <SvgIcon
                  src="/new-wingman/icons/hamburger.svg"
                  className="w-[1.25rem] h-[1.25rem] bg-[#A8E8FF] inline-block"
                />
              </div>
              {/* Drawer Title */}
              <span className="font-['SF_Pro',_sans-serif] font-[700] text-[1rem] leading-[1.5rem] tracking-[-0.05rem] text-[#A8E8FF] uppercase">
                {brandName}
              </span>
            </Link>

            {/* Cross button container */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center h-[2rem] w-[2rem] rounded-[9999px] bg-[#201F1F] hover:bg-[#2A2929] transition-colors"
              aria-label="Close menu"
            >
              {/* Cross Icon (14px) */}
              <SvgIcon
                src="/new-wingman/icons/close.svg"
                className="w-[0.875rem] h-[0.875rem] bg-[#A8E8FF] inline-block"
              />
            </button>
          </div>

          {/* Links */}
          <nav className="flex flex-col mt-[1.5rem] shrink-0">
            {navLinks.map(({ label, href, iconSrc, underline }, i) => {
              const active = i === activeIndex
              return (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center gap-[0.75rem] h-[3.5rem] px-[1.5rem] font-['SF_Pro',_sans-serif] text-[1rem] leading-[1.5rem] transition-colors border-l-[4px] ${active
                    ? "border-[#A8E8FF] bg-[#00D4FF]/10 text-[#A8E8FF] font-[700]"
                    : "border-transparent text-[#BBC9CF] font-[400] hover:bg-white/5"
                    } ${underline
                      ? "md:after:absolute md:after:bottom-0 md:after:left-0 md:after:h-[2px] md:after:w-full md:after:bg-[#6CABDD] md:after:opacity-0 md:after:transition-opacity md:after:duration-300 md:after:ease-in-out md:hover:after:opacity-100"
                      : ""
                    }`}
                >
                  <SvgIcon
                    src={iconSrc}
                    className={`w-[1.25rem] h-[1.25rem] shrink-0 inline-block ${active ? "bg-[#A8E8FF]" : "bg-[#BBC9CF]"
                      }`}
                  />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Bottom: app downloads + login */}
          <div className="mt-auto px-[1.5rem] pb-[3rem] pt-[1.5rem] shrink-0 flex flex-col">
            <p className="font-['SF_Compact',_sans-serif] font-[556] text-[0.75rem] leading-[1rem] tracking-[0.0375rem] text-[#BBC9CF] uppercase mb-[0.75rem]">
              Download our app
            </p>

            <div className="flex flex-col gap-[0.75rem]">
              <a
                href="#"
                className="flex items-center justify-center gap-[0.625rem] h-[2.875rem] rounded-[0.5rem] border border-[#FFFFFF1F] bg-[#050505] font-['SF_Compact',_sans-serif] font-[656] text-[0.875rem] leading-[1.25rem] text-[#E5E2E1] hover:bg-white/5 transition-colors"
              >
                <Play className="w-[1.25rem] h-[1.25rem] text-[#E5E2E1] fill-[#E5E2E1]" />
                Google Play Store
              </a>
              <a
                href="#"
                className="flex items-center justify-center gap-[0.625rem] h-[2.875rem] rounded-[0.5rem] border border-[#FFFFFF1F] bg-[#050505] font-['SF_Compact',_sans-serif] font-[656] text-[0.875rem] leading-[1.25rem] text-[#E5E2E1] hover:bg-white/5 transition-colors"
              >
                <Smartphone className="w-[1.25rem] h-[1.25rem] text-[#E5E2E1]" strokeWidth={1.75} />
                Apple App Store
              </a>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setMobileOpen(false)
                handleLoginClick()
              }}
              className="mx-auto mt-[2rem] h-[3.25rem] w-[13.125rem] uppercase !tracking-[0.04375rem]"
            >
              Log in / Sign up
            </Button>
          </div>
        </aside>
      </div>
    </>
  )
}