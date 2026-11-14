"use client"

import { Calendar, Pencil, X } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useForum } from "./forum-store"

export const ClubCard = () => {
  const { user } = useAuth() as { user?: { club?: { name?: string } } }
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{user?.club?.name ?? "Your club"}</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>Official community space for fans: matchday chat, transfer talk and meetups.</p>
        <p className="flex items-center gap-1 text-xs"><Calendar className="h-3.5 w-3.5" />Community forum</p>
      </CardContent>
    </Card>
  )
}

export const PinnedPanel = () => {
  const { threads, pinnedCount, maxPinned, patchThread } = useForum()
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Pinned threads</CardTitle>
        <Badge variant="outline" className="border-orange-500/50 text-orange-600">{pinnedCount} of {maxPinned} pinned</Badge>
      </CardHeader>
      <CardContent className="divide-y">
        {threads.filter((t) => t.pinned && !t.archived).map((t, i) => (
          <div key={t.id} className="flex items-center gap-3 py-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-xs">{i + 1}</span>
            <Link href={`/dashboard/forum/${t.id}`} className="min-w-0 flex-1 hover:underline">
              <p className="truncate text-sm font-medium">{t.title}</p>
              <p className="text-xs text-muted-foreground">{t.author} · {t.likes} likes</p>
            </Link>
            <Button size="icon" variant="outline" className="h-7 w-7" aria-label="Unpin" onClick={() => patchThread(t.id, { pinned: false })}><X className="h-4 w-4" /></Button>
          </div>
        ))}
        {pinnedCount === 0 && <p className="py-3 text-sm text-muted-foreground">Nothing pinned yet.</p>}
      </CardContent>
    </Card>
  )
}

export const RulesPanel = () => {
  const { rules } = useForum()
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Community rules</CardTitle>
        <Button asChild variant="outline" size="sm"><Link href="/dashboard/forum/settings"><Pencil className="mr-1 h-4 w-4" />Edit</Link></Button>
      </CardHeader>
      <CardContent className="divide-y text-sm">{rules.map((r) => <p key={r} className="py-3">{r}</p>)}</CardContent>
    </Card>
  )
}
