import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Instagram, Youtube, X, Globe } from "lucide-react"

const linkColumns = [
  {
    title: "Navigation",
    links: [
      { label: "Discovery", href: "/discovery" },
      { label: "About Wingman", href: "/about" },
      { label: "Affiliations", href: "/affiliations" },
      { label: "Who are we?", href: "/who-are-we" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQs", href: "/faqs" },
      { label: "Contact Us", href: "/contact" },
      { label: "Data Deletion Form", href: "/data-deletion" },
      { label: "Partner Agreement", href: "/partner-agreement" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Refund Policy", href: "/refund" },
      { label: "Child Safety & CSAE", href: "/child-safety" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
]

const socials = [
  { label: "Instagram", href: "#", iconSrc: "/new-wingman/icons/instagram.svg" },
  { label: "YouTube", href: "#", iconSrc: "/new-wingman/icons/youtube.svg" },
  { label: "X", href: "#", iconSrc: "/new-wingman/icons/x.svg" },
]

export function SiteFooter({ brandName = "Wingman Pro" }: { brandName?: string } = {}) {
  return (
    <footer className="w-full bg-[#0A0A0F] md:bg-[#050505] border-t border-[#FFFFFF1F] md:border-t-0 pt-[2.5rem] pb-[3rem] md:pt-[5rem] md:pb-[5rem] mt-auto">

      {/* Container: 96rem (8xl) desktop width */}
      <div className="mx-auto w-full max-w-[71.875rem] md:max-w-[96rem] px-5 sm:px-8 flex flex-col">

        {/* Top: brand + link columns */}
        <div className="flex flex-col lg:flex-row justify-between gap-[1.75rem] md:gap-[3rem] mb-[1.75rem] md:mb-[4rem]">

          {/* Brand column */}
          <div className="flex flex-col w-full lg:w-[20.625rem] shrink-0">
            <div className="flex items-center gap-[0.625rem] md:gap-[0.75rem] mb-[1rem] md:mb-[1.5rem]">
              <Image
                src="/new-wingman/icons/logo.svg"
                alt={`${brandName} logo`}
                width={48}
                height={48}

                className="w-[2.25rem] h-[2.25rem] md:w-[3rem] md:h-[3rem]"
              />
              {/* Mobile: 18px (1.125rem) -> Desktop: 24px (1.5rem) */}
              <span className="font-['Anton',_sans-serif] font-normal text-[1.125rem] md:text-[1.5rem] leading-[1.15] tracking-[0.01em] text-[#F4F4EE] uppercase">
                {brandName}
              </span>
            </div>

            <p className="font-['Inter',_sans-serif] font-normal text-[0.875rem] leading-[1.5] text-[#BCCBB9] mb-[1rem] md:mb-[1.5rem]">
              The world&apos;s first AI-enhanced platform built for Supporter
              Groups and Sports Clubs. Powered by RallyUp Solutions.
            </p>

            <p className="font-['Inter',_sans-serif] font-normal text-[0.875rem] leading-[1.5] text-[#BCCBB9] mb-[1rem] md:mb-[1.5rem]">
              {brandName}©. Precision and Performance.
            </p>

            {/* Socials: Mobile and Desktop share the same 44px box and 24px icons now */}
            <div className="flex items-center gap-[0.5rem]">
              {socials.map(({ label, href, iconSrc }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex items-center justify-center w-[2.75rem] h-[2.75rem] border-[2px] border-[#F4F4EE3D] text-[#F4F4EE] hover:bg-white/10 transition-colors"
                >
                  <Image
                    src={iconSrc}
                    alt={`${label} icon`}
                    width={24}
                    height={24}
                    className="w-[1.5rem] h-[1.5rem] object-contain"
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-3 gap-x-[1.25rem] md:gap-x-[1.5rem] gap-y-[2.5rem] w-full lg:w-[50.625rem]">
            {linkColumns.map((col) => (
              <div key={col.title} className="flex flex-col">
                <h4 className="font-['Inter',_sans-serif] font-semibold text-[0.75rem] leading-[1.3] tracking-[0.06em] text-[#BCCBB9] uppercase mb-[1rem] md:mb-[1.5rem]">
                  {col.title}
                </h4>
                <nav className="flex flex-col gap-[0.75rem] md:gap-[1.5rem]">
                  {col.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="relative w-fit font-['Inter',_sans-serif] font-normal text-[0.75rem] md:text-[0.875rem] leading-[1.0625rem] md:leading-[1.5] text-[#BCCBB9] hover:text-[#F4F4EE] transition-colors after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-full after:bg-[#6CABDD] after:opacity-0 after:transition-opacity after:duration-300 after:ease-[cubic-bezier(0.7,-0.4,0.4,1.4)] hover:after:opacity-100"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: copyright (left) + language selector (right) */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-[1.25rem] md:gap-[1.5rem] pt-[1.25rem] md:pt-0 border-t border-[#FFFFFF1F] md:border-t-0">
          <p className="font-['Inter',_sans-serif] font-normal text-[0.875rem] leading-[1.5] text-[#BCCBB9]">
            © 2026 RallyUp Solutions Private Limited. All rights reserved.
          </p>

          <button
            type="button"
            className="flex items-center gap-[0.625rem] h-[2.75rem] px-[1rem] border-[2px] border-[#F4F4EE3D] bg-transparent font-['Inter',_sans-serif] font-normal text-[0.875rem] leading-[1.5] text-[#F4F4EE] hover:bg-white/10 transition-colors"
          >
            <Image
              src="/new-wingman/icons/footer-globe.svg"
              alt="Globe"
              width={24}
              height={24}
              className="w-[1.5rem] h-[1.5rem] object-contain"
            />
            English (India)
          </button>
        </div>

      </div>
    </footer>
  )
}