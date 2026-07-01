import type React from "react"

/**
 * Standalone layout — no sidebar, no admin chrome, no heavy global providers.
 *
 * This route group is intentionally minimal. The root app/layout.tsx already
 * provides ThemeProvider, AuthProvider, SocketWrapper, CartProvider, and
 * Toaster. Pages inside (standalone)/ inherit all of those through Next.js
 * layout composition, but they do NOT get the DashboardLayout chrome that
 * app/dashboard/layout.tsx adds.
 *
 * Individual pages should apply the `public-theme` CSS class on their
 * outermost wrapper to pick up the project's dark-mode public colour tokens
 * (defined in globals.css around the `.public-theme` selector).
 */
export default function StandaloneLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
