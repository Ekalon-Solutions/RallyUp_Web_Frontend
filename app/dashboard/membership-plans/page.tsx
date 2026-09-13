"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, CreditCard, Edit, Trash2, Gift, TrendingUp } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { useClubFeatures } from "@/hooks/useClubFeatures"
import { isFeatureEnabled } from "@/lib/clubFeatures"
import { LockedFeaturePage } from "@/components/feature-gate"

interface MembershipPlan {
  _id: string
  name: string
  description: string
  price: number
  currency: string
  duration?: number
  planStartDate?: string
  planEndDate?: string
  bookingStartDate?: string
  bookingEndDate?: string
  referralReward?: { enabled: boolean; points: number }
  isActive: boolean
  createdAt: string
}

export default function MembershipPlansPage() {
  const router = useRouter()
  const { user, activeClubId } = useAuth()
  const { config: clubFeatureConfig } = useClubFeatures(activeClubId ?? null)
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [clubs, setClubs] = useState<Array<{ _id: string; name: string }>>([])
  const [planToDeactivate, setPlanToDeactivate] = useState<MembershipPlan | null>(null)
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<MembershipPlan | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [plansWithCards, setPlansWithCards] = useState<Set<string>>(new Set())
  const [activeMembersPerPlan, setActiveMembersPerPlan] = useState<Record<string, number>>({})

  // Use activeClubId from useAuth as the only source of truth for "selected" club
  // When user or activeClubId is set, update UI and/or load plans
  useEffect(() => {
    if (user && activeClubId) {
      loadClubsAndPlans()
    }
  }, [user, activeClubId])

  // Helper to refresh plans for currently active club
  const loadPlans = async () => {
    return loadPlansForClub(activeClubId)
  }

  const loadPlansForClub = async (clubId?: string | null) => {
    try {
      setIsLoading(true)

      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please log in to view membership plans')
        setIsLoading(false)
        return
      }

      const response = await apiClient.getMembershipPlans(clubId || "")

      if (response.success) {
        const respAny: any = response
        const plansData = Array.isArray(respAny.data) ? respAny.data : (respAny.data?.data || [])
        setPlans(plansData)

        if (plansData.length === 0) {
          toast.info('No membership plans found for this club. Click "Create Plan" to add your first membership plan.')
        }

        if (clubId) {
          await loadPlansWithCards(clubId, plansData)
          apiClient.getActiveMembersPerPlan(clubId).then((r) => {
            if (r.success && r.data) setActiveMembersPerPlan(r.data)
          }).catch(() => {})
        }
      } else {
        const errorDetails = (response as any).errorDetails || {}
        const errorMessage = response.error || 'Unknown error occurred'
        const statusCode = errorDetails.statusCode || (response as any).statusCode || 'Unknown'
        toast.error(`Failed to load membership plans: ${errorMessage}. Status: ${statusCode}. Please check your authentication and try again.`)
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Network error or server unavailable'
      const errorDetails = error?.response?.data || error?.response || {}
      toast.error(`Failed to load membership plans due to: ${errorMessage}. ${errorDetails.message ? `Details: ${errorDetails.message}` : ''} Please check your internet connection and try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  const loadPlansWithCards = async (clubId: string, plansData: MembershipPlan[]) => {
    try {
      const cardsResponse = await apiClient.getClubMembershipCards(clubId, {})

      if (cardsResponse.success) {
        const cards = Array.isArray(cardsResponse.data)
          ? cardsResponse.data
          : (cardsResponse.data?.data || [])

        const planIdsWithCards = new Set<string>()
        cards.forEach((card: any) => {
          if (card.membershipPlan && card.membershipPlan._id) {
            planIdsWithCards.add(card.membershipPlan._id)
          }
        })

        setPlansWithCards(planIdsWithCards)
      }
    } catch (error) {
      console.error('Error loading membership cards:', error)
    }
  }

  const handleCreateCard = (planId: string) => {
    window.location.href = `/dashboard/membership-cards?planId=${planId}`
  }

  // This loads the user's clubs list for display (not for switching);
  // selected/active club always comes from context (activeClubId).
  const loadClubsAndPlans = async () => {
    try {
      let clubsList: Array<{ _id: string; name: string }> = []

      const userRole = user?.role
      const userAny = user as any

      if (userRole === 'system_owner') {
        const clubsResp = await apiClient.getPublicClubs()
        clubsList = clubsResp.success ? (clubsResp.data?.clubs || []) : []
      } else if (userRole === 'admin' || userRole === 'super_admin') {
        if (userAny?.club?._id) {
          clubsList = [{ _id: userAny.club._id, name: userAny.club.name }]
        } else if (userAny?.memberships && Array.isArray(userAny.memberships)) {
          clubsList = userAny.memberships
            .filter((m: any) => m.club_id && m.status === 'active')
            .map((m: any) => ({
              _id: m.club_id._id || m.club_id,
              name: m.club_id.name || 'Unknown Club'
            }))
        }

        if (clubsList.length === 0) {
          try {
            const adminClubResp = await apiClient.getAdminClub()
            if (adminClubResp.success && adminClubResp.data?.club) {
              clubsList = [{ _id: adminClubResp.data.club._id, name: adminClubResp.data.club.name }]
            }
          } catch (err) {}
        }
      } else {
        if (userAny?.memberships && Array.isArray(userAny.memberships)) {
          clubsList = userAny.memberships
            .filter((m: any) => m.club_id && m.status === 'active')
            .map((m: any) => ({
              _id: m.club_id._id || m.club_id,
              name: m.club_id.name || 'Unknown Club'
            }))
        }
      }

      setClubs(clubsList)
      await loadPlansForClub(activeClubId)
    } catch (error) {
      setClubs([])
      await loadPlansForClub(undefined)
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price)
  }

  const formatPlanPeriod = (plan: MembershipPlan) => {
    if (plan.planStartDate && plan.planEndDate) {
      const start = new Date(plan.planStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      const end = new Date(plan.planEndDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      return `${start} – ${end}`
    }
    if (plan.duration != null && plan.duration > 0) {
      if (plan.duration === 1) return "1 Month"
      if (plan.duration === 12) return "1 Year"
      return `${plan.duration} Months`
    }
    return "Lifetime"
  }

  const handleDeactivatePlanClick = (plan: MembershipPlan) => {
    setPlanToDeactivate(plan)
    setShowDeactivateDialog(true)
  }

  const handleConfirmDeactivatePlan = async () => {
    if (!planToDeactivate) return
    setIsDeactivating(true)
    try {
      const response = await apiClient.deleteMembershipPlan(planToDeactivate._id)
      if (response.success) {
        toast.success(`Plan "${planToDeactivate.name}" has been deactivated.`)
        setShowDeactivateDialog(false)
        setPlanToDeactivate(null)
        await loadPlans()
      } else {
        toast.error(response.error || "Failed to deactivate plan")
      }
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || "Failed to deactivate plan"
      toast.error(msg)
    } finally {
      setIsDeactivating(false)
    }
  }

  const handleDeletePlanClick = (plan: MembershipPlan) => {
    setPlanToDelete(plan)
    setShowDeleteDialog(true)
  }

  const handleConfirmDeletePlan = async () => {
    if (!planToDelete) return
    setIsDeleting(true)
    try {
      const response = await apiClient.hardDeleteMembershipPlan(planToDelete._id)
      if (response.success) {
        toast.success(`Plan "${planToDelete.name}" has been permanently removed.`)
        setShowDeleteDialog(false)
        setPlanToDelete(null)
        await loadPlans()
      } else {
        toast.error(response.error || "Failed to remove plan")
      }
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || "Failed to remove plan"
      toast.error(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleStatus = async (planId: string, currentStatus: boolean) => {
    try {
      const plan = plans.find(p => p._id === planId)
      const planName = plan?.name || 'Unknown Plan'
      const newStatus = !currentStatus ? 'activated' : 'deactivated'

      const response = await apiClient.updateMembershipPlan(planId, {
        isActive: !currentStatus
      })

      if (response.success) {
        toast.success(`Membership plan "${planName}" has been ${newStatus} successfully. ${newStatus === 'activated' ? 'The plan is now available for members to purchase.' : 'The plan is now hidden and cannot be purchased.'}`)
        await loadPlans()
      } else {
        const errorDetails = (response as any).errorDetails || {}
        const errorMessage = response.error || 'Unknown error occurred'
        const statusCode = (errorDetails as any).statusCode || (response as any).statusCode || 'Unknown'
        const detailsMsg = (errorDetails as any).message || (errorDetails as any).details || ''
        toast.error(`Failed to ${!currentStatus ? 'activate' : 'deactivate'} membership plan "${planName}" (ID: ${planId}): ${errorMessage}. Status: ${statusCode}. ${detailsMsg ? `Details: ${detailsMsg}.` : ''} Please try again.`)
      }
    } catch (error: any) {
      const plan = plans.find(p => p._id === planId)
      const planName = plan?.name || 'Unknown Plan'
      const newStatus = !currentStatus ? 'activate' : 'deactivate'
      const errorMessage = error?.message || 'Network error or server unavailable'
      const errorDetails = error?.response?.data || {}
      const statusCode = error?.response?.status || 'Unknown'
      const detailsMsg = (errorDetails as any)?.message || (errorDetails as any)?.details || ''
      toast.error(`Failed to ${newStatus} membership plan "${planName}" (ID: ${planId}) due to: ${errorMessage}. Status: ${statusCode}. ${detailsMsg ? `Details: ${detailsMsg}.` : ''} Please check your connection and try again.`)
    }
  }

  if (!isFeatureEnabled(clubFeatureConfig, 'membership')) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <LockedFeaturePage
            featureKey="membership"
            featureLabel="Membership Plans"
            clubId={activeClubId ?? ""}
            currentTier={clubFeatureConfig?.billing_tier}
          />
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Membership Plans</h1>
                <p className="text-muted-foreground">Create and manage membership plans for your club</p>
              </div>
            </div>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading membership plans...</p>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Membership Plans</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Create and manage membership plans for your club</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={loadPlans} className="w-full sm:w-auto">
                Refresh
              </Button>
              <Button onClick={() => router.push("/dashboard/membership-plans/create")}>
                <Plus className="mr-2 w-4 h-4" />
                Create Plan
              </Button>

              <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deactivate membership plan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {planToDeactivate && (
                        <>
                          This will deactivate &quot;{planToDeactivate.name}&quot; and remove it from your club&apos;s list. It cannot be deactivated if any members are currently on this plan (active or pending)—move members to another plan first. You can activate the plan again later from the list.
                        </>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeactivating}>Cancel</AlertDialogCancel>
                    <Button
                      variant="secondary"
                      disabled={isDeactivating}
                      onClick={handleConfirmDeactivatePlan}
                    >
                      {isDeactivating ? "Deactivating..." : "Deactivate plan"}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Permanently remove membership plan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {planToDelete && (
                        <>
                          This will permanently remove &quot;{planToDelete.name}&quot; from the database. This cannot be undone. The plan must have no active or pending members—deactivate it or move members first if needed.
                        </>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <Button
                      variant="destructive"
                      disabled={isDeleting}
                      onClick={handleConfirmDeletePlan}
                    >
                      {isDeleting ? "Removing..." : "Remove permanently"}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <CreditCard className="w-5 h-5" />
                        {plan.name}
                      </CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                    <Badge variant={plan.isActive ? "default" : "secondary"}>
                      {plan.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {formatPrice(plan.price, plan.currency)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      per {formatPlanPeriod(plan)}
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-foreground">
                        <Gift className="w-4 h-4" />
                        Referral Reward
                      </span>
                      <span className="text-foreground font-medium">
                        {plan.referralReward?.enabled && (plan.referralReward.points ?? 0) > 0
                          ? `${plan.referralReward.points} pts`
                          : <span className="text-muted-foreground text-xs">Disabled</span>}
                      </span>
                    </div>
                    {plan.referralReward?.enabled && (plan.referralReward.points ?? 0) > 0 && (
                      <div className="flex items-center justify-between text-sm bg-amber-50 dark:bg-amber-950/30 rounded-md px-2 py-1.5">
                        <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                          <TrendingUp className="w-3.5 h-3.5" />
                          Points Liability
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help text-amber-500 underline decoration-dotted text-xs">(?)</span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                Active members × referral points = maximum points that could be owed if every member refers someone.
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </span>
                        <span className="font-bold text-amber-800 dark:text-amber-300 text-xs">
                          {(activeMembersPerPlan[plan._id] ?? 0)} × {plan.referralReward.points} = {(activeMembersPerPlan[plan._id] ?? 0) * plan.referralReward.points} pts
                        </span>
                      </div>
                    )}
                  </div>

                  {(plan.bookingStartDate || plan.bookingEndDate) && (() => {
                    const now = Date.now()
                    const startMs = plan.bookingStartDate ? new Date(plan.bookingStartDate).getTime() : null
                    const endMs = plan.bookingEndDate ? new Date(plan.bookingEndDate).getTime() : null
                    const notStarted = Boolean(startMs && now < startMs)
                    const closed = Boolean(endMs && now > endMs)
                    const isOpen = !notStarted && !closed
                    return (
                      <div className="border-t pt-3 space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">Booking Window</span>
                          <Badge variant={isOpen ? "default" : "secondary"} className="text-xs">
                            {closed ? "Closed" : notStarted ? "Not Started" : "Open"}
                          </Badge>
                        </div>
                        {plan.bookingStartDate && (
                          <div className="flex justify-between">
                            <span>Opens</span>
                            <span>{new Date(plan.bookingStartDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                          </div>
                        )}
                        {plan.bookingEndDate && (
                          <div className="flex justify-between">
                            <span>Closes</span>
                            <span className={closed ? "text-destructive font-medium" : ""}>{new Date(plan.bookingEndDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/dashboard/membership-plans/create?planId=${plan._id}`)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      {plan.isActive ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleDeactivatePlanClick(plan)}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleToggleStatus(plan._id, plan.isActive)}
                        >
                          Activate
                        </Button>
                      )}
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleDeletePlanClick(plan)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="w-full">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={() => handleCreateCard(plan._id)}
                              disabled={plansWithCards.has(plan._id)}
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Create Membership Card
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {plansWithCards.has(plan._id) && (
                          <TooltipContent>
                            <p>This plan already has a membership card. Only one card can be created per plan.</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {plans.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">No Membership Plans Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first membership plan to start offering different tiers to your members
                </p>
                <Button onClick={() => router.push("/dashboard/membership-plans/create")}>
                  <Plus className="mr-2 w-4 h-4" />
                  Create First Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 