"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Download, Save } from "lucide-react"
import { apiClient } from "@/lib/api"
import { triggerBlobDownload } from "@/lib/utils"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const BASE = "/amsc-address-campaign"

type Summary = {
  totalMembers: number; withAddress: number; missingAddress: number; initialEmailsSent: number
  addressUpdated: number; pendingUpdates: number; firstRemindersSent: number; finalRemindersSent: number; merchRemindersSent?: number; failedEmails: number
}
type Row = {
  memberId: string; name: string; email: string; address: string; addressStatus: string
  initialEmail: string; addressUpdatedAt: string | null; firstReminder: string; finalReminder: string; merchReminder?: string
}
type SavedReport = { _id: string; createdAt: string; trigger: string; summary: Summary }

const FILTERS = [
  { value: "all", label: "All members" },
  { value: "updated", label: "Address Updated" },
  { value: "missing", label: "Address Missing" },
  { value: "initial_sent", label: "Initial Email Sent" },
  { value: "reminder_pending", label: "Reminder Pending" },
  { value: "final_pending", label: "Final Reminder Pending" },
  { value: "merch_sent", label: "Delivery-Address Reminder Sent" },
  { value: "merch_pending", label: "Delivery-Address Reminder Pending" },
]

const TILES: Array<[keyof Summary, string]> = [
  ["totalMembers", "Registered members"], ["withAddress", "With address"], ["missingAddress", "Missing address"],
  ["initialEmailsSent", "Initial emails sent"], ["addressUpdated", "Updated after campaign"], ["pendingUpdates", "Pending updates"],
  ["firstRemindersSent", "First reminders sent"], ["finalRemindersSent", "Final reminders sent"], ["merchRemindersSent", "Delivery-address reminders sent"],
]

export default function AmscAddressCampaignReportPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [saved, setSaved] = useState<SavedReport[]>([])
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const params = filter === "all" ? undefined : { filter }
    const [s, m, r] = await Promise.all([
      apiClient.get<Summary>(`${BASE}/summary`),
      apiClient.get<Row[]>(`${BASE}/members`, { params }),
      apiClient.get<SavedReport[]>(`${BASE}/reports`),
    ])
    if (s.success && s.data) setSummary(s.data); else toast.error("Could not load summary")
    if (m.success && Array.isArray(m.data)) setRows(m.data)
    if (r.success && Array.isArray(r.data)) setSaved(r.data)
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  const exportCsv = async (endpoint: string, params?: Record<string, string>, fallback = "amsc-addresses.csv") => {
    const res = await apiClient.downloadFile(endpoint, { params })
    if (!res.success || !res.blob) return toast.error(res.error || "Export failed")
    triggerBlobDownload(res.blob, res.filename ?? fallback)
  }

  const saveSnapshot = async () => {
    const res = await apiClient.post(`${BASE}/reports`, {})
    if (res.success) { toast.success("Report saved"); load() } else toast.error("Could not save report")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">AMSC 2026–27 Address Campaign</h1>
            <p className="text-muted-foreground mt-1">Address collection status for the Arsenal Mumbai chapter. Restricted data.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={saveSnapshot}><Save className="w-4 h-4 mr-2" />Save report</Button>
            <Button onClick={() => exportCsv(`${BASE}/export.csv`, filter === "all" ? undefined : { filter })}>
              <Download className="w-4 h-4 mr-2" />Export CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {TILES.map(([key, label]) => (
            <Card key={key}><CardContent className="p-4">
              <div className="text-2xl font-black">{summary ? (summary[key] ?? 0) : "–"}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </CardContent></Card>
          ))}
        </div>
        {summary && summary.failedEmails > 0 && (
          <Badge variant="destructive">{summary.failedEmails} member(s) with failed emails</Badge>
        )}

        <div className="max-w-xs">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{FILTERS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <Card><CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b">
              <tr>{["Member", "Email", "Address Status", "Latest Address", "Initial Email", "First Reminder", "Final Reminder", "Delivery-Address Reminder"].map((h) => <th key={h} className="p-3 whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td className="p-6 text-center" colSpan={8}>Loading…</td></tr>
                : rows.length === 0 ? <tr><td className="p-6 text-center" colSpan={8}>No members match this filter</td></tr>
                : rows.map((r) => (
                  <tr key={r.memberId} className="border-b last:border-0 align-top">
                    <td className="p-3 font-medium whitespace-nowrap">{r.name}</td>
                    <td className="p-3">{r.email}</td>
                    <td className="p-3 whitespace-nowrap"><Badge variant={r.addressStatus === "Address Missing" ? "destructive" : "secondary"}>{r.addressStatus}</Badge></td>
                    <td className="p-3 min-w-[240px]">{r.address || "—"}</td>
                    <td className="p-3">{r.initialEmail}</td>
                    <td className="p-3">{r.firstReminder}</td>
                    <td className="p-3">{r.finalReminder}</td>
                    <td className="p-3">{r.merchReminder ?? "—"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </CardContent></Card>

        <div className="space-y-2">
          <h2 className="text-lg font-bold">Saved reports</h2>
          {saved.length === 0 ? <p className="text-sm text-muted-foreground">None yet. Reports are also saved automatically after each send.</p>
            : saved.map((r) => (
              <div key={r._id} className="flex items-center justify-between border rounded-lg p-3 text-sm">
                <span>{new Date(r.createdAt).toLocaleString()} · {r.trigger} · {r.summary.totalMembers} members, {r.summary.missingAddress} missing</span>
                <Button size="sm" variant="outline" onClick={() => exportCsv(`${BASE}/reports/${r._id}/export.csv`, undefined, `amsc-report-${r._id}.csv`)}>CSV</Button>
              </div>
            ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
