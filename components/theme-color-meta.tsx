"use client"

import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

export function ThemeColorMeta() {
  const { theme, resolvedTheme } = useTheme()
  const pathname = usePathname()

  useEffect(() => {
    const currentTheme = resolvedTheme || theme || "light"
    
    const dark = currentTheme === "dark"
    // Public marketing pages keep their original colours; inner pages use the site canvas.
    const isPublic = document.documentElement.classList.contains("public-page")
    const themeColor = isPublic ? (dark ? "#0f172a" : "#0ea5e9") : dark ? "#0A0A0A" : "#F7F5F0"
    
    let metaThemeColor = document.querySelector('meta[name="theme-color"]')
    
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta")
      metaThemeColor.setAttribute("name", "theme-color")
      document.head.appendChild(metaThemeColor)
    }
    
    metaThemeColor.setAttribute("content", themeColor)
  }, [theme, resolvedTheme, pathname])

  return null
}

