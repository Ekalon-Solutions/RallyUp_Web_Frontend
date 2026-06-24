"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, WhatsAppSafetyLogEntry } from "@/lib/api"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ShieldAlert, Search, RefreshCw } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"

const inr = (n: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n)

const RESULT_STYLES: Record<string, string> = {
  sent: "bg-green-100 text-green-800",
  partial: "bg-amber-100 text-amber-800",
  rejected: "bg-red-100 text-red-800",
}

export default function WhatsAppSafetyPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<WhatsAppSafetyLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [clubId, setClubId] = useState("")
  const [trusted, setTrusted] = useState<boolean | null>(null)
  const [savingTrust, setSavingTrust] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await apiClient.listWhatsAppSafetyLogs({ clubId: clubId.trim() || undefined, limit: 200 })
    if (res.success && res.data) setLogs(res.data.logs)
    setLoading(false)
  }, [clubId])

  const loadTrusted = useCallback(async () => {
    if (!clubId.trim()) {
      setTrusted(null)
      return
    }
    const res = await apiClient.getWhatsAppTrustedStatus(clubId.trim())
    if (res.success && res.data) setTrusted(res.data.trustedStatus)
  }, [clubId])

  useEffect(() => {
    if (user?.role !== "system_owner") return
    load()
    loadTrusted()
  }, [user?.role, load, loadTrusted])

  const handleTrustToggle = async (value: boolean) => {
    if (!clubId.trim()) return
    setSavingTrust(true)
    const res = await apiClient.setWhatsAppTrustedStatus(clubId.trim(), value)
    if (res.success && res.data) {
      setTrusted(res.data.trustedStatus)
      toast.success(`Trusted Status ${value ? "granted" : "revoked"} — 5,000/day cap ${value ? "lifted" : "enforced"}`)
    } else {
      toast.error(res.error || "Failed to update Trusted Status")
    }
    setSavingTrust(false)
  }

  if (user?.role !== "system_owner") {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-muted-foreground mb-2">Access Denied</h2>
              <p className="text-muted-foreground">Only the System Owner can view the Safety Audit Log.</p>
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
              <ShieldAlert className="w-7 h-7" /> WhatsApp Safety Audit Log
            </h1>
            <p className="text-muted-foreground">
              Every bulk marketing trigger and rejection. Investigate clubs with high blocks or spam reports.
            </p>
          </div>

          {/* Filter + Trusted Status */}
          <Card>
            <CardContent className="flex flex-wrap items-end gap-4 pt-6">
              <div className="space-y-1">
                <Label className="text-xs">Club ID</Label>
                <Input
                  placeholder="Filter by Club_ID"
                  value={clubId}
                  onChange={(e) => setClubId(e.target.value)}
                  className="w-64"
                />
              </div>
              <Button onClick={() => { load(); loadTrusted() }} variant="outline">
                <Search className="w-4 h-4 mr-1" /> Apply
              </Button>
              {trusted !== null && (
                <div className="flex items-center gap-2 ml-auto">
                  <div className="text-right">
                    <Label className="text-xs">Trusted Status (lifts 5,000/day cap)</Label>
                    <p className="text-[11px] text-muted-foreground">
                      {trusted ? "Verified — cap lifted" : "Not verified — cap enforced"}
                    </p>
                  </div>
                  <Switch checked={trusted} disabled={savingTrust} onCheckedChange={handleTrustToggle} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Safety log table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Activity</CardTitle>
                <CardDescription>{logs.length} record(s)</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={load}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No safety log entries.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Club</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead>By</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead className="text-right">Sent</TableHead>
                        <TableHead className="text-right">Suppressed</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                        <TableHead className="text-right">Blocks/Spam</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((l) => {
                        const sup =
                          l.suppressed.optedOut +
                          l.suppressed.blockedMember +
                          l.suppressed.cooldown +
                          l.suppressed.invalidPhone
                        return (
                          <TableRow key={l._id}>
                            <TableCell className="whitespace-nowrap text-xs">
                              {new Date(l.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-sm">
                              <div>{l.clubName || "—"}</div>
                              <div className="font-mono text-[10px] text-muted-foreground">{l.clubId}</div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{l.templateName}</TableCell>
                            <TableCell className="text-xs">
                              {l.triggeredByName || "—"}
                              {l.triggeredByRole && (
                                <span className="text-muted-foreground"> ({l.triggeredByRole})</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={RESULT_STYLES[l.result]} variant="secondary">
                                {l.result}
                              </Badge>
                              {l.rejectionReason && (
                                <div className="text-[10px] text-red-600 max-w-[180px] truncate" title={l.rejectionReason}>
                                  {l.rejectionReason}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{l.sent}</TableCell>
                            <TableCell className="text-right">{sup}</TableCell>
                            <TableCell className="text-right">INR {inr(l.estimatedCostInr)}</TableCell>
                            <TableCell className="text-right">
                              {l.userBlocksReported + l.spamReports > 0 ? (
                                <span className="text-red-600 font-semibold">
                                  {l.userBlocksReported}/{l.spamReports}
                                </span>
                              ) : (
                                "0/0"
                              )}
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
      </DashboardLayout>
    </ProtectedRoute>
  )
}
