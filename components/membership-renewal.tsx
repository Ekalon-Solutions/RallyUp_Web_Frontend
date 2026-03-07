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
import { formatDisplayDate } from "@/lib/utils"
import { apiClient } from "@/lib/api"

interface MembershipPlan {
  _id: string
  name: string
  description: string
  price: number
  currency: string
  duration?: number
  planStartDate?: string
  planEndDate?: string
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
  // onRenewal may receive optional reservation info: (planId, reservationToken?, redeemedPoints?)
  onRenewal: (planId: string, reservationToken?: string | null, redeemedPoints?: number) => Promise<void>
}

export function MembershipRenewal({ user, membershipPlans, onRenewal }: MembershipRenewalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>("")
  const [isRenewing, setIsRenewing] = useState(false)
  const [showRenewalDialog, setShowRenewalDialog] = useState(false)
  const [availablePoints, setAvailablePoints] = useState<number | null>(null)
  const [redeemPoints, setRedeemPoints] = useState<number>(0)
  const [reservationToken, setReservationToken] = useState<string | null>(null)
  const [reserving, setReserving] = useState(false)

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
    if (plan.duration === 0) return 'Lifetime'
    if (plan.duration === 1) return '1 month'
    if (plan.duration && plan.duration < 12) return `${plan.duration} months`
    if (plan.duration === 12) return '1 year'
    if (plan.duration) return `${plan.duration} months`
    return '—'
  }

  React.useEffect(() => {
    const fetchPoints = async () => {
      try {
        if (showRenewalDialog && user) {
          const clubId = (user as any)?.memberships?.[0]?.club_id?._id || (user as any)?.club || undefined
          if (clubId) {
            const resp = await apiClient.getMemberPoints((user as any)._id, clubId)
            if (resp && resp.success && resp.data) setAvailablePoints(resp.data.points || 0)
          }
        }
      } catch (e) {}
    }
    fetchPoints()
  }, [showRenewalDialog, user])

  const handleRenewal = async () => {
    if (!selectedPlan) {
      toast.error("Please select a membership plan")
      return
    }

    setIsRenewing(true)
    try {
      await onRenewal(selectedPlan, reservationToken, redeemPoints)
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
                  {formatDisplayDate(user.membershipExpiry)}
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
                          <div>Plan period: {formatPlanPeriod(plan)}</div>
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

                  {/* Redeem Points for renewal */}
                  <div className="mt-3">
                    <Label className="text-sm font-medium">Redeem Points {availablePoints !== null && ` (Available: ${availablePoints} pts)`}</Label>
                    <div className="flex gap-2 mt-2">
                      <input type="number" min={0} value={redeemPoints} onChange={(e) => setRedeemPoints(Number(e.target.value || 0))} className="border rounded px-2 py-1 w-32" placeholder="Points" />
                      <Button type="button" size="sm" onClick={async () => {
                        if (!redeemPoints || redeemPoints <= 0) { toast.error('Enter points to redeem'); return }
                        setReserving(true)
                        try {
                          const plan = membershipPlans.find(p => p._id === selectedPlan)
                          const orderTotal = plan ? plan.price : undefined
                          const resp = await apiClient.createReservation(redeemPoints, (user as any)?.memberships?.[0]?.club_id?._id || (user as any)?.club, orderTotal)
                          if (resp && resp.success) {
                            setReservationToken(resp.data?.reservationToken || null)
                            toast.success('Points reserved')
                          } else {
                            toast.error(resp?.message || 'Failed to reserve points')
                          }
                        } catch (e) {
                          toast.error('Failed to reserve points')
                        } finally { setReserving(false) }
                      }}>{reserving ? 'Reserving...' : 'Reserve'}</Button>
                      <Button type="button" variant="ghost" onClick={async () => {
                        if (reservationToken) {
                          try { await apiClient.cancelReservation(reservationToken) } catch (e) {}
                        }
                        setReservationToken(null); setRedeemPoints(0)
                      }}>Clear</Button>
                    </div>
                  </div>
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