"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, History, Loader2, RefreshCw, Star, Target } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { apiClient, type GTSJoinedLeague, type GTSLeagueFixture, type GTSLeaguePrediction } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useSocket } from "@/contexts/socket-context"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { ConsentModal } from "@/components/guess-the-score/consent-modal"
import { ChooseLeagueModal } from "@/components/guess-the-score/choose-league-modal"
import { LeaguePicker } from "@/components/guess-the-score/league-picker"
import { FixtureRow, type GTSScoring } from "@/components/guess-the-score/fixture-row"
import { GTSLeaderboard } from "@/components/guess-the-score/gts-leaderboard"
import { groupIntoWeeks } from "@/components/guess-the-score/utils"

/** Fallback fixture refresh (covers socket disconnects) – 10 minutes */
const FIXTURE_REFRESH_MS = 10 * 60 * 1000
const DEFAULT_SCORING: GTSScoring = { exact: 3, close: 1.5, correctOutcome: 1, wrong: 0 }

const SCORING_TILES: { key: keyof GTSScoring; label: string; help: string }[] = [
  { key: "exact", label: "Exact", help: "Correct outcome and exact score predicted." },
  { key: "close", label: "Close", help: "Correct outcome predicted, with the score ±1 goal difference." },
  { key: "correctOutcome", label: "Result", help: "Correct outcome predicted, but the score is ±2 goal difference or more." },
  { key: "wrong", label: "Wrong", help: "Incorrect outcome predicted, irrespective of the goal difference or score." },
]

interface Prefs {
  hasAcceptedConsent: boolean
  hasOptedOutGlobalLeagueSeason: boolean
  season: string
  scoring?: GTSScoring
}

interface LeagueData {
  league: GTSJoinedLeague
  fixtures: GTSLeagueFixture[]
  predictions: GTSLeaguePrediction[]
  currentMatchdayKey: string | null
}

// Remembered league per viewer — a convenience only, so storage failures are ignored.
const storageKey = (userId?: string) => `gts:league:${userId ?? "anon"}`
const readStored = (userId?: string) => { try { return localStorage.getItem(storageKey(userId)) } catch { return null } }
const writeStored = (userId: string | undefined, id: string) => { try { localStorage.setItem(storageKey(userId), id) } catch { /* ignore */ } }

export default function WingmanPredictorPage() {
  const router = useRouter()
  const { user, isAdmin, isLoading: authLoading } = useAuth()
  const userId = user?._id as string | undefined
  const { socket } = useSocket()
  const clubId = useRequiredClubId() ?? ""

  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [leagues, setLeagues] = useState<GTSJoinedLeague[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [data, setData] = useState<LeagueData | null>(null)
  const [loadingFixtures, setLoadingFixtures] = useState(false)
  const [weekKey, setWeekKey] = useState<string | null>(null)
  const [stats, setStats] = useState<{ rank?: number; points?: number }>({})
  const [refreshKey, setRefreshKey] = useState(0)

  const [showChoose, setShowChoose] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [leaveTarget, setLeaveTarget] = useState<GTSJoinedLeague | null>(null)
  const [leaving, setLeaving] = useState(false)

  const weekStripRef = useRef<HTMLDivElement>(null)
  const scoring = prefs?.scoring ?? DEFAULT_SCORING

  useEffect(() => {
    if (!authLoading && isAdmin) router.replace("/dashboard")
  }, [authLoading, isAdmin, router])

  // ── Consent ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !clubId) return
    apiClient.getGTSPreferences(clubId)
      .then((res) => setPrefs(res.success && res.data ? res.data : { hasAcceptedConsent: false, hasOptedOutGlobalLeagueSeason: false, season: "" }))
      .catch(() => setPrefs({ hasAcceptedConsent: false, hasOptedOutGlobalLeagueSeason: false, season: "" }))
  }, [authLoading, clubId])

  // ── Joined leagues (the server auto-joins the club team's league on first visit) ──
  const loadLeagues = useCallback(async () => {
    const res = await apiClient.getMyGTSLeagues(clubId)
    const list = res.success && res.data ? res.data.leagues : []
    setLeagues(list)
    return list
  }, [clubId])

  useEffect(() => {
    if (!prefs?.hasAcceptedConsent || !clubId) return
    loadLeagues().then((list) => {
      const active = list.filter((l) => l.status === "active")
      const stored = readStored(userId)
      const pick = list.find((l) => l.competitionId === stored) ?? active[0] ?? list[0]
      if (pick) setSelectedId(pick.competitionId)
      if (active.length === 0) setShowChoose(true)
    })
  }, [prefs?.hasAcceptedConsent, clubId, userId, loadLeagues])

  const selectLeague = (id: string) => {
    setSelectedId(id)
    writeStored(userId, id)
  }

  // ── Fixtures for the selected league ───────────────────────────────────────
  const loadFixtures = useCallback(async (keepWeek: boolean) => {
    if (!selectedId) return
    setLoadingFixtures(true)
    try {
      const res = await apiClient.getGTSLeagueFixtures(selectedId, clubId)
      if (res.success && res.data) {
        setData(res.data)
        if (!keepWeek) setWeekKey(res.data.currentMatchdayKey)
      } else {
        toast.error(res.error || "Failed to load fixtures")
      }
    } finally {
      setLoadingFixtures(false)
    }
  }, [selectedId, clubId])

  useEffect(() => { setData(null); loadFixtures(false) }, [loadFixtures])

  useEffect(() => {
    if (!selectedId) return
    const t = setInterval(() => loadFixtures(true), FIXTURE_REFRESH_MS)
    return () => clearInterval(t)
  }, [selectedId, loadFixtures])

  // "Club level points & ranking" = the user's club board for the selected league.
  useEffect(() => {
    if (!selectedId || !clubId) return
    apiClient.getGTSLeagueLeaderboard({ competitionId: selectedId, scope: "club", clubId })
      .then((res) => setStats({ rank: res.data?.me?.rank, points: res.data?.me?.points }))
      .catch(() => setStats({}))
  }, [selectedId, clubId, refreshKey])

  // Points land ~10 min after full-time; update the card and the boards.
  useEffect(() => {
    if (!socket) return
    const onResult = (msg: { fixtureId: string; result: GTSLeaguePrediction["result"]; pointsEarned: number }) => {
      setData((d) => d && ({
        ...d,
        predictions: d.predictions.map((p) => p.fixtureId === msg.fixtureId ? { ...p, result: msg.result, pointsEarned: msg.pointsEarned } : p),
      }))
      setRefreshKey((k) => k + 1)
    }
    socket.on("gts:prediction-result", onResult)
    return () => { socket.off("gts:prediction-result", onResult) }
  }, [socket])

  const weeks = useMemo(() => groupIntoWeeks(data?.fixtures ?? []), [data?.fixtures])
  const week = weeks.find((w) => w.key === weekKey) ?? weeks[weeks.length - 1]
  const predictionFor = (id: string) => data?.predictions.find((p) => p.fixtureId === id)

  // Keep the selected week pill in view.
  useEffect(() => {
    weekStripRef.current?.querySelector<HTMLElement>("[data-selected=true]")?.scrollIntoView({ block: "nearest", inline: "center" })
  }, [week?.key])

  // ── Actions ────────────────────────────────────────────────────────────────
  const savePrediction = async (fixture: GTSLeagueFixture, home: number, away: number) => {
    try {
      const res = await apiClient.submitGTSLeaguePrediction({ fixtureId: fixture.idEvent, homeScore: home, awayScore: away, clubId })
      if (!res.success || !res.data) {
        toast.error(res.error || "Failed to save prediction")
        return false
      }
      const saved = res.data
      setData((d) => d && ({
        ...d,
        predictions: [
          ...d.predictions.filter((p) => p.fixtureId !== saved.fixtureId),
          { _id: saved._id, fixtureId: saved.fixtureId, homeScore: saved.homeScore, awayScore: saved.awayScore, result: null, pointsEarned: null },
        ],
      }))
      return true
    } catch {
      toast.error("Something went wrong. Please try again.")
      return false
    }
  }

  const onJoined = async (league: GTSJoinedLeague) => {
    await loadLeagues()
    selectLeague(league.competitionId)
    setRefreshKey((k) => k + 1)
  }

  const rejoin = async (league: GTSJoinedLeague) => {
    const res = await apiClient.joinGTSLeague(league.idLeague, clubId)
    if (res.success && res.data?.league) {
      toast.success(`Re-joined ${league.name}`)
      await onJoined(res.data.league)
      loadFixtures(false)
    } else {
      toast.error(res.error || "Couldn't re-join this league")
    }
  }

  const confirmLeave = async () => {
    if (!leaveTarget) return
    setLeaving(true)
    try {
      const res = await apiClient.leaveGTSLeague(leaveTarget.competitionId, clubId)
      if (res.success) {
        toast.success(`You left ${leaveTarget.name}. Your predictions are kept.`)
        await loadLeagues()
        setRefreshKey((k) => k + 1)
        if (leaveTarget.competitionId === selectedId) loadFixtures(false)
      } else {
        toast.error(res.error || "Couldn't leave this league")
      }
    } finally {
      setLeaving(false)
      setLeaveTarget(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (authLoading || !prefs) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const league = data?.league ?? leagues?.find((l) => l.competitionId === selectedId)
  const hasLeft = league?.status === "left"

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {!prefs.hasAcceptedConsent && (
          <ConsentModal
            open
            clubId={clubId}
            canJoinGlobal={!prefs.hasOptedOutGlobalLeagueSeason}
            onAccepted={() => setPrefs((p) => p && { ...p, hasAcceptedConsent: true })}
          />
        )}

        <div className="mx-auto max-w-8xl space-y-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start">
            <div>
              <h1 className="text-2xl font-bold">Wingman Predictor</h1>
              <p className="mt-1 text-sm text-muted-foreground">Predict match scores · lock 90 mins before kick-off</p>
            </div>
            {prefs.hasAcceptedConsent && leagues && (
              <div className="flex gap-3 lg:justify-end">
                <LeaguePicker
                  leagues={leagues}
                  selectedId={selectedId}
                  onSelect={selectLeague}
                  onJoinAnother={() => setShowChoose(true)}
                  onLeave={setLeaveTarget}
                  onRejoin={rejoin}
                />
                <Button variant="outline" className="h-10" onClick={() => setShowSettings(true)}>Settings</Button>
              </div>
            )}
          </div>

          {prefs.hasAcceptedConsent && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start">
              <div className="min-w-0 space-y-6">
                {/* Points & ranking */}
                <section className="rounded-2xl border bg-card p-5">
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <Star className="h-4 w-4" /> Club level points &amp; ranking
                  </h2>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-muted py-5 text-center">
                      <p className="text-2xl font-bold">{stats.rank ?? "—"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Your Rank</p>
                    </div>
                    <div className="rounded-lg bg-muted py-5 text-center">
                      <p className="text-2xl font-bold">{stats.points ?? 0}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Points</p>
                    </div>
                  </div>
                  <TooltipProvider delayDuration={150}>
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {SCORING_TILES.map((t) => (
                        <Tooltip key={t.key}>
                          <TooltipTrigger asChild>
                            <div tabIndex={0} className="cursor-help rounded-lg border py-3 text-center">
                              <p className="text-lg font-bold">{scoring[t.key]}</p>
                              <p className="text-xs text-muted-foreground">{t.label}</p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-52 text-center text-xs">{t.help}</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </TooltipProvider>
                </section>

                {league?.syncStatus === "degraded" && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    Live data for {league.name} is paused while our data provider has problems. Fixtures and results may be out of date; scoring resumes automatically.
                  </div>
                )}
                {hasLeft && league && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/50 p-3 text-sm">
                    <span className="flex items-center gap-2"><History className="h-4 w-4" /> You left {league.name}. Showing your past predictions only.</span>
                    <Button size="sm" variant="outline" onClick={() => rejoin(league)}>Re-join</Button>
                  </div>
                )}

                {/* Week pills */}
                {weeks.length > 0 && (
                  <div ref={weekStripRef} className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="tablist" aria-label="Match weeks">
                    {weeks.map((w) => {
                      const selected = w.key === week?.key
                      return (
                        <button
                          key={w.key}
                          type="button"
                          role="tab"
                          aria-selected={selected}
                          data-selected={selected}
                          title={w.range}
                          onClick={() => setWeekKey(w.key)}
                          className={cn(
                            "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                            selected ? "border-green-500 bg-green-500 text-black" : "bg-muted/60 hover:bg-muted"
                          )}
                        >
                          {w.label}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Fixtures */}
                <section className="rounded-2xl border bg-card p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-sm font-semibold">
                      <Target className="h-4 w-4" /> Fixtures
                      {week && <span className="font-normal text-muted-foreground">· {week.range}</span>}
                    </h2>
                    <button type="button" aria-label="Refresh fixtures" onClick={() => loadFixtures(true)} className="rounded p-1 text-muted-foreground hover:text-foreground">
                      <RefreshCw className={cn("h-4 w-4", loadingFixtures && "animate-spin")} />
                    </button>
                  </div>

                  {!selectedId ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                      <p>Join a league to start predicting.</p>
                      <Button className="mt-3" variant="outline" onClick={() => setShowChoose(true)}>Choose a league</Button>
                    </div>
                  ) : loadingFixtures && !data ? (
                    <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                  ) : !week ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">
                      {hasLeft ? "No past predictions in this league." : "No fixtures published for this league yet."}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {week.fixtures.map((f) => (
                        <FixtureRow key={f.idEvent} fixture={f} prediction={predictionFor(f.idEvent)} scoring={scoring} onSave={savePrediction} />
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {leagues && (
                <GTSLeaderboard clubId={clubId} leagues={leagues} pageCompetitionId={selectedId} refreshKey={refreshKey} />
              )}
            </div>
          )}
        </div>

        <ChooseLeagueModal open={showChoose} onOpenChange={setShowChoose} clubId={clubId} onJoined={onJoined} />

        <AlertDialog open={!!leaveTarget} onOpenChange={(o) => !o && setLeaveTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Leave {leaveTarget?.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                You'll drop off this league's leaderboard and its upcoming fixtures will be hidden. Your past predictions and
                points are kept, and you can re-join any time — matches that have already locked can't be predicted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => { e.preventDefault(); confirmLeave() }}
                disabled={leaving}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {leaving ? "Leaving..." : "Leave league"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Sheet open={showSettings} onOpenChange={setShowSettings}>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle>Predictor settings</SheetTitle>
              <SheetDescription>Your leagues and the rules of the game.</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-5 text-sm">
              <div className="space-y-2">
                <p className="font-medium">Your leagues</p>
                {(leagues ?? []).length === 0 && <p className="text-muted-foreground">None yet.</p>}
                {(leagues ?? []).map((l) => (
                  <div key={l.competitionId} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className={cn("truncate", l.status === "left" && "text-muted-foreground")}>
                      {l.name} <span className="text-xs text-muted-foreground">· {l.season}</span>
                    </span>
                    {l.status === "active" ? (
                      <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => { setShowSettings(false); setLeaveTarget(l) }}>Leave</Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-7" onClick={() => { setShowSettings(false); rejoin(l) }}>Re-join</Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full" onClick={() => { setShowSettings(false); setShowChoose(true) }}>
                  Join another league
                </Button>
              </div>
              <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
                <p className="text-sm font-medium text-foreground">Rules</p>
                <p>Predict any match up to 90 minutes before kick-off. The same scoring applies in every league: {scoring.exact} exact · {scoring.close} close · {scoring.correctOutcome} result · {scoring.wrong} wrong.</p>
                <p>Postponed, abandoned or cancelled matches aren't scored. If a result is corrected later, points are recalculated.</p>
                <p>Ties on the leaderboard are broken by exact scores, then close scores, then correct results.</p>
                <p>Leaving a league keeps your predictions and points; you drop off its live leaderboard but stay in the season-end archive.</p>
                <p>Only first name, last name, club and points appear on leaderboards.</p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
