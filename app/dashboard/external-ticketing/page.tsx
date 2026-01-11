"use client"

import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiClient, ExternalTicketRequest } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import { triggerBlobDownload } from '@/lib/utils'
import { CheckCircle, XCircle } from 'lucide-react'
import { ProtectedRoute } from '@/components/protected-route'

export default function ExternalTicketingPage() {
  const { user } = useAuth()
  const clubId = (user as any)?.club?._id || (user as any)?.club_id?._id
  const [requests, setRequests] = useState<ExternalTicketRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!clubId) return
    const load = async () => {
      setLoading(true)
      const resp = await apiClient.listExternalTicketRequestsForClub(clubId, { limit: 200 })
      // resp.data may either be the array or an object { success: true, data: [...] }
      if (resp.success && resp.data) {
        const payload: any = resp.data
        const arr = Array.isArray(payload) ? payload : (payload.data || payload)
        if (Array.isArray(arr)) setRequests(arr as any)
        else toast.error('Failed to load requests')
      } else {
        toast.error('Failed to load requests')
      }
      setLoading(false)
    }
    load()
  }, [clubId])

  const updateStatus = async (id: string, status: string) => {
    const resp = await apiClient.updateExternalTicketRequestStatus(id, status as any)
    if (resp.success) {
      const updated = (resp.data as any)?.data || (resp.data as any)
      setRequests((r) => r.map(req => req._id === id ? (updated as any) : req))
      toast.success('Status updated')
    } else {
      toast.error('Failed to update status')
    }
  }

  const exportRequests = async () => {
    if (!clubId) {
      toast.error('Missing club id')
      return
    }
    try {
      setExporting(true)
      const result = await apiClient.downloadFile(`/external-tickets/club/${clubId}/export`)
      if (!result.success) throw new Error(result.error || 'Export failed')
      const blob = result.blob as Blob | undefined
      if (!blob) throw new Error('No file returned')
      const filename = result.filename || `external_ticket_requests_${clubId}_${Date.now()}.xlsx`
      triggerBlobDownload(blob, filename)
      toast.success('Download started')
    } catch (err: any) {
      toast.error('Failed to export requests')
    } finally {
      setExporting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!clubId) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <DashboardLayout>
          <div className="space-y-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900">No club associated</h3>
              <p className="text-gray-500">Please ensure you are associated with a club to view ticket requests.</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">External Ticket Requests</h1>
            </div>
            <div>
              <Button variant="default" onClick={exportRequests} disabled={exporting}>{exporting ? 'Exporting…' : 'Export to Excel'}</Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ticket Requests</CardTitle>
              <CardDescription>
                Manage external ticket requests for this club
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div>Loading requests...</div>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium text-gray-900">No ticket requests found</h3>
                  <p className="text-gray-500">No ticket requests have been submitted yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px]">User Name</TableHead>
                          <TableHead className="min-w-[120px]">Date</TableHead>
                          <TableHead className="min-w-[100px]">Tickets</TableHead>
                          <TableHead className="min-w-[120px]">Status</TableHead>
                          <TableHead className="min-w-[150px]">Phone</TableHead>
                          <TableHead className="min-w-[200px]">Comments</TableHead>
                          <TableHead className="text-right min-w-[150px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.map((r) => (
                          <TableRow key={r._id}>
                            <TableCell className="font-medium">
                              {r.user_name}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatDate(r.preferred_date)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {r.tickets}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={r.status === 'fulfilled' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {r.status === 'fulfilled' ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Fulfilled
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Unfulfilled
                                  </>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {r.phone_country_code ? `${r.phone_country_code} ${r.phone}` : r.phone}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground max-w-[200px] truncate" title={r.comments}>
                                {r.comments || '—'}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {r.status !== 'fulfilled' ? (
                                <Button variant="default" size="sm" onClick={() => updateStatus(r._id, 'fulfilled')}>
                                  Mark Fulfilled
                                </Button>
                              ) : (
                                <Button variant="outline" size="sm" onClick={() => updateStatus(r._id, 'unfulfilled')}>
                                  Mark Unfulfilled
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
