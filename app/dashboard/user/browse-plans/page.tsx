"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Star, CreditCard, Calendar, Users, Building2 } from "lucide-react"
import { toast } from "sonner"
import { apiClient, MembershipPlan } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { ClubSelector } from "@/components/club-selector"

export default function BrowseMembershipPlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState<string | null>(null)
  const [selectedClubId, setSelectedClubId] = useState<string>("")
  const { user } = useAuth()

  useEffect(() => {
    // Initial load - let ClubSelector auto-select first club
    // Plans will be loaded when club is selected
  }, [])

  useEffect(() => {
    // Load plans when selected club changes
    if (selectedClubId) {
      loadPlans(selectedClubId)
    }
  }, [selectedClubId])

  const handleClubSelect = (clubId: string) => {
    setSelectedClubId(clubId)
  }

  const loadPlans = async (clubId?: string) => {
    try {
      setIsLoading(true)
      
      console.log('🔍 Loading plans for club:', clubId || 'auto-detect')
      
      // Call getMembershipPlans with specific clubId if provided
      const response = await apiClient.getMembershipPlans(clubId)
      console.log('User membership plans response:', response)
      
      if (response.success && response.data) {
        // Handle both direct array response and nested data response
        const plansData = Array.isArray(response.data) ? response.data : ((response.data as any)?.data || [])
        // Filter only active plans
        const activePlans = plansData.filter((plan: any) => plan.isActive)
        console.log('Active plans for user:', activePlans)
        setPlans(activePlans)
      } else {
        console.error('Failed to load membership plans:', response.error)
        toast.error(response.error || "Failed to load membership plans")
      }
    } catch (error) {
      console.error('Error loading membership plans:', error)
      toast.error("Failed to load membership plans")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectPlan = async (planId: string) => {
    if (!user?._id) {
      toast.error("Please log in to select a plan")
      return
    }

    try {
      setIsAssigning(planId)
      const response = await apiClient.assignMembershipPlan(planId, user._id)
      
      if (response.success) {
        toast.success("Membership plan selected successfully!")
        // You might want to redirect to membership card or payment page here
      } else {
        toast.error(response.error || "Failed to select membership plan")
      }
    } catch (error) {
      console.error('Error assigning membership plan:', error)
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
                const featureList = getFeatureList(plan.features)
                
                return (
                  <Card 
                    key={plan._id} 
                    className={`relative ${isPopular ? 'border-primary shadow-lg' : ''}`}
                  >
                    {isPopular && (
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
                        variant={isPopular ? "default" : "outline"}
                        onClick={() => handleSelectPlan(plan._id)}
                        disabled={isAssigning === plan._id}
                      >
                        {isAssigning === plan._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                            Selecting...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Select Plan
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : null}
          
          {/* Help section - always show */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Need Help Choosing?</h3>
                <p className="text-sm text-muted-foreground">
                  Not sure which plan is right for you? Contact our support team for personalized recommendations.
                </p>
                <Button variant="outline" size="sm">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}