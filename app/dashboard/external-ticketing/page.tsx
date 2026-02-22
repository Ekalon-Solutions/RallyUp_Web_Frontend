"use client"

import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient, ExternalTicketRequest, ExternalTicketFixture, Event } from '@/lib/api'
import { toast } from 'sonner'
import { triggerBlobDownload, formatDisplayDate } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, Pause, UserX, Download, Filter, RefreshCw } from 'lucide-react'
import { ProtectedRoute } from '@/components/protected-route'
import { useRequiredClubId } from '@/hooks/useRequiredClubId'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'on_hold', label: 'Event Rescheduled (On Hold)' },
  { value: 'cancelled_by_member', label: 'Cancelled by Member' },
  { value: 'unfulfilled', label: 'Unfulfilled' },
] as const

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  fulfilled: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    icon: <CheckCircle className="w-3 h-3 mr-1" />,
  },
  rejected: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    icon: <XCircle className="w-3 h-3 mr-1" />,
  },
  on_hold: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    icon: <Pause className="w-3 h-3 mr-1" />,
  },
  pending: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    icon: <Clock className="w-3 h-3 mr-1" />,
  },
  cancelled_by_member: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    icon: <UserX className="w-3 h-3 mr-1" />,
  },
  unfulfilled: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    icon: <Clock className="w-3 h-3 mr-1" />,
  },
}

export default function ExternalTicketingPage() {
  const clubId = useRequiredClubId()
  const [requests, setRequests] = useState<ExternalTicketRequest[]>([])
  const [fixtures, setFixtures] = useState<ExternalTicketFixture[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingFixtures, setLoadingFixtures] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [updatingVisibility, setUpdatingVisibility] = useState(false)
  const [bulkUpdatingStatus, setBulkUpdatingStatus] = useState(false)
  const [competitionFilter, setCompetitionFilter] = useState<string>('all')
  const [selectedFixtureIds, setSelectedFixtureIds] = useState<Set<string>>(new Set())
  const [bulkVisibilityEndsAt, setBulkVisibilityEndsAt] = useState<string>('')
  const [fixtureVisibilityEndById, setFixtureVisibilityEndById] = useState<Record<string, string>>({})
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [requestFixtureFilter, setRequestFixtureFilter] = useState<string>('all')
  const [requestCompetitionFilter, setRequestCompetitionFilter] = useState<string>('all')
  const [selectedRequestIds, setSelectedRequestIds] = useState<Set<string>>(new Set())
  const [rowStatusById, setRowStatusById] = useState<Record<string, string>>({})
  const [rowCommentById, setRowCommentById] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!clubId) return
    const load = async () => {
      setLoading(true)
      const resp = await apiClient.listExternalTicketRequestsForClub(clubId, {
        limit: 500,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        fixtureId: requestFixtureFilter !== 'all' ? requestFixtureFilter : undefined,
        competition: requestCompetitionFilter !== 'all' ? requestCompetitionFilter : undefined,
      })
      // resp.data may either be the array or an object { success: true, data: [...] }
      if (resp.success && resp.data) {
        const payload: any = resp.data
        const arr = Array.isArray(payload) ? payload : (payload.data || payload)
        if (Array.isArray(arr)) {
          setRequests(arr as any)
          setSelectedRequestIds(new Set())
          const statusMap: Record<string, string> = {}
          ;(arr as ExternalTicketRequest[]).forEach((r) => {
            statusMap[r._id] = r.status
          })
          setRowStatusById(statusMap)
        }
        else toast.error('Failed to load requests')
      } else {
        toast.error('Failed to load requests')
      }
      setLoading(false)
    }
    load()
  }, [clubId, statusFilter, requestFixtureFilter, requestCompetitionFilter])

  const loadFixtures = async () => {
    if (!clubId) return
    setLoadingFixtures(true)
    try {
      const resp = await apiClient.listExternalTicketFixturesForAdmin(clubId)
      if (resp.success && resp.data) {
        const payload: any = resp.data
        const arr = Array.isArray(payload) ? payload : (payload.data || payload)
        if (Array.isArray(arr)) {
          setFixtures(arr as ExternalTicketFixture[])
          setSelectedFixtureIds(new Set())
          const endsMap: Record<string, string> = {}
          ;(arr as ExternalTicketFixture[]).forEach((f) => {
            if (f.visibilityEndsAt) {
              const dt = new Date(f.visibilityEndsAt)
              if (!Number.isNaN(dt.getTime())) {
                endsMap[f._id] = toDatetimeLocalValue(dt)
              }
            }
          })
          setFixtureVisibilityEndById(endsMap)
        } else {
          toast.error('Failed to load fixtures')
        }
      } else {
        toast.error('Failed to load fixtures')
      }
    } catch {
      toast.error('Failed to load fixtures')
    } finally {
      setLoadingFixtures(false)
    }
  }

  useEffect(() => {
    if (!clubId) return
    loadFixtures()
  }, [clubId])

  useEffect(() => {
    if (!clubId) return
    const loadEvents = async () => {
      try {
        const resp = await apiClient.getEventsByClub(clubId)
        if (resp.success && resp.data) {
          setEvents(resp.data || [])
        }
      } catch {
      }
    }
    loadEvents()
  }, [clubId])

  const toDatetimeLocalValue = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  const uniqueCompetitions = Array.from(new Set(fixtures.map((f) => f.competition).filter(Boolean))).sort()
  const filteredFixtures =
    competitionFilter === 'all'
      ? fixtures
      : fixtures.filter((f) => f.competition === competitionFilter)

  const allVisibleSelected =
    filteredFixtures.length > 0 && filteredFixtures.every((f) => selectedFixtureIds.has(f._id))

  const toggleSelectAll = (checked: boolean) => {
    const next = new Set(selectedFixtureIds)
    if (checked) {
      filteredFixtures.forEach((f) => next.add(f._id))
    } else {
      filteredFixtures.forEach((f) => next.delete(f._id))
    }
    setSelectedFixtureIds(next)
  }

  const toggleSelectOne = (fixtureId: string, checked: boolean) => {
    const next = new Set(selectedFixtureIds)
    if (checked) next.add(fixtureId)
    else next.delete(fixtureId)
    setSelectedFixtureIds(next)
  }

  const applyVisibilityToFixtures = async (fixtureIds: string[], enabled: boolean, visibilityEndsAt?: string) => {
    if (!clubId || fixtureIds.length === 0) return
    setUpdatingVisibility(true)
    try {
      const resp = await apiClient.bulkUpdateExternalTicketFixtureVisibility(clubId, {
        fixtureIds,
        enabled,
        visibilityEndsAt: enabled ? (visibilityEndsAt || null) : null,
      })
      if (resp.success) {
        toast.success('Fixture visibility updated')
        await loadFixtures()
      } else {
        toast.error(resp.error || 'Failed to update fixture visibility')
      }
    } catch {
      toast.error('Failed to update fixture visibility')
    } finally {
      setUpdatingVisibility(false)
    }
  }

  const updateStatus = async (id: string, status: string, adminComment?: string) => {
    const resp = await apiClient.updateExternalTicketRequestStatus(id, status as any, adminComment)
    if (resp.success) {
      const updated = (resp.data as any)?.data || (resp.data as any)
      setRequests((r) => r.map(req => req._id === id ? (updated as any) : req))
      setRowStatusById((prev) => ({ ...prev, [id]: status }))
      toast.success('Status updated')
    } else {
      toast.error(resp.error || 'Failed to update status')
    }
  }

  const exportRequests = async () => {
    if (!clubId) {
      toast.error('Missing club id')
      return
    }
    try {
      setExporting(true)
      const result = await apiClient.exportExternalTicketRequests(clubId, {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        fixtureId: requestFixtureFilter !== 'all' ? requestFixtureFilter : undefined,
        competition: requestCompetitionFilter !== 'all' ? requestCompetitionFilter : undefined,
        format: 'xlsx',
      })
      if (!result.success) throw new Error(result.error || 'Export failed')
      const blob = result.blob as Blob | undefined
      if (!blob) throw new Error('No file returned')
      const filename = result.filename || `external_ticket_requests_${clubId}_${Date.now()}.xlsx`
      triggerBlobDownload(blob, filename)
      toast.success('XLSX download started')
    } catch (err: any) {
      toast.error('Failed to export XLSX')
    } finally {
      setExporting(false)
    }
  }

  const exportRequestsCsv = async () => {
    if (!clubId) {
      toast.error('Missing club id')
      return
    }
    try {
      setExporting(true)
      const result = await apiClient.exportExternalTicketRequests(clubId, {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        fixtureId: requestFixtureFilter !== 'all' ? requestFixtureFilter : undefined,
        competition: requestCompetitionFilter !== 'all' ? requestCompetitionFilter : undefined,
        format: 'csv',
      })
      if (!result.success) throw new Error(result.error || 'Export failed')
      const blob = result.blob as Blob | undefined
      if (!blob) throw new Error('No file returned')
      const filename = result.filename || `external_ticket_requests_${clubId}_${Date.now()}.csv`
      triggerBlobDownload(blob, filename)
      toast.success('CSV download started')
    } catch (err: any) {
      toast.error('Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }

  const formatDate = (dateString: string) => formatDisplayDate(dateString)

  const getStatusBadge = (status: string) => {
    const config = STATUS_COLORS[status] || STATUS_COLORS.pending
    const displayStatus = STATUS_OPTIONS.find((s) => s.value === status)?.label || status
    return (
      <Badge className={`${config.bg} ${config.text}`}>
        {config.icon}
        {displayStatus}
      </Badge>
    )
  }

  const allRequestsSelected = requests.length > 0 && selectedRequestIds.size === requests.length

  const toggleSelectAllRequests = (checked: boolean) => {
    if (checked) setSelectedRequestIds(new Set(requests.map((r) => r._id)))
    else setSelectedRequestIds(new Set())
  }

  const toggleSelectOneRequest = (requestId: string, checked: boolean) => {
    const next = new Set(selectedRequestIds)
    if (checked) next.add(requestId)
    else next.delete(requestId)
    setSelectedRequestIds(next)
  }

  const handleBulkRequestStatusUpdate = async (status: string) => {
    if (selectedRequestIds.size === 0) {
      toast.error('Please select at least one request')
      return
    }
    try {
      setBulkUpdatingStatus(true)
      const resp = await apiClient.bulkUpdateExternalTicketRequestStatus(Array.from(selectedRequestIds), status as any)
      if (resp.success) {
        toast.success(`Updated ${selectedRequestIds.size} request(s)`)
        setSelectedRequestIds(new Set())
        const refresh = await apiClient.listExternalTicketRequestsForClub(clubId!, {
          limit: 500,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          fixtureId: requestFixtureFilter !== 'all' ? requestFixtureFilter : undefined,
          competition: requestCompetitionFilter !== 'all' ? requestCompetitionFilter : undefined,
        })
        if (refresh.success && refresh.data) {
          const payload: any = refresh.data
          const arr = Array.isArray(payload) ? payload : (payload.data || payload)
          if (Array.isArray(arr)) setRequests(arr as any)
        }
      } else {
        toast.error(resp.error || 'Failed to update selected requests')
      }
    } catch {
      toast.error('Failed to update selected requests')
    } finally {
      setBulkUpdatingStatus(false)
    }
  }

  const requestCompetitions = Array.from(new Set(requests.map((r) => r.competition).filter((c): c is string => Boolean(c)))).sort()

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
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={exportRequestsCsv} disabled={exporting}>
                <Download className="w-4 h-4 mr-2" />
                {exporting ? 'Exporting…' : 'Export CSV'}
              </Button>
              <Button variant="default" onClick={exportRequests} disabled={exporting}>
                <Download className="w-4 h-4 mr-2" />
                {exporting ? 'Exporting…' : 'Export XLSX'}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Fixture Visibility for Members</CardTitle>
              <CardDescription>
                Select future fixtures members can choose while submitting external ticket requests.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Competition</Label>
                  <Select value={competitionFilter} onValueChange={setCompetitionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All competitions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All competitions</SelectItem>
                      {uniqueCompetitions.map((competition) => (
                        <SelectItem key={competition} value={competition}>
                          {competition}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bulk visibility end (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={bulkVisibilityEndsAt}
                    onChange={(e) => setBulkVisibilityEndsAt(e.target.value)}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    variant="default"
                    disabled={selectedFixtureIds.size === 0 || updatingVisibility}
                    onClick={() => applyVisibilityToFixtures(Array.from(selectedFixtureIds), true, bulkVisibilityEndsAt)}
                  >
                    Publish Selected
                  </Button>
                  <Button
                    variant="outline"
                    disabled={selectedFixtureIds.size === 0 || updatingVisibility}
                    onClick={() => applyVisibilityToFixtures(Array.from(selectedFixtureIds), false)}
                  >
                    Unpublish Selected
                  </Button>
                </div>
              </div>

              {loadingFixtures ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading fixtures...</div>
              ) : filteredFixtures.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No upcoming fixtures found for this competition filter.
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <Checkbox checked={allVisibleSelected} onCheckedChange={(v) => toggleSelectAll(Boolean(v))} />
                          </TableHead>
                          <TableHead>Fixture</TableHead>
                          <TableHead>Competition</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Visibility End</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFixtures.map((fixture) => (
                          <TableRow key={fixture._id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedFixtureIds.has(fixture._id)}
                                onCheckedChange={(v) => toggleSelectOne(fixture._id, Boolean(v))}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{fixture.title}</TableCell>
                            <TableCell>{fixture.competition || '—'}</TableCell>
                            <TableCell>{formatDate(fixture.startTime)}</TableCell>
                            <TableCell>
                              <Badge className={fixture.isVisibleForMembers ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {fixture.isVisibleForMembers ? 'Published' : 'Hidden'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="datetime-local"
                                value={fixtureVisibilityEndById[fixture._id] || ''}
                                onChange={(e) =>
                                  setFixtureVisibilityEndById((prev) => ({ ...prev, [fixture._id]: e.target.value }))
                                }
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    applyVisibilityToFixtures(
                                      [fixture._id],
                                      true,
                                      fixtureVisibilityEndById[fixture._id]
                                    )
                                  }
                                  disabled={updatingVisibility}
                                >
                                  Publish
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => applyVisibilityToFixtures([fixture._id], false)}
                                  disabled={updatingVisibility}
                                >
                                  Unpublish
                                </Button>
                              </div>
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Request Filters
              </CardTitle>
              <CardDescription>
                Filter requests by fixture, competition and approval status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Approval Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fixture</Label>
                  <Select value={requestFixtureFilter} onValueChange={setRequestFixtureFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Fixtures</SelectItem>
                      {events.map((event) => (
                        <SelectItem key={event._id} value={event._id}>
                          {event.title} - {formatDate(event.startTime)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Competition</Label>
                  <Select value={requestCompetitionFilter} onValueChange={setRequestCompetitionFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Competitions</SelectItem>
                      {requestCompetitions.map((competition) => (
                        <SelectItem key={competition} value={competition}>
                          {competition}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(statusFilter !== 'all' || requestFixtureFilter !== 'all' || requestCompetitionFilter !== 'all') && (
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter('all')
                      setRequestFixtureFilter('all')
                      setRequestCompetitionFilter('all')
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                  <span className="text-sm text-muted-foreground">{requests.length} request(s) found</span>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedRequestIds.size > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-blue-900">{selectedRequestIds.size} request(s) selected</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-blue-700">Change status to:</span>
                    <Select onValueChange={handleBulkRequestStatusUpdate} disabled={bulkUpdatingStatus}>
                      <SelectTrigger className="w-[240px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.filter((s) => s.value !== 'all').map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedRequestIds(new Set())} disabled={bulkUpdatingStatus}>
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                          <TableHead className="w-10">
                            <Checkbox checked={allRequestsSelected} onCheckedChange={(v) => toggleSelectAllRequests(Boolean(v))} />
                          </TableHead>
                          <TableHead className="min-w-[150px]">User Name</TableHead>
                          <TableHead className="min-w-[120px]">Date</TableHead>
                          <TableHead className="min-w-[100px]">Tickets</TableHead>
                          <TableHead className="min-w-[150px]">Competition</TableHead>
                          <TableHead className="min-w-[200px]">Fixture</TableHead>
                          <TableHead className="min-w-[120px]">Status</TableHead>
                          <TableHead className="min-w-[150px]">Phone</TableHead>
                          <TableHead className="min-w-[200px]">Comments</TableHead>
                          <TableHead className="min-w-[240px]">Admin Note (Optional)</TableHead>
                          <TableHead className="text-right min-w-[150px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.map((r) => (
                          <TableRow key={r._id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedRequestIds.has(r._id)}
                                onCheckedChange={(v) => toggleSelectOneRequest(r._id, Boolean(v))}
                              />
                            </TableCell>
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
                            <TableCell>{r.competition || '—'}</TableCell>
                            <TableCell>
                              {typeof r.fixture_id === 'object' && r.fixture_id
                                ? (r.fixture_id as any).title
                                : '—'}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(r.status)}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {r.countryCode ? `${r.countryCode} ${r.phone}` : r.phone}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground max-w-[200px] truncate" title={r.comments}>
                                {r.comments || '—'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                placeholder="Reason / note (optional)"
                                value={rowCommentById[r._id] ?? r.adminComment ?? ''}
                                onChange={(e) =>
                                  setRowCommentById((prev) => ({ ...prev, [r._id]: e.target.value }))
                                }
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Select
                                  value={rowStatusById[r._id] || r.status}
                                  onValueChange={(value) =>
                                    setRowStatusById((prev) => ({ ...prev, [r._id]: value }))
                                  }
                                >
                                  <SelectTrigger className="w-[220px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STATUS_OPTIONS.filter((s) => s.value !== 'all').map((status) => (
                                      <SelectItem key={status.value} value={status.value}>
                                        {status.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    updateStatus(
                                      r._id,
                                      rowStatusById[r._id] || r.status,
                                      rowCommentById[r._id]
                                    )
                                  }
                                >
                                  Update
                                </Button>
                              </div>
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
