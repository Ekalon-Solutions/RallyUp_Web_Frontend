"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Users, Globe, Trophy, AlertCircle, X } from "lucide-react"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"

interface ConsentModalProps {
  open: boolean
  clubId: string
  /** False when the user has already opted out of Global this season */
  canJoinGlobal: boolean
  onAccepted: (prefs: { isInClubLeague: boolean; isInGlobalLeague: boolean }) => void
}

// ─── Step 1: League selection ────────────────────────────────────────────────

function LeagueSelectionStep({
  canJoinGlobal,
  joinClub,
  setJoinClub,
  joinGlobal,
  setJoinGlobal,
  onSubmit,
  submitting,
}: {
  canJoinGlobal: boolean
  joinClub: boolean
  setJoinClub: (v: boolean) => void
  joinGlobal: boolean
  setJoinGlobal: (v: boolean) => void
  onSubmit: () => void
  submitting: boolean
}) {
  const noneSelected = !joinClub && !joinGlobal

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-5 h-5 text-primary" />
          <DialogTitle>Welcome to Guess The Score</DialogTitle>
        </div>
        <DialogDescription>
          Predict match scores and earn points. Choose which league(s) you want to compete in.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 py-1">
        {/* Club League */}
        <label className="flex items-start gap-3 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
          <Checkbox
            checked={joinClub}
            onCheckedChange={(v) => setJoinClub(!!v)}
            className="mt-0.5"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Club League</span>
              <Badge variant="secondary" className="text-xs">Recommended</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Compete with registered members of your club only.
            </p>
          </div>
        </label>

        {/* Global League */}
        <label
          className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
            canJoinGlobal ? "cursor-pointer hover:bg-muted/50" : "opacity-50 cursor-not-allowed"
          }`}
        >
          <Checkbox
            checked={joinGlobal}
            onCheckedChange={(v) => canJoinGlobal && setJoinGlobal(!!v)}
            disabled={!canJoinGlobal}
            className="mt-0.5"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-sm">Global League</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {canJoinGlobal
                ? "Compete with all Wingman Pro members across every club. T&C acceptance required."
                : "You have opted out of the Global League for this season."}
            </p>
          </div>
        </label>

        {noneSelected && (
          <div className="flex items-center gap-2 text-xs text-destructive px-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Please select at least one league to continue.</span>
          </div>
        )}
      </div>

      <Button
        className="w-full"
        onClick={onSubmit}
        disabled={noneSelected || submitting}
      >
        {submitting ? "Saving..." : "Continue"}
      </Button>
    </>
  )
}

// ─── Step 2: T&C for Global League ───────────────────────────────────────────

function GlobalTermsStep({
  onAccept,
  onReject,
  submitting,
}: {
  onAccept: () => void
  onReject: () => void
  submitting: boolean
}) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    // Allow 20px tolerance so the button unlocks just before pixel-perfect bottom
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setScrolledToBottom(true)
    }
  }

  return (
    <>
      <DialogHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" />
            <DialogTitle>Global League – Terms & Conditions</DialogTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={onReject}
            disabled={submitting}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <DialogDescription>
          Please read the full Terms & Conditions below. Scroll to the bottom to enable the Accept button.
        </DialogDescription>
      </DialogHeader>

      <ScrollArea
        className="h-64 rounded-md border p-4 text-sm text-muted-foreground leading-relaxed"
        onScrollCapture={handleScroll}
      >
        <p className="font-semibold text-foreground mb-3">
          Guess The Score – Global League End User Licence Agreement
        </p>

        <p className="mb-3">
          By accepting these Terms & Conditions ("T&C"), you agree to participate in the Wingman Pro
          Global League as part of the Guess The Score feature ("GTS"). These terms govern your
          participation across all clubs on the Wingman Pro platform.
        </p>

        <p className="font-medium text-foreground mb-1">1. Eligibility</p>
        <p className="mb-3">
          The Global League is open to all registered Wingman Pro members with an active club
          membership. Administrators and system owners are excluded. Participation is subject to your
          club's terms and Wingman Pro's platform-wide policies.
        </p>

        <p className="font-medium text-foreground mb-1">2. Predictions & Lock Time</p>
        <p className="mb-3">
          You may submit and update your prediction for any fixture up until 90 minutes before the
          scheduled kick-off time ("Lock Time"). No predictions may be submitted or changed after Lock
          Time. The Lock Time is determined by the official StrTime field provided by TheSportsDB and is
          enforced by the server; client-side countdowns are indicative only.
        </p>

        <p className="font-medium text-foreground mb-1">3. Points Scoring</p>
        <p className="mb-3">
          Points are awarded approximately 10 minutes after the official full-time signal as recorded by
          TheSportsDB. The scoring system is: 3 points for an exact scoreline prediction; 1.5 points for a
          "Close" prediction (correct match outcome with a combined goal difference of exactly 1); 1 point
          for correctly predicting the match outcome (home win, draw, or away win) with a greater goal
          difference; and 0 points for an incorrect outcome prediction. Wingman Pro reserves the right to
          adjust or withhold points in cases of data error, system fault, or fair-play violations.
        </p>

        <p className="font-medium text-foreground mb-1">4. Leaderboard & Data Visibility</p>
        <p className="mb-3">
          Your first name, last name, and club name will be displayed on the Global League leaderboard
          alongside your accumulated points and rank. No other personal data (including username, email
          address, phone number, or profile picture) will be shown. By accepting these T&C you consent to
          this limited display of your name and club.
        </p>

        <p className="font-medium text-foreground mb-1">5. Opt-Out</p>
        <p className="mb-3">
          You may opt out of the Global League at any time via your GTS settings. Opting out will
          immediately remove your entry from the Global leaderboard. Once opted out during a season, you
          cannot opt back in for the remainder of that season. Your Club League participation and point
          history are not affected by opting out of the Global League.
        </p>

        <p className="font-medium text-foreground mb-1">6. Fair Play & Disqualification</p>
        <p className="mb-3">
          Any attempt to manipulate predictions, exploit system vulnerabilities, or engage in conduct
          detrimental to fair competition will result in immediate disqualification and permanent removal
          from all GTS leagues. Wingman Pro may share information about disqualified accounts with
          affiliated clubs.
        </p>

        <p className="font-medium text-foreground mb-1">7. Amendments</p>
        <p className="mb-3">
          Wingman Pro reserves the right to amend these T&C at any time. Material changes will be
          communicated via the platform. Continued participation after notification of changes constitutes
          acceptance of the revised terms.
        </p>

        <p className="font-medium text-foreground mb-1">8. Governing Law</p>
        <p>
          These T&C are governed by the laws of England and Wales. Any disputes shall be subject to the
          exclusive jurisdiction of the courts of England and Wales.
        </p>
      </ScrollArea>

      {!scrolledToBottom && (
        <p className="text-xs text-muted-foreground text-center -mt-1">
          Scroll to the bottom to enable the Accept button.
        </p>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onReject}
          disabled={submitting}
        >
          Reject
        </Button>
        <Button
          className="flex-1"
          onClick={onAccept}
          disabled={!scrolledToBottom || submitting}
        >
          {submitting ? "Saving..." : "Accept & Join"}
        </Button>
      </div>
    </>
  )
}

// ─── Root modal ──────────────────────────────────────────────────────────────

export function ConsentModal({ open, clubId, canJoinGlobal, onAccepted }: ConsentModalProps) {
  // "league" = step 1, "terms" = step 2 (T&C for Global)
  const [step, setStep] = useState<"league" | "terms">("league")
  const [joinClub, setJoinClub] = useState(true)
  const [joinGlobal, setJoinGlobal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const submitConsent = async (withGlobal: boolean) => {
    setSubmitting(true)
    try {
      const res = await apiClient.acceptGTSConsent({
        clubId,
        joinClubLeague: joinClub,
        joinGlobalLeague: withGlobal,
      })
      if (res.success) {
        toast.success("You're all set! Start predicting match scores.")
        onAccepted({ isInClubLeague: joinClub, isInGlobalLeague: withGlobal })
      } else {
        toast.error(res.error || "Failed to save preferences")
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // Step 1 "Continue" clicked
  const handleLeagueSubmit = () => {
    if (joinGlobal) {
      // Must accept T&C before Global League is confirmed
      setStep("terms")
    } else {
      // Club only – no T&C required
      submitConsent(false)
    }
  }

  // Step 2 "Accept" clicked
  const handleTermsAccept = () => {
    submitConsent(true)
  }

  // Step 2 "Reject" clicked → back to step 1 with Global unchecked
  const handleTermsReject = () => {
    setJoinGlobal(false)
    setStep("league")
  }

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-lg gap-4"
        onInteractOutside={(e) => e.preventDefault()}
        // Hide the default close button – user must make a choice
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {step === "league" ? (
          <LeagueSelectionStep
            canJoinGlobal={canJoinGlobal}
            joinClub={joinClub}
            setJoinClub={setJoinClub}
            joinGlobal={joinGlobal}
            setJoinGlobal={setJoinGlobal}
            onSubmit={handleLeagueSubmit}
            submitting={submitting}
          />
        ) : (
          <GlobalTermsStep
            onAccept={handleTermsAccept}
            onReject={handleTermsReject}
            submitting={submitting}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
