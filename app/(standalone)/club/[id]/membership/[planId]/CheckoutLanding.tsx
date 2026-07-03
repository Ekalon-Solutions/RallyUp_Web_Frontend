"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LogIn, UserCheck, CreditCard, Clock, Calendar, Search, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LoginModal } from "@/components/login-modal"
import { JoinMembershipModal } from "@/components/modals/join-membership-modal"
import type { JoinablePlan } from "@/components/modals/join-membership-modal"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CheckoutClub {
  _id: string
  name: string
  description?: string
  logo?: string
}

export interface CheckoutPlan {
  _id: string
  name: string
  description: string
  price: number
  currency: string
  isActive: boolean
  duration?: number
  planStartDate?: string
  planEndDate?: string
}

interface CheckoutLandingProps {
  club: CheckoutClub
  planId: string
  plan?: CheckoutPlan
  isInvalidPlan?: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(price)
  } catch {
    return `${currency || "₹"}${price}`
  }
}

function formatDuration(plan: CheckoutPlan): string {
  if (plan.planStartDate && plan.planEndDate) {
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
    return `${new Date(plan.planStartDate).toLocaleDateString(undefined, opts)} – ${new Date(plan.planEndDate).toLocaleDateString(undefined, opts)}`
  }
  const months = plan.duration ?? 0
  if (months === 0) return "Lifetime membership"
  if (months === 12) return "1 year membership"
  return `${months} month${months > 1 ? "s" : ""} membership`
}

// ---------------------------------------------------------------------------
// Plan summary card (shown above the action buttons)
// ---------------------------------------------------------------------------

function PlanSummaryCard({ club, plan, planId }: { club: CheckoutClub; plan?: CheckoutPlan; planId: string }) {
  return (
    <Card className="w-full bg-white rounded-[2.5rem] shadow-2xl border-none overflow-hidden">
      <CardHeader className="text-center pb-5 bg-secondary px-6 pt-6 text-white rounded-t-[2.5rem]">
        {/* Club name as context */}
        <p className="text-xs text-white/70 font-semibold uppercase tracking-widest mb-1">
          {club.name}
        </p>

        {plan ? (
          <>
            <CardTitle className="text-3xl font-black text-white">{plan.name}</CardTitle>
            {plan.description && (
              <CardDescription className="text-white/80 text-sm mt-1">
                {plan.description}
              </CardDescription>
            )}
          </>
        ) : (
          <>
            <CardTitle className="text-3xl font-black text-white">
              Membership Plan
            </CardTitle>
            <CardDescription className="text-white/80 text-sm mt-1">
              {planId ? `Plan ID: ${planId}` : "Select a plan to get started."}
            </CardDescription>
          </>
        )}
      </CardHeader>

      {plan && (
        <CardContent className="space-y-4 pt-6 pb-6 bg-white px-6 border-x border-b border-secondary/20 rounded-b-[2.5rem]">
          {/* Price */}
          <div className="flex items-center justify-center gap-2">
            <CreditCard className="h-5 w-5 text-secondary" />
            <span className="text-3xl font-black text-secondary">
              {formatPrice(plan.price, plan.currency)}
            </span>
          </div>

          <Separator className="bg-slate-200" />

          {/* Duration */}
          <div className="flex items-center justify-center gap-1.5 text-sm text-slate-600">
            {plan.planStartDate ? (
              <Calendar className="h-4 w-4 shrink-0 text-slate-500" />
            ) : (
              <Clock className="h-4 w-4 shrink-0 text-slate-500" />
            )}
            <span>{formatDuration(plan)}</span>
          </div>

          {/* Active badge */}
          {!plan.isActive && (
            <div className="flex justify-center">
              <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none">Currently Inactive</Badge>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CheckoutLanding({ club, planId, plan, isInvalidPlan }: CheckoutLandingProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const utm = params.get("utm_source")
      if (utm) {
        sessionStorage.setItem("utm_source", utm)
      }
      if (params.get("guest") === "true") {
        setGuestFormOpen(true)
      }
    }
  }, [])

  const [loginOpen, setLoginOpen] = useState(false)
  const [guestFormOpen, setGuestFormOpen] = useState(false)
  const [localPlan, setLocalPlan] = useState<CheckoutPlan | undefined>(plan)
  const [allClubPlans, setAllClubPlans] = useState<JoinablePlan[]>(() => {
    return plan
      ? [
          {
            _id: plan._id,
            name: plan.name,
            description: plan.description,
            price: plan.price,
            currency: plan.currency,
            duration: plan.duration,
            planStartDate: plan.planStartDate,
            planEndDate: plan.planEndDate,
          },
        ]
      : []
  })

  useEffect(() => {
    let active = true
    apiClient.getPublicClubs()
      .then((res) => {
        if (!active || !res.success || !res.data) return
        const match = (res.data.clubs || []).find((c: any) => c._id === club._id)
        if (!match) return
        
        const plans = ((match as any).membershipPlans || [])
          .filter((p: any) => p.isActive)
          .map((p: any) => ({
            _id: p._id,
            name: p.name,
            description: p.description || "",
            price: p.price,
            currency: p.currency || "INR",
            duration: p.duration,
            planStartDate: p.planStartDate,
            planEndDate: p.planEndDate,
            isActive: p.isActive,
          }))

        if (active) {
          setAllClubPlans(plans)
          
          if (!localPlan) {
            const matchingPlan = plans.find((p: any) => p._id === planId)
            if (matchingPlan) {
              setLocalPlan(matchingPlan)
            }
          } else {
            // Sync active state from fetched public club data if matching
            const matchingPlan = plans.find((p: any) => p._id === planId)
            if (matchingPlan) {
              setLocalPlan(matchingPlan)
            }
          }
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [club._id, planId, localPlan])

  const handleLoginSuccess = useCallback(() => {
    toast.success("Signed in! Continuing to checkout…")
    router.refresh()
  }, [router])

  const handleGuestFlow = useCallback(() => {
    if (allClubPlans.length === 0) {
      toast.info("Please log in first to select and purchase a membership plan.")
      setLoginOpen(true)
      return
    }
    setGuestFormOpen(true)
  }, [allClubPlans.length])

  if (isInvalidPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#EBF3FF] via-[#F4F8FF] to-white public-theme">
        <SiteNavbar brandName="Wingman Pro" />
        
        <div className="relative flex flex-col items-center justify-center px-4 py-16 bg-transparent">
          <Card className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border-none overflow-hidden">
            <CardHeader className="text-center pb-5 bg-secondary px-6 pt-6 text-white rounded-t-[2.5rem]">
              <div className="mx-auto w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                <Search className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-3xl font-black text-white">Incorrect Plan</CardTitle>
              <CardDescription className="text-white/80 text-sm mt-1">
                The membership plan you&apos;re looking for doesn&apos;t exist or is no longer available.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-6 pb-6 bg-white px-6 border-x border-b border-secondary/20 rounded-b-[2.5rem]">
              <div className="grid gap-3">
                <Link href="/" className="w-full">
                  <Button className="w-full bg-primary hover:bg-[#FF7E4A] hover:shadow-[0_8px_20px_#FF5C1A6B] text-white h-12 rounded-xl font-bold uppercase tracking-wider transition-all duration-300 gap-2 active:scale-95">
                    <ArrowLeft className="h-4 w-4" />
                    Go Back to Home
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  className="w-full border-2 border-secondary bg-white text-secondary hover:bg-secondary/5 hover:text-secondary h-12 rounded-xl font-bold uppercase tracking-wider transition-all duration-300 gap-2 active:scale-95"
                  onClick={() => setGuestFormOpen(true)}
                >
                  <UserCheck className="h-4 w-4" />
                  Join the Club
                </Button>
              </div>
            </CardContent>

            <CardFooter className="justify-center border-t border-slate-100 bg-white py-4 border-x border-b border-secondary/20 rounded-b-[2.5rem]">
              <p className="text-xs text-secondary/80 font-medium">
                Need help?{" "}
                <Link
                  href="/contact"
                  className="text-primary hover:underline font-bold"
                >
                  Contact Support
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>

        <LoginModal
          open={loginOpen}
          onOpenChange={setLoginOpen}
          onSuccess={handleLoginSuccess}
        />

        <JoinMembershipModal
          open={guestFormOpen}
          onOpenChange={setGuestFormOpen}
          clubId={club._id}
          clubName={club.name}
          plans={allClubPlans}
          initialPlanId={planId}
          forceRegister={true}
          returnPath={typeof window !== "undefined" ? window.location.pathname : "/clubs"}
        />
        <SiteFooter brandName="Wingman Pro" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EBF3FF] via-[#F4F8FF] to-white public-theme">
      <SiteNavbar brandName="Wingman Pro" />
      
      {/* Main content area */}
      <div className="relative flex flex-col items-center justify-center px-4 py-16 bg-transparent">
        <div className="w-full max-w-md space-y-6">
          {isAuthenticated ? (
            <>
              {/* ── Plan summary ─────────────────────────────────────────── */}
              <PlanSummaryCard club={club} plan={localPlan} planId={planId} />

              {/* ── Action area ──────────────────────────────────────────── */}
              <div className="space-y-3">
                <Button
                  className="w-full bg-primary hover:bg-[#FF7E4A] hover:shadow-[0_8px_20px_#FF5C1A6B] text-white h-12 rounded-xl font-bold uppercase tracking-wider transition-all duration-300 gap-2 active:scale-95"
                  onClick={() => setGuestFormOpen(true)}
                >
                  Upgrade Plan
                </Button>
              </div>
            </>
          ) : (
            /* Card encapsulation for unauthenticated state to avoid collapsed layout */
            <Card className="w-full bg-white rounded-[2.5rem] shadow-2xl border-none overflow-hidden">
              <CardHeader className="text-center pb-5 bg-secondary px-6 pt-6 text-white rounded-t-[2.5rem]">
                <p className="text-xs text-white/70 font-semibold uppercase tracking-widest mb-1">
                  {club.name}
                </p>
                <CardTitle className="text-3xl font-black text-white">Join Membership</CardTitle>
                <CardDescription className="text-white/80 text-sm mt-1">
                  Securely register or log in to subscribe to plans.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-6 pb-6 bg-white px-6 border-x border-b border-secondary/20 rounded-b-[2.5rem]">
                <div className="space-y-3">
                  {/* Login via OTP */}
                  <Button
                    className="w-full bg-primary hover:bg-[#FF7E4A] hover:shadow-[0_8px_20px_#FF5C1A6B] text-white h-12 rounded-xl font-bold uppercase tracking-wider transition-all duration-300 gap-2 active:scale-95"
                    onClick={() => setLoginOpen(true)}
                  >
                    <LogIn className="h-4 w-4" />
                    Login via OTP
                  </Button>

                  {/* Continue as Guest */}
                  <Button
                    variant="outline"
                    className="w-full border-2 border-secondary bg-white text-secondary hover:bg-secondary/5 hover:text-secondary h-12 rounded-xl font-bold uppercase tracking-wider transition-all duration-300 gap-2 active:scale-95"
                    onClick={handleGuestFlow}
                  >
                    <UserCheck className="h-4 w-4" />
                    Continue as Guest
                  </Button>
                </div>

                <div className="pt-2 border-t border-slate-100 text-center">
                  <p className="text-secondary/80 text-xs font-medium pt-1">
                    Already a member of{" "}
                    <span className="font-semibold text-secondary">{club.name}</span>?{" "}
                    <button onClick={() => setLoginOpen(true)} className="text-primary hover:underline font-bold">
                      Log in
                    </button>{" "}
                    above to use your existing account.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Login modal ──────────────────────────────────────────────── */}
      <LoginModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSuccess={handleLoginSuccess}
      />

      {/* ── Guest registration form (reuses pre‑existing JoinMembershipModal containing all plans of the club) ──── */}
      <JoinMembershipModal
        open={guestFormOpen}
        onOpenChange={setGuestFormOpen}
        clubId={club._id}
        clubName={club.name}
        plans={allClubPlans}
        initialPlanId={planId}
        forceRegister={!planId}
        returnPath={typeof window !== "undefined" ? window.location.pathname : "/clubs"}
      />
      <SiteFooter brandName="Wingman Pro" />
    </div>
  )
}
