"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Star, CreditCard, Calendar, Users, Building2, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "sonner"
import { apiClient, MembershipPlan } from "@/lib/api"
import { formatDisplayDate } from "@/lib/utils"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { PaymentSimulationModal } from "@/components/modals/payment-simulation-modal"
import { calculateTransactionFees } from "@/lib/transactionFees"

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
  } | null>(null)
  const { user, checkAuth } = useAuth()
  const clubId = useRequiredClubId()

  useEffect(() => {
  }, [])

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
            const latestDate = new Date(latest.start_date)
            const currentDate = new Date(current.start_date)
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

    // Paid plan: show payment modal first, then subscribe with payment
    if (plan.price > 0) {
      const orderId = `membership-${planId}-${user._id}-${Date.now()}`
      const orderNumber = `ORD-${Math.floor(Math.random() * 900000) + 100000}`
      const currency = plan.currency || "INR"
      // On upgrade: charge only the difference; apply GST + platform fee on that difference (same as event purchase)
      const currentPlanPrice = currentMembership?.membership_level_id?.price ?? 0
      const isUpgrade = Boolean(currentMembership && !isMembershipExpired() && plan.price > currentPlanPrice)
      const baseAmount = isUpgrade ? Math.max(0, plan.price - currentPlanPrice) : plan.price
      const feeBreakdown = calculateTransactionFees(baseAmount)
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
      })
      return
    }

    // Free plan: subscribe directly
    try {
      setIsAssigning(planId)
      const response = await apiClient.subscribeMembershipPlan(planId)
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
    const { planId } = pendingPayment
    try {
      setIsAssigning(planId)
      const response = await apiClient.subscribeMembershipPlan(planId, {
        razorpay_payment_id: paymentId,
        razorpay_order_id: razorpayOrderId,
        razorpay_signature: razorpaySignature,
      })
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

  const formatDuration = (duration: number) => {
    if (duration === 0) return "Lifetime"
    if (duration === 1) return "1 month"
    if (duration < 12) return `${duration} months`
    const years = Math.floor(duration / 12)
    const months = duration % 12
    if (months === 0) return `${years} year${years > 1 ? 's' : ''}`
    return `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}`
  }

  const getFeatureList = (features: MembershipPlan['features']) => {
    const featureList = []
    
    if (features.maxEvents > 0) {
      featureList.push(`Up to ${features.maxEvents} events`)
    }
    if (features.maxNews > 0) {
      featureList.push(`Up to ${features.maxNews} news posts`)
    }
    if (features.maxMembers > 0) {
      featureList.push(`Up to ${features.maxMembers} members`)
    }
    if (features.customBranding) {
      featureList.push("Custom branding")
    }
    if (features.advancedAnalytics) {
      featureList.push("Advanced analytics")
    }
    if (features.prioritySupport) {
      featureList.push("Priority support")
    }
    if (features.apiAccess) {
      featureList.push("API access")
    }
    if (features.customIntegrations) {
      featureList.push("Custom integrations")
    }
    
    return featureList
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
    if (!currentMembership?.end_date) {
      return false
    }
    const endDate = new Date(currentMembership.end_date)
    const now = new Date()
    const isExpired = endDate <= now
    return isExpired
  }

  const isCurrentPlan = (plan: MembershipPlan) => {
    if (!currentMembership?.membership_level_id) return false
    const isCurrent = currentMembership.membership_level_id._id === plan._id
    return isCurrent
  }

  const isPlanDisabled = (plan: MembershipPlan) => {
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
                      {currentMembership.membership_level_id?.name} - {formatPrice(currentMembership.membership_level_id?.price || 0, currentMembership.membership_level_id?.currency || 'USD')}
                    </p>
                  </div>
                  {isMembershipExpired() ? (
                    <p className="text-center text-sm text-red-700 dark:text-red-300">
                      Your membership expired on {formatDate(currentMembership.end_date || '')}. You can now upgrade or downgrade to any plan.
                    </p>
                  ) : (
                    <p className="text-center text-sm text-blue-700 dark:text-blue-300">
                      Active until {formatDate(currentMembership.end_date || '')}. You can upgrade to a higher-tier plan anytime.
                    </p>
                  )}
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
                const membershipExpired = isMembershipExpired()
                const featureList = getFeatureList(plan.features)
                const buttonText = getButtonText(plan)
                
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
                      <CardDescription className="text-sm">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold">
                          {formatPrice(plan.price, plan.currency)}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDuration(plan.duration)}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-1">
                          <Check className="w-4 h-4 text-green-500" />
                          What's included:
                        </h4>
                        <ul className="space-y-1 text-sm">
                          {featureList.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-muted-foreground">{feature}</span>
                            </li>
                          ))}
                        </ul>
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
            />
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}