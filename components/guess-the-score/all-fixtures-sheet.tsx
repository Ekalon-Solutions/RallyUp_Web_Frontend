"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Lock, CheckCircle2, Clock } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { isPredictionDeadlinePassed, formatMatchDateTime, getMatchDeadline } from "./utils"

export interface GTSFixture {
  idEvent: string
  strEvent: string
  strHomeTeam: string
  strAwayTeam: string
  strHomeTeamBadge?: string
  strAwayTeamBadge?: string
  dateEvent: string
  strTime: string
  strTimestamp?: string
  intHomeScore: string | null
  intAwayScore: string | null
  strStatus: string
  idLeague?: string
  strLeague?: string
}

export interface GTSPrediction {
  _id: string
  fixtureId: string
  homeScore: number
  awayScore: number
  pointsEarned?: number | null
  result?: "exact" | "close" | "correct_outcome" | "incorrect" | null
  finalHomeScore?: number | null
  finalAwayScore?: number | null
}

interface AllFixturesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fixtures: GTSFixture[]
  predictions: GTSPrediction[]
  clubId: string
  onPredictionSubmitted: (prediction: GTSPrediction) => void
}

const RESULT_LABEL: Record<string, { label: string; color: string }> = {
  exact: { label: "Exact! +3 pts", color: "text-green-600 dark:text-green-400" },
  close: { label: "Close! +1.5 pts", color: "text-blue-600 dark:text-blue-400" },
  correct_outcome: { label: "Right result +1 pt", color: "text-yellow-600 dark:text-yellow-400" },
  incorrect: { label: "Wrong +0 pts", color: "text-destructive" },
}

function FixtureRow({
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

  const handleSubmit = async () => {
    const h = parseInt(home, 10)
    const a = parseInt(away, 10)
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      toast.error("Please enter valid scores (0 or above)")
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
      toast.error("Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const resultInfo = prediction?.result ? RESULT_LABEL[prediction.result] : null

  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">
            {fixture.strHomeTeam} vs {fixture.strAwayTeam}
          </p>
          <p className="text-xs text-muted-foreground">{formatMatchDateTime(fixture)}</p>
          {fixture.strLeague && (
            <p className="text-xs text-muted-foreground">{fixture.strLeague}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isLive && (
            <Badge variant="destructive" className="text-xs animate-pulse gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
              LIVE {fixture.intHomeScore ?? 0}–{fixture.intAwayScore ?? 0}
            </Badge>
          )}
          {isFinished && (
            <Badge variant="secondary" className="text-xs">
              FT {fixture.intHomeScore}–{fixture.intAwayScore}
            </Badge>
          )}
          {!isFinished && !isLive && deadlinePassed && (
            <Badge variant="outline" className="text-xs gap-1">
              <Lock className="w-3 h-3" />
              Closed
            </Badge>
          )}
          {!deadlinePassed && !hasPrediction && (
            <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              {getMatchDeadline(fixture)}
            </Badge>
          )}
        </div>
      </div>

      {hasPrediction ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            <span className="text-muted-foreground">Your prediction:</span>
            <span className="font-semibold">
              {prediction.homeScore}–{prediction.awayScore}
            </span>
          </div>
          {resultInfo && (
            <span className={`text-xs font-medium ${resultInfo.color}`}>{resultInfo.label}</span>
          )}
        </div>
      ) : deadlinePassed ? (
        <p className="text-xs text-muted-foreground italic">Prediction window closed.</p>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground w-16 truncate text-right">
              {fixture.strHomeTeam}
            </span>
            <Input
              type="number"
              min={0}
              max={20}
              value={home}
              onChange={(e) => setHome(e.target.value)}
              className="w-14 h-8 text-center text-sm"
              placeholder="0"
            />
          </div>
          <span className="text-muted-foreground font-bold">–</span>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={0}
              max={20}
              value={away}
              onChange={(e) => setAway(e.target.value)}
              className="w-14 h-8 text-center text-sm"
              placeholder="0"
            />
            <span className="text-xs text-muted-foreground w-16 truncate">
              {fixture.strAwayTeam}
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || home === "" || away === ""}
            className="h-8"
          >
            {submitting ? "..." : "Save"}
          </Button>
        </div>
      )}
    </div>
  )
}

export function AllFixturesModal({
  open,
  onOpenChange,
  fixtures,
  predictions,
  clubId,
  onPredictionSubmitted,
}: AllFixturesModalProps) {
  const predMap = new Map(predictions.map((p) => [p.fixtureId, p]))

  const live = fixtures.filter(
    (f) =>
      f.strStatus !== "Not Started" &&
      f.strStatus !== "" &&
      f.strStatus !== "Match Finished" &&
      f.strStatus !== "FT" &&
      f.strStatus !== "AET" &&
      f.strStatus !== "PEN"
  )
  const upcoming = fixtures.filter((f) => f.strStatus === "Not Started" || f.strStatus === "")
  const finished = fixtures.filter(
    (f) =>
      f.strStatus === "Match Finished" ||
      f.strStatus === "FT" ||
      f.strStatus === "AET" ||
      f.strStatus === "PEN"
  )

  const renderGroup = (title: string, items: GTSFixture[]) => {
    if (items.length === 0) return null
    return (
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 px-1">
          {title}
        </p>
        {items.map((f, i) => (
          <div key={f.idEvent}>
            <FixtureRow
              fixture={f}
              prediction={predMap.get(f.idEvent)}
              clubId={clubId}
              onPredictionSubmitted={onPredictionSubmitted}
            />
            {i < items.length - 1 && <Separator />}
          </div>
        ))}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-full flex flex-col max-h-[85vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>More Fixtures</DialogTitle>
          <DialogDescription>
            Predict scores for all fixtures this season. Predictions lock 90 mins before kick-off.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6 mt-2">
          <div className="space-y-4 pb-4">
            {fixtures.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                No fixtures available.
              </p>
            ) : (
              <>
                {renderGroup("Live", live)}
                {renderGroup("Upcoming", upcoming)}
                {renderGroup("Finished", finished)}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
