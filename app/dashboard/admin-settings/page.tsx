import { Suspense } from "react"
import AdminSettingsClient from "./AdminSettingsClient"

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading settings…</div>}>
      <AdminSettingsClient />
    </Suspense>
  )
}
