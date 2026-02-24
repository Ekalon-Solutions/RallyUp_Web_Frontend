'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RefundDetailsModal } from '@/components/modals/refund-details-modal'
import { getApiUrl } from '@/lib/config'
import { ChevronLeft, ChevronRight, Eye, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface RefundRequest {
  _id: string
  sourceType: 'event_ticket' | 'store_order'
  user: {
    first_name: string
    last_name: string
    email: string
    phoneNumber: string
  }
  eventId?: {
    title: string
    startTime: string
  }
  orderId?: {
    orderNumber: string
    total: number
  }
  currency: string
  estimatedRefund: number
  breakdown: {
    grossPaid: number
    taxesExcluded: number
    platformFeesExcluded: number
    paymentGatewayFeesExcluded: number
  }
  status: 'requested' | 'processed' | 'rejected'
  requestedAt: string
  processedAt?: string
  adminNotes?: string
}

export default function RefundsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [refunds, setRefunds] = useState<RefundRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null)

  useEffect(() => {
    fetchRefunds()
  }, [page, statusFilter])

  const fetchRefunds = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(
        getApiUrl(`/refunds/admin?page=${page}&limit=20&status=${statusFilter}`),
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      const data = await response.json()

      if (response.ok && data.success) {
        setRefunds(data.data.refunds)
        setTotalPages(data.data.pagination.totalPages)
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to fetch refunds',
          variant: 'destructive'
        })
      }
    } catch (err) {
      console.error('Failed to fetch refunds:', err)
      toast({
        title: 'Error',
        description: 'Failed to fetch refunds',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkProcessed = async (refundId: string, adminNotes: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        getApiUrl(`/refunds/admin/${refundId}/processed`),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ adminNotes })
        }
      )

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: 'Success',
          description: 'Refund marked as processed'
        })
        fetchRefunds()
        setSelectedRefund(null)
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to process refund',
          variant: 'destructive'
        })
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to process refund',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Requested</Badge>
      case 'processed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Processed</Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Refund Requests</h1>
          <p className="text-muted-foreground">Manage and process refund requests</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Refunds</CardTitle>
                <CardDescription>View and manage all refund requests</CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="requested">Requested</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : refunds.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No refund requests found
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Refund</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {refunds.map((refund) => (
                        <TableRow key={refund._id}>
                          <TableCell className="text-sm">
                            {new Date(refund.requestedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {refund.user.first_name} {refund.user.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {refund.user.email}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {refund.sourceType === 'event_ticket' ? 'Event Ticket' : 'Store Order'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {refund.sourceType === 'event_ticket' && refund.eventId
                              ? refund.eventId.title
                              : refund.orderId?.orderNumber}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {refund.currency} {refund.breakdown.grossPaid.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold text-green-600">
                            {refund.currency} {refund.estimatedRefund.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(refund.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {refund.status === 'requested' && (
                                <Button
                                  onClick={() => setSelectedRefund(refund)}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Process
                                </Button>
                              )}
                              <Button
                                onClick={() => setSelectedRefund(refund)}
                                size="sm"
                                variant="outline"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      variant="outline"
                      size="sm"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      variant="outline"
                      size="sm"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <RefundDetailsModal
        refund={selectedRefund}
        onClose={() => setSelectedRefund(null)}
        onMarkProcessed={handleMarkProcessed}
      />
    </DashboardLayout>
  )
}
