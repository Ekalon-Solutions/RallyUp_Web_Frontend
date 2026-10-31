"use client"

import { useTheme } from "next-themes"
import { useEffect } from "react"

export function ThemeColorMeta() {
  const { theme, resolvedTheme } = useTheme()

  useEffect(() => {
    const currentTheme = resolvedTheme || theme || "light"
    
    const themeColor = currentTheme === "dark" ? "#0A0A0A" : "#F7F5F0"
    
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

