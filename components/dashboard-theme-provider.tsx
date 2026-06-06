"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function DashboardThemeProvider() {
  const pathname = usePathname()

  useEffect(() => {
    const html = document.documentElement
    if (pathname.startsWith("/dashboard")) {
      html.classList.add("dashboard-theme")
      html.classList.remove("public-page")
    } else if (pathname.startsWith("/merchandise")) {
      html.classList.add("dashboard-theme")
      html.classList.remove("public-page")
    } else if (pathname.startsWith("/clubs/")) {
      html.classList.remove("public-page", "dashboard-theme")
    } else {
      html.classList.add("public-page")
      html.classList.remove("dashboard-theme")
    }
    return () => {
      html.classList.remove("dashboard-theme", "public-page")
    }
  }, [pathname])

  return null
}
