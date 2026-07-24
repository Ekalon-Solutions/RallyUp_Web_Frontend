"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Check, Star, CreditCard, Calendar, Users, Building2, ArrowUp, ArrowDown, Info, Loader2, AlertTriangle, UserCheck } from "lucide-react"
import { toast } from "sonner"
import { apiClient, MembershipPlan } from "@/lib/api"
import { formatDisplayDate } from "@/lib/utils"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { PaymentSimulationModal } from "@/components/modals/payment-simulation-modal"
import { computeMembershipPlanCharge } from "@/lib/transactionFees"

export default function BrowseMembershipPlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAssigning, setIsAssigning] = useState<string | null>(null)
  const [currentMembership, setCurrentMembership] = useState<any>(null)
  const [pendingPayment, setPendingPayment] = useState<{
    planId: string
    planName: string
    orderId: string
    orderNumber: string
    total: number
    subtotal?: number
    platformFeeTotal?: number
    razorpayFeeTotal?: number
    currency: string
    paymentMethod: string
    isUpgrade?: boolean
    referralPhone?: string
  } | null>(null)
  const { user, checkAuth } = useAuth()
  const clubId = useRequiredClubId()

  const [referralPhone, setReferralPhone] = useState("")
  const [referralStatus, setReferralStatus] = useState<"idle" | "checking" | "found" | "not-found" | "not-member" | "self">("idle")
  const [referralName, setReferralName] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
  }, [])

  useEffect(() => {
    const digits = referralPhone.replace(/\D/g, "")
    if (digits.length === 0) {
      setReferralStatus("idle")
      setReferralName(null)
      return
    }
    if (digits.length < 10) {
      setReferralStatus("idle")
      setReferralName(null)
      return
    }
    if (digits.length !== 10) {
      setReferralStatus("idle")
      setReferralName(null)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setReferralStatus("checking")
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await apiClient.checkReferralPhone(digits, {
          clubId: clubId ?? undefined,
          refereePhone: user?.phoneNumber?.replace(/\D/g, ""),
        })
        if (res.success && res.data) {
          if (res.data.isSelf) {
            setReferralStatus("self")
            setReferralName(null)
          } else if (res.data.exists && res.data.isMember === false) {
            setReferralStatus("not-member")
            setReferralName(res.data.name ?? null)
          } else if (res.data.exists) {
            setReferralStatus("found")
            setReferralName(res.data.name ?? null)
          } else {
            setReferralStatus("not-found")
            setReferralName(null)
          }
        } else {
          setReferralStatus("idle")
        }
      } catch {
        setReferralStatus("idle")
      }
    }, 600)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [referralPhone, clubId, user?.phoneNumber])

  useEffect(() => {
    if (clubId) {
      setCurrentMembership(null)
      loadCurrentMembership(clubId)
      loadPlans(clubId)
    } else {
      setIsLoading(false)
      setPlans([])
      setCurrentMembership(null)
    }
  }, [clubId, user])

  const loadCurrentMembership = async (clubId: string) => {
    try {
      if (user && 'memberships' in user && user.memberships) {
        
        const clubMemberships = user.memberships.filter((m: any) => 
          m.club_id?._id === clubId && m.status === 'active'
        )
        
        let membership = null
        if (clubMemberships.length > 0) {
          membership = clubMemberships.reduce((latest: any, current: any) => {
            const latestDate = new Date(getMembershipStartDate(latest))
            const currentDate = new Date(getMembershipStartDate(current))
            return currentDate > latestDate ? current : latest
          })
        }
        
        setCurrentMembership(membership)
      }
    } catch (error) {
    }
  }

  const loadPlans = async (clubId?: string) => {
    try {
      setIsLoading(true)
      
      
      const response = await apiClient.getMembershipPlans(clubId)
      
      if (response.success && response.data) {
        const plansData = Array.isArray(response.data) ? response.data : ((response.data as any)?.data || [])
        const activePlans = plansData
          .filter((plan: any) => plan.isActive)
          .sort((a: any, b: any) => a.price - b.price)
        setPlans(activePlans)
      } else {
        toast.error(response.error || "Failed to load membership plans")
      }
    } catch (error) {
      toast.error("Failed to load membership plans")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectPlan = async (plan: MembershipPlan) => {
    if (!user?._id) {
      toast.error("Please log in to select a plan")
      return
    }
    const planId = plan._id
    const salesState = getPlanSalesState(plan)
    if (!salesState.isOpen) {
      if (salesState.closed && currentMembership && isMembershipExpired()) {
        toast.error("Contact Club Admin")
      } else if (salesState.closed) {
        toast.error("Membership Closed")
      } else {
        toast.error("Membership sales are not open yet for this plan")
      }
      return
    }

    if (plan.price > 0) {
      const orderId = `membership-${planId}-${user._id}-${Date.now()}`
      const orderNumber = `ORD-${Math.floor(Math.random() * 900000) + 100000}`
      const currency = plan.currency || "INR"
      const { isUpgrade, ...feeBreakdown } = getPlanCharge(plan)
      const validReferral = referralStatus === "found" ? referralPhone.replace(/\D/g, "") : undefined
      setPendingPayment({
        planId,
        planName: plan.name,
        orderId,
        orderNumber,
        total: feeBreakdown.finalAmount,
        subtotal: feeBreakdown.baseAmount,
        platformFeeTotal: feeBreakdown.platformFee + feeBreakdown.platformFeeGst,
        razorpayFeeTotal: feeBreakdown.razorpayFee + feeBreakdown.razorpayFeeGst,
        currency,
        paymentMethod: "all",
        isUpgrade,
        referralPhone: validReferral,
      })
      return
    }

    const validReferralFree = referralStatus === "found" ? referralPhone.replace(/\D/g, "") : undefined
    try {
      setIsAssigning(planId)
      const response = await apiClient.subscribeMembershipPlan(planId, undefined, validReferralFree)
      if (response.success) {
        const message = response.data && "isUpgrade" in response.data && response.data.isUpgrade
          ? "Membership plan upgraded successfully!"
          : "Membership plan selected successfully!"
        toast.success(message)
        await checkAuth()
        if (clubId) {
          await loadPlans(clubId)
          await loadCurrentMembership(clubId)
        }
      } else {
        toast.error(response.error || "Failed to select membership plan")
      }
    } catch (error) {
      toast.error("Failed to select membership plan")
    } finally {
      setIsAssigning(null)
    }
  }

  const handlePaymentSuccess = async (
    orderId: string,
    paymentId: string,
    razorpayOrderId: string,
    razorpaySignature: string
  ) => {
    if (!pendingPayment) return
    const { planId, referralPhone: pendingReferral } = pendingPayment
    try {
      setIsAssigning(planId)
      const response = await apiClient.subscribeMembershipPlan(
        planId,
        { razorpay_payment_id: paymentId, razorpay_order_id: razorpayOrderId, razorpay_signature: razorpaySignature },
        pendingReferral
      )
      if (response.success) {
        const message =
          response.data && "isUpgrade" in response.data && response.data.isUpgrade
            ? "Payment successful — membership upgraded!"
            : "Payment successful — membership activated!"
        toast.success(message)
        setPendingPayment(null)
        await checkAuth()
        if (clubId) {
          await loadPlans(clubId)
          await loadCurrentMembership(clubId)
        }
      } else {
        toast.error(response.error || "Failed to activate membership after payment")
      }
    } catch (error) {
      toast.error("Failed to activate membership after payment")
    } finally {
      setIsAssigning(null)
      setPendingPayment(null)
    }
  }

  const handlePaymentFailure = (
    _orderId: string,
    _paymentId: string,
    _razorpayOrderId: string,
    _razorpaySignature: string,
    _error?: any
  ) => {
    toast.error("Payment failed or was cancelled. Please try again.")
    setPendingPayment(null)
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price)
  }

  const formatDate = (dateString: string) => (dateString ? formatDisplayDate(dateString) : 'N/A')

  const getMembershipStartDate = (m: any) => m?.start_date ?? m?.startDate ?? ''
  const getMembershipEndDate = (m: any) => m?.end_date ?? m?.endDate ?? ''

  const formatDuration = (duration: number) => {
    if (duration === 0) return "Lifetime"
    if (duration === 1) return "1 month"
    if (duration < 12) return `${duration} months`
    const years = Math.floor(duration / 12)
    const months = duration % 12
    if (months === 0) return `${years} year${years > 1 ? 's' : ''}`
    return `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}`
  }

  const getPlanDurationMonths = (plan: MembershipPlan & { duration_days?: number }) => {
    if (plan.duration != null && plan.duration > 0) return plan.duration
    const start = plan.planStartDate ? new Date(plan.planStartDate).getTime() : 0
    const end = plan.planEndDate ? new Date(plan.planEndDate).getTime() : 0
    if (start && end && end > start) {
      const months = Math.round((end - start) / (30.44 * 24 * 60 * 60 * 1000))
      return months > 0 ? months : 0
    }
    if (plan.duration_days != null && plan.duration_days > 0) {
      return Math.round(plan.duration_days / 30.44)
    }
    return 0
  }

  const getPlanDateRangeLabel = (plan: MembershipPlan) => {
    if (plan.planStartDate && plan.planEndDate) {
      return `${formatDate(plan.planStartDate)} – ${formatDate(plan.planEndDate)}`
    }
    return formatDuration(getPlanDurationMonths(plan))
  }

  const getMostPopularPlan = () => {
    if (plans.length <= 2) return null
    const sortedByPrice = [...plans].sort((a, b) => a.price - b.price)
    return sortedByPrice[Math.floor(sortedByPrice.length / 2)]?._id
  }

  const isUpgradePlan = (plan: MembershipPlan) => {
    if (!currentMembership?.membership_level_id) return false
    const currentPlan = currentMembership.membership_level_id
    return plan.price > currentPlan.price
  }

  const isDowngradePlan = (plan: MembershipPlan) => {
    if (!currentMembership?.membership_level_id) return false
    const currentPlan = currentMembership.membership_level_id
    return plan.price < currentPlan.price
  }

  const isMembershipExpired = () => {
    const endDateStr = getMembershipEndDate(currentMembership)
    if (!endDateStr) return false
    const endDate = new Date(endDateStr)
    const now = new Date()
    return endDate <= now
  }

  /** Single source of truth for what a plan actually costs — same calculation feeds both the
   *  card price shown here and the amount handed to Razorpay in handleSelectPlan. */
  const getPlanCharge = (plan: MembershipPlan) => {
    const currentPlanPrice = currentMembership?.membership_level_id?.price ?? 0
    const isUpgradeEligible = Boolean(currentMembership && !isMembershipExpired())
    return computeMembershipPlanCharge({ planPrice: plan.price, currentPlanPrice, isUpgradeEligible })
  }

  const isCurrentPlan = (plan: MembershipPlan) => {
    if (!currentMembership?.membership_level_id) return false
    const isCurrent = currentMembership.membership_level_id._id === plan._id
    return isCurrent
  }

  const isPlanDisabled = (plan: MembershipPlan) => {
    const salesState = getPlanSalesState(plan)
    if (!salesState.isOpen) return true
    if (isCurrentPlan(plan)) {
      return true
    }
    
    const expired = isMembershipExpired()
    const isDowngrade = isDowngradePlan(plan)
    
    if (currentMembership && !expired) {
      const disabled = isDowngrade
      return disabled
    }
    
    return false
  }

  const getButtonText = (plan: MembershipPlan) => {
    const salesState = getPlanSalesState(plan)
    if (!salesState.isOpen) {
      return salesState.closed ? "Membership Closed" : "Unavailable"
    }
    if (isCurrentPlan(plan)) {
      return 'Your Current Plan'
    }
    
    if (currentMembership && !isMembershipExpired()) {
      if (isUpgradePlan(plan)) {
        return 'Upgrade to This Plan'
      }
      return 'Upgrade Required'
    } else {
      if (isUpgradePlan(plan)) {
        return 'Upgrade to This Plan'
      } else if (isDowngradePlan(plan)) {
        return 'Downgrade to This Plan'
      }
      return 'Select Plan'
    }
  }

  const getPlanSalesState = (plan: MembershipPlan) => {
    const now = Date.now()
    const bookingStartMs = (plan as any).bookingStartDate ? new Date((plan as any).bookingStartDate).getTime() : null
    const bookingEndMs = (plan as any).bookingEndDate ? new Date((plan as any).bookingEndDate).getTime() : null
    const notStarted = Boolean(bookingStartMs && now < bookingStartMs)
    const closed = Boolean(bookingEndMs && now > bookingEndMs)
    return { isOpen: !notStarted && !closed, closed, notStarted }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading membership plans...</p>
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
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Choose Your Membership Plan</h1>
            <p className="text-lg text-muted-foreground">
              Select the perfect plan that suits your needs and unlock exclusive benefits
            </p>
          </div>

          {!clubId && !isLoading && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Select a Club</h3>
                  <p className="text-muted-foreground">
                    Please select a club to view available membership plans.
                  </p>
                  <div className="pt-2">
                    <Button onClick={() => (window.location.href = "/splash")}>Go to Club Selection</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Display current membership info */}
          {currentMembership && (
            <Card className={`${
              isMembershipExpired() 
                ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
            }`}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Check className={`w-5 h-5 ${
                      isMembershipExpired() 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-blue-600 dark:text-blue-400'
                    }`} />
                    <p className={`${
                      isMembershipExpired() 
                        ? 'text-red-900 dark:text-red-100' 
                        : 'text-blue-900 dark:text-blue-100'
                    }`}>
                      <span className="font-semibold">
                        {isMembershipExpired() ? 'Expired Plan: ' : 'Current Plan: '}
                      </span>
                      {currentMembership.membership_level_id?.name} - {formatPrice(currentMembership.membership_level_id?.price || 0, currentMembership.membership_level_id?.currency || 'INR')}
                    </p>
                  </div>
                  <div className="text-center text-sm space-y-1">
                    {getMembershipStartDate(currentMembership) && (
                      <p className={isMembershipExpired() ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300'}>
                        Member since {formatDate(getMembershipStartDate(currentMembership))}
                      </p>
                    )}
                    {isMembershipExpired() ? (
                      getMembershipEndDate(currentMembership) && (
                        <p className="text-red-700 dark:text-red-300">
                          Expired on {formatDate(getMembershipEndDate(currentMembership))}. You can now upgrade or downgrade to any plan.
                        </p>
                      )
                    ) : (
                      getMembershipEndDate(currentMembership) ? (
                        <p className="text-blue-700 dark:text-blue-300">
                          Active until {formatDate(getMembershipEndDate(currentMembership))}. You can upgrade to a higher-tier plan anytime.
                        </p>
                      ) : (
                        <p className="text-blue-700 dark:text-blue-300">
                          Active (lifetime). You can upgrade to a higher-tier plan anytime.
                        </p>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Referral field */}
          {clubId && plans.some((p) => p.referralReward?.enabled) && (
            <Card>
              <CardContent className="pt-5 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="referralPhone" className="text-sm font-medium">
                        Referral Mobile Number
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            Enter the registered mobile number of the member who referred you to earn them points!
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="text-xs text-muted-foreground">(Optional)</span>
                    </div>
                    <div className="relative">
                      <Input
                        id="referralPhone"
                        type="tel"
                        placeholder="Enter 10-digit mobile number"
                        value={referralPhone}
                        onChange={(e) => setReferralPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className={
                          referralStatus === "found" ? "border-green-500 pr-9" :
                          referralStatus === "self" || referralStatus === "not-found" || referralStatus === "not-member" ? "border-amber-400 pr-9" :
                          "pr-9"
                        }
                        maxLength={10}
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        {referralStatus === "checking" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                        {referralStatus === "found" && <UserCheck className="w-4 h-4 text-green-600" />}
                        {(referralStatus === "not-found" || referralStatus === "self" || referralStatus === "not-member") && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                      </div>
                    </div>

                    {referralStatus === "found" && referralName && (
                      <p className="text-xs text-green-600 font-medium">
                        ✓ Referral confirmed — {referralName} will earn points when you subscribe!
                      </p>
                    )}
                    {referralStatus === "found" && !referralName && (
                      <p className="text-xs text-green-600 font-medium">
                        ✓ Referral confirmed — your friend will earn points when you subscribe!
                      </p>
                    )}
                    {referralStatus === "not-found" && (
                      <p className="text-xs text-amber-600">
                        Member not found. Please check the number to ensure your friend gets their points.
                      </p>
                    )}
                    {referralStatus === "not-member" && (
                      <p className="text-xs text-amber-600">
                        {referralName ? `${referralName} is registered but not an active member of this club.` : "This number is not an active member of this club."}
                      </p>
                    )}
                    {referralStatus === "self" && (
                      <p className="text-xs text-destructive font-medium">
                        You cannot refer yourself.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {clubId && plans.length === 0 && !isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <CreditCard className="mx-auto h-8 w-8 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No Plans Available</h3>
                  <p className="text-muted-foreground">
                    There are currently no membership plans available for this club. Please check back later.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : clubId && plans.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const isPopular = plan._id === getMostPopularPlan()
                const isUpgrade = isUpgradePlan(plan)
                const isDowngrade = isDowngradePlan(plan)
                const isCurrent = isCurrentPlan(plan)
                const isDisabled = isPlanDisabled(plan)
                const buttonText = getButtonText(plan)
                const salesState = getPlanSalesState(plan)
                
                return (
                  <Card 
                    key={plan._id} 
                    className={`relative ${
                      isCurrent 
                        ? 'border-green-500 shadow-md' 
                        : isPopular 
                        ? 'border-primary shadow-lg' 
                        : isDisabled
                        ? 'opacity-60'
                        : ''
                    }`}
                  >
                    {isCurrent && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge variant="default" className="bg-green-600 text-white">
                          <Check className="w-3 h-3 mr-1" />
                          Current Plan
                        </Badge>
                      </div>
                    )}
                    {!isCurrent && isPopular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge variant="default" className="bg-primary text-primary-foreground">
                          <Star className="w-3 h-3 mr-1" />
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      {!salesState.isOpen && (
                        <div className="pt-1">
                          <Badge variant="secondary">
                            {salesState.closed ? "Membership Closed" : "Unavailable"}
                          </Badge>
                        </div>
                      )}
                      <CardDescription className="text-sm">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold">
                          {formatPrice(getPlanCharge(plan).finalAmount, plan.currency)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getPlanCharge(plan).isUpgrade ? 'Upgrade price, ' : ''}all-inclusive
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {getPlanDateRangeLabel(plan)}
                        </div>
                      </div>

                      <Button 
                        className="w-full" 
                        variant={isCurrent ? "outline" : isPopular ? "default" : "outline"}
                        onClick={() => handleSelectPlan(plan)}
                        disabled={isAssigning === plan._id || isDisabled}
                      >
                        {isCurrent ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Your Current Plan
                          </>
                        ) : isAssigning === plan._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                            {isUpgrade ? 'Upgrading...' : isDowngrade ? 'Downgrading...' : 'Selecting...'}
                          </>
                        ) : isUpgrade ? (
                          <>
                            <ArrowUp className="w-4 h-4 mr-2" />
                            {buttonText}
                          </>
                        ) : isDowngrade ? (
                          <>
                            <ArrowDown className="w-4 h-4 mr-2" />
                            {buttonText}
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            {buttonText}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : null}

          {pendingPayment && (
            <PaymentSimulationModal
              isOpen={!!pendingPayment}
              onClose={() => setPendingPayment(null)}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentFailure={handlePaymentFailure}
              orderId={pendingPayment.orderId}
              orderNumber={pendingPayment.orderNumber}
              total={pendingPayment.total}
              subtotal={pendingPayment.subtotal}
              platformFeeTotal={pendingPayment.platformFeeTotal}
              razorpayFeeTotal={pendingPayment.razorpayFeeTotal}
              currency={pendingPayment.currency}
              paymentMethod={pendingPayment.paymentMethod}
              dialogTitle={pendingPayment.isUpgrade ? "Pay upgrade difference" : "Pay for membership"}
              dialogDescription={
                pendingPayment.isUpgrade
                  ? `Pay the difference for ${pendingPayment.planName} (incl. GST & fees)`
                  : `Complete payment for ${pendingPayment.planName}`
              }
              payButtonLabel="Pay & activate"
              onRazorpayOrderCreated={async (razorpayOrderId) => {
                const result = await apiClient.createPendingMembershipPurchase(
                  pendingPayment.planId,
                  razorpayOrderId,
                  pendingPayment.referralPhone
                )
                if (!result.success) toast.error(result.error || "Unable to prepare membership purchase")
                return result.success
              }}
            />
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
