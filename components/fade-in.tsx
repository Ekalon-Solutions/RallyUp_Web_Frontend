"use client"

import React, { useEffect, useRef, useState } from "react"

type FadeInProps = {
  children: React.ReactNode
  className?: string
  delayMs?: number
}

export function FadeIn({ children, className = "", delayMs = 0 }: FadeInProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => setVisible(true), delayMs)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delayMs])

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 will-change-transform ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      {children}
    </div>
  )
}


