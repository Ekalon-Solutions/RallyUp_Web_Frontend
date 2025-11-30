"use client"

import { useEffect, useRef } from "react"

export function JellyCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const followerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>()

  useEffect(() => {
    if (typeof window === "undefined") return

    const cursor = cursorRef.current
    const follower = followerRef.current
    if (!cursor || !follower) return

    // Only show on non-touch devices
    if (window.matchMedia("(pointer: coarse)").matches) {
      cursor.style.display = "none"
      follower.style.display = "none"
      return
    }

    let mouseX = 0
    let mouseY = 0
    let followerX = window.innerWidth / 2
    let followerY = window.innerHeight / 2

    const updateCursor = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY

      cursor.style.left = `${mouseX}px`
      cursor.style.top = `${mouseY}px`
    }

    const updateFollower = () => {
      const dx = mouseX - followerX
      const dy = mouseY - followerY

      followerX += dx * 0.15
      followerY += dy * 0.15

      follower.style.left = `${followerX}px`
      follower.style.top = `${followerY}px`

      rafRef.current = requestAnimationFrame(updateFollower)
    }

    const handleMouseMove = (e: MouseEvent) => {
      updateCursor(e)
    }

    const handleMouseEnter = () => {
      cursor.style.opacity = "1"
      follower.style.opacity = "1"
    }

    const handleMouseLeave = () => {
      cursor.style.opacity = "0"
      follower.style.opacity = "0"
    }

    const handleMouseDown = () => {
      cursor.style.transform = "translate(-50%, -50%) scale(0.8)"
      follower.style.transform = "translate(-50%, -50%) scale(1.2)"
    }

    const handleMouseUp = () => {
      cursor.style.transform = "translate(-50%, -50%) scale(1)"
      follower.style.transform = "translate(-50%, -50%) scale(1)"
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseenter", handleMouseEnter, true)
    document.addEventListener("mouseleave", handleMouseLeave, true)
    document.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("mouseup", handleMouseUp)

    updateFollower()

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseenter", handleMouseEnter, true)
      document.removeEventListener("mouseleave", handleMouseLeave, true)
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mouseup", handleMouseUp)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return (
    <>
      <div
        ref={cursorRef}
        className="fixed pointer-events-none z-[9999] w-4 h-4 rounded-full bg-sky-500/80 dark:bg-sky-400/80 mix-blend-difference transition-transform duration-200 ease-out"
        style={{
          transform: "translate(-50%, -50%)",
          opacity: 0,
        }}
      />
      <div
        ref={followerRef}
        className="fixed pointer-events-none z-[9998] w-8 h-8 rounded-full border-2 border-sky-500/40 dark:border-sky-400/40 transition-transform duration-300 ease-out"
        style={{
          transform: "translate(-50%, -50%)",
          opacity: 0,
        }}
      />
    </>
  )
}

