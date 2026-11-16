"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, Lock, MessageCircle, MoreHorizontal } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { ReportCommentDialog } from "@/components/forum/member/member-dialogs"
import { MemberSidePanels } from "@/components/forum/member/member-panels"
import { ReactionBar } from "@/components/forum/member/reactions"
import { ago } from "@/components/forum/forum-store"
import { useAuth } from "@/contexts/auth-context"
import { useSelectedClubId } from "@/hooks/useSelectedClubId"
import { apiClient } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { ForumComment, MemberOverview, Thread } from "@/types/forum"

const initials = (n: string) => n.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()

type Ctx = {
  clubId: string; all: ForumComment[]; me?: string; locked: boolean; maxDepth: number; reporting: boolean
  reload: () => void; onReport: (id: string) => void; fail: (r: { error?: string; message?: string }) => void
}

const Composer = ({ initial = "", cta, onSubmit, onCancel, placeholder }: { initial?: string; cta: string; onSubmit: (v: string) => Promise<void>; onCancel?: () => void; placeholder?: string }) => {
  const [v, setV] = useState(initial); const [busy, setBusy] = useState(false)
  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <Textarea rows={3} value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} />
      <div className="flex justify-end gap-2">
        {onCancel && <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button size="sm" disabled={!v.trim() || busy} onClick={async () => { setBusy(true); await onSubmit(v.trim()); setBusy(false); setV("") }}>{cta}</Button>
      </div>
    </div>
  )
}

const CommentNode = ({ c, depth, x }: { c: ForumComment; depth: number; x: Ctx }) => {
  const [mode, setMode] = useState<"view" | "reply" | "edit">("view"); const [collapsed, setCollapsed] = useState(false)
  const kids = x.all.filter((k) => k.parentId === c.id)
  const mine = !!x.me && c.authorId === x.me && c.role === "Member"
  const run = async (p: Promise<{ success: boolean; error?: string; message?: string }>) => { const r = await p; if (!r.success) x.fail(r); x.reload(); setMode("view") }
  return (
    <div className={cn(depth > 0 && "ml-5 border-l pl-4")}>
      <div className="space-y-1 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">{initials(c.author)}</span>
          <span className="font-semibold">{c.author}</span>
          {c.isOP && <span className="text-xs font-semibold text-green-500">OP</span>}
          {c.role === "Admin" && <Badge variant="outline" className="border-red-500/50 text-red-600">Admin</Badge>}
          <span className="text-xs text-muted-foreground">· {ago(c.createdAt)}{c.editedAt && " (edited)"}</span>
        </div>
        {mode === "edit"
          ? <Composer initial={c.body} cta="Save Edits" onCancel={() => setMode("view")} onSubmit={(v) => run(apiClient.editMemberForumComment(x.clubId, c.id, v))} />
          : !collapsed && <p className={cn("text-sm", c.removed && "text-muted-foreground")}>{c.body}</p>}
        {!c.removed && mode !== "edit" && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <ReactionBar clubId={x.clubId} targetType="comment" targetId={c.id} reactions={c.reactions} onChange={x.reload} />
            {!x.locked && depth < x.maxDepth - 1 && <button onClick={() => setMode(mode === "reply" ? "view" : "reply")}>Reply</button>}
            <button onClick={() => setCollapsed(!collapsed)}>{collapsed ? "Expand" : "Collapse"}</button>
            {(mine || x.reporting) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild><button aria-label="More"><MoreHorizontal className="h-4 w-4" /></button></DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {mine && <DropdownMenuItem onClick={() => setMode("edit")}>Edit</DropdownMenuItem>}
                  {mine && <DropdownMenuItem onClick={() => run(apiClient.deleteMemberForumComment(x.clubId, c.id))}>Delete</DropdownMenuItem>}
                  {!mine && x.reporting && <DropdownMenuItem onClick={() => x.onReport(c.id)}>Report</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
        {mode === "reply" && <Composer cta="Comment" placeholder={`Reply to ${c.author}`} onCancel={() => setMode("view")} onSubmit={(v) => run(apiClient.addMemberForumComment(x.clubId, c.threadId, { body: v, parentId: c.id }))} />}
      </div>
      {!collapsed && kids.map((k) => <CommentNode key={k.id} c={k} depth={depth + 1} x={x} />)}
    </div>
  )
}

export default function MemberThreadPage() {
  const { id } = useParams<{ id: string }>()
  const clubId = useSelectedClubId()
  const { user } = useAuth()
  const me = String((user as any)?._id ?? (user as any)?.id ?? "")
  const [data, setData] = useState<{ thread: Thread; comments: ForumComment[] } | null>(null)
  const [side, setSide] = useState<MemberOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!clubId) return
    const [t, o] = await Promise.all([apiClient.getMemberForumThread(clubId, id), apiClient.getForumOverview(clubId, "hot")])
    if (t.data) { setData(t.data); setError(null) } else setError(t.error || t.message || "Thread not found")
    if (o.data) setSide(o.data)
  }, [clubId, id])
  useEffect(() => { void load() }, [load])

  const fail = (r: { error?: string; message?: string }) => toast({ title: "Action failed", description: r.error || r.message, variant: "destructive" })
  const t = data?.thread
  const locked = !!t?.locked || !!t?.archived
  const top = (data?.comments ?? []).filter((c) => c.parentId === null).sort((a, b) => (b.reactions?.total ?? 0) - (a.reactions?.total ?? 0))

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <Button asChild size="sm" variant="outline"><Link href="/dashboard/user/forum"><ChevronLeft className="mr-1 h-4 w-4" />Back to club</Link></Button>
            {error && <p className="py-10 text-center text-muted-foreground">{error}</p>}
            {!error && !t && <p className="py-10 text-center text-muted-foreground">Loading…</p>}
            {t && clubId && (<>
              <Card><CardContent className="space-y-3 p-5">
                <div className="flex items-center gap-2 text-sm"><span className="font-semibold">{t.author}</span><span className="text-xs text-muted-foreground">· {ago(t.createdAt)}</span><Badge variant="secondary" className="font-normal">{t.isAdmin ? "Admin" : "Member"}</Badge></div>
                <h1 className="text-xl font-bold">{t.title}</h1>
                {t.body && <p className="whitespace-pre-line text-sm text-muted-foreground">{t.body}</p>}
                {t.media?.map((m) => m.type === "video" ? <video key={m.url} src={m.url} controls className="max-h-96 w-full rounded-lg bg-black" /> : <img key={m.url} src={m.url} alt="" className="max-h-96 w-full rounded-lg object-cover" />)}
                <div className="flex items-center gap-2">
                  <ReactionBar clubId={clubId} targetType="thread" targetId={t.id} reactions={t.reactions} onChange={load} />
                  <span className="flex items-center gap-1 rounded-full border px-3 py-1 text-sm"><MessageCircle className="h-4 w-4" />{t.comments}</span>
                </div>
              </CardContent></Card>
              {locked
                ? <p className="flex items-center gap-2 rounded-lg border p-4 text-sm text-muted-foreground"><Lock className="h-4 w-4" />{t.lockMessage || (t.archived ? "This thread is read-only." : "Thread locked")}</p>
                : <Composer cta="Comment" placeholder="Join the conversation" onSubmit={async (v) => { const r = await apiClient.addMemberForumComment(clubId, t.id, { body: v }); if (!r.success) fail(r); await load() }} />}
              <h2 className="text-lg font-semibold">Comments</h2>
              <Card><CardContent className="divide-y p-4">
                {top.map((c) => <CommentNode key={c.id} c={c} depth={0} x={{ clubId, all: data!.comments, me, locked, maxDepth: side?.config.depth ?? 5, reporting: side?.config.reporting ?? true, reload: load, onReport: setReport, fail }} />)}
                {top.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No comments yet.</p>}
              </CardContent></Card>
            </>)}
          </div>
          {side && <MemberSidePanels data={side} />}
        </div>
        {clubId && <ReportCommentDialog clubId={clubId} open={!!report} onOpenChange={(o) => !o && setReport(null)} commentId={report} />}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
