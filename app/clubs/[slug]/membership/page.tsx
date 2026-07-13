"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { apiClient } from "@/lib/api"
import { JoinMembershipModal, JoinablePlan } from "@/components/modals/join-membership-modal"
import { LoginModal } from "@/components/login-modal"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { ArrowLeft, Calendar, Clock, CreditCard, Search } from "lucide-react"

interface Club {
  _id: string
  name: string
  logo?: string
}

interface ClubSettings {
  websiteSetup: { isPublished: boolean }
  designSettings: { primaryColor: string; logo: string | null }
}

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "INR" }).format(price)
  } catch {
    return `${currency} ${price}`
  }
}

function formatPeriod(plan: JoinablePlan): string {
  if (plan.planStartDate && plan.planEndDate) {
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
    return `${new Date(plan.planStartDate).toLocaleDateString(undefined, opts)} – ${new Date(plan.planEndDate).toLocaleDateString(undefined, opts)}`
  }
  const months = plan.duration ?? 0
  if (months === 0) return "Lifetime"
  if (months === 12) return "1 Year"
  return `${months} Month${months > 1 ? "s" : ""}`
}

// Booking-window rule shared with join-membership-modal.tsx: a plan can only
// be selected while `now` falls between its bookingStartDate/bookingEndDate.
function getSalesState(plan: JoinablePlan) {
  const now = Date.now()
  const startMs = plan.bookingStartDate ? new Date(plan.bookingStartDate).getTime() : null
  const endMs = plan.bookingEndDate ? new Date(plan.bookingEndDate).getTime() : null
  const notStarted = Boolean(startMs && now < startMs)
  const closed = Boolean(endMs && now > endMs)
  return { isOpen: !notStarted && !closed, closed, notStarted }
}

export default function ClubMembershipPlansPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [club, setClub] = useState<Club | null>(null)
  const [settings, setSettings] = useState<ClubSettings | null>(null)
  const [plans, setPlans] = useState<JoinablePlan[]>([])
  const [loginOpen, setLoginOpen] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>(undefined)
  const [showJoinModal, setShowJoinModal] = useState(false)

  const isLoggedIn = Boolean(
    user?._id || (typeof window !== "undefined" && localStorage.getItem("token"))
  )

  useEffect(() => {
    if (!slug) return
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        const clubRes = await apiClient.getClubById(slug, true)
        if (!active || !clubRes.success || !clubRes.data) return
        setClub(clubRes.data)

        const settingsRes = await apiClient.getClubSettings(slug, true)
        if (active && settingsRes.success && settingsRes.data) {
          setSettings((settingsRes.data as any).data || settingsRes.data)
        }

        const plansRes = await apiClient.getPublicClubs()
        if (active && plansRes.success && plansRes.data) {
          const match = (plansRes.data.clubs || []).find(
            (c: any) => c._id === clubRes.data!._id || c.slug === slug
          )
          const activePlans = ((match as any)?.membershipPlans || []).filter((p: any) => p.isActive)
          setPlans(activePlans as JoinablePlan[])
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [slug])

  // Resume a pending join once the user logs in via the "existing account" redirect.
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token || !club?._id) return
    let pending: { clubId: string; membershipPlanId: string } | null = null
    try {
      const raw = sessionStorage.getItem("clubs_pending_join")
      if (raw) pending = JSON.parse(raw)
    } catch (_) {}
    if (!pending || pending.clubId !== club._id) return
    sessionStorage.removeItem("clubs_pending_join")
    setSelectedPlanId(pending.membershipPlanId)
    setShowJoinModal(true)
  }, [club?._id])

  const activeMembership = (user as any)?.memberships?.find(
    (m: any) => (m.club_id?._id === club?._id || m.club_id === club?._id) && m.status === "active"
  )
  const membershipExpired = activeMembership?.end_date
    ? new Date(activeMembership.end_date) <= new Date()
    : activeMembership?.endDate
    ? new Date(activeMembership.endDate) <= new Date()
    : false
  const hasActiveMembership = Boolean(activeMembership && !membershipExpired)
  const currentPlanId = activeMembership
    ? typeof activeMembership.membership_level_id === "string"
      ? activeMembership.membership_level_id
      : activeMembership.membership_level_id?._id
    : null
  const currentPlanPrice =
    (typeof activeMembership?.membership_level_id === "object" && activeMembership.membership_level_id?.price) ??
    plans.find((p) => p._id === currentPlanId)?.price ??
    0

  // Only show plans whose booking window is currently open — hides plans
  // that haven't started yet AND plans whose booking has already ended.
  const visiblePlans = plans.filter((plan) => getSalesState(plan).isOpen)

  const handleSelectPlan = (plan: JoinablePlan) => {
    setSelectedPlanId(plan._id)
    setShowJoinModal(true)
  }

  const getCardCta = (plan: JoinablePlan): { label: string; disabled: boolean } => {
    if (!isLoggedIn) return { label: "Select Plan", disabled: false }
    if (String(plan._id) === String(currentPlanId)) return { label: "Your Current Plan", disabled: true }
    if (hasActiveMembership && plan.price <= currentPlanPrice) {
      return { label: "Downgrade Unavailable", disabled: true }
    }
    if (hasActiveMembership) return { label: "Upgrade to This Plan", disabled: false }
    return { label: "Select Plan", disabled: false }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!club || !settings || !settings.websiteSetup?.isPublished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Club Not Found</CardTitle>
            <CardDescription className="text-base mt-2">
              This club's membership plans aren't available right now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/" className="w-full">
              <Button variant="default" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const primaryColor = settings.designSettings?.primaryColor || "#3b82f6"

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="border-b bg-background">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <button
            onClick={() => router.push(`/clubs/${slug}`)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {club.name}
          </button>
          {!isLoggedIn && (
            <Button variant="outline" size="sm" onClick={() => setLoginOpen(true)}>
              Member Login
            </Button>
          )}
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            {hasActiveMembership ? "Upgrade Your Membership" : `Join ${club.name}`}
          </h1>
          <p className="text-muted-foreground mt-2">
            {hasActiveMembership
              ? "Pick a higher-tier plan to upgrade your current membership."
              : "Choose a membership plan to become a member."}
          </p>
        </div>

        {visiblePlans.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No membership plans are available for this club right now.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visiblePlans.map((plan) => {
              const cta = getCardCta(plan)
              return (
                <Card key={plan._id} className="flex flex-col overflow-hidden">
                  <CardHeader style={{ backgroundColor: primaryColor }} className="text-white">
                    <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                    {plan.description && (
                      <CardDescription className="text-white/80">{plan.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 pt-6 flex-1">
                    <div className="flex items-center gap-2 text-2xl font-black">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      {formatPrice(plan.price, plan.currency)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatPeriod(plan)}
                    </div>
                    {plan.bookingEndDate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {`Booking closes ${new Date(plan.bookingEndDate).toLocaleDateString()}`}
                      </div>
                    )}
                    {String(plan._id) === String(currentPlanId) && (
                      <Badge variant="secondary" className="w-fit">Current Plan</Badge>
                    )}
                    <Separator className="mt-auto" />
                    <Button
                      className="w-full"
                      disabled={cta.disabled}
                      style={!cta.disabled ? { backgroundColor: primaryColor, color: "white" } : undefined}
                      onClick={() => handleSelectPlan(plan)}
                    >
                      {cta.label}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} onSuccess={() => {}} />

      {club._id && (
        <JoinMembershipModal
          open={showJoinModal}
          onOpenChange={(open) => {
            setShowJoinModal(open)
            if (!open) setSelectedPlanId(undefined)
          }}
          clubId={club._id}
          clubName={club.name}
          plans={visiblePlans}
          primaryColor={primaryColor}
          returnPath={`/clubs/${slug}/membership`}
          initialPlanId={selectedPlanId}
        />
      )}
    </div>
  )
}
