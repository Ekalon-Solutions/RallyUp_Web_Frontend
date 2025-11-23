"use client"

import { useEffect } from 'react'

export function AntiScrapingProtection() {
  useEffect(() => {
    const detectHeadless = () => {
      const checks = {
        webdriver: navigator.webdriver,
        chrome: !!(window as any).chrome,
        permissions: !!(navigator as any).permissions,
        plugins: navigator.plugins.length === 0,
        languages: navigator.languages.length === 0,
      }

      if (checks.webdriver) {
        console.warn('Automated browser detected')
      }
    }

    const detectDevTools = () => {
      const threshold = 160
      const widthThreshold = window.outerWidth - window.innerWidth > threshold
      const heightThreshold = window.outerHeight - window.innerHeight > threshold

      if (widthThreshold || heightThreshold) {
        console.warn('DevTools may be open')
      }
    }

    const disableRightClick = (e: MouseEvent) => {
    }

    const disableSelection = () => {
      document.body.style.userSelect = 'none'
      document.body.style.webkitUserSelect = 'none'
    }

    const obfuscateContent = () => {
      document.body.setAttribute('data-dynamic', 'true')
    }

    let requestCount = 0
    let lastRequestTime = Date.now()
    
    const monitorRequests = () => {
      const now = Date.now()
      const timeDiff = now - lastRequestTime
      
      if (timeDiff < 100) {
        requestCount++
        if (requestCount > 10) {
          console.warn('Rapid requests detected - possible scraping')
        }
      } else {
        requestCount = 0
      }
      
      lastRequestTime = now
    }

    const addHoneypot = () => {
      const honeypot = document.createElement('a')
      honeypot.href = '/api/honeypot'
      honeypot.style.display = 'none'
      honeypot.style.visibility = 'hidden'
      honeypot.setAttribute('aria-hidden', 'true')
      honeypot.textContent = 'Do not follow'
      document.body.appendChild(honeypot)
    }

    const generateFingerprint = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.textBaseline = 'top'
        ctx.font = '14px Arial'
        ctx.fillText('Browser fingerprint', 2, 2)
        const fingerprint = canvas.toDataURL()
        sessionStorage.setItem('fp', fingerprint.substring(0, 50))
      }
    }

    detectHeadless()
    detectDevTools()
    obfuscateContent()
    addHoneypot()
    generateFingerprint()

    const devToolsInterval = setInterval(detectDevTools, 1000)
    
    document.addEventListener('contextmenu', disableRightClick)
    
    return () => {
      clearInterval(devToolsInterval)
      document.removeEventListener('contextmenu', disableRightClick)
    }
  }, [])

  return null
}
