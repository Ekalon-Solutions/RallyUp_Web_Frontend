"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy, Medal, Award, Star, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

interface LeaderboardEntry {
  userId: string
  firstName: string
  lastName: string
  clubName: string
  points: number
  rank: number
}

interface GTSLeaderboardProps {
  clubId: string
  isInClubLeague: boolean
  isInGlobalLeague: boolean
  /** Called after the club-league data loads with the current user's rank and points */
  onUserStats?: (rank: number | undefined, points: number | undefined) => void
}

function RankCell({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="flex items-center gap-1.5">
        <Trophy className="w-4 h-4 text-yellow-500 shrink-0" />
        <span className="font-bold">1</span>
      </div>
    )
  if (rank === 2)
    return (
      <div className="flex items-center gap-1.5">
        <Medal className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="font-bold">2</span>
      </div>
    )
  if (rank === 3)
    return (
      <div className="flex items-center gap-1.5">
        <Award className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="font-bold">3</span>
      </div>
    )
  return <span className="font-medium text-muted-foreground">#{rank}</span>
}

function LeaderboardTable({
  entries,
  userRank,
  userPoints,
  userId,
}: {
  entries: LeaderboardEntry[]
  userRank?: number
  userPoints?: number
  userId?: string
}) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No predictions yet. Be the first!</p>
      </div>
    )
  }

  // Top 10 only
  const top10 = entries.slice(0, 10)
  const userInTop10 = userId ? top10.some((e) => e.userId === userId) : false
  const userEntry = userId ? entries.find((e) => e.userId === userId) : undefined
  const showUserRow = !userInTop10 && !!userEntry && userRank != null

  const fullName = (e: LeaderboardEntry) =>
    `${e.firstName} ${e.lastName}`.trim() || "—"

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="hidden sm:table-cell">Club</TableHead>
            <TableHead className="text-right w-20">Points</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {top10.map((entry) => {
            const isMe = entry.userId === userId
            return (
              <TableRow
                key={entry.userId}
                className={isMe ? "bg-primary/10 font-medium" : undefined}
              >
                <TableCell>
                  <RankCell rank={entry.rank} />
                </TableCell>
                <TableCell>
                  <span className="font-medium">{fullName(entry)}</span>
                  {isMe && (
                    <Badge variant="outline" className="ml-2 text-xs py-0 align-middle">
                      You
                    </Badge>
                  )}
                  {/* Show club inline on mobile */}
                  <p className="text-xs text-muted-foreground sm:hidden mt-0.5">
                    {entry.clubName || "—"}
                  </p>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                  {entry.clubName || "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500" />
                    <span className="font-semibold">{entry.points}</span>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}

          {/* Separator row + user's own row when outside top 10 */}
          {showUserRow && (
            <>
              <TableRow>
                <TableCell colSpan={4} className="py-1 text-center">
                  <span className="text-xs text-muted-foreground">· · ·</span>
                </TableCell>
              </TableRow>
              <TableRow className="bg-primary/10 font-medium">
                <TableCell>
                  <RankCell rank={userRank!} />
                </TableCell>
                <TableCell>
                  <span className="font-medium">{fullName(userEntry!)}</span>
                  <Badge variant="outline" className="ml-2 text-xs py-0 align-middle">
                    You
                  </Badge>
                  <p className="text-xs text-muted-foreground sm:hidden mt-0.5">
                    {userEntry!.clubName || "—"}
                  </p>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                  {userEntry!.clubName || "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500" />
                    <span className="font-semibold">{userEntry!.points}</span>
                  </div>
                </TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export function GTSLeaderboard({ clubId, isInClubLeague, isInGlobalLeague, onUserStats }: GTSLeaderboardProps) {
  const { user } = useAuth()
  const userId = user?._id

  const defaultTab: "club" | "global" = isInClubLeague ? "club" : "global"
  const [activeTab, setActiveTab] = useState<"club" | "global">(defaultTab)
  const [clubData, setClubData] = useState<{
    entries: LeaderboardEntry[]
    userRank?: number
    userPoints?: number
  } | null>(null)
  const [globalData, setGlobalData] = useState<{
    entries: LeaderboardEntry[]
    userRank?: number
    userPoints?: number
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchLeaderboard = useCallback(
    async (type: "club" | "global") => {
      setLoading(true)
      try {
        const res = await apiClient.getGTSLeaderboard({ clubId, type })
        if (res.success && res.data) {
          const payload = {
            entries: res.data.leaderboard ?? [],
            userRank: res.data.userRank,
            userPoints: res.data.userPoints,
          }
          if (type === "club") {
            setClubData(payload)
            onUserStats?.(res.data.userRank, res.data.userPoints)
          } else {
            setGlobalData(payload)
          }
        } else {
          toast.error(res.error || "Failed to load leaderboard")
        }
      } catch {
        toast.error("Failed to load leaderboard")
      } finally {
        setLoading(false)
      }
    },
    [clubId]
  )

  useEffect(() => {
    if (isInClubLeague && !clubData) fetchLeaderboard("club")
  }, [isInClubLeague, clubData, fetchLeaderboard])

  useEffect(() => {
    if (isInGlobalLeague && activeTab === "global" && !globalData) fetchLeaderboard("global")
  }, [isInGlobalLeague, activeTab, globalData, fetchLeaderboard])

  const currentData = activeTab === "club" ? clubData : globalData
  const showTabs = isInClubLeague && isInGlobalLeague

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="w-5 h-5" />
              Leaderboard
            </CardTitle>
            <CardDescription className="mt-0.5">
              Top 10 · {showTabs ? "Switch between leagues using the tabs" : activeTab === "club" ? "Club League" : "Global League"}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchLeaderboard(activeTab)}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {showTabs && (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "club" | "global")}
            className="mt-3"
          >
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="club">Club League</TabsTrigger>
              <TabsTrigger value="global">Global League</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {loading && !currentData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <LeaderboardTable
            entries={currentData?.entries ?? []}
            userRank={currentData?.userRank}
            userPoints={currentData?.userPoints}
            userId={userId}
          />
        )}
      </CardContent>
    </Card>
  )
}
