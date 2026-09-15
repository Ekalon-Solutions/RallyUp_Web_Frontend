"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { apiClient } from "@/lib/api"
import { calculateTransactionFees } from "@/lib/transactionFees"
import { ArrowUpRight, Building2, CreditCard } from "lucide-react"
import { JoinMembershipModal, type JoinablePlan } from "@/components/modals/join-membership-modal"
import { PlanDetailsModal } from "@/components/modals/plan-details-modal"
import { planBenefits, type PublicPlanConfig } from "@/lib/membershipPlanConfig"

type PublicMembershipPlan = JoinablePlan & PublicPlanConfig & {
  isActive: boolean
}

type PublicClubWithPlans = {
  _id: string
  name: string
  slug?: string
  platformFeePercent?: number
  membershipPlans?: PublicMembershipPlan[]
}

export default function MembershipPlansClient({ clubId }: { clubId: string }) {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [club, setClub] = useState<PublicClubWithPlans | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>(undefined)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [detailsPlan, setDetailsPlan] = useState<PublicMembershipPlan | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!clubId) return
      setLoading(true)
      try {
        const resp = await apiClient.getPublicClubs()
        const clubs = (resp.success ? (resp.data as any)?.clubs : []) as PublicClubWithPlans[]
        const found = clubs.find((c) => c?._id === clubId) || null
        setClub(found)
      } catch {
        setClub(null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [clubId])

  const plans = useMemo(() => {
    const list = (club?.membershipPlans || []).filter((p) => p?.isActive)
    return list.sort((a, b) => (a.price || 0) - (b.price || 0))
  }, [club?.membershipPlans])

  const formatPrice = (price: number, currency: string) => {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price)
    } catch {
      return `${currency} ${price}`
    }
  }

  const formatPlanPeriod = (plan: PublicMembershipPlan) => {
    if (plan.planStartDate && plan.planEndDate) {
      const start = new Date(plan.planStartDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
      const end = new Date(plan.planEndDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
      return `${start} – ${end}`
    }
    const duration = plan.duration ?? 0
    if (duration === 0) return "Lifetime"
    if (duration === 1) return "1 month"
    if (duration < 12) return `${duration} months`
    const years = Math.floor(duration / 12)
    const months = duration % 12
    if (months === 0) return `${years} year${years > 1 ? "s" : ""}`
    return `${years} year${years > 1 ? "s" : ""} ${months} month${months > 1 ? "s" : ""}`
  }

  const getPlanSalesState = (plan: PublicMembershipPlan) => {
    const now = Date.now()
    const bookingStartMs = plan.bookingStartDate ? new Date(plan.bookingStartDate).getTime() : null
    const bookingEndMs = plan.bookingEndDate ? new Date(plan.bookingEndDate).getTime() : null
    const notStarted = Boolean(bookingStartMs && now < bookingStartMs)
    const closed = Boolean(bookingEndMs && now > bookingEndMs)
    return { isOpen: !notStarted && !closed, closed, notStarted }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 public-theme">
      <SiteNavbar brandName="Wingman Pro" />

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Membership Plans</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            {club ? (
              <>
                Explore available plans for <span className="font-semibold text-foreground">{club.name}</span>.
              </>
            ) : clubId ? (
              "Loading club membership plans…"
            ) : (
              "Select a club to view membership plans."
            )}
          </p>
        </div>

        {!clubId && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Choose a club
              </CardTitle>
              <CardDescription>Go to clubs and pick a membership plan.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              {/* <Link href="/clubs">
                <Button>Browse Clubs</Button>
              </Link> */}
            </CardContent>
          </Card>
        )}

        {clubId && loading && (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        )}

        {clubId && !loading && !club && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Club not found</CardTitle>
              <CardDescription>We couldn’t find membership plans for that club.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              {/* <Link href="/clubs">
                <Button>Browse Clubs</Button>
              </Link> */}
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        )}

        {club && !loading && (
          <>
            {plans.length === 0 ? (
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>No active plans</CardTitle>
                  <CardDescription>This club doesn’t have any active membership plans right now.</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-3">
                  {/* <Link href="/clubs">
                    <Button>Browse Clubs</Button>
                  </Link> */}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => {
                  const benefits = planBenefits(plan)
                  return (
                  <Card key={plan._id} className="border-2">
                    <CardHeader className="text-center">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(() => {
                        const salesState = getPlanSalesState(plan)
                        return !salesState.isOpen ? (
                          <div className="text-center">
                            <Badge variant="secondary">
                              {salesState.closed ? "Membership Closed" : "Unavailable"}
                            </Badge>
                          </div>
                        ) : null
                      })()}
                      <div className="text-center">
                        <div className="text-3xl font-black">
                          {formatPrice(calculateTransactionFees(plan.price || 0, club.platformFeePercent).finalAmount, plan.currency || "INR")}
                        </div>
                        <div className="text-xs text-muted-foreground">all-inclusive</div>
                        <div className="text-sm text-muted-foreground">{formatPlanPeriod(plan)}</div>
                        {(plan.planStartDate || plan.planEndDate) && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2 justify-center">
                            {plan.planStartDate && (
                              <span>Start: {new Date(plan.planStartDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                            )}
                            {plan.planEndDate && (
                              <span>End: {new Date(plan.planEndDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {benefits.length > 0 && (
                        <ul className="space-y-1.5 text-sm text-muted-foreground text-left">
                          {benefits.slice(0, 4).map((b) => (
                            <li key={b.key} className="flex items-start gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                              <span className="leading-snug">{b.title}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <Separator />

                      {(() => {
                        const salesState = getPlanSalesState(plan)
                        return (
                          <Button
                            className="w-full"
                            disabled={!salesState.isOpen}
                            onClick={() => {
                              setSelectedPlanId(plan._id)
                              setShowJoinModal(true)
                            }}
                          >
                            {salesState.closed
                              ? "Membership Closed"
                              : salesState.notStarted
                                ? "Unavailable"
                                : "Purchase Plan"}
                          </Button>
                        )
                      })()}
                      <button
                        type="button"
                        onClick={() => setDetailsPlan(plan)}
                        className="inline-flex w-full items-center justify-center gap-1 text-sm font-semibold text-primary hover:underline"
                      >
                        View Plan Details
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </CardContent>
                  </Card>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      <SiteFooter brandName="Wingman Pro" />

      <PlanDetailsModal
        open={Boolean(detailsPlan)}
        onOpenChange={(open) => { if (!open) setDetailsPlan(null) }}
        plan={detailsPlan}
        displayPrice={
          detailsPlan
            ? calculateTransactionFees(detailsPlan.price || 0, club?.platformFeePercent).finalAmount
            : undefined
        }
      />

      {club?._id && (
        <JoinMembershipModal
          open={showJoinModal}
          onOpenChange={(open) => {
            setShowJoinModal(open)
            if (!open) setSelectedPlanId(undefined)
          }}
          clubId={club._id}
          clubName={club.name}
          platformFeePercent={club.platformFeePercent}
          plans={plans.filter((p) => getPlanSalesState(p).isOpen) as JoinablePlan[]}
          returnPath={`/membership-plans?clubId=${encodeURIComponent(clubId)}`}
          initialPlanId={selectedPlanId}
        />
      )}
    </div>
  )
}
