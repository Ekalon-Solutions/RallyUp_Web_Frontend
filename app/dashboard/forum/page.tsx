"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { MessageCircle, Heart, Pin, Plus, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreateThreadDialog, LockThreadDialog, RemoveThreadDialog } from "@/components/forum/forum-dialogs"
import { ClubCard, PinnedPanel, RulesPanel } from "@/components/forum/forum-side-panels"
import { ago, useForum } from "@/components/forum/forum-store"
import type { Thread } from "@/types/forum"
import { cn } from "@/lib/utils"

type Sort = "hot" | "new" | "top"
const Pill = ({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) => (
  <Button size="sm" variant={active ? "default" : "outline"} className="rounded-full" onClick={onClick}>{children}</Button>
)

export default function DiscussionsPage() {
  const { threads, subTopics, patchThread } = useForum()
  const [tab, setTab] = useState<"active" | "archived">("active")
  const [sort, setSort] = useState<Sort>("hot")
  const [q, setQ] = useState(""); const [sub, setSub] = useState("all"); const [author, setAuthor] = useState("all")
  const [create, setCreate] = useState(false); const [lock, setLock] = useState<Thread | null>(null); const [remove, setRemove] = useState<Thread | null>(null)

  const subName = (id: string) => subTopics.find((s) => s.id === id)?.name
  const authors = useMemo(() => Array.from(new Set(threads.map((t) => t.author))), [threads])
  const list = useMemo(() => {
    const rank = (t: Thread) => (sort === "top" ? t.likes : sort === "hot" ? t.likes + t.comments * 3 : 0)
    return threads
      .filter((t) => t.archived === (tab === "archived"))
      .filter((t) => (sub === "all" || t.subTopicId === sub) && (author === "all" || t.author === author))
      .filter((t) => `${t.title} ${t.body} ${t.author}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || (sort === "new" ? b.createdAt.localeCompare(a.createdAt) : rank(b) - rank(a)))
  }, [threads, tab, sort, q, sub, author])

  const pin = (t: Thread) => patchThread(t.id, { pinned: !t.pinned })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div><h1 className="text-2xl font-bold sm:text-3xl">Discussions</h1><p className="text-muted-foreground">Moderate threads, pin important posts and keep the community on topic.</p></div>
        <Button onClick={() => setCreate(true)}><Plus className="mr-1 h-4 w-4" />Create thread</Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Pill active={tab === "active"} onClick={() => setTab("active")}>Active ({threads.filter((t) => !t.archived).length})</Pill>
            <Pill active={tab === "archived"} onClick={() => setTab("archived")}>Archived ({threads.filter((t) => t.archived).length})</Pill>
            <span className="ml-auto text-sm text-muted-foreground">Sort by</span>
            {(["hot", "new", "top"] as Sort[]).map((s) => <Pill key={s} active={sort === s} onClick={() => setSort(s)}>{s[0].toUpperCase() + s.slice(1)}</Pill>)}
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[200px] flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search threads, members or keywords..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <Select value={sub} onValueChange={setSub}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All sub-topics</SelectItem>{subTopics.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
            <Select value={author} onValueChange={setAuthor}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All authors</SelectItem>{authors.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select>
          </div>
          {list.map((t) => (
            <Card key={t.id}><CardContent className="space-y-3 p-5">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{t.author}</span>
                <Badge variant="outline" className={cn("font-normal", t.isAdmin && "border-red-500/50 text-red-600")}>{t.isAdmin ? "Admin" : "Member"}</Badge>
                <span className="text-xs text-muted-foreground">· {ago(t.createdAt)}</span>
                <Badge variant="secondary" className="font-normal">{subName(t.subTopicId)}</Badge>
                {t.pinned && <Badge variant="outline" className="ml-auto border-orange-500/50 text-orange-600">Pinned</Badge>}
                {t.locked && <Badge variant="outline" className="ml-auto border-red-500/50 text-red-600">Locked</Badge>}
              </div>
              <Link href={`/dashboard/forum/${t.id}`} className="block text-lg font-semibold hover:underline">{t.title}</Link>
              {t.body && <p className="text-sm text-muted-foreground">{t.body}</p>}
                      <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 rounded-full border px-3 py-1 text-sm"><Heart className="h-4 w-4" />{t.likes}</span>
                <span className="flex items-center gap-1 rounded-full border px-3 py-1 text-sm"><MessageCircle className="h-4 w-4" />{t.comments}</span>
                <div className="ml-auto flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => pin(t)}><Pin className="mr-1 h-3.5 w-3.5" />{t.pinned ? "Unpin" : "Pin"}</Button>
                  <Button size="sm" variant="outline" onClick={() => (t.locked ? patchThread(t.id, { locked: false }) : setLock(t))}>{t.locked ? "Unlock" : "Lock"}</Button>
                  <Button size="sm" variant="outline" onClick={() => patchThread(t.id, { archived: !t.archived, pinned: false })}>{t.archived ? "Restore" : "Archive"}</Button>
                  <Button size="sm" variant="outline" onClick={() => setRemove(t)}>Delete</Button>
                </div>
              </div>
            </CardContent></Card>
          ))}
          {list.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No threads match.</p>}
        </div>
        <aside className="space-y-4"><ClubCard /><PinnedPanel /><RulesPanel /></aside>
      </div>
      <CreateThreadDialog open={create} onOpenChange={setCreate} />
      <LockThreadDialog open={!!lock} onOpenChange={(o) => !o && setLock(null)} thread={lock} />
      <RemoveThreadDialog open={!!remove} onOpenChange={(o) => !o && setRemove(null)} thread={remove} />
    </div>
  )
}
