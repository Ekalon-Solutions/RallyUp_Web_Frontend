'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { DashboardLayout } from '@/components/dashboard-layout'
import { ProtectedRoute } from '@/components/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, XCircle, Clock, Zap } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'

interface LimitRequest {
  _id: string
  clubId: {
    _id: string
    name: string
    slug: string
  }
  featureKey: string
  currentLimit: number
  requestedLimit: number
  justification: string
  status: 'pending' | 'approved' | 'rejected' | 'in_review'
  createdAt: string
  approvedAt?: string
  rejectedAt?: string
  reviewNotes?: string
}

export default function FeatureLimitsAdminPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<LimitRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState<LimitRequest | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [newLimit, setNewLimit] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [activeAction, setActiveAction] = useState<'approve' | 'reject' | null>(null)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getAllLimitRequests()
      if (response.success && Array.isArray(response.data)) {
        setRequests(response.data)
        setPendingCount(response.data.filter((r: any) => r.status === 'pending').length)
      } else {
        toast.error('Failed to load requests')
      }
    } catch (error) {
      toast.error('Error loading requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedRequest) return
    try {
      setActionLoading(true)
      const response = await apiClient.approveLimitRequest(selectedRequest._id, {
        reviewNotes: reviewNotes.trim() || undefined,
        newLimit: newLimit || undefined,
      })
      if (response.success) {
        toast.success('Request approved and limit updated')
        await loadRequests()
        setSelectedRequest(null)
        setReviewNotes('')
        setNewLimit(null)
        setActiveAction(null)
      } else {
        toast.error(response.message || 'Failed to approve request')
      }
    } catch (error) {
      toast.error('Error approving request')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest) return
    try {
      setActionLoading(true)
      const response = await apiClient.rejectLimitRequest(selectedRequest._id, {
        reviewNotes: reviewNotes.trim() || undefined,
      })
      if (response.success) {
        toast.success('Request rejected')
        await loadRequests()
        setSelectedRequest(null)
        setReviewNotes('')
        setActiveAction(null)
      } else {
        toast.error(response.message || 'Failed to reject request')
      }
    } catch (error) {
      toast.error('Error rejecting request')
    } finally {
      setActionLoading(false)
    }
  }

  const getFilteredRequests = () => {
    if (statusFilter === 'all') return requests
    return requests.filter((r) => r.status === statusFilter)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'in_review':
        return <AlertCircle className="h-4 w-4" />
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_review':
        return 'bg-blue-100 text-blue-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatLabel = (key: string) => {
    const labels: Record<string, string> = {
      max_merch_items: 'Max Merchandise Items',
      max_wa_messages: 'Max WhatsApp Messages',
      max_event_images: 'Max Event Images',
      max_gallery_albums: 'Max Gallery Albums',
      max_poll_options: 'Max Poll Options',
      max_news_posts: 'Max News Posts',
      max_leaderboard_entries: 'Max Leaderboard Entries',
      max_coupons: 'Max Coupons',
      max_volunteers: 'Max Volunteers',
    }
    return labels[key] || key
  }

  const filteredRequests = getFilteredRequests()

  return (
    <ProtectedRoute requireSystemOwner>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Zap className="h-8 w-8" />
              Feature Limits Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Review and manage club feature limit increase requests
            </p>
          </div>

          {pendingCount > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have <strong>{pendingCount}</strong> pending request{pendingCount !== 1 ? 's' : ''} waiting for review.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Limit Increase Requests</CardTitle>
              <CardDescription>
                Total requests: {requests.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" onValueChange={setStatusFilter} className="w-full">
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="all">
                    All ({requests.length})
                  </TabsTrigger>
                  <TabsTrigger value="pending">
                    Pending ({requests.filter((r) => r.status === 'pending').length})
                  </TabsTrigger>
                  <TabsTrigger value="in_review">
                    In Review ({requests.filter((r) => r.status === 'in_review').length})
                  </TabsTrigger>
                  <TabsTrigger value="approved">
                    Approved ({requests.filter((r) => r.status === 'approved').length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected">
                    Rejected ({requests.filter((r) => r.status === 'rejected').length})
                  </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                  {loading ? (
                    <div className="text-center py-8">Loading requests...</div>
                  ) : filteredRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No requests found in this category
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Club</TableHead>
                            <TableHead>Feature</TableHead>
                            <TableHead>Limit</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRequests.map((request) => (
                            <TableRow key={request._id}>
                              <TableCell className="font-medium">
                                {request.clubId.name}
                              </TableCell>
                              <TableCell>
                                {formatLabel(request.featureKey)}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">
                                  {request.currentLimit} → {request.requestedLimit}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(request.status)}>
                                  {request.status === 'pending' && '⏳ Pending'}
                                  {request.status === 'in_review' && '👁️ In Review'}
                                  {request.status === 'approved' && '✅ Approved'}
                                  {request.status === 'rejected' && '❌ Rejected'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(request.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {request.status === 'pending' || request.status === 'in_review' ? (
                                  <Dialog open={selectedRequest?._id === request._id}>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedRequest(request)
                                          setReviewNotes(request.reviewNotes || '')
                                          setNewLimit(request.requestedLimit)
                                          setActiveAction(null)
                                        }}
                                      >
                                        Review
                                      </Button>
                                    </DialogTrigger>
                                    {selectedRequest?._id === request._id && (
                                      <DialogContent className="max-w-lg">
                                        <DialogHeader>
                                          <DialogTitle>Review Limit Request</DialogTitle>
                                          <DialogDescription>
                                            {request.clubId.name} - {formatLabel(request.featureKey)}
                                          </DialogDescription>
                                        </DialogHeader>

                                        <div className="space-y-4">
                                          <div>
                                            <Label className="font-semibold">Request Details</Label>
                                            <div className="mt-2 p-3 bg-gray-50 rounded text-sm space-y-2">
                                              <p>
                                                <strong>Club:</strong> {request.clubId.name}
                                              </p>
                                              <p>
                                                <strong>Feature:</strong> {formatLabel(request.featureKey)}
                                              </p>
                                              <p>
                                                <strong>Current Limit:</strong> {request.currentLimit}
                                              </p>
                                              <p>
                                                <strong>Requested Limit:</strong> {request.requestedLimit}
                                              </p>
                                              <p>
                                                <strong>Justification:</strong>
                                              </p>
                                              <p className="italic ml-2">{request.justification}</p>
                                              <p className="text-xs text-gray-500">
                                                Requested: {new Date(request.createdAt).toLocaleString()}
                                              </p>
                                            </div>
                                          </div>

                                          <div>
                                            <Label htmlFor="new-limit">Approved Limit (leave as requested default)</Label>
                                            <Input
                                              id="new-limit"
                                              type="number"
                                              min={request.currentLimit + 1}
                                              value={newLimit || request.requestedLimit}
                                              onChange={(e) => setNewLimit(parseInt(e.target.value) || null)}
                                            />
                                          </div>

                                          <div>
                                            <Label htmlFor="review-notes">Review Notes</Label>
                                            <Textarea
                                              id="review-notes"
                                              placeholder="Optional notes to include in the approval/rejection email"
                                              value={reviewNotes}
                                              onChange={(e) => setReviewNotes(e.target.value)}
                                              rows={3}
                                              className="resize-none"
                                            />
                                          </div>

                                          <div className="flex gap-2 justify-end">
                                            {activeAction === null && (
                                              <>
                                                <Button
                                                  variant="destructive"
                                                  onClick={() => setActiveAction('reject')}
                                                >
                                                  Reject
                                                </Button>
                                                <Button
                                                  onClick={() => setActiveAction('approve')}
                                                >
                                                  Approve
                                                </Button>
                                              </>
                                            )}

                                            {activeAction === 'approve' && (
                                              <>
                                                <Button
                                                  variant="outline"
                                                  onClick={() => setActiveAction(null)}
                                                  disabled={actionLoading}
                                                >
                                                  Cancel
                                                </Button>
                                                <Button
                                                  onClick={handleApprove}
                                                  disabled={actionLoading}
                                                >
                                                  {actionLoading ? 'Approving...' : 'Confirm Approval'}
                                                </Button>
                                              </>
                                            )}

                                            {activeAction === 'reject' && (
                                              <>
                                                <Button
                                                  variant="outline"
                                                  onClick={() => setActiveAction(null)}
                                                  disabled={actionLoading}
                                                >
                                                  Cancel
                                                </Button>
                                                <Button
                                                  variant="destructive"
                                                  onClick={handleReject}
                                                  disabled={actionLoading}
                                                >
                                                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                                                </Button>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </DialogContent>
                                    )}
                                  </Dialog>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    {request.status === 'approved' && '✓ Approved'}
                                    {request.status === 'rejected' && '✗ Rejected'}
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
