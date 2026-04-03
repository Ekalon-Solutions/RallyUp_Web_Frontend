"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
import {
  Trophy,
  Target,
  Globe,
  Users,
  CheckCircle2,
  Lock,
  Clock,
  Loader2,
  RefreshCw,
  LogOut,
  Settings,
  ScrollText,
  Star,
  ChevronDown,
  LogIn,
} from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { ConsentModal, GlobalLeagueJoinModal } from "@/components/guess-the-score/consent-modal"
import { AllFixturesModal, type GTSFixture, type GTSPrediction } from "@/components/guess-the-score/all-fixtures-sheet"
import { GTSLeaderboard } from "@/components/guess-the-score/gts-leaderboard"
import { isPredictionDeadlinePassed, formatMatchDateTime, getMatchDeadline } from "@/components/guess-the-score/utils"

/** Live score polling – 5 minutes */
const LIVE_REFRESH_MS = 5 * 60 * 1000
/** Full fixture list refresh – 10 minutes */
const FIXTURE_REFRESH_MS = 10 * 60 * 1000

interface GTSPreferences {
  hasAcceptedConsent: boolean
  isInClubLeague: boolean
  isInGlobalLeague: boolean
  hasOptedOutGlobalLeagueSeason: boolean
  season: string
}

const RESULT_META: Record<string, { label: string; pts: string; color: string; bg: string }> = {
  exact: {
    label: "Exact!",
    pts: "+3 pts",
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
  },
  close: {
    label: "Close!",
    pts: "+1.5 pts",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
  },
  correct_outcome: {
    label: "Right result",
    pts: "+1 pt",
    color: "text-yellow-700 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800",
  },
  incorrect: {
    label: "Wrong",
    pts: "+0 pts",
    color: "text-destructive",
    bg: "bg-destructive/5 border-destructive/20",
  },
}

// ─── Fixture card ─────────────────────────────────────────────────────────────

function FixtureCard({
  fixture,
  prediction,
  clubId,
  onPredictionSubmitted,
}: {
  fixture: GTSFixture
  prediction?: GTSPrediction
  clubId: string
  onPredictionSubmitted: (p: GTSPrediction) => void
}) {
  const [home, setHome] = useState<string>(prediction ? String(prediction.homeScore) : "")
  const [away, setAway] = useState<string>(prediction ? String(prediction.awayScore) : "")
  const [submitting, setSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const deadlinePassed = isPredictionDeadlinePassed(fixture)
  const isFinished =
    fixture.strStatus === "Match Finished" ||
    fixture.strStatus === "FT" ||
    fixture.strStatus === "AET" ||
    fixture.strStatus === "PEN"
  const isLive =
    !isFinished &&
    fixture.strStatus !== "Not Started" &&
    fixture.strStatus !== "" &&
    fixture.strStatus != null

  const hasPrediction = !!prediction
  const resultMeta = prediction?.result ? RESULT_META[prediction.result] : null

  const handleSubmit = async () => {
    const h = parseInt(home, 10)
    const a = parseInt(away, 10)
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      toast.error("Enter valid scores (0 or above for each team)")
      return
    }
    if (isPredictionDeadlinePassed(fixture)) {
      toast.error("Prediction window has closed for this match.")
      return
    }
    setSubmitting(true)
    try {
      const res = await apiClient.submitGTSPrediction({
        fixtureId: fixture.idEvent,
        strTime: fixture.strTime,
        dateEvent: fixture.dateEvent,
        homeScore: h,
        awayScore: a,
        clubId,
        homeTeam: fixture.strHomeTeam,
        awayTeam: fixture.strAwayTeam,
      })
      if (res.success) {
        toast.success("Prediction saved!")
        setIsEditing(false)
        onPredictionSubmitted({
          _id: res.data?._id ?? fixture.idEvent,
          fixtureId: fixture.idEvent,
          homeScore: h,
          awayScore: a,
        })
      } else {
        toast.error(res.error || "Failed to save prediction")
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      {/* Header row */}
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary shrink-0" />
            <span className="font-semibold text-sm">Fixture</span>
            {fixture.strLeague && (
              <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                {fixture.strLeague}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {isLive && (
              <Badge variant="destructive" className="animate-pulse gap-1 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
                LIVE
              </Badge>
            )}
            {isFinished && <Badge variant="secondary" className="text-xs">Full Time</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{formatMatchDateTime(fixture)}</p>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-4">
        {/* Teams row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 text-center">
            {fixture.strHomeTeamBadge && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fixture.strHomeTeamBadge}
                alt={fixture.strHomeTeam}
                className="w-10 h-10 object-contain mx-auto mb-1"
              />
            )}
            <p className="font-semibold text-sm leading-tight">{fixture.strHomeTeam}</p>
            <p className="text-xs text-muted-foreground">Home</p>
          </div>

          <div className="text-center shrink-0 px-2">
            {(isLive || isFinished) ? (
              <p className="text-2xl font-bold tabular-nums">
                {fixture.intHomeScore ?? 0}
                <span className="text-muted-foreground mx-1.5">–</span>
                {fixture.intAwayScore ?? 0}
              </p>
            ) : (
              <p className="text-xl font-bold text-muted-foreground">vs</p>
            )}
          </div>

          <div className="flex-1 text-center">
            {fixture.strAwayTeamBadge && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fixture.strAwayTeamBadge}
                alt={fixture.strAwayTeam}
                className="w-10 h-10 object-contain mx-auto mb-1"
              />
            )}
            <p className="font-semibold text-sm leading-tight">{fixture.strAwayTeam}</p>
            <p className="text-xs text-muted-foreground">Away</p>
          </div>
        </div>

        <Separator />

        {/* Prediction area */}
        {hasPrediction && !isEditing ? (
          <div className={`rounded-lg border p-3 ${resultMeta ? resultMeta.bg : "bg-muted/50"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <span className="text-sm text-muted-foreground">Your prediction</span>
                <span className="text-base font-bold tabular-nums">
                  {prediction.homeScore}–{prediction.awayScore}
                </span>
              </div>
              {resultMeta ? (
                <div className={`text-right ${resultMeta.color}`}>
                  <p className="text-xs font-semibold">{resultMeta.label}</p>
                  <p className="text-sm font-bold">{resultMeta.pts}</p>
                </div>
              ) : !deadlinePassed ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              ) : null}
            </div>
            {!deadlinePassed && !resultMeta && (
              <p className="text-xs text-muted-foreground mt-2">
                <Clock className="w-3 h-3 inline mr-1" />
                {getMatchDeadline(fixture)}
              </p>
            )}
          </div>
        ) : deadlinePassed && !hasPrediction ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Prediction window closed.</span>
          </div>
        ) : (!hasPrediction || isEditing) ? (
          <div className="space-y-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3 shrink-0" />
              <span>{getMatchDeadline(fixture)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 flex-1">
                <span className="text-xs text-muted-foreground truncate text-right w-16 hidden sm:block">
                  {fixture.strHomeTeam}
                </span>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={home}
                  onChange={(e) => setHome(e.target.value)}
                  className="w-14 text-center text-lg font-bold"
                  placeholder="0"
                />
              </div>
              <span className="text-lg font-bold text-muted-foreground shrink-0">–</span>
              <div className="flex items-center gap-1.5 flex-1 justify-end">
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={away}
                  onChange={(e) => setAway(e.target.value)}
                  className="w-14 text-center text-lg font-bold"
                  placeholder="0"
                />
                <span className="text-xs text-muted-foreground truncate w-16 hidden sm:block">
                  {fixture.strAwayTeam}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setHome(String(prediction!.homeScore))
                    setAway(String(prediction!.awayScore))
                    setIsEditing(false)
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              )}
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={submitting || home === "" || away === ""}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : isEditing ? (
                  "Update Prediction"
                ) : (
                  "Submit Prediction"
                )}
              </Button>
            </div>
          </div>
        ) : null}

        {isLive && (
          <p className="text-xs text-muted-foreground text-center">
            Live score updates every 5 minutes
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Settings sheet ───────────────────────────────────────────────────────────

function SettingsSheet({
  open,
  onOpenChange,
  prefs,
  onOptOut,
  onOptIn,
  optingOut,
  optingIn,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  prefs: GTSPreferences
  onOptOut: () => void
  onOptIn: () => void
  optingOut: boolean
  optingIn: boolean
}) {
  const [showTerms, setShowTerms] = useState(false)

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              GTS Settings
            </SheetTitle>
            <SheetDescription>
              Manage your league membership and consent.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-5">
            {/* Season badge */}
            {prefs.season && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Season</span>
                <Badge variant="outline">{prefs.season}</Badge>
              </div>
            )}

            <Separator />

            {/* Club League */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Club League</span>
              </div>
              <Badge variant={prefs.isInClubLeague ? "secondary" : "outline"}>
                {prefs.isInClubLeague ? "Joined" : "Not joined"}
              </Badge>
            </div>

            {/* Global League */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Global League</p>
                  {prefs.hasOptedOutGlobalLeagueSeason && !prefs.isInGlobalLeague && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Opted out this season
                    </p>
                  )}
                </div>
              </div>
              <Badge variant={prefs.isInGlobalLeague ? "default" : "outline"}>
                {prefs.isInGlobalLeague ? "Joined" : "Not joined"}
              </Badge>
            </div>

            {/* Opt-out button */}
            {prefs.isInGlobalLeague && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => { onOpenChange(false); onOptOut() }}
                disabled={optingOut}
              >
                <LogOut className="w-4 h-4" />
                {optingOut ? "Opting out..." : "Opt out of Global League"}
              </Button>
            )}

            {/* Opt-in button */}
            {!prefs.isInGlobalLeague && !prefs.hasOptedOutGlobalLeagueSeason && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => { onOpenChange(false); onOptIn() }}
                disabled={optingIn}
              >
                <LogIn className="w-4 h-4" />
                Join Global League
              </Button>
            )}

            <Separator />

            {/* T&C link */}
            <button
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-left"
              onClick={() => setShowTerms(true)}
            >
              <ScrollText className="w-4 h-4 shrink-0" />
              View Terms & Conditions
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* T&C viewer */}
      <AlertDialog open={showTerms} onOpenChange={setShowTerms}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Terms & Conditions</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground space-y-2 max-h-72 overflow-y-auto leading-relaxed">
                <p>
                  <span className="font-medium text-foreground">1. Eligibility.</span> GTS is available
                  exclusively to registered club members. Administrators cannot participate.
                </p>
                <p>
                  <span className="font-medium text-foreground">2. Predictions.</span> One prediction per
                  fixture, submitted at least 90 minutes before kick-off. Predictions lock at that point
                  and cannot be changed.
                </p>
                <p>
                  <span className="font-medium text-foreground">3. Scoring.</span> 3 pts exact · 1.5 pts
                  close (correct result, ±1 goal total) · 1 pt correct outcome · 0 pts incorrect. Points
                  calculated ~10 minutes after full-time.
                </p>
                <p>
                  <span className="font-medium text-foreground">4. Leagues.</span> Club League (your club
                  only) and/or Global League (all Wingman Pro members). Once opted out of the Global
                  League in a season, you cannot opt back in for that season.
                </p>
                <p>
                  <span className="font-medium text-foreground">5. Leaderboard.</span> Only First Name,
                  Last Name, Club, and Points are displayed. No email, username, phone, or picture is
                  shown.
                </p>
                <p>
                  <span className="font-medium text-foreground">6. Fair Play.</span> Manipulation or
                  exploitation results in disqualification from all leagues.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuessTheScorePage() {
  const router = useRouter()
  const { isAdmin, isLoading: authLoading } = useAuth()
  const clubId = useRequiredClubId()

  const [prefs, setPrefs] = useState<GTSPreferences | null>(null)
  const [loadingPrefs, setLoadingPrefs] = useState(true)
  const [fixtures, setFixtures] = useState<GTSFixture[]>([])
  const [predictions, setPredictions] = useState<GTSPrediction[]>([])
  const [loadingFixtures, setLoadingFixtures] = useState(true)

  // Modal/dialog states
  const [showAllFixtures, setShowAllFixtures] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showOptOutDialog, setShowOptOutDialog] = useState(false)
  const [showOptInDialog, setShowOptInDialog] = useState(false)
  const [optingOut, setOptingOut] = useState(false)
  const [optingIn, setOptingIn] = useState(false)

  // User stats surfaced from the leaderboard fetch
  const [userRank, setUserRank] = useState<number | undefined>()
  const [userPoints, setUserPoints] = useState<number | undefined>()

  const liveRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fixtureRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasLiveRef = useRef(false)
  const isFetchingRef = useRef(false)

  // Block admin access
  useEffect(() => {
    if (!authLoading && isAdmin) router.replace("/dashboard")
  }, [authLoading, isAdmin, router])

  const loadPrefs = useCallback(async () => {
    if (!clubId) return
    setLoadingPrefs(true)
    try {
      const res = await apiClient.getGTSPreferences(clubId)
      if (res.success && res.data) setPrefs(res.data)
    } catch {
      // first-visit — consent modal will appear
    } finally {
      setLoadingPrefs(false)
    }
  }, [clubId])

  const loadFixturesAndPredictions = useCallback(async () => {
    if (!clubId || isFetchingRef.current) return
    isFetchingRef.current = true
    setLoadingFixtures(true)
    try {
      const [fixtureRes, predRes] = await Promise.allSettled([
        apiClient.getGTSFixtures(clubId),
        apiClient.getMyGTSPredictions(clubId),
      ])

      if (fixtureRes.status === "fulfilled" && fixtureRes.value.success && fixtureRes.value.data) {
        const list = fixtureRes.value.data.fixtures ?? []
        setFixtures(list)
        hasLiveRef.current = list.some(
          (f) =>
            f.strStatus !== "Not Started" &&
            f.strStatus !== "" &&
            f.strStatus !== "Match Finished" &&
            f.strStatus !== "FT" &&
            f.strStatus !== "AET" &&
            f.strStatus !== "PEN"
        )
      } else if (fixtureRes.status === "rejected") {
        toast.error("Failed to load fixtures")
      }

      if (predRes.status === "fulfilled" && predRes.value.success && predRes.value.data) {
        setPredictions(predRes.value.data.predictions ?? [])
      }
    } finally {
      isFetchingRef.current = false
      setLoadingFixtures(false)
    }
  }, [clubId])

  useEffect(() => {
    if (authLoading || !clubId) return
    loadPrefs()
  }, [authLoading, clubId, loadPrefs])

  useEffect(() => {
    if (!prefs?.hasAcceptedConsent || !clubId) return
    loadFixturesAndPredictions()
  }, [prefs?.hasAcceptedConsent, clubId, loadFixturesAndPredictions])

  // Fixture refresh – every 10 minutes
  useEffect(() => {
    if (!prefs?.hasAcceptedConsent || !clubId) return
    fixtureRefreshRef.current = setInterval(loadFixturesAndPredictions, FIXTURE_REFRESH_MS)
    return () => { if (fixtureRefreshRef.current) clearInterval(fixtureRefreshRef.current) }
  }, [prefs?.hasAcceptedConsent, clubId, loadFixturesAndPredictions])

  // Live score polling – every 5 minutes, only when hasLiveRef is true
  useEffect(() => {
    if (!prefs?.hasAcceptedConsent || !clubId) return
    liveRefreshRef.current = setInterval(() => {
      if (hasLiveRef.current) loadFixturesAndPredictions()
    }, LIVE_REFRESH_MS)
    return () => { if (liveRefreshRef.current) clearInterval(liveRefreshRef.current) }
  }, [prefs?.hasAcceptedConsent, clubId, loadFixturesAndPredictions])

  const handleConsentAccepted = (accepted: { isInClubLeague: boolean; isInGlobalLeague: boolean }) => {
    setPrefs((prev) => ({
      hasAcceptedConsent: true,
      isInClubLeague: accepted.isInClubLeague,
      isInGlobalLeague: accepted.isInGlobalLeague,
      hasOptedOutGlobalLeagueSeason: prev?.hasOptedOutGlobalLeagueSeason ?? false,
      season: prev?.season ?? "",
    }))
  }

  const handlePredictionSubmitted = (prediction: GTSPrediction) => {
    setPredictions((prev) => {
      const idx = prev.findIndex((p) => p.fixtureId === prediction.fixtureId)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = prediction
        return updated
      }
      return [...prev, prediction]
    })
  }

  const handleOptOut = async () => {
    if (!clubId) return
    setOptingOut(true)
    try {
      const res = await apiClient.optOutGlobalLeague(clubId)
      if (res.success) {
        toast.success("You've opted out of the Global League.")
        setPrefs((prev) => prev ? { ...prev, isInGlobalLeague: false, hasOptedOutGlobalLeagueSeason: true } : prev)
      } else {
        toast.error(res.error || "Failed to opt out")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setOptingOut(false)
      setShowOptOutDialog(false)
    }
  }

  const handleOptIn = async () => {
    if (!clubId) return
    setOptingIn(true)
    try {
      const res = await apiClient.optInGlobalLeague(clubId)
      if (res.success) {
        toast.success("You've joined the Global League!")
        setPrefs((prev) => prev ? { ...prev, isInGlobalLeague: true } : prev)
      } else {
        toast.error(res.error || "Failed to opt in")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setOptingIn(false)
      setShowOptInDialog(false)
    }
  }

  const FINISHED = new Set(["Match Finished", "FT", "AET", "PEN", "Post"])
  const isUpcoming = (f: GTSFixture) => {
    if (FINISHED.has(f.strStatus)) return false
    if (f.strStatus === "Not Started" || f.strStatus === "") return true
    // date-based fallback: treat as upcoming if kick-off is in the future
    const ko = new Date(`${f.dateEvent}T${f.strTime || "00:00:00"}Z`)
    return ko.getTime() > Date.now()
  }
  const isLiveStatus = (f: GTSFixture) =>
    !FINISHED.has(f.strStatus) && f.strStatus !== "Not Started" && f.strStatus !== ""

  // Next actionable fixture (live first, then upcoming)
  const nextFixture =
    fixtures.find(isLiveStatus) ?? fixtures.find(isUpcoming)

  const nextPrediction = nextFixture
    ? predictions.find((p) => p.fixtureId === nextFixture.idEvent)
    : undefined

  // ── Loading state ──────────────────────────────────────────────────────────

  if (authLoading || loadingPrefs) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* Consent modal – blocking on first visit */}
        {prefs && !prefs.hasAcceptedConsent && (
          <ConsentModal
            open
            clubId={clubId ?? ""}
            canJoinGlobal={!prefs.hasOptedOutGlobalLeagueSeason}
            onAccepted={handleConsentAccepted}
          />
        )}

        <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">

          {/* ── Page header ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Guess The Score
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Predict match scores · lock 90 mins before kick-off
              </p>
            </div>
            {prefs?.hasAcceptedConsent && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            )}
          </div>

          {/* ── Main two-column grid ─────────────────────────────────────── */}
          {prefs?.hasAcceptedConsent ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-4 items-start">

              {/* ── Left column ──────────────────────────────────────────── */}
              <div className="space-y-4">

                {/* Club level points & ranking */}
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      Club level points &amp; ranking
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-muted/50 p-3 text-center">
                        <p className="text-2xl font-bold">
                          {userRank != null ? `#${userRank}` : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">Your Rank</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3 text-center">
                        <p className="text-2xl font-bold text-primary">
                          {userPoints ?? 0}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">Points</p>
                      </div>
                    </div>

                    {/* Scoring legend */}
                    <div className="grid grid-cols-4 gap-1.5 mt-3">
                      {[
                        { pts: "3", label: "Exact", color: "text-green-600 dark:text-green-400" },
                        { pts: "1.5", label: "Close", color: "text-blue-600 dark:text-blue-400" },
                        { pts: "1", label: "Result", color: "text-yellow-600 dark:text-yellow-400" },
                        { pts: "0", label: "Wrong", color: "text-muted-foreground" },
                      ].map((s) => (
                        <div key={s.label} className="rounded border p-1.5 text-center">
                          <p className={`text-sm font-bold ${s.color}`}>{s.pts}</p>
                          <p className="text-[10px] text-muted-foreground">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Fixture */}
                {loadingFixtures ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-16">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </CardContent>
                  </Card>
                ) : nextFixture ? (
                  <FixtureCard
                    fixture={nextFixture}
                    prediction={nextPrediction}
                    clubId={clubId ?? ""}
                    onPredictionSubmitted={handlePredictionSubmitted}
                  />
                ) : (
                  <Card>
                    <CardContent className="text-center py-10">
                      <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No upcoming fixtures.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 gap-2"
                        onClick={loadFixturesAndPredictions}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Predict More button */}
                {fixtures.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setShowAllFixtures(true)}
                  >
                    Predict More
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* ── Right column – Leaderboard ────────────────────────────── */}
              <div>
                {(prefs.isInClubLeague || prefs.isInGlobalLeague) && clubId ? (
                  <GTSLeaderboard
                    clubId={clubId}
                    isInClubLeague={prefs.isInClubLeague}
                    isInGlobalLeague={prefs.isInGlobalLeague}
                    onUserStats={(rank, points) => {
                      setUserRank(rank)
                      setUserPoints(points)
                    }}
                  />
                ) : (
                  <Card>
                    <CardContent className="text-center py-16 text-muted-foreground text-sm">
                      Join a league to see the leaderboard.
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            // Pre-consent: show minimal loading / wait state
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* ── More Fixtures Prediction Modal ───────────────────────────── */}
        <AllFixturesModal
          open={showAllFixtures}
          onOpenChange={setShowAllFixtures}
          fixtures={fixtures}
          predictions={predictions}
          clubId={clubId ?? ""}
          onPredictionSubmitted={handlePredictionSubmitted}
        />

        {/* ── Settings sheet ───────────────────────────────────────────── */}
        {prefs && (
          <SettingsSheet
            open={showSettings}
            onOpenChange={setShowSettings}
            prefs={prefs}
            onOptOut={() => setShowOptOutDialog(true)}
            onOptIn={() => setShowOptInDialog(true)}
            optingOut={optingOut}
            optingIn={optingIn}
          />
        )}

        {/* ── Opt-out confirmation ─────────────────────────────────────── */}
        <AlertDialog open={showOptOutDialog} onOpenChange={setShowOptOutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Opt out of Global League?</AlertDialogTitle>
              <AlertDialogDescription>
                You'll be removed from the Global League for the rest of this season and cannot
                opt back in. Your Club League participation is unaffected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleOptOut}
                disabled={optingOut}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {optingOut ? "Opting out..." : "Yes, opt out"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── Opt-in (EULA + confirmation flow) ───────────────────────── */}
        <GlobalLeagueJoinModal
          open={showOptInDialog}
          onOpenChange={setShowOptInDialog}
          onConfirmed={handleOptIn}
          submitting={optingIn}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
