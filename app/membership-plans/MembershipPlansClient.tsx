"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api"
import { Check, CreditCard, Building2 } from "lucide-react"

type PublicMembershipPlan = {
  _id: string
  name: string
  description: string
  price: number
  currency: string
  duration: number
  features?: {
    maxEvents?: number
    maxNews?: number
    maxMembers?: number
    customBranding?: boolean
    advancedAnalytics?: boolean
    prioritySupport?: boolean
    apiAccess?: boolean
    customIntegrations?: boolean
  }
  isActive: boolean
}

type PublicClubWithPlans = {
  _id: string
  name: string
  membershipPlans?: PublicMembershipPlan[]
}

export default function MembershipPlansClient({ clubId }: { clubId: string }) {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [club, setClub] = useState<PublicClubWithPlans | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!clubId) return
      setLoading(true)
      try {
        const resp = await apiClient.getPublicClubs()
        const clubs = (resp.success ? (resp.data as any)?.clubs : []) as PublicClubWithPlans[]
        const found = clubs.find((c) => c?._id === clubId) || null
        setClub(found)
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

  const formatDuration = (duration: number) => {
    if (duration === 0) return "Lifetime"
    if (duration === 1) return "1 month"
    if (duration < 12) return `${duration} months`
    const years = Math.floor(duration / 12)
    const months = duration % 12
    if (months === 0) return `${years} year${years > 1 ? "s" : ""}`
    return `${years} year${years > 1 ? "s" : ""} ${months} month${months > 1 ? "s" : ""}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
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
              <Link href="/clubs">
                <Button>Browse Clubs</Button>
              </Link>
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
              <Link href="/clubs">
                <Button>Browse Clubs</Button>
              </Link>
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
                  <Link href="/clubs">
                    <Button>Browse Clubs</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                  <Card key={plan._id} className="border-2">
                    <CardHeader className="text-center">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-black">
                          {formatPrice(plan.price || 0, plan.currency || "INR")}
                        </div>
                        <div className="text-sm text-muted-foreground">{formatDuration(plan.duration || 0)}</div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-semibold">Highlights</div>
                        <div className="flex flex-wrap gap-2">
                          {typeof plan.features?.maxEvents === "number" && (
                            <Badge variant="secondary">Events: {plan.features.maxEvents}</Badge>
                          )}
                          {typeof plan.features?.maxNews === "number" && (
                            <Badge variant="secondary">News: {plan.features.maxNews}</Badge>
                          )}
                          {typeof plan.features?.maxMembers === "number" && (
                            <Badge variant="secondary">Members: {plan.features.maxMembers}</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-green-600" />
                        Join flow continues on Clubs page
                      </div>

                      <Link href={`/clubs?search=${encodeURIComponent(club.name)}`} className="block">
                        <Button className="w-full">Continue to Join</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <SiteFooter brandName="Wingman Pro" />
    </div>
  )
}

