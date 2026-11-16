"use client"

import Link from "next/link"
import { Calendar } from "lucide-react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { MemberOverview, Thread } from "@/types/forum"

const ThreadList = ({ title, items, empty }: { title: string; items: Thread[]; empty: string }) => (
  <Card>
    <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
    <CardContent className="divide-y">
      {items.map((t, i) => (
        <Link key={t.id} href={`/dashboard/user/forum/${t.id}`} className="flex items-center gap-3 py-3 hover:opacity-80">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-orange-600 text-xs text-white">{i + 1}</span>
          <span className="min-w-0"><span className="block truncate text-sm font-medium">{t.title}</span><span className="text-xs text-muted-foreground">{t.author} · {t.likes} likes</span></span>
        </Link>
      ))}
      {items.length === 0 && <p className="py-2 text-sm text-muted-foreground">{empty}</p>}
    </CardContent>
  </Card>
)

export const MemberSidePanels = ({ data }: { data: MemberOverview }) => (
  <aside className="space-y-4">
    <Card>
      <CardHeader className="pb-2"><CardTitle>{data.club.name}</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        {data.club.description && <p>{data.club.description}</p>}
        {data.club.createdAt && <p className="flex items-center gap-1 text-xs"><Calendar className="h-3.5 w-3.5" />Created {format(new Date(data.club.createdAt), "MMM d, yyyy")}</p>}
      </CardContent>
    </Card>
    <ThreadList title="Pinned posts" items={data.pinned} empty="Nothing pinned." />
    <ThreadList title="Favorites" items={data.favorites} empty="Star a thread to find it here." />
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Community rules</CardTitle></CardHeader>
      <CardContent className="divide-y text-sm">{data.rules.map((r) => <p key={r} className="py-3">{r}</p>)}</CardContent>
    </Card>
  </aside>
)
