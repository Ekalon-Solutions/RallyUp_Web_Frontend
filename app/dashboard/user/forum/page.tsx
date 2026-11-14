"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { Lock, MessageCircle, Star } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { MemberCreateThreadDialog } from "@/components/forum/member/member-dialogs"
import { MemberSidePanels } from "@/components/forum/member/member-panels"
import { ReactionBar } from "@/components/forum/member/reactions"
import { ago } from "@/components/forum/forum-store"
import { useSelectedClubId } from "@/hooks/useSelectedClubId"
import { apiClient } from "@/lib/api"
import type { MemberOverview } from "@/types/forum"

const initials = (n: string) => n.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()

export default function MemberForumPage() {
  const clubId = useSelectedClubId()
  const [sort, setSort] = useState("hot")
  const [data, setData] = useState<MemberOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [create, setCreate] = useState(false)

  const load = useCallback(async () => {
    if (!clubId) return
    const r = await apiClient.getForumOverview(clubId, sort)
    if (r.data) { setData(r.data); setError(null) } else setError(r.error || r.message || "Could not load the forum")
  }, [clubId, sort])
  useEffect(() => { void load() }, [load])

  const favorite = async (id: string) => {
    if (!clubId) return
    const r = await apiClient.toggleForumFavorite(clubId, id)
    if (!r.success) toast({ title: "Could not update favorites", description: r.error || r.message, variant: "destructive" })
    await load()
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {error && <p className="py-10 text-center text-muted-foreground">{error}</p>}
        {!error && !data && <p className="py-10 text-center text-muted-foreground">Loading…</p>}
        {data && clubId && (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-bold sm:text-3xl">{data.club.name}</h1>
                <div className="flex items-center gap-2">
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="w-36"><span className="text-muted-foreground">Sort:</span><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="hot">Hot</SelectItem><SelectItem value="new">New</SelectItem><SelectItem value="top">Top</SelectItem></SelectContent>
                  </Select>
                  <Button onClick={() => setCreate(true)}>Create thread</Button>
                </div>
              </div>
              {data.threads.map((t) => (
                <Card key={t.id}><CardContent className="space-y-3 p-5">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">{initials(t.author)}</span>
                    <span className="font-semibold">{t.author}</span><span className="text-xs text-muted-foreground">· {ago(t.createdAt)}</span>
                    <Badge variant="secondary" className="font-normal">{t.isAdmin ? "Admin" : "Member"}</Badge>
                    {t.locked && <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label="Locked" />}
                    <Button size="icon" variant="ghost" className="ml-auto h-8 w-8" aria-label={t.isFavorite ? "Remove favorite" : "Add favorite"} onClick={() => favorite(t.id)}>
                      <Star className={t.isFavorite ? "h-4 w-4 fill-current" : "h-4 w-4"} />
                    </Button>
                  </div>
                  <Link href={`/dashboard/user/forum/${t.id}`} className="block text-lg font-semibold hover:underline">{t.title}</Link>
                  {t.body && <p className="line-clamp-3 text-sm text-muted-foreground">{t.body}</p>}
                  {t.media?.[0] && (t.media[0].type === "video"
                    ? <video src={t.media[0].url} controls className="max-h-96 w-full rounded-lg bg-black" />
                    : <img src={t.media[0].url} alt="" className="max-h-96 w-full rounded-lg object-cover" />)}
                  <div className="flex items-center gap-2">
                    <ReactionBar clubId={clubId} targetType="thread" targetId={t.id} reactions={t.reactions} onChange={load} />
                    <Link href={`/dashboard/user/forum/${t.id}`} className="flex items-center gap-1 rounded-full border px-3 py-1 text-sm"><MessageCircle className="h-4 w-4" />{t.comments}</Link>
                  </div>
                </CardContent></Card>
              ))}
              {data.threads.length === 0 && <p className="py-10 text-center text-muted-foreground">No threads yet. Start the first one.</p>}
            </div>
            <MemberSidePanels data={data} />
          </div>
        )}
        {clubId && <MemberCreateThreadDialog clubId={clubId} open={create} onOpenChange={setCreate} onCreated={load} />}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
