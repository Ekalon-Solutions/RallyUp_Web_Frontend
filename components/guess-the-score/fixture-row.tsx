"use client"

import { useEffect, useState } from "react"
import { Check, Loader2, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GTSLeagueFixture, GTSLeaguePrediction } from "@/lib/api"
import { formatMatchDateTime, getMatchDeadline, isFixtureLocked } from "./utils"

export interface GTSScoring {
  exact: number
  close: number
  correctOutcome: number
  wrong: number
}

const RESULT_META = {
  exact: { label: "Exact", key: "exact", cls: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900" },
  close: { label: "Close", key: "close", cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900" },
  correct_outcome: { label: "Result", key: "correctOutcome", cls: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-900" },
  incorrect: { label: "Wrong", key: "wrong", cls: "bg-muted text-muted-foreground border-border" },
} as const

const CALLED_OFF: Record<string, string> = { postponed: "Postponed", cancelled: "Cancelled", abandoned: "Abandoned" }

function TeamBadge({ src, name }: { src?: string | null; name: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} className="h-8 w-8 shrink-0 rounded-full object-contain" />
  ) : (
    <span className="h-8 w-8 shrink-0 rounded-full bg-muted" aria-hidden />
  )
}

function ScoreBox({ value, onChange, onBlur, disabled, label }: {
  value: string
  onChange: (v: string) => void
  onBlur: () => void
  disabled: boolean
  label: string
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={2}
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 2))}
      onBlur={onBlur}
      className={cn(
        "h-10 w-10 rounded-md border border-foreground/40 bg-background text-center text-base font-semibold tabular-nums",
        "focus:outline-none focus:ring-2 focus:ring-primary disabled:border-border disabled:opacity-80"
      )}
    />
  )
}

export function FixtureRow({ fixture, prediction, scoring, onSave }: {
  fixture: GTSLeagueFixture
  prediction?: GTSLeaguePrediction
  scoring: GTSScoring
  /** Resolves true when the server accepted the prediction. */
  onSave: (fixture: GTSLeagueFixture, home: number, away: number) => Promise<boolean>
}) {
  const [home, setHome] = useState(prediction ? String(prediction.homeScore) : "")
  const [away, setAway] = useState(prediction ? String(prediction.awayScore) : "")
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  // Pick up server-side changes (e.g. saved from another tab, result pushed by socket).
  useEffect(() => {
    setHome(prediction ? String(prediction.homeScore) : "")
    setAway(prediction ? String(prediction.awayScore) : "")
  }, [prediction?.homeScore, prediction?.awayScore]) // eslint-disable-line react-hooks/exhaustive-deps

  const locked = isFixtureLocked(fixture)
  const calledOff = CALLED_OFF[fixture.status]
  const finished = fixture.status === "finished"
  const result = prediction?.result ? RESULT_META[prediction.result] : null

  const save = async () => {
    if (locked || saving || home === "" || away === "") return
    const h = Number(home)
    const a = Number(away)
    if (prediction && prediction.homeScore === h && prediction.awayScore === a) return
    setSaving(true)
    const ok = await onSave(fixture, h, a)
    setSaving(false)
    if (ok) {
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2000)
    }
  }

  return (
    <div className="relative rounded-xl border bg-card px-4 py-5 sm:px-8">
      <div className="absolute right-3 top-2 flex items-center gap-1.5">
        {fixture.status === "live" && (
          <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground">LIVE</span>
        )}
        {calledOff ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{calledOff}</span>
        ) : locked && fixture.status !== "live" && (
          <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            <Lock className="h-2.5 w-2.5" /> Locked
          </span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <TeamBadge src={fixture.strHomeTeamBadge} name={fixture.strHomeTeam} />
          <span className="truncate text-sm font-semibold">{fixture.strHomeTeam}</span>
        </div>

        <div className="flex items-center gap-2">
          <ScoreBox label={`${fixture.strHomeTeam} score`} value={home} onChange={setHome} onBlur={save} disabled={locked || saving} />
          <span className="text-muted-foreground">–</span>
          <ScoreBox label={`${fixture.strAwayTeam} score`} value={away} onChange={setAway} onBlur={save} disabled={locked || saving} />
        </div>

        <div className="flex min-w-0 items-center justify-end gap-3">
          <span className="truncate text-right text-sm font-semibold">{fixture.strAwayTeam}</span>
          <TeamBadge src={fixture.strAwayTeamBadge} name={fixture.strAwayTeam} />
        </div>
      </div>

      <div className="mt-2 flex min-h-5 flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {(finished || fixture.status === "live") && fixture.intHomeScore != null ? (
          <span className="font-medium text-foreground">
            {finished ? "FT" : "Now"} {fixture.intHomeScore}–{fixture.intAwayScore}
          </span>
        ) : (
          <span>{formatMatchDateTime(fixture)}</span>
        )}
        {!locked && !calledOff && <span>{getMatchDeadline(fixture)}</span>}
        {saving && <Loader2 className="h-3 w-3 animate-spin" />}
        {justSaved && <span className="flex items-center gap-1 text-green-600"><Check className="h-3 w-3" /> Saved</span>}
        {result && (
          <span className={cn("rounded-full border px-2 py-0.5 font-semibold", result.cls)}>
            {result.label} +{scoring[result.key]}
          </span>
        )}
        {finished && prediction && !result && <span>Scoring soon</span>}
        {calledOff && prediction && <span>Not scored — match {calledOff.toLowerCase()}</span>}
      </div>
    </div>
  )
}
