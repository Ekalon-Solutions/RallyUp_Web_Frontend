"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AlertCircle, Plus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { apiClient } from "@/lib/api"

interface FeatureLimit {
  key: string
  label: string
  currentLimit: number
  tierDefault: number
}

interface LimitRequest {
  _id: string
  featureKey: string
  currentLimit: number
  requestedLimit: number
  justification: string
  status: 'pending' | 'approved' | 'rejected' | 'in_review'
  createdAt: string
  approvedAt?: string
}

export function FeatureLimitsTab() {
  const clubId = useRequiredClubId()
  const [loading, setLoading] = useState(true)
  const [limits, setLimits] = useState<FeatureLimit[]>([])
  const [requests, setRequests] = useState<LimitRequest[]>([])
  const [billingTier, setBillingTier] = useState<string>('')
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<FeatureLimit | null>(null)
  const [requestedLimit, setRequestedLimit] = useState<number>(0)
  const [justification, setJustification] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (clubId) {
      loadLimits()
      loadRequests()
    }
  }, [clubId])

  const loadLimits = async () => {
    if (!clubId) return
    try {
      setLoading(true)
      const response = await apiClient.getClubTierLimits(clubId)
      if (response.success && response.data) {
        const data = response.data
        setBillingTier(data.billingTier)
        const limitsArray = Object.entries(data.limits).map(([key, value]: [string, any]) => ({
          key,
          label: value.label,
          currentLimit: value.currentLimit,
          tierDefault: value.tierDefault,
        }))
        setLimits(limitsArray)
      } else {
        toast.error("Failed to load tier limits")
      }
    } catch (error) {
      toast.error("Error loading tier limits")
    } finally {
      setLoading(false)
    }
  }

  const loadRequests = async () => {
    if (!clubId) return
    try {
      const response = await apiClient.getLimitRequests(clubId)
      if (response.success && response.data) {
        setRequests(response.data)
      }
    } catch (error) {
      console.error("Error loading requests:", error)
    }
  }

  const handleRequestIncrease = (feature: FeatureLimit) => {
    setSelectedFeature(feature)
    setRequestedLimit(feature.currentLimit)
    setJustification('')
    setOpenDialog(true)
  }

  const handleSubmitRequest = async () => {
    if (!clubId || !selectedFeature) return
    if (requestedLimit <= selectedFeature.currentLimit) {
      toast.error("Requested limit must be higher than current limit")
      return
    }
    if (!justification.trim() || justification.trim().length < 10) {
      toast.error("Justification must be at least 10 characters")
      return
    }

    try {
      setSubmitting(true)
      const response = await apiClient.requestLimitIncrease(clubId, {
        featureKey: selectedFeature.key,
        requestedLimit,
        justification,
      })
      if (response.success) {
        toast.success("Limit increase request submitted successfully!")
        setOpenDialog(false)
        await loadRequests()
      } else {
        toast.error(response.message || "Failed to submit request")
      }
    } catch (error) {
      toast.error("Error submitting request")
    } finally {
      setSubmitting(false)
    }
  }

  const getPendingRequest = (featureKey: string) => {
    return requests.find(
      (r) => r.featureKey === featureKey && r.status === 'pending'
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600'
      case 'rejected':
        return 'text-red-600'
      case 'pending':
        return 'text-yellow-600'
      case 'in_review':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6 p-2">
      <Card>
        <CardHeader>
          <CardTitle>Feature Limits for Your Tier</CardTitle>
          <CardDescription>
            Your current billing tier is <strong>{billingTier.toUpperCase()}</strong>. View and request higher limits below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading limits...</div>
          ) : limits.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No feature limits are configured for your tier.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {limits.map((limit) => {
                const pendingReq = getPendingRequest(limit.key)
                return (
                  <div
                    key={limit.key}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1 mb-3 sm:mb-0">
                      <h4 className="font-medium text-sm">{limit.label}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Current: <strong>{limit.currentLimit}</strong> | Tier Default: {limit.tierDefault}
                      </p>
                      {pendingReq && (
                        <p className="text-xs mt-2">
                          <span className={`font-semibold ${getStatusColor(pendingReq.status)}`}>
                            {pendingReq.status === 'pending' && '⏳ Pending request'}
                            {pendingReq.status === 'in_review' && '👁️ Under review'}
                            {pendingReq.status === 'approved' && '✅ Approved'}
                            {pendingReq.status === 'rejected' && '❌ Rejected'}
                          </span>
                          {' '}: Requested {pendingReq.requestedLimit}
                        </p>
                      )}
                    </div>
                    <div className="w-full sm:w-auto">
                      {pendingReq ? (
                        <Button disabled size="sm" variant="outline">
                          Request Pending
                        </Button>
                      ) : (
                        <Dialog open={openDialog && selectedFeature?.key === limit.key} onOpenChange={setOpenDialog}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRequestIncrease(limit)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Request Increase
                            </Button>
                          </DialogTrigger>
                          {selectedFeature?.key === limit.key && (
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Request Limit Increase</DialogTitle>
                                <DialogDescription>
                                  Request a higher limit for {limit.label}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Feature</Label>
                                  <Input value={limit.label} disabled />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Current Limit</Label>
                                    <Input value={limit.currentLimit} disabled />
                                  </div>
                                  <div>
                                    <Label>Tier Default</Label>
                                    <Input value={limit.tierDefault} disabled />
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="requested-limit">Requested Limit *</Label>
                                  <Input
                                    id="requested-limit"
                                    type="number"
                                    min={limit.currentLimit + 1}
                                    value={requestedLimit}
                                    onChange={(e) =>
                                      setRequestedLimit(parseInt(e.target.value) || 0)
                                    }
                                    placeholder={`Enter limit higher than ${limit.currentLimit}`}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="justification">Justification *</Label>
                                  <Textarea
                                    id="justification"
                                    placeholder="Why do you need this increase? (min 10 characters)"
                                    value={justification}
                                    onChange={(e) => setJustification(e.target.value)}
                                    rows={4}
                                    className="resize-none"
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {justification.length} / 500 characters
                                  </p>
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    onClick={() => setOpenDialog(false)}
                                    disabled={submitting}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleSubmitRequest}
                                    disabled={submitting}
                                  >
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          )}
                        </Dialog>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Request History</CardTitle>
            <CardDescription>
              Track the status of your limit increase requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request._id}
                  className="p-3 border rounded-lg text-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium">
                        {limits.find((l) => l.key === request.featureKey)?.label || request.featureKey}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {request.currentLimit} → {request.requestedLimit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${getStatusColor(request.status)}`}>
                        {request.status === 'pending' && '⏳ Pending'}
                        {request.status === 'in_review' && '👁️ In Review'}
                        {request.status === 'approved' && '✅ Approved'}
                        {request.status === 'rejected' && '❌ Rejected'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    {request.justification}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
