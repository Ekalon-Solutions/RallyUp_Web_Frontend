"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import {
  apiClient,
  WhatsAppBillingRunStatus,
  WhatsAppBillingInvoice as Invoice,
} from "@/lib/api"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Receipt, Play, Lock, RefreshCw, FileText } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"

const inr = (n: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n)

/** Default to the previous calendar month (matches the aggregator). */
function prevMonthLabel(): string {
  const d = new Date()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() - 1)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

export default function WhatsAppBillingPage() {
  const { user } = useAuth()
  const [period, setPeriod] = useState(prevMonthLabel())
  const [run, setRun] = useState<WhatsAppBillingRunStatus | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)
  const [noteFor, setNoteFor] = useState<Invoice | null>(null)
  const [noteType, setNoteType] = useState<"credit" | "debit">("credit")
  const [noteAmount, setNoteAmount] = useState("")
  const [noteReason, setNoteReason] = useState("")
  const [savingNote, setSavingNote] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadRun = useCallback(async () => {
    const res = await apiClient.getWhatsAppBillingRunStatus(period)
    if (res.success && res.data) setRun(res.data.status)
  }, [period])

  const loadInvoices = useCallback(async () => {
    const res = await apiClient.listWhatsAppBillingInvoices({ period })
    if (res.success && res.data) setInvoices(res.data.invoices)
    setLoading(false)
  }, [period])

  useEffect(() => {
    if (user?.role !== "system_owner") return
    loadRun()
    loadInvoices()
  }, [user?.role, loadRun, loadInvoices])

  // Poll while a run is in progress (drives the live progress bar).
  useEffect(() => {
    if (run?.status === "running") {
      if (!pollRef.current) {
        pollRef.current = setInterval(async () => {
          await loadRun()
        }, 2000)
      }
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
        loadInvoices()
      }
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [run?.status, loadRun, loadInvoices])

  const handleRun = async () => {
    setTriggering(true)
    const res = await apiClient.runWhatsAppBilling(period)
    if (res.success) {
      toast.success("Billing aggregation started")
      setTimeout(loadRun, 800)
    } else {
      toast.error(res.error || "Failed to start aggregation")
    }
    setTriggering(false)
  }

  const handleSaveNote = async () => {
    if (!noteFor) return
    const amount = Number(noteAmount)
    if (!amount || amount <= 0 || !noteReason.trim()) {
      toast.error("Enter a valid amount and reason")
      return
    }
    setSavingNote(true)
    const res = await apiClient.createWhatsAppInvoiceNote(noteFor._id, {
      type: noteType,
      amount,
      reason: noteReason.trim(),
    })
    if (res.success) {
      toast.success(`${noteType === "credit" ? "Credit" : "Debit"} note issued`)
      setNoteFor(null)
      setNoteAmount("")
      setNoteReason("")
    } else {
      toast.error(res.error || "Failed to issue note")
    }
    setSavingNote(false)
  }

  if (user?.role !== "system_owner") {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-muted-foreground mb-2">Access Denied</h2>
              <p className="text-muted-foreground">Only the System Owner can access WhatsApp billing.</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const running = run?.status === "running"

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Receipt className="w-7 h-7" /> WhatsApp Monthly Billing
              </h1>
              <p className="text-muted-foreground">
                Aggregates each club's marketing usage into locked, GST-inclusive draft invoices.
              </p>
            </div>
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Period (YYYY-MM)</Label>
                <Input value={period} onChange={(e) => setPeriod(e.target.value)} className="w-32" />
              </div>
              <Button onClick={handleRun} disabled={triggering || running}>
                <Play className="w-4 h-4 mr-1" /> Run Aggregator
              </Button>
              <Button variant="outline" onClick={() => { loadRun(); loadInvoices() }}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Billing Progress Bar + run summary */}
          {run && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {running ? "Aggregation in progress…" : `Run ${run.status} — ${run.periodLabel}`}
                </CardTitle>
                <CardDescription>
                  {run.processedClubs}/{run.totalClubs} clubs processed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={run.progressPercent} />
                <div className="flex flex-wrap gap-6 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">Marketing messages</div>
                    <div className="font-bold">{run.totalMessages.toLocaleString("en-IN")}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Total revenue (GST incl.)</div>
                    <div className="font-bold text-green-700">INR {inr(run.totalRevenue)}</div>
                  </div>
                  {run.error && <div className="text-red-600 text-xs self-end">{run.error}</div>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoices */}
          <Card>
            <CardHeader>
              <CardTitle>Draft Invoices</CardTitle>
              <CardDescription>
                Amounts are locked; corrections via Credit/Debit Note. Settled against the club's next payout.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices for this period yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Club</TableHead>
                        <TableHead className="text-right">Msgs</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Base</TableHead>
                        <TableHead className="text-right">GST</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((inv) => (
                        <TableRow key={inv._id}>
                          <TableCell className="font-mono text-xs">
                            {inv.invoiceNumber}
                            {inv.locked && <Lock className="inline w-3 h-3 ml-1 text-muted-foreground" />}
                          </TableCell>
                          <TableCell className="text-sm">
                            {inv.clubName || inv.clubId}
                            {inv.zeroBill && (
                              <Badge variant="secondary" className="ml-2 text-[10px]">Zero Bill</Badge>
                            )}
                            {inv.proratedFrom && (
                              <Badge variant="outline" className="ml-1 text-[10px]">Prorated</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{inv.marketingMessageCount}</TableCell>
                          <TableCell className="text-right">{inr(inv.ratePerMessage)}</TableCell>
                          <TableCell className="text-right">{inr(inv.baseAmount)}</TableCell>
                          <TableCell className="text-right">{inr(inv.gstAmount)}</TableCell>
                          <TableCell className="text-right font-semibold">INR {inr(inv.totalAmount)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setNoteFor(inv); setNoteType("credit"); }}
                            >
                              <FileText className="w-4 h-4 mr-1" /> Note
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <p className="text-xs text-muted-foreground mt-3">
                    Invoiced amounts are adjusted against the next settlement due to each club. No card
                    details or subscription plans are required.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Credit / Debit note dialog */}
        <Dialog open={!!noteFor} onOpenChange={(o) => !o && setNoteFor(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Issue Credit / Debit Note</DialogTitle>
            </DialogHeader>
            {noteFor && (
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Invoice <span className="font-mono">{noteFor.invoiceNumber}</span> · current total{" "}
                  <strong>INR {inr(noteFor.totalAmount)}</strong>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={noteType} onValueChange={(v) => setNoteType(v as "credit" | "debit")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit">Credit (reduce)</SelectItem>
                        <SelectItem value="debit">Debit (increase)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Amount (INR)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={noteAmount}
                      onChange={(e) => setNoteAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Reason</Label>
                  <Textarea value={noteReason} onChange={(e) => setNoteReason(e.target.value)} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setNoteFor(null)} disabled={savingNote}>
                Cancel
              </Button>
              <Button onClick={handleSaveNote} disabled={savingNote}>
                {savingNote ? "Issuing…" : "Issue Note"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
