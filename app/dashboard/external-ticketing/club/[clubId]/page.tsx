"use client"

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiClient, ExternalTicketRequest } from '@/lib/api'
import { toast } from 'sonner'
import { triggerBlobDownload } from '@/lib/utils'

export default function ClubExternalTicketsPage() {
  const params = useParams() as any
  const clubId = params.clubId
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
      // console.log("setting requests", requests.map(req => req._id === id ? (updated as any) : req))
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
      // console.error('Export error', err)
      toast.error('Failed to export requests')
    } finally {
      setExporting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">External Ticket Requests</h1>
            <p className="text-muted-foreground">Club ID: {clubId}</p>
          </div>
          <div>
            <Button variant="default" onClick={exportRequests} disabled={exporting}>{exporting ? 'Exporting…' : 'Export to Excel'}</Button>
          </div>
        </div>

        {loading ? (
          <div>Loading requests...</div>
        ) : (
          <div className="grid gap-4">
            {requests.map((r) => (
              <Card key={r._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{r.user_name}</CardTitle>
                    <div className="text-sm text-muted-foreground">{new Date(r.preferred_date).toLocaleDateString()}</div>
                  </div>
                  <CardDescription className="text-sm">Tickets: {r.tickets} — Status: {r.status}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-2">Phone: {r.phone_country_code ? `${r.phone_country_code} ${r.phone}` : r.phone}</div>
                  {r.comments && <div className="mb-2">Comments: {r.comments}</div>}
                  <div className="flex gap-2">
                    {r.status !== 'fulfilled' ? (
                      <Button variant="default" onClick={() => updateStatus(r._id, 'fulfilled')}>Mark Fulfilled</Button>
                    ) : (
                      <Button variant="outline" onClick={() => updateStatus(r._id, 'unfulfilled')}>Mark Unfulfilled</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
