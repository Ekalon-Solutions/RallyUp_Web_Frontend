"use client"

import { useEffect } from 'react'
import { useClubSettings } from './useClubSettings'

function hexToHSL(hex: string): string {
  hex = hex.replace(/^#/, '')
  
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  
  h = Math.round(h * 360)
  s = Math.round(s * 100)
  const lightness = Math.round(l * 100)
  
  return `${h} ${s}% ${lightness}%`
}

export function useDesignSettings(clubId?: string) {
  const { settings } = useClubSettings(clubId)

  useEffect(() => {
    if (settings) {
      const actualData = (settings as any).data || settings
      const designSettings = actualData.designSettings

      if (designSettings) {
        if (designSettings.primaryColor) {
          const primaryHSL = hexToHSL(designSettings.primaryColor)
          document.documentElement.style.setProperty('--primary', primaryHSL)
        }

        if (designSettings.secondaryColor) {
          const secondaryHSL = hexToHSL(designSettings.secondaryColor)
          document.documentElement.style.setProperty('--secondary', secondaryHSL)
        }

        if (designSettings.fontFamily) {
          document.documentElement.style.setProperty('--font-sans', designSettings.fontFamily)
          document.body.style.fontFamily = designSettings.fontFamily
        }
      }
    }
  }, [settings])

  return { settings }
}
