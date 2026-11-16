"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, Heart, MessageCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { LockThreadDialog, RemoveThreadDialog } from "@/components/forum/forum-dialogs"
import { PinnedPanel, RulesPanel } from "@/components/forum/forum-side-panels"
import { ago, useForum } from "@/components/forum/forum-store"
import { apiClient } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import type { ForumComment, Thread } from "@/types/forum"
import { cn } from "@/lib/utils"

type Sort = "best" | "new" | "reported"

type NodeProps = { c: ForumComment; depth: number; all: ForumComment[]; onRemove: (id: string) => void; onKeep: (id: string) => void }
const CommentNode = ({ c, depth, all, onRemove, onKeep }: NodeProps) => {
  const kids = all.filter((k) => k.parentId === c.id)
  const reported = c.reports > 0
  return (
    <div className={cn(depth > 0 && "ml-6 border-l pl-4")}>
      <div className={cn("space-y-1 rounded-lg py-3", reported && "border border-orange-500/40 bg-muted/40 px-3")}>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold">{c.author}</span>
          {c.isOP && <Badge variant="outline" className="border-green-500/50 text-green-600">OP</Badge>}
          <Badge variant="outline" className={cn("font-normal", c.role === "Admin" && "border-red-500/50 text-red-600")}>{c.role}</Badge>
          <span className="text-xs text-muted-foreground">· {ago(c.createdAt)}</span>
          {reported && <Badge variant="outline" className="border-orange-500/50 text-orange-600">Reported ×{c.reports}</Badge>}
        </div>
        <p className={cn("text-sm", c.removed && "text-muted-foreground")}>{c.body}</p>
        {!c.removed && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{c.likes}</span>
            <span className="ml-auto flex gap-2">
              {reported && <Button size="sm" variant="outline" onClick={() => onKeep(c.id)}>Keep</Button>}
              <Button size="sm" variant={reported ? "default" : "ghost"} className={cn(reported ? "bg-orange-600 text-white hover:bg-orange-700" : "h-auto p-0 text-orange-600 hover:bg-transparent")} onClick={() => onRemove(c.id)}>Remove</Button>
            </span>
          </div>
        )}
      </div>
      {kids.map((k) => <CommentNode key={k.id} c={k} depth={depth + 1} all={all} onRemove={onRemove} onKeep={onKeep} />)}
    </div>
  )
}

export default function ThreadPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { clubId, subTopics, patchThread, refresh } = useForum()
  const [data, setData] = useState<{ thread: Thread; comments: ForumComment[] } | null>(null); const [missing, setMissing] = useState(false)
  const load = useCallback(async () => { const r = await apiClient.getForumThread(clubId, id); if (r.data) setData(r.data); else setMissing(true) }, [clubId, id])
  useEffect(() => { void load() }, [load])
  // After a thread-level change, refresh both the shared lists and this thread.
  const act = async (p: Promise<boolean>) => { if (await p) await load() }
  const [sort, setSort] = useState<Sort>("best")
  const [reply, setReply] = useState(""); const [lock, setLock] = useState(false); const [remove, setRemove] = useState(false)
  const t = data?.thread; const comments = data?.comments ?? []
  if (missing) return <div className="space-y-4"><Button asChild variant="outline"><Link href="/dashboard/forum">Back to discussions</Link></Button><p className="text-muted-foreground">Thread not found.</p></div>
  if (!t) return <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>

  const mine = comments.filter((c) => c.threadId === t.id)
  const reportedN = mine.filter((c) => c.reports > 0).length
  // Reply nesting is by parentId; sort applies to top-level comments only.
  const top = mine.filter((c) => c.parentId === null).filter((c) => sort !== "reported" || mine.some((x) => x.reports > 0 && (x.id === c.id || x.parentId === c.id)))
    .sort((a, b) => (sort === "best" ? b.likes - a.likes : 0))
  const submit = async () => { const r = await apiClient.addForumComment(clubId, t.id, { body: reply.trim() }); if (r.success) { setReply(""); await load() } else toast({ title: "Could not comment", description: r.error || r.message, variant: "destructive" }) }
  const removeComment = async (cid: string) => { await apiClient.removeForumComment(clubId, cid); await Promise.all([load(), refresh()]) }
  const keepComment = async (cid: string) => { await apiClient.resolveForumReport(clubId, cid, { action: "keep" }); await Promise.all([load(), refresh()]) }

  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold sm:text-3xl">Discussions</h1><p className="text-muted-foreground">Moderate threads, pin important posts and keep the community on topic.</p></div>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Button asChild variant="outline" size="sm"><Link href="/dashboard/forum"><ChevronLeft className="mr-1 h-4 w-4" />Back to discussions</Link></Button>
          <Card><CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">{t.author}</span><Badge variant="outline" className="font-normal">{t.isAdmin ? "Admin" : "Member"}</Badge>
              <span className="text-xs text-muted-foreground">· {ago(t.createdAt)}</span><Badge variant="secondary" className="font-normal">{subTopics.find((s) => s.id === t.subTopicId)?.name}</Badge>
              {t.pinned && <Badge variant="outline" className="ml-auto border-orange-500/50 text-orange-600">Pinned</Badge>}
            </div>
            <h2 className="text-xl font-bold">{t.title}</h2>
            {t.body && <p className="text-sm text-muted-foreground">{t.body}</p>}
            <div className="flex gap-2">
              <span className="flex items-center gap-1 rounded-full border px-3 py-1 text-sm"><Heart className="h-4 w-4" />{t.likes}</span>
              <span className="flex items-center gap-1 rounded-full border px-3 py-1 text-sm"><MessageCircle className="h-4 w-4" />{mine.length}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t pt-3">
              <span className="mr-1 text-xs text-muted-foreground">Admin actions</span>
              <Button size="sm" variant="outline" onClick={() => act(patchThread(t.id, { pinned: !t.pinned }))}>{t.pinned ? "Unpin" : "Pin"}</Button>
              <Button size="sm" variant="outline" onClick={() => (t.locked ? act(patchThread(t.id, { locked: false })) : setLock(true))}>{t.locked ? "Unlock" : "Lock thread"}</Button>
              <Button size="sm" variant="outline" onClick={() => act(patchThread(t.id, { archived: !t.archived }))}>{t.archived ? "Restore" : "Archive"}</Button>
              <Button size="sm" className="bg-orange-600 text-white hover:bg-orange-700" onClick={() => setRemove(true)}>Remove thread</Button>
            </div>
          </CardContent></Card>
          <Card><CardContent className="space-y-3 p-4">
            <Textarea rows={3} disabled={t.locked} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t.locked ? "Thread locked" : "Reply as Admin..."} />
            <div className="text-right"><Button disabled={!reply.trim() || t.locked} onClick={submit}>Comment</Button></div>
          </CardContent></Card>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Comments ({mine.length})</h3>
            <div className="flex gap-2">
              {([["best", "Best"], ["new", "Newest"], ["reported", `Reported (${reportedN})`]] as [Sort, string][]).map(([k, l]) => <Button key={k} size="sm" className="rounded-full" variant={sort === k ? "default" : "outline"} onClick={() => setSort(k)}>{l}</Button>)}
            </div>
          </div>
          <Card><CardContent className="divide-y p-4">{top.map((c) => <CommentNode key={c.id} c={c} depth={0} all={comments} onRemove={removeComment} onKeep={keepComment} />)}{top.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nothing here.</p>}</CardContent></Card>
        </div>
        <aside className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Thread status</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[["Sub-topic", subTopics.find((s) => s.id === t.subTopicId)?.name], ["Participants", `${new Set(mine.map((c) => c.author)).size} members`], ["Open reports", `${reportedN} comment${reportedN === 1 ? "" : "s"}`], ["Status", t.locked ? "Locked" : t.archived ? "Archived" : "Active"]].map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
              ))}
            </CardContent>
          </Card>
          <PinnedPanel /><RulesPanel />
        </aside>
      </div>
      <LockThreadDialog open={lock} onOpenChange={(o) => { setLock(o); if (!o) void load() }} thread={t} />
      <RemoveThreadDialog open={remove} onOpenChange={setRemove} thread={t} onRemoved={() => router.push("/dashboard/forum")} />
    </div>
  )
}
