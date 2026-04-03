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
import { Users, Globe, Trophy, AlertCircle, ShieldCheck } from "lucide-react"
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
                ? "Compete with all Wingman Pro members across every club. EULA acceptance required."
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

// ─── Step 2: Full EULA (Part A) ───────────────────────────────────────────────

function EulaStep({
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
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setScrolledToBottom(true)
    }
  }

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-500" />
          <DialogTitle>Global League – End User Licence Agreement</DialogTitle>
        </div>
        <DialogDescription>
          Please read the full EULA below. Scroll to the bottom to enable the I Consent button.
        </DialogDescription>
      </DialogHeader>

      <ScrollArea
        className="h-72 rounded-md border p-4 text-sm text-muted-foreground leading-relaxed"
        onScrollCapture={handleScroll}
      >
        <p className="font-semibold text-foreground mb-1">
          Wingman Pro "Guess-the-Score" Global League
        </p>
        <p className="text-xs text-muted-foreground mb-4">Last Updated: April 2, 2026</p>

        <p className="font-medium text-foreground mb-1">1. Acceptance of Terms</p>
        <p className="mb-3">
          By selecting the "Join Global League" option, you ("The Participant") explicitly agree to
          be bound by these supplemental Terms and Conditions in addition to the standard Wingman
          Pro Privacy Policy. If you do not agree to these terms, you may still participate in your
          "Club-Only League" without entering the Global League.
        </p>

        <p className="font-medium text-foreground mb-1">2. Eligibility &amp; Opt-In</p>
        <p className="mb-3">
          Participation in the Global League is voluntary. Entry requires a clear affirmative action
          (Opt-In) by the user. By joining, you acknowledge that your participation involves a
          transition from a private "Club" environment to a "Global" community environment within
          the Wingman Pro platform.
        </p>

        <p className="font-medium text-foreground mb-1">3. Data Disclosure &amp; Visibility (Public Leaderboard)</p>
        <p className="mb-2">
          In compliance with the Digital Personal Data Protection Act (DPDPA), 2023 and GDPR, we
          hereby disclose the specific data points that will be made visible to other users globally
          if you reach the Top 10 positions on the leaderboard:
        </p>
        <ul className="list-disc pl-5 mb-3 space-y-1">
          <li><span className="text-foreground font-medium">Full Name:</span> First Name and Last Name as registered.</li>
          <li><span className="text-foreground font-medium">Username:</span> As assigned by your Club Admin or selected during registration.</li>
          <li><span className="text-foreground font-medium">Club Affiliation:</span> The name of the specific Supporters' Club or Group you are registered with on Wingman Pro.</li>
          <li><span className="text-foreground font-medium">Game Performance:</span> Your accumulated points, rank and score history.</li>
        </ul>

        <p className="font-medium text-foreground mb-1">4. Protection of Personally Identifiable Information (PII)</p>
        <p className="mb-2">
          RallyUp Solutions Private Limited guarantees that the following sensitive PII will{" "}
          <span className="font-semibold text-foreground">NEVER</span> be displayed, shared, or
          made searchable in the Global League interface:
        </p>
        <ul className="list-disc pl-5 mb-3 space-y-1">
          <li><span className="text-foreground font-medium">Contact Information:</span> Mobile numbers and Email addresses.</li>
          <li><span className="text-foreground font-medium">Identity Media:</span> Profile pictures or avatars.</li>
          <li><span className="text-foreground font-medium">Sensitive Data:</span> Residential addresses, payment histories, or Government IDs.</li>
          <li><span className="text-foreground font-medium">Communication:</span> Direct contact links to your private profile.</li>
        </ul>

        <p className="font-medium text-foreground mb-1">5. Purpose of Processing</p>
        <p className="mb-2">
          The processing of your Name and Club affiliation for the Global League is strictly for
          the purpose of:
        </p>
        <ol className="list-decimal pl-5 mb-3 space-y-1">
          <li>Maintaining a transparent and competitive "Guess-the-Score" ranking system.</li>
          <li>Verifying the authenticity of participants to prevent bot activity.</li>
          <li>Fostering community engagement across different supporters' groups.</li>
        </ol>

        <p className="font-medium text-foreground mb-1">6. User Rights (Withdrawal of Consent)</p>
        <p className="mb-2">
          Under DPDPA (India), you have the "Right to Withdraw Consent" at any time.
        </p>
        <ul className="list-disc pl-5 mb-3 space-y-1">
          <li>If you choose to leave the Global League, your data will be removed from the Global Leaderboard within 24–48 hours.</li>
          <li>Withdrawal from the Global League does not affect your points or status within your private "Club League."</li>
          <li>To withdraw, navigate to Game Settings &gt; Privacy &gt; Leave Global League.</li>
        </ul>

        <p className="font-medium text-foreground mb-1">7. Code of Conduct &amp; Gamification</p>
        <p className="mb-3">
          Participants must not use usernames that are offensive, defamatory, or infringe on
          third-party trademarks. RallyUp Solutions reserves the right to anonymize or remove any
          participant from the Global League who violates community standards or attempts to
          manipulate scores via unauthorized technical means.
        </p>

        <p className="font-medium text-foreground mb-1">8. Limitation of Liability</p>
        <p className="mb-3">
          While RallyUp Solutions employs industry-standard encryption (SSL/HTTPS) to protect your
          data in transit, by joining the Global League, you acknowledge that your Name and Club
          affiliation will be visible to other registered users of the platform. RallyUp Solutions
          is not responsible for any third-party actions resulting from this public-facing
          leaderboard visibility.
        </p>

        <p className="font-medium text-foreground mb-1">9. Governing Law</p>
        <p>
          These terms are governed by the laws of India. Any disputes arising from participation in
          the Global League shall be subject to the exclusive jurisdiction of the courts in Mumbai,
          Maharashtra.
        </p>
      </ScrollArea>

      {!scrolledToBottom && (
        <p className="text-xs text-muted-foreground text-center -mt-1">
          Scroll to the bottom to enable the I Consent button.
        </p>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onReject}
          disabled={submitting}
        >
          Not Now
        </Button>
        <Button
          className="flex-1"
          onClick={onAccept}
          disabled={!scrolledToBottom || submitting}
        >
          I Consent
        </Button>
      </div>
    </>
  )
}

// ─── Step 3: Confirmation (Part B) ───────────────────────────────────────────

function GlobalConfirmStep({
  onConfirm,
  onReject,
  submitting,
}: {
  onConfirm: () => void
  onReject: () => void
  submitting: boolean
}) {
  const [agreed, setAgreed] = useState(false)

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-blue-500" />
          <DialogTitle>Ready to Go Global?</DialogTitle>
        </div>
        <DialogDescription>
          By joining the Wingman Pro Global League, you are opting to compete with supporters from
          every club on the platform.
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-lg border bg-muted/30 p-4 space-y-3 text-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          To maintain a fair and transparent leaderboard, we need your consent for the following:
        </p>
        <div className="space-y-2.5">
          <div className="flex gap-2.5">
            <Globe className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Leaderboard Visibility</p>
              <p className="text-xs text-muted-foreground">
                If you reach the Top 10, your Full Name, Username and Club Name will be visible
                to all Wingman Pro users.
              </p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <ShieldCheck className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Data Privacy</p>
              <p className="text-xs text-muted-foreground">
                Your PII (Phone, Email, Address and Profile Picture) remains 100% Private and
                will never be shared or displayed.
              </p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <Users className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Control</p>
              <p className="text-xs text-muted-foreground">
                You can leave the Global League and revert to "Club-Only" mode at any time via
                your Game Settings.
              </p>
            </div>
          </div>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <Checkbox
          checked={agreed}
          onCheckedChange={(v) => setAgreed(!!v)}
          className="mt-0.5"
        />
        <p className="text-xs text-muted-foreground leading-relaxed">
          I have read and agree to the Global League T&amp;C and authorize RallyUp Solutions to
          display my name and club affiliation on the global leaderboard.
        </p>
      </label>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onReject}
          disabled={submitting}
        >
          Not Now
        </Button>
        <Button
          className="flex-1"
          onClick={onConfirm}
          disabled={!agreed || submitting}
        >
          {submitting ? "Saving..." : "I Agree & Join"}
        </Button>
      </div>
    </>
  )
}

// ─── Standalone join-from-settings modal (EULA → Confirm) ────────────────────

interface GlobalLeagueJoinModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirmed: () => void
  submitting: boolean
}

export function GlobalLeagueJoinModal({
  open,
  onOpenChange,
  onConfirmed,
  submitting,
}: GlobalLeagueJoinModalProps) {
  const [step, setStep] = useState<"eula" | "confirm">("eula")

  const handleClose = () => {
    setStep("eula")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="max-w-lg gap-4" onEscapeKeyDown={handleClose}>
        {step === "eula" ? (
          <EulaStep
            onAccept={() => setStep("confirm")}
            onReject={handleClose}
            submitting={submitting}
          />
        ) : (
          <GlobalConfirmStep
            onConfirm={() => {
              onConfirmed()
              setStep("eula")
            }}
            onReject={handleClose}
            submitting={submitting}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Root modal ──────────────────────────────────────────────────────────────

export function ConsentModal({ open, clubId, canJoinGlobal, onAccepted }: ConsentModalProps) {
  // "league" → league selection, "eula" → full EULA (Part A), "confirm" → consent confirmation (Part B)
  const [step, setStep] = useState<"league" | "eula" | "confirm">("league")
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
      // Must read EULA before Global League confirmation
      setStep("eula")
    } else {
      // Club only – no EULA required
      submitConsent(false)
    }
  }

  // Step 2 "I Consent" clicked → move to confirmation modal
  const handleEulaAccept = () => {
    setStep("confirm")
  }

  // Step 2 "Not Now" clicked → back to step 1 with Global unchecked
  const handleEulaReject = () => {
    setJoinGlobal(false)
    setStep("league")
  }

  // Step 3 "I Agree & Join" clicked
  const handleConfirm = () => {
    submitConsent(true)
  }

  // Step 3 "Not Now" clicked → back to step 1 with Global unchecked
  const handleConfirmReject = () => {
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
        ) : step === "eula" ? (
          <EulaStep
            onAccept={handleEulaAccept}
            onReject={handleEulaReject}
            submitting={submitting}
          />
        ) : (
          <GlobalConfirmStep
            onConfirm={handleConfirm}
            onReject={handleConfirmReject}
            submitting={submitting}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
