"use client"

import { usePathname } from "next/navigation"

function themeClassFor(pathname: string): "dashboard-theme" | "public-page" | "" {
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/merchandise")) return "dashboard-theme"
  if (pathname.startsWith("/clubs/")) return "" // club pages use their own inline club colors
  return "public-page"
}

export function DashboardThemeProvider() {
  const pathname = usePathname()

  // Apply the route's theme class during render (client only), NOT in a useEffect.
  // Effects run after paint, so an effect leaves the previous route's theme
  // (e.g. the dark/orange .public-page marketing theme) painted for a beat when
  // navigating onto a club page — the "old layout flashes then club colors" bug.
  if (typeof document !== "undefined") {
    const cls = themeClassFor(pathname)
    const html = document.documentElement
    html.classList.toggle("dashboard-theme", cls === "dashboard-theme")
    html.classList.toggle("public-page", cls === "public-page")
  }

  return null
}
