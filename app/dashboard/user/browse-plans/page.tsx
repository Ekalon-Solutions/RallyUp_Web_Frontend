"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Star, CreditCard, Calendar, Users, Building2, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "sonner"
import { apiClient, MembershipPlan } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { ClubSelector } from "@/components/club-selector"

export default function BrowseMembershipPlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAssigning, setIsAssigning] = useState<string | null>(null)
  const [selectedClubId, setSelectedClubId] = useState<string>("")
  const [currentMembership, setCurrentMembership] = useState<any>(null)
  const { user, checkAuth } = useAuth()

  useEffect(() => {
    // console.log('BrowsePlansPage: Initial load, waiting for ClubSelector')
  }, [])

  useEffect(() => {
    // console.log('BrowsePlansPage: selectedClubId changed to:', selectedClubId)
    if (selectedClubId) {
      // Reset current membership when club changes
      setCurrentMembership(null)
      loadCurrentMembership(selectedClubId)
      loadPlans(selectedClubId)
    } else {
      setIsLoading(false)
      setPlans([])
      setCurrentMembership(null)
    }
  }, [selectedClubId, user])

  const handleClubSelect = (clubId: string) => {
    setSelectedClubId(clubId)
  }

  const loadCurrentMembership = async (clubId: string) => {
    try {
      // console.log('🔍 Loading current membership for clubId:', clubId)
      // Get current user's active membership for this club from auth context
      if (user && 'memberships' in user && user.memberships) {
        // console.log('All user memberships:', user.memberships)
        
        // Find all memberships for this club
        const clubMemberships = user.memberships.filter((m: any) => 
          m.club_id?._id === clubId && m.status === 'active'
        )
        
        // console.log('Club memberships found:', clubMemberships)
        
        // If multiple memberships for same club, take the most recent one (latest start_date)
        let membership = null
        if (clubMemberships.length > 0) {
          membership = clubMemberships.reduce((latest: any, current: any) => {
            const latestDate = new Date(latest.start_date)
            const currentDate = new Date(current.start_date)
            return currentDate > latestDate ? current : latest
          })
        }
        
        // console.log('✅ Selected current membership for club:', membership)
        setCurrentMembership(membership)
      }
    } catch (error) {
      // console.error('Error loading current membership:', error)
    }
  }

  const loadPlans = async (clubId?: string) => {
    try {
      setIsLoading(true)
      
      // console.log('🔍 Loading plans for club:', clubId || 'auto-detect')
      
      const response = await apiClient.getMembershipPlans(clubId)
      // console.log('User membership plans response:', response)
      
      if (response.success && response.data) {
        const plansData = Array.isArray(response.data) ? response.data : ((response.data as any)?.data || [])
        // Filter only active plans and sort by price (ascending)
        const activePlans = plansData
          .filter((plan: any) => plan.isActive)
          .sort((a: any, b: any) => a.price - b.price)
        // console.log('Active plans sorted by price:', activePlans)
        setPlans(activePlans)
      } else {
        // console.error('Failed to load membership plans:', response.error)
        toast.error(response.error || "Failed to load membership plans")
      }
    } catch (error) {
      // console.error('Error loading membership plans:', error)
      toast.error("Failed to load membership plans")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectPlan = async (planId: string, isUpgrade: boolean) => {
    if (!user?._id) {
      toast.error("Please log in to select a plan")
      return
    }

    try {
      setIsAssigning(planId)
      
      // Use the new subscribe endpoint
      const response = await apiClient.subscribeMembershipPlan(planId)
      
      if (response.success) {
        const message = response.data && 'isUpgrade' in response.data && response.data.isUpgrade
          ? "Membership plan upgraded successfully!" 
          : "Membership plan selected successfully!"
        toast.success(message)
        
        // Refresh auth context to get updated memberships
        await checkAuth()
        
        // Reload plans and current membership
        if (selectedClubId) {
          await loadPlans(selectedClubId)
          await loadCurrentMembership(selectedClubId)
        }
      } else {
        toast.error(response.error || "Failed to select membership plan")
      }
    } catch (error) {
      // console.error('Error subscribing to membership plan:', error)
      toast.error("Failed to select membership plan")
    } finally {
      setIsAssigning(null)
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

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
    // Simple logic: middle-priced plan is most popular
    if (plans.length <= 2) return null
    const sortedByPrice = [...plans].sort((a, b) => a.price - b.price)
    return sortedByPrice[Math.floor(sortedByPrice.length / 2)]?._id
  }

  // Determine if a plan is an upgrade
  const isUpgradePlan = (plan: MembershipPlan) => {
    if (!currentMembership?.membership_level_id) return false
    const currentPlan = currentMembership.membership_level_id
    return plan.price > currentPlan.price
  }

  // Determine if a plan is a downgrade
  const isDowngradePlan = (plan: MembershipPlan) => {
    if (!currentMembership?.membership_level_id) return false
    const currentPlan = currentMembership.membership_level_id
    return plan.price < currentPlan.price
  }

  // Check if membership is expired or about to expire
  const isMembershipExpired = () => {
    if (!currentMembership?.end_date) {
      // console.log('❌ No end_date found in currentMembership')
      return false
    }
    const endDate = new Date(currentMembership.end_date)
    const now = new Date()
    const isExpired = endDate <= now
    // console.log('⏰ Membership expiry check:', {
//       endDate: endDate.toISOString(),
//       now: now.toISOString(),
//       isExpired
//     })
    return isExpired
  }

  // Determine if this is the user's current plan
  const isCurrentPlan = (plan: MembershipPlan) => {
    if (!currentMembership?.membership_level_id) return false
    const isCurrent = currentMembership.membership_level_id._id === plan._id
    // console.log('🎯 Is current plan?', {
//       planId: plan._id,
//       planName: plan.name,
//       currentPlanId: currentMembership.membership_level_id._id,
//       isCurrent
//     })
    return isCurrent
  }

  // Determine if a plan should be disabled
  const isPlanDisabled = (plan: MembershipPlan) => {
    if (isCurrentPlan(plan)) {
      // console.log('🚫 Plan disabled - is current plan:', plan.name)
      return true
    }
    
    const expired = isMembershipExpired()
    const isDowngrade = isDowngradePlan(plan)
    
    // If membership is active (not expired)
    if (currentMembership && !expired) {
      // Only allow upgrades during active membership
      const disabled = isDowngrade
      // console.log('🔒 Active membership check:', {
//         planName: plan.name,
//         isDowngrade,
//         disabled,
//         reason: disabled ? 'Downgrade not allowed during active membership' : 'Upgrade allowed'
//       })
      return disabled
    }
    
    // If expired or no membership, allow all plans
    // console.log('✅ Plan enabled:', plan.name, 'Membership expired or no membership')
    return false
  }

  // Get button text based on plan status
  const getButtonText = (plan: MembershipPlan) => {
    if (isCurrentPlan(plan)) {
      return 'Your Current Plan'
    }
    
    if (currentMembership && !isMembershipExpired()) {
      // Active membership - only show upgrade
      if (isUpgradePlan(plan)) {
        return 'Upgrade to This Plan'
      }
      return 'Upgrade Required' // For downgrade plans
    } else {
      // Expired or no membership - can upgrade or downgrade
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

          {/* Club Selector */}
          <ClubSelector 
            onClubSelect={handleClubSelect}
            selectedClubId={selectedClubId}
          />

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

          {/* Display message when no club is selected */}
          {!selectedClubId && !isLoading && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Select a Club</h3>
                  <p className="text-muted-foreground">
                    Choose a club from your memberships above to view available membership plans.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plans section - only show when club is selected */}
          {selectedClubId && plans.length === 0 && !isLoading ? (
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
          ) : selectedClubId && plans.length > 0 ? (
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
                        onClick={() => handleSelectPlan(plan._id, isUpgrade)}
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
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}