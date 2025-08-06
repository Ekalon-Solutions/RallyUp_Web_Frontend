"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, CreditCard, AlertTriangle, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"

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
}

interface MembershipRenewalProps {
  user: any
  membershipPlans: MembershipPlan[]
  onRenewal: (planId: string) => Promise<void>
}

export function MembershipRenewal({ user, membershipPlans, onRenewal }: MembershipRenewalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>("")
  const [isRenewing, setIsRenewing] = useState(false)
  const [showRenewalDialog, setShowRenewalDialog] = useState(false)

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

  const handleRenewal = async () => {
    if (!selectedPlan) {
      toast.error("Please select a membership plan")
      return
    }

    setIsRenewing(true)
    try {
      await onRenewal(selectedPlan)
      toast.success("Membership renewed successfully!")
      setShowRenewalDialog(false)
      setSelectedPlan("")
    } catch (error) {
      toast.error("Failed to renew membership")
    } finally {
      setIsRenewing(false)
    }
  }

  const isExpired = user.membershipExpiry && new Date() > new Date(user.membershipExpiry)
  const isExpiringSoon = user.membershipExpiry && 
    new Date(user.membershipExpiry) > new Date() && 
    new Date(user.membershipExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  if (!user.membershipPlan && !isExpired && !isExpiringSoon) {
    return null
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isExpired ? (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          ) : (
            <Calendar className="w-5 h-5 text-orange-500" />
          )}
          Membership Status
        </CardTitle>
        <CardDescription>
          {isExpired 
            ? "Your membership has expired. Renew to continue accessing club features."
            : isExpiringSoon 
            ? "Your membership is expiring soon. Consider renewing to maintain access."
            : "Manage your membership plan"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {user.membershipPlan && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Plan</span>
              <Badge variant={isExpired ? "destructive" : "default"}>
                {typeof user.membershipPlan === 'string' ? user.membershipPlan : user.membershipPlan.name}
              </Badge>
            </div>
            
            {user.membershipExpiry && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expires</span>
                <span className={`text-sm ${isExpired ? 'text-red-600 font-medium' : ''}`}>
                  {new Date(user.membershipExpiry).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}

        <Dialog open={showRenewalDialog} onOpenChange={setShowRenewalDialog}>
          <DialogTrigger asChild>
            <Button 
              variant={isExpired ? "destructive" : "default"}
              className="w-full"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isExpired ? "Renew Membership" : "Change Plan"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Renew Membership</DialogTitle>
              <DialogDescription>
                Select a new membership plan to continue accessing club features.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Membership Plan</Label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {membershipPlans.filter(plan => plan.isActive).map((plan) => (
                      <SelectItem key={plan._id} value={plan._id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{plan.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatPrice(plan.price, plan.currency)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPlan && (
                <div className="bg-muted p-3 rounded-lg">
                  {(() => {
                    const plan = membershipPlans.find(p => p._id === selectedPlan)
                    if (!plan) return null
                    
                    return (
                      <div className="space-y-2">
                        <h4 className="font-semibold">{plan.name}</h4>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Price: {formatPrice(plan.price, plan.currency)}</div>
                          <div>Duration: {formatDuration(plan.duration)}</div>
                          <div>Events: {plan.features.maxEvents}</div>
                          <div>News: {plan.features.maxNews}</div>
                        </div>
                        {plan.features.advancedAnalytics && (
                          <div className="flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            Advanced Analytics
                          </div>
                        )}
                        {plan.features.prioritySupport && (
                          <div className="flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            Priority Support
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleRenewal} 
                  disabled={isRenewing || !selectedPlan}
                  className="flex-1"
                >
                  {isRenewing ? "Processing..." : "Renew Membership"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowRenewalDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
} 