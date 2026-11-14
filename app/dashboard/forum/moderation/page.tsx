"use client"

import { useState } from "react"
import { Check, Search, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ReviewReportDialog } from "@/components/forum/forum-dialogs"
import { ago, useForum } from "@/components/forum/forum-store"
import type { Report } from "@/types/forum"
import { cn } from "@/lib/utils"

type Tab = "reported" | "flagged" | "resolved"

export default function ModerationPage() {
  const { reports, resolveReport } = useForum()
  const [tab, setTab] = useState<Tab>("reported"); const [q, setQ] = useState(""); const [review, setReview] = useState<Report | null>(null)
  const inTab = (r: Report, t: Tab) => (t === "resolved" ? r.status === "Resolved" : r.status !== "Resolved" && (t === "flagged") === (r.source === "profanity"))
  const rows = reports.filter((r) => inTab(r, tab) && `${r.text} ${r.author} ${r.thread}`.toLowerCase().includes(q.toLowerCase()))
  const open = reports.filter((r) => r.status !== "Resolved")
  const stats = [["Open reports", String(open.filter((r) => r.source === "member").length)], ["Auto-flagged (profanity filter)", String(open.filter((r) => r.source === "profanity").length)], ["Resolved", String(reports.length - open.length)]]
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold sm:text-3xl">Moderation Queue</h1><p className="text-muted-foreground">Review reported and auto-flagged comments across all threads.</p></div>
      <div className="grid grid-cols-1 divide-y border-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {stats.map(([k, v]) => <div key={k} className="p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="text-3xl font-bold">{v}</p></div>)}
      </div>
      <div className="flex flex-wrap gap-2">
        {([["reported", "Reported"], ["flagged", "Auto-flagged"], ["resolved", "Resolved"]] as [Tab, string][]).map(([k, l]) => (
          <Button key={k} size="sm" className="rounded-full" variant={tab === k ? "default" : "outline"} onClick={() => setTab(k)}>{l} ({reports.filter((r) => inTab(r, k)).length})</Button>
        ))}
        <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search comments, authors or threads..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Comment</TableHead><TableHead>Author</TableHead><TableHead>Reports</TableHead><TableHead>Source</TableHead><TableHead>Reported</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="max-w-xs"><p className="font-medium">{r.text}</p><p className="text-xs text-muted-foreground">in: {r.thread}</p></TableCell>
              <TableCell><p className="font-medium">{r.author}</p><p className="text-xs text-muted-foreground">Member</p></TableCell>
              <TableCell><p>{r.count} report{r.count === 1 ? "" : "s"}</p><p className="text-xs text-muted-foreground">{r.reasons.map((x) => x.label).join(", ")}</p></TableCell>
              <TableCell><Badge variant="outline" className={cn("font-normal", r.source === "profanity" && "border-red-500/50 text-red-600")}>{r.source === "profanity" ? "Profanity filter" : "Member report"}</Badge></TableCell>
              <TableCell className="text-muted-foreground">{ago(r.createdAt)}</TableCell>
              <TableCell><Badge variant="outline" className={cn(r.status === "Open" && "border-orange-500/50 text-orange-600", r.status === "Flagged" && "border-red-500/50 text-red-600")}>{r.status}</Badge></TableCell>
              <TableCell className="space-x-2 text-right whitespace-nowrap">
                <Button size="sm" variant="outline" onClick={() => setReview(r)}>Review</Button>
                {r.status !== "Resolved" && <>
                  <Button size="icon" variant="outline" className="h-8 w-8" aria-label="Keep" onClick={() => resolveReport(r.commentId, "keep")}><Check className="h-4 w-4" /></Button>
                  <Button size="icon" variant="outline" className="h-8 w-8" aria-label="Remove" onClick={() => resolveReport(r.commentId, "remove")}><Trash2 className="h-4 w-4" /></Button>
                </>}
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Queue is clear.</TableCell></TableRow>}
        </TableBody>
      </Table>
      <ReviewReportDialog open={!!review} onOpenChange={(o) => !o && setReview(null)} report={review} />
    </div>
  )
}
