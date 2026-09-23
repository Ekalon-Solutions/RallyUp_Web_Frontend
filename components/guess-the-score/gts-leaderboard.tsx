"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, RefreshCw, Star, Trophy } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { apiClient, type GTSBoardEntry, type GTSJoinedLeague } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

type Scope = "club" | "global"

function Row({ e, isMe }: { e: GTSBoardEntry; isMe: boolean }) {
  return (
    <div className={cn("grid grid-cols-[3rem_1fr_auto_3rem] items-center gap-2 border-t py-3 text-sm", isMe && "bg-primary/5 font-medium")}>
      <span className="flex items-center gap-1.5 pl-1">
        <Trophy className={cn("h-3.5 w-3.5", e.rank <= 3 ? "text-yellow-500" : "text-muted-foreground")} />
        {e.rank}
      </span>
      <span className="truncate font-semibold">
        {`${e.firstName} ${e.lastName}`.trim() || "—"}
        {isMe && <span className="ml-1.5 text-[10px] font-medium text-primary">You</span>}
      </span>
      <span className="max-w-28 truncate text-muted-foreground">{e.clubName || "—"}</span>
      <span className="flex items-center justify-end gap-1 pr-1 font-bold">
        <Star className="h-3.5 w-3.5 font-normal" />
        {e.points}
      </span>
    </div>
  )
}

/**
 * Leaderboard with its own league filter: each joined league plus the overall
 * board across all of them, for the user's club or globally. Follows the
 * page's selected league until the user picks a different one here.
 */
export function GTSLeaderboard({ clubId, leagues, pageCompetitionId, refreshKey }: {
  clubId: string
  leagues: GTSJoinedLeague[]
  pageCompetitionId: string | null
  /** Bump to refetch (e.g. after join/leave or a scored result). */
  refreshKey: number
}) {
  const { user } = useAuth()
  const userId = user?._id as string | undefined
  const [competitionId, setCompetitionId] = useState<string>(pageCompetitionId ?? "all")
  const [scope, setScope] = useState<Scope>("club")
  const [data, setData] = useState<{ leaderboard: GTSBoardEntry[]; me: GTSBoardEntry | null; total: number } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (pageCompetitionId) setCompetitionId(pageCompetitionId) }, [pageCompetitionId])

  const load = useCallback(async () => {
    if (!clubId) return
    setLoading(true)
    try {
      const res = await apiClient.getGTSLeagueLeaderboard({ competitionId, scope, clubId })
      setData(res.success && res.data ? res.data : { leaderboard: [], me: null, total: 0 })
    } finally {
      setLoading(false)
    }
  }, [clubId, competitionId, scope])

  useEffect(() => { load() }, [load, refreshKey])

  // Joined leagues, plus a left one while the page is showing its history.
  const options = leagues.filter((l) => l.status === "active" || l.competitionId === competitionId)
  const meInTop = !!data?.me && data.leaderboard.some((e) => e.userId === data.me!.userId)

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Trophy className="h-4 w-4" /> Leaderboard
          </h2>
          <p className="mt-1 pl-6 text-xs text-muted-foreground">
            Top 10 · {scope === "club" ? "Club League" : "Global"}
            {data?.total ? ` · ${data.total} players` : ""}
          </p>
        </div>
        <button type="button" onClick={load} aria-label="Refresh leaderboard" className="rounded p-1 text-muted-foreground hover:text-foreground">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        <Select value={competitionId} onValueChange={setCompetitionId}>
          <SelectTrigger className="h-8 flex-1 text-xs" aria-label="Leaderboard league">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((l) => (
              <SelectItem key={l.competitionId} value={l.competitionId} className="text-xs">{l.name}</SelectItem>
            ))}
            <SelectItem value="all" className="text-xs">All leagues (overall)</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex rounded-md border p-0.5 text-xs" role="tablist">
          {(["club", "global"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={scope === s}
              onClick={() => setScope(s)}
              className={cn("rounded px-2.5 py-1", scope === s ? "bg-foreground text-background" : "text-muted-foreground")}
            >
              {s === "club" ? "My club" : "Global"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[3rem_1fr_auto_3rem] gap-2 pb-2 text-[11px] font-semibold text-muted-foreground">
        <span className="pl-1">Rank</span><span>Name</span><span>Club</span><span className="pr-1 text-right">Points</span>
      </div>

      {loading && !data ? (
        <div className="flex justify-center border-t py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : !data || data.leaderboard.length === 0 ? (
        <p className="border-t py-10 text-center text-sm text-muted-foreground">No one on this board yet.</p>
      ) : (
        <>
          {data.leaderboard.map((e) => <Row key={e.userId} e={e} isMe={e.userId === userId} />)}
          {data.me && !meInTop && (
            <>
              <p className="border-t py-1 text-center text-xs text-muted-foreground">· · ·</p>
              <Row e={data.me} isMe />
            </>
          )}
        </>
      )}

      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
        Ties are broken by exact scores, then close scores, then correct results. Players level on all of these share a rank.
      </p>
    </div>
  )
}
