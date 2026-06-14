"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { EkalonAttribution } from "@/components/ekalon-attribution"
import {
  EKALON_URL,
  getPageSection,
  PAGE_SECTION_LABELS,
  pageHasDedicatedFooter,
} from "@/lib/pageContext"

const TITLE_STYLE = "color: #0ea5e9; font-size: 14px; font-weight: bold;"
const LINK_STYLE = "color: #38bdf8; font-size: 12px;"

export function EkalonBranding() {
  const pathname = usePathname() ?? "/"

  useEffect(() => {
    const section = getPageSection(pathname)
    const label = PAGE_SECTION_LABELS[section]

    console.log(`%cWingman Pro · ${label}`, TITLE_STYLE)
    console.log("%cDesigned and Developed by Ekalon Solutions", TITLE_STYLE)
    console.log(`%c${EKALON_URL}`, LINK_STYLE)
  }, [pathname])

  if (pageHasDedicatedFooter(pathname)) {
    return null
  }

  return (
    <div className="fixed bottom-3 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      {/* <div className="pointer-events-auto rounded-md bg-background/80 px-3 py-1.5 shadow-sm border border-border/60 backdrop-blur-sm">
        <EkalonAttribution className="text-center" />
      </div> */}
    </div>
  )
}
