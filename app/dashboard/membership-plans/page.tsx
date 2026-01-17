"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, CreditCard, Users, Calendar, CheckCircle, Edit } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"

interface MembershipPlan {
  _id: string
  name: string
  description: string
  price: number
  currency: string
  duration: number
  features: {
    maxEvents: number
    maxNews: number
    maxMembers: number
    customBranding: boolean
    advancedAnalytics: boolean
    prioritySupport: boolean
    apiAccess: boolean
    customIntegrations: boolean
  }
  isActive: boolean
  createdAt: string
}

export default function MembershipPlansPage() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [clubs, setClubs] = useState<Array<{ _id: string; name: string }>>([])
  const [selectedClubId, setSelectedClubId] = useState<string | undefined>(undefined)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [plansWithCards, setPlansWithCards] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    currency: "INR",
    duration: 1,
    features: {
      maxEvents: 10,
      maxNews: 5,
      maxMembers: 100,
      customBranding: false,
      advancedAnalytics: false,
      prioritySupport: false,
      apiAccess: false,
      customIntegrations: false,
      premiumFeatures: "" // Free text field for premium features
    }
  })

  useEffect(() => {
    // Load clubs and then plans when user is available
    if (user) {
      loadClubsAndDefault()
    }
  }, [user])

  const loadPlans = async () => {
    return loadPlansForClub(selectedClubId)
  }

  const loadPlansForClub = async (clubId?: string) => {
    try {
      setIsLoading(true)
      // console.log('Loading membership plans...')

      // Check if user is authenticated
      const token = localStorage.getItem('token')
      if (!token) {
        // console.error('No authentication token found')
        toast.error('Please log in to view membership plans')
        setIsLoading(false)
        return
      }

      const response = await apiClient.getMembershipPlans(clubId)

      if (response.success) {
        const respAny: any = response
        const plansData = Array.isArray(respAny.data) ? respAny.data : (respAny.data?.data || [])
        setPlans(plansData)

        if (plansData.length === 0) {
          toast.info('No membership plans found for this club. Click "Create Plan" to add your first membership plan.')
        }

        if (clubId) {
          await loadPlansWithCards(clubId, plansData)
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

  const loadClubsAndDefault = async () => {
    try {
      let clubsList: Array<{ _id: string; name: string }> = []
      let initialClubId: string | undefined = undefined

      const userRole = user?.role
      const userAny = user as any

      if (userRole === 'system_owner') {
        const clubsResp = await apiClient.getPublicClubs()
        clubsList = clubsResp.success ? (clubsResp.data?.clubs || []) : []
        initialClubId = clubsList.length > 0 ? clubsList[0]._id : undefined
      } else if (userRole === 'admin' || userRole === 'super_admin') {
        if (userAny?.club?._id) {
          clubsList = [{ _id: userAny.club._id, name: userAny.club.name }]
          initialClubId = userAny.club._id
        } else if (userAny?.memberships && Array.isArray(userAny.memberships)) {
          clubsList = userAny.memberships
            .filter((m: any) => m.club_id && m.status === 'active')
            .map((m: any) => ({
              _id: m.club_id._id || m.club_id,
              name: m.club_id.name || 'Unknown Club'
            }))
          initialClubId = clubsList.length > 0 ? clubsList[0]._id : undefined
        }

        if (clubsList.length === 0) {
          try {
            const adminClubResp = await apiClient.getAdminClub()
            if (adminClubResp.success && adminClubResp.data?.club) {
              clubsList = [{ _id: adminClubResp.data.club._id, name: adminClubResp.data.club.name }]
              initialClubId = adminClubResp.data.club._id
            }
          } catch (err) {
          }
        }
      } else {
        if (userAny?.memberships && Array.isArray(userAny.memberships)) {
          clubsList = userAny.memberships
            .filter((m: any) => m.club_id && m.status === 'active')
            .map((m: any) => ({
              _id: m.club_id._id || m.club_id,
              name: m.club_id.name || 'Unknown Club'
            }))
          initialClubId = clubsList.length > 0 ? clubsList[0]._id : undefined
        }
      }

      setClubs(clubsList)
      setSelectedClubId(initialClubId)
      
      await loadPlansForClub(initialClubId)
    } catch (error) {
      // console.error('Error loading clubs:', error)
      setClubs([])
      await loadPlansForClub(undefined)
    }
  }

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      if (!selectedClubId) {
        toast.error('Please select a club to create the plan for')
        setIsCreating(false)
        return
      }

      if (!formData.name || formData.name.trim().length === 0) {
        toast.error('Plan name is required. Please enter a valid plan name before creating the membership plan.')
        setIsCreating(false)
        return
      }

      if (formData.price < 0) {
        toast.error('Price cannot be negative. Please enter a valid price (0 or greater) for the membership plan.')
        setIsCreating(false)
        return
      }

      if (formData.duration < 1 || formData.duration > 120) {
        toast.error('Duration must be between 1 and 120 months. Please enter a valid duration for the membership plan.')
        setIsCreating(false)
        return
      }

      const response = await (apiClient as any).createMembershipPlan({ ...formData, clubId: selectedClubId })

      if (response.success) {
        toast.success(`Membership plan "${formData.name}" created successfully with price ${formData.currency} ${formData.price} for ${formData.duration} month(s).`)
        setShowCreateDialog(false)
        setFormData({
          name: "",
          description: "",
          price: 0,
          currency: "USD",
          duration: 1,
          features: {
            maxEvents: 10,
            maxNews: 5,
            maxMembers: 100,
            customBranding: false,
            advancedAnalytics: false,
            prioritySupport: false,
            apiAccess: false,
            customIntegrations: false,
            premiumFeatures: ""
          }
        })
        loadPlans()
      } else {
        const errorDetails = response.errorDetails || {}
        const errorMessage = response.error || 'Unknown error occurred'
        const validationErrors = errorDetails.errors || errorDetails.validationErrors || []
        const validationMsg = validationErrors.length > 0 ? ` Validation errors: ${validationErrors.join(', ')}.` : ''
        toast.error(`Failed to create membership plan "${formData.name}": ${errorMessage}.${validationMsg} Please check all required fields and try again.`)
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Network error or server unavailable'
      const errorDetails = error?.response?.data || {}
      const statusCode = error?.response?.status || 'Unknown'
      const validationErrors = errorDetails.errors || []
      const validationMsg = validationErrors.length > 0 ? ` Validation errors: ${validationErrors.join(', ')}.` : ''
      toast.error(`Failed to create membership plan "${formData.name}" due to: ${errorMessage}. Status: ${statusCode}.${validationMsg} Please check your input and try again.`)
    } finally {
      setIsCreating(false)
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price)
  }

  const formatDuration = (months: number) => {
    if (months === 1) return "1 Month"
    if (months === 3) return "3 Months"
    if (months === 6) return "6 Months"
    if (months === 12) return "1 Year"
    return `${months} Months`
  }

  const handleEditPlan = (plan: MembershipPlan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      duration: plan.duration,
      features: {
        maxEvents: plan.features.maxEvents,
        maxNews: plan.features.maxNews,
        maxMembers: plan.features.maxMembers,
        customBranding: plan.features.customBranding || false,
        advancedAnalytics: plan.features.advancedAnalytics || false,
        prioritySupport: plan.features.prioritySupport || false,
        apiAccess: plan.features.apiAccess || false,
        customIntegrations: plan.features.customIntegrations || false,
        premiumFeatures: (plan.features as any).premiumFeatures || ""
      }
    })
    setShowEditDialog(true)
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

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPlan) return

    setIsUpdating(true)

    try {
      if (!formData.name || formData.name.trim().length === 0) {
        toast.error('Plan name is required. Please enter a valid plan name before updating the membership plan.')
        setIsUpdating(false)
        return
      }

      if (formData.price < 0) {
        toast.error('Price cannot be negative. Please enter a valid price (0 or greater) for the membership plan.')
        setIsUpdating(false)
        return
      }

      if (formData.duration < 1 || formData.duration > 120) {
        toast.error('Duration must be between 1 and 120 months. Please enter a valid duration for the membership plan.')
        setIsUpdating(false)
        return
      }

      const response = await apiClient.updateMembershipPlan(editingPlan._id, formData)

      if (response.success) {
        toast.success(`Membership plan "${formData.name}" updated successfully with new price ${formData.currency} ${formData.price} and duration ${formData.duration} month(s).`)
        setShowEditDialog(false)
        setEditingPlan(null)
        setFormData({
          name: "",
          description: "",
          price: 0,
          currency: "USD",
          duration: 1,
          features: {
            maxEvents: 10,
            maxNews: 5,
            maxMembers: 100,
            customBranding: false,
            advancedAnalytics: false,
            prioritySupport: false,
            apiAccess: false,
            customIntegrations: false,
            premiumFeatures: ""
          }
        })
        await loadPlans()
      } else {
        const errorDetails = (response as any).errorDetails || {}
        const errorMessage = response.error || 'Unknown error occurred'
        const statusCode = (errorDetails as any).statusCode || (response as any).statusCode || 'Unknown'
        const validationErrors = (errorDetails as any).errors || (errorDetails as any).validationErrors || []
        const validationMsg = validationErrors.length > 0 ? ` Validation errors: ${validationErrors.join(', ')}.` : ''
        const detailsMsg = (errorDetails as any).message || (errorDetails as any).details || ''
        toast.error(`Failed to update membership plan "${formData.name}" (ID: ${editingPlan._id}): ${errorMessage}. Status: ${statusCode}.${validationMsg} ${detailsMsg ? `Details: ${detailsMsg}.` : ''} Please check all fields and try again.`)
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Network error or server unavailable'
      const errorDetails = error?.response?.data || {}
      const statusCode = error?.response?.status || 'Unknown'
      const validationErrors = errorDetails.errors || []
      const validationMsg = validationErrors.length > 0 ? ` Validation errors: ${validationErrors.join(', ')}.` : ''
      toast.error(`Failed to update membership plan "${formData.name}" (ID: ${editingPlan._id}) due to: ${errorMessage}. Status: ${statusCode}.${validationMsg} Please check your input and try again.`)
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Membership Plans</h1>
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
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Membership Plans</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Create and manage membership plans for your club</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                <Label className="text-sm">Club</Label>
                <select
                  value={selectedClubId}
                  onChange={(e) => {
                    const id = e.target.value || undefined
                    setSelectedClubId(id)
                    // reload plans for selected club
                    loadPlansForClub(id)
                  }}
                  className="px-3 py-2 border border-input rounded-md bg-background text-foreground w-full sm:w-auto text-sm"
                >
                  <option value={""}>Select Club</option>
                  {clubs.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <Button variant="outline" onClick={loadPlans} className="w-full sm:w-auto">
                Refresh
              </Button>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 w-4 h-4" />
                    Create Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Membership Plan</DialogTitle>
                    <DialogDescription>
                      Create a new membership plan with features and pricing
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreatePlan} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Plan Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Price</Label>
                        <Input
                          id="price"
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <select
                          id="currency"
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                        >
                          <option value="INR">INR</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="AUD">AUD</option>
                          <option value="CAD">CAD</option>
                          <option value="CHF">CHF</option>
                          <option value="CNY">CNY</option>
                          <option value="HKD">HKD</option>
                          <option value="JPY">JPY</option>
                          <option value="NZD">NZD</option>
                          <option value="NOK">NOK</option>
                          <option value="SEK">SEK</option>
                          <option value="SGD">SGD</option>
                          <option value="ZAR">ZAR</option>
                          <option value="BRL">BRL</option>
                          <option value="MXN">MXN</option>
                          <option value="TRY">TRY</option>
                          <option value="DKK">DKK</option>
                          <option value="ILS">ILS</option>
                          <option value="PLN">PLN</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration (Months)</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 1 })}
                          min="1"
                          max="120"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration Display</Label>
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          {formatDuration(formData.duration)}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-4 text-foreground">Plan Features</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="maxEvents">Max Events</Label>
                          <Input
                            id="maxEvents"
                            type="number"
                            value={formData.features.maxEvents}
                            onChange={(e) => setFormData({
                              ...formData,
                              features: { ...formData.features, maxEvents: parseInt(e.target.value) || 0 }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxNews">Max News</Label>
                          <Input
                            id="maxNews"
                            type="number"
                            value={formData.features.maxNews}
                            onChange={(e) => setFormData({
                              ...formData,
                              features: { ...formData.features, maxNews: parseInt(e.target.value) || 0 }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxMembers">Max Members</Label>
                          <Input
                            id="maxMembers"
                            type="number"
                            value={formData.features.maxMembers}
                            onChange={(e) => setFormData({
                              ...formData,
                              features: { ...formData.features, maxMembers: parseInt(e.target.value) || 0 }
                            })}
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <Label htmlFor="premiumFeatures">Premium Features</Label>
                        <Textarea
                          id="premiumFeatures"
                          value={formData.features.premiumFeatures || ""}
                          onChange={(e) => setFormData({
                            ...formData,
                            features: { ...formData.features, premiumFeatures: e.target.value }
                          })}
                          placeholder="Enter premium features as free text (e.g., Custom Branding, Advanced Analytics, Priority Support, API Access)"
                          className="mt-2"
                          rows={4}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={isCreating} className="flex-1">
                        {isCreating ? "Creating..." : "Create Plan"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Membership Plan</DialogTitle>
                    <DialogDescription>
                      Update the membership plan details and features
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpdatePlan} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Plan Name</Label>
                        <Input
                          id="edit-name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-price">Price</Label>
                        <Input
                          id="edit-price"
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Input
                        id="edit-description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-currency">Currency</Label>
                        <select
                          id="edit-currency"
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                        >
                          <option value="INR">INR</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="AUD">AUD</option>
                          <option value="CAD">CAD</option>
                          <option value="CHF">CHF</option>
                          <option value="CNY">CNY</option>
                          <option value="HKD">HKD</option>
                          <option value="JPY">JPY</option>
                          <option value="NZD">NZD</option>
                          <option value="NOK">NOK</option>
                          <option value="SEK">SEK</option>
                          <option value="SGD">SGD</option>
                          <option value="ZAR">ZAR</option>
                          <option value="BRL">BRL</option>
                          <option value="MXN">MXN</option>
                          <option value="TRY">TRY</option>
                          <option value="DKK">DKK</option>
                          <option value="ILS">ILS</option>
                          <option value="PLN">PLN</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-duration">Duration (Months)</Label>
                        <Input
                          id="edit-duration"
                          type="number"
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 1 })}
                          min="1"
                          max="120"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration Display</Label>
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          {formatDuration(formData.duration)}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-4 text-foreground">Plan Features</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-maxEvents">Max Events</Label>
                          <Input
                            id="edit-maxEvents"
                            type="number"
                            value={formData.features.maxEvents}
                            onChange={(e) => setFormData({
                              ...formData,
                              features: { ...formData.features, maxEvents: parseInt(e.target.value) || 0 }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-maxNews">Max News</Label>
                          <Input
                            id="edit-maxNews"
                            type="number"
                            value={formData.features.maxNews}
                            onChange={(e) => setFormData({
                              ...formData,
                              features: { ...formData.features, maxNews: parseInt(e.target.value) || 0 }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-maxMembers">Max Members</Label>
                          <Input
                            id="edit-maxMembers"
                            type="number"
                            value={formData.features.maxMembers}
                            onChange={(e) => setFormData({
                              ...formData,
                              features: { ...formData.features, maxMembers: parseInt(e.target.value) || 0 }
                            })}
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <Label htmlFor="edit-premiumFeatures">Premium Features</Label>
                        <Textarea
                          id="edit-premiumFeatures"
                          value={formData.features.premiumFeatures || ""}
                          onChange={(e) => setFormData({
                            ...formData,
                            features: { ...formData.features, premiumFeatures: e.target.value }
                          })}
                          placeholder="Enter premium features as free text (e.g., Custom Branding, Advanced Analytics, Priority Support, API Access)"
                          className="mt-2"
                          rows={4}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={isUpdating} className="flex-1">
                        {isUpdating ? "Updating..." : "Update Plan"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => {
                        setShowEditDialog(false)
                        setEditingPlan(null)
                      }}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
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
                      per {formatDuration(plan.duration)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-foreground">
                        <Calendar className="w-4 h-4" />
                        Events
                      </span>
                      <span className="text-foreground">{plan.features.maxEvents}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-foreground">
                        <Users className="w-4 h-4" />
                        Members
                      </span>
                      <span className="text-foreground">{plan.features.maxMembers}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-foreground">
                        <CreditCard className="w-4 h-4" />
                        News
                      </span>
                      <span className="text-foreground">{plan.features.maxNews}</span>
                    </div>
                  </div>

                  {(plan.features as any).premiumFeatures && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold text-sm mb-2 text-foreground">Premium Features</h4>
                        <div className="text-sm text-foreground whitespace-pre-line">
                          {(plan.features as any).premiumFeatures}
                        </div>
                      </div>
                    )}

                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleEditPlan(plan)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleToggleStatus(plan._id, plan.isActive)}
                      >
                        {plan.isActive ? "Deactivate" : "Activate"}
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
                <Button onClick={() => setShowCreateDialog(true)}>
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