"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import {
  apiClient,
  WhatsAppOptInLogEntry,
  WhatsAppOptInCurrentStatus,
  WhatsAppServiceEmailEntry,
} from "@/lib/api"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Download, Search, ShieldAlert, Activity, Lock, Mail, MailOpen } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"

const ACTION_LABELS: Record<string, { label: string; cls: string }> = {
  enabled: { label: "Enabled", cls: "bg-green-100 text-green-800" },
  re_enabled: { label: "Re-enabled", cls: "bg-green-100 text-green-800" },
  disabled: { label: "Disabled", cls: "bg-amber-100 text-amber-800" },
  system_override_disabled: { label: "System Override", cls: "bg-red-100 text-red-800" },
  reset_role_change: { label: "Reset (Role Change)", cls: "bg-gray-200 text-gray-700" },
  communication_error: { label: "Communication Error", cls: "bg-red-100 text-red-800" },
}

const SOURCE_LABELS: Record<string, string> = {
  mobile_app: "Mobile App",
  web_dashboard: "Web Dashboard",
  system: "System",
}

export default function WhatsAppMarketingLogsPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<WhatsAppOptInLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [clubId, setClubId] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<WhatsAppOptInCurrentStatus | null>(null)
  const [serviceEmails, setServiceEmails] = useState<WhatsAppServiceEmailEntry[]>([])
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [overrideNote, setOverrideNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await apiClient.listMarketingOptInLogs({
      clubId: clubId.trim() || undefined,
      search: search.trim() || undefined,
      limit: 200,
    })
    if (res.success && res.data) {
      setLogs(res.data.logs)
      setTotal(res.data.total)
    } else {
      toast.error(res.error || "Failed to load logs")
    }
    setLoading(false)
  }, [clubId, search])

  const loadStatus = useCallback(async () => {
    if (!clubId.trim()) {
      setStatus(null)
      return
    }
    const res = await apiClient.getMarketingOptInStatus(clubId.trim())
    if (res.success && res.data) setStatus(res.data.status)
  }, [clubId])

  const loadEmails = useCallback(async () => {
    const res = await apiClient.listMarketingServiceEmails({
      clubId: clubId.trim() || undefined,
      limit: 25,
    })
    if (res.success && res.data) setServiceEmails(res.data.emails)
  }, [clubId])

  useEffect(() => {
    if (user?.role !== "system_owner") return
    load()
    loadStatus()
    loadEmails()
  }, [user?.role, load, loadStatus, loadEmails])

  const handleExport = async () => {
    try {
      const url = apiClient.marketingOptInLogCsvUrl({
        clubId: clubId.trim() || undefined,
        search: search.trim() || undefined,
      })
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      const resp = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (!resp.ok) throw new Error("Export failed")
      const blob = await resp.blob()
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = "whatsapp-optin-log.csv"
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      toast.error("Failed to export CSV")
    }
  }

  const handleOverride = async () => {
    if (!clubId.trim() || !overrideNote.trim()) return
    setSubmitting(true)
    const res = await apiClient.systemOverrideDisableMarketing(clubId.trim(), overrideNote.trim())
    if (res.success) {
      toast.success("Club marketing access disabled (System Override)")
      setOverrideOpen(false)
      setOverrideNote("")
      await Promise.all([load(), loadStatus()])
    } else {
      toast.error(res.error || "Override failed")
    }
    setSubmitting(false)
  }

  if (user?.role !== "system_owner") {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-muted-foreground mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                Only the System Owner can view WhatsApp opt-in logs.
              </p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Lock className="w-7 h-7" /> WhatsApp Opt-in Audit Log
            </h1>
            <p className="text-muted-foreground">
              Append-only history of every WhatsApp Marketing state change. Filter by Club ID to
              resolve billing disputes.
            </p>
          </div>

          {/* Current Status header (when a club is selected) */}
          {status && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" /> Current Status
                </CardTitle>
                <CardDescription>For club {clubId}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={status.enabled ? "bg-green-600" : "bg-gray-400"}>
                    {status.enabled ? "Active" : "Opted-out"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Consecutive days active</p>
                  <p className="text-2xl font-bold">{status.enabled ? status.consecutiveDaysActive : 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last change</p>
                  <p className="text-sm font-medium">
                    {status.lastChangeAt ? new Date(status.lastChangeAt).toLocaleString() : "—"}
                    {status.lastChangeBy ? ` by ${status.lastChangeBy}` : ""}
                  </p>
                </div>
                {status.enabled && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="ml-auto"
                    onClick={() => setOverrideOpen(true)}
                  >
                    <ShieldAlert className="w-4 h-4 mr-1" /> System Override (Disable)
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card>
            <CardContent className="flex flex-wrap items-end gap-3 pt-6">
              <div className="space-y-1">
                <Label className="text-xs">Club ID</Label>
                <Input
                  placeholder="Filter by Club_ID"
                  value={clubId}
                  onChange={(e) => setClubId(e.target.value)}
                  className="w-64"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Search</Label>
                <Input
                  placeholder="Club name, admin, note…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64"
                />
              </div>
              <Button onClick={load} variant="outline">
                <Search className="w-4 h-4 mr-1" /> Apply
              </Button>
              <Button onClick={handleExport} variant="outline" className="ml-auto">
                <Download className="w-4 h-4 mr-1" /> Export CSV
              </Button>
            </CardContent>
          </Card>

          {/* Service emails & opens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" /> Confirmation Emails &amp; Opens
              </CardTitle>
              <CardDescription>
                Verify whether the club owner opened the pricing confirmation email.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {serviceEmails.length === 0 ? (
                <p className="text-sm text-muted-foreground">No confirmation emails sent yet.</p>
              ) : (
                <div className="space-y-3">
                  {serviceEmails.map((em) => {
                    const opened = em.recipients.filter((r) => r.openedAt).length
                    return (
                      <div key={em._id} className="rounded-md border p-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">
                            {em.type === "activation" ? "Activation" : "Deactivation"}
                          </Badge>
                          <Badge
                            className={
                              em.status === "sent"
                                ? "bg-green-100 text-green-800"
                                : em.status === "partial"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }
                            variant="secondary"
                          >
                            {em.status}
                          </Badge>
                          <span className="font-mono text-xs text-muted-foreground">{em.ticketId}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {new Date(em.createdAt).toLocaleString()} · attempt {em.attempts}/{em.maxAttempts}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {em.recipients.map((r) => (
                            <span
                              key={r.email}
                              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                              title={r.openedAt ? `Opened ${new Date(r.openedAt).toLocaleString()} (${r.openCount}x)` : "Not opened"}
                            >
                              {r.openedAt ? (
                                <MailOpen className="w-3 h-3 text-green-600" />
                              ) : (
                                <Mail className="w-3 h-3 text-muted-foreground" />
                              )}
                              {r.email}
                              {r.role === "primary_owner" && (
                                <span className="text-[10px] text-blue-600">(owner)</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Log table */}
          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
              <CardDescription>{total} record(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No log entries.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Club</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Admin UID</TableHead>
                        <TableHead>T&C Ver.</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((l) => {
                        const a = ACTION_LABELS[l.action] || { label: l.action, cls: "" }
                        return (
                          <TableRow key={l._id}>
                            <TableCell className="whitespace-nowrap text-xs">
                              {new Date(l.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-sm">
                              <div>{l.clubName || "—"}</div>
                              <div className="font-mono text-[10px] text-muted-foreground">{l.clubId}</div>
                            </TableCell>
                            <TableCell>
                              <Badge className={a.cls} variant="secondary">{a.label}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">{SOURCE_LABELS[l.source] || l.source}</TableCell>
                            <TableCell className="font-mono text-[11px]">
                              <div>{l.actorName || "—"}</div>
                              <div className="text-muted-foreground">{l.actorId || ""}</div>
                            </TableCell>
                            <TableCell className="text-xs">{l.tcVersion || "—"}</TableCell>
                            <TableCell className="text-xs max-w-xs truncate" title={l.note}>
                              {l.note || "—"}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Override dialog */}
        <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>System Override — Disable Marketing</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              This records a permanent "System Override" entry in the append-only log. A note is
              required.
            </p>
            <Textarea
              placeholder="Reason for disabling this club's access…"
              value={overrideNote}
              onChange={(e) => setOverrideNote(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setOverrideOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleOverride}
                disabled={submitting || !overrideNote.trim()}
              >
                {submitting ? "Disabling…" : "Confirm Override"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
