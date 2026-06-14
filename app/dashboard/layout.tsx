import type React from "react"
import { DashboardLayout } from "@/components/dashboard-layout"

// Render the dashboard chrome (sidebar + header) once here so it persists across
// client-side navigation between /dashboard/* pages. Pages that still wrap their
// content in <DashboardLayout> render as pass-throughs (see DashboardChromeContext),
// so the sidebar no longer unmounts/remounts (and re-fetches) on every route change.
export default function DashboardLayout_Persistent({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
