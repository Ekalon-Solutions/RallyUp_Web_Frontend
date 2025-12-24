"use client"

import { useTheme } from "next-themes"
import { useEffect } from "react"

export function ThemeColorMeta() {
  const { theme, resolvedTheme } = useTheme()

  useEffect(() => {
    const currentTheme = resolvedTheme || theme || "light"
    
    const themeColor = currentTheme === "dark" ? "#0f172a" : "#0ea5e9"
    
    let metaThemeColor = document.querySelector('meta[name="theme-color"]')
    
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta")
      metaThemeColor.setAttribute("name", "theme-color")
      document.head.appendChild(metaThemeColor)
    }
    
    metaThemeColor.setAttribute("content", themeColor)
  }, [theme, resolvedTheme])

  return null
}

