"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, CreditCard, Users, Calendar, CheckCircle, DollarSign } from "lucide-react"
import { toast } from "sonner"

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
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    currency: "USD",
    duration: 30,
    features: {
      maxEvents: 10,
      maxNews: 5,
      maxMembers: 100,
      customBranding: false,
      advancedAnalytics: false,
      prioritySupport: false,
      apiAccess: false,
      customIntegrations: false
    }
  })

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://3.111.169.32:5050/api/membership-plans', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPlans(data.data || [])
      } else {
        toast.error("Failed to load membership plans")
      }
    } catch (error) {
      toast.error("Failed to load membership plans")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://3.111.169.32:5050/api/membership-plans', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Membership plan created successfully!")
        setShowCreateDialog(false)
        setFormData({
          name: "",
          description: "",
          price: 0,
          currency: "USD",
          duration: 30,
          features: {
            maxEvents: 10,
            maxNews: 5,
            maxMembers: 100,
            customBranding: false,
            advancedAnalytics: false,
            prioritySupport: false,
            apiAccess: false,
            customIntegrations: false
          }
        })
        loadPlans()
      } else {
        toast.error(data.message || "Failed to create membership plan")
      }
    } catch (error) {
      toast.error("An error occurred")
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

  const formatDuration = (days: number) => {
    if (days === 30) return "1 Month"
    if (days === 90) return "3 Months"
    if (days === 180) return "6 Months"
    if (days === 365) return "1 Year"
    return `${days} Days`
  }

  if (isLoading) {
    return <div className="p-6">Loading membership plans...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Membership Plans</h1>
          <p className="text-muted-foreground">Create and manage membership plans for your club</p>
        </div>
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
              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (Days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
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
                <h3 className="font-semibold mb-4">Plan Features</h3>
                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="customBranding"
                      checked={formData.features.customBranding}
                      onChange={(e) => setFormData({
                        ...formData,
                        features: { ...formData.features, customBranding: e.target.checked }
                      })}
                    />
                    <Label htmlFor="customBranding">Custom Branding</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="advancedAnalytics"
                      checked={formData.features.advancedAnalytics}
                      onChange={(e) => setFormData({
                        ...formData,
                        features: { ...formData.features, advancedAnalytics: e.target.checked }
                      })}
                    />
                    <Label htmlFor="advancedAnalytics">Advanced Analytics</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="prioritySupport"
                      checked={formData.features.prioritySupport}
                      onChange={(e) => setFormData({
                        ...formData,
                        features: { ...formData.features, prioritySupport: e.target.checked }
                      })}
                    />
                    <Label htmlFor="prioritySupport">Priority Support</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="apiAccess"
                      checked={formData.features.apiAccess}
                      onChange={(e) => setFormData({
                        ...formData,
                        features: { ...formData.features, apiAccess: e.target.checked }
                      })}
                    />
                    <Label htmlFor="apiAccess">API Access</Label>
                  </div>
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
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan._id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
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
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Events
                  </span>
                  <span>{plan.features.maxEvents}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Members
                  </span>
                  <span>{plan.features.maxMembers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    News
                  </span>
                  <span>{plan.features.maxNews}</span>
                </div>
              </div>

              {Object.entries(plan.features).some(([key, value]) => 
                key.startsWith('custom') || key.startsWith('advanced') || key.startsWith('priority') || key.startsWith('api') && value
              ) && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm mb-2">Premium Features</h4>
                  <div className="space-y-1">
                    {plan.features.customBranding && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Custom Branding
                      </div>
                    )}
                    {plan.features.advancedAnalytics && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Advanced Analytics
                      </div>
                    )}
                    {plan.features.prioritySupport && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Priority Support
                      </div>
                    )}
                    {plan.features.apiAccess && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        API Access
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  {plan.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plans.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Membership Plans Yet</h3>
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
  )
} 