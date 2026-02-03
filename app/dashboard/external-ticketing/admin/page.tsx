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
import { apiClient, ExternalTicketRequest, Event } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import { triggerBlobDownload } from '@/lib/utils'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Pause, 
  UserX,
  Download,
  Filter,
  RefreshCw,
  CheckSquare,
  Square
} from 'lucide-react'
import { ProtectedRoute } from '@/components/protected-route'
import { Label } from '@/components/ui/label'
import { useRequiredClubId } from '@/hooks/useRequiredClubId'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'on_hold', label: 'Event Rescheduled (On Hold)' },
  { value: 'cancelled_by_member', label: 'Cancelled by Member' },
  { value: 'unfulfilled', label: 'Unfulfilled' }
] as const

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  fulfilled: { 
    bg: 'bg-green-100', 
    text: 'text-green-800', 
    icon: <CheckCircle className="w-3 h-3 mr-1" />
  },
  rejected: { 
    bg: 'bg-red-100', 
    text: 'text-red-800', 
    icon: <XCircle className="w-3 h-3 mr-1" />
  },
  on_hold: { 
    bg: 'bg-yellow-100', 
    text: 'text-yellow-800', 
    icon: <Pause className="w-3 h-3 mr-1" />
  },
  pending: { 
    bg: 'bg-blue-100', 
    text: 'text-blue-800', 
    icon: <Clock className="w-3 h-3 mr-1" />
  },
  cancelled_by_member: { 
    bg: 'bg-gray-100', 
    text: 'text-gray-800', 
    icon: <UserX className="w-3 h-3 mr-1" />
  },
  unfulfilled: { 
    bg: 'bg-orange-100', 
    text: 'text-orange-800', 
    icon: <Clock className="w-3 h-3 mr-1" />
  }
}

export default function AdminExternalTicketsPage() {
  const { user, isAdmin } = useAuth()
  const clubId = useRequiredClubId()
  const [requests, setRequests] = useState<ExternalTicketRequest[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [fixtureFilter, setFixtureFilter] = useState<string>('')
  const [competitionFilter, setCompetitionFilter] = useState<string>('')
  
  // Get unique competitions from requests
  const uniqueCompetitions = Array.from(new Set(
    requests
      .map(r => r.competition)
      .filter((c): c is string => !!c)
  )).sort()

  useEffect(() => {
    if (clubId && isAdmin) {
      fetchRequests()
      fetchEvents()
    }
  }, [clubId, isAdmin, statusFilter, fixtureFilter, competitionFilter])

  const fetchRequests = async () => {
    if (!clubId) return
    try {
      setLoading(true)
      const resp = await apiClient.listExternalTicketRequestsForClub(clubId, { 
        limit: 500,
        status: statusFilter || undefined,
        fixtureId: fixtureFilter || undefined,
        competition: competitionFilter || undefined
      })
      
      if (resp.success && resp.data) {
        const payload: any = resp.data
        const arr = Array.isArray(payload) ? payload : (payload.data || payload)
        if (Array.isArray(arr)) {
          setRequests(arr as any)
          // Clear selections when data changes
          setSelectedIds(new Set())
        } else {
          toast.error('Failed to load requests')
        }
      } else {
        toast.error('Failed to load requests')
      }
    } catch (error: any) {
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async () => {
    if (!clubId) return
    try {
      const resp = await apiClient.getEventsByClub(clubId)
      if (resp.success && resp.data) {
        setEvents(resp.data || [])
      }
    } catch (error) {
      // Silently fail - events are optional for filtering
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(requests.map(r => r._id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one request')
      return
    }

    try {
      setBulkUpdating(true)
      const resp = await apiClient.bulkUpdateExternalTicketRequestStatus(
        Array.from(selectedIds),
        status as any
      )
      
      if (resp.success) {
        toast.success(`Updated ${selectedIds.size} request(s) status`)
        setSelectedIds(new Set())
        fetchRequests()
      } else {
        toast.error('Failed to update requests')
      }
    } catch (error: any) {
      toast.error('Failed to update requests')
    } finally {
      setBulkUpdating(false)
    }
  }

  const handleExport = async (format: 'csv' | 'xlsx' = 'xlsx') => {
    if (!clubId) {
      toast.error('Missing club id')
      return
    }
    
    try {
      setExporting(true)
      const result = await apiClient.exportExternalTicketRequests(clubId, {
        status: statusFilter || undefined,
        fixtureId: fixtureFilter || undefined,
        competition: competitionFilter || undefined,
        format
      })
      
      if (!result.success) throw new Error(result.error || 'Export failed')
      const blob = result.blob as Blob | undefined
      if (!blob) throw new Error('No file returned')
      
      const filename = result.filename || `external_ticket_requests_${clubId}_${Date.now()}.${format}`
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

  const getStatusBadge = (status: string) => {
    const config = STATUS_COLORS[status] || STATUS_COLORS.pending
    const displayStatus = STATUS_OPTIONS.find(opt => opt.value === status)?.label || status
    return (
      <Badge className={`${config.bg} ${config.text}`}>
        {config.icon}
        {displayStatus}
      </Badge>
    )
  }

  const allSelected = requests.length > 0 && selectedIds.size === requests.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < requests.length

  if (!clubId || !isAdmin) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <DashboardLayout>
          <div className="space-y-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
              <p className="text-gray-500">You need admin privileges to access this page.</p>
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
              <h1 className="text-2xl font-bold">External Ticket Requests - Admin</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage all ticket applications with filters and bulk actions
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleExport('csv')} 
                disabled={exporting}
              >
                <Download className="w-4 h-4 mr-2" />
                {exporting ? 'Exporting…' : 'Export CSV'}
              </Button>
              <Button 
                variant="default" 
                onClick={() => handleExport('xlsx')} 
                disabled={exporting}
              >
                <Download className="w-4 h-4 mr-2" />
                {exporting ? 'Exporting…' : 'Export XLSX'}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
              <CardDescription>
                Filter requests by status, fixture, or competition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status-filter">Approval Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fixture-filter">Fixture</Label>
                  <Select value={fixtureFilter} onValueChange={setFixtureFilter}>
                    <SelectTrigger id="fixture-filter">
                      <SelectValue placeholder="All Fixtures" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Fixtures</SelectItem>
                      {events.map(event => (
                        <SelectItem key={event._id} value={event._id}>
                          {event.title} - {formatDate(event.startTime)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="competition-filter">Competition</Label>
                  <Select value={competitionFilter} onValueChange={setCompetitionFilter}>
                    <SelectTrigger id="competition-filter">
                      <SelectValue placeholder="All Competitions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Competitions</SelectItem>
                      {uniqueCompetitions.map(comp => (
                        <SelectItem key={comp} value={comp}>
                          {comp}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(statusFilter || fixtureFilter || competitionFilter) && (
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter('')
                      setFixtureFilter('')
                      setCompetitionFilter('')
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {requests.length} request(s) found
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-blue-900">
                      {selectedIds.size} request(s) selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-blue-700">Change status to:</span>
                    <Select 
                      onValueChange={handleBulkStatusUpdate}
                      disabled={bulkUpdating}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.filter(opt => opt.value !== '').map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedIds(new Set())}
                      disabled={bulkUpdating}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Requests</CardTitle>
              <CardDescription>
                Select requests to perform bulk actions or export filtered data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  <div>Loading requests...</div>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium text-gray-900">No ticket requests found</h3>
                  <p className="text-gray-500">
                    {statusFilter || fixtureFilter || competitionFilter
                      ? 'Try adjusting your filters'
                      : 'No ticket requests have been submitted yet.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={allSelected}
                              onCheckedChange={handleSelectAll}
                              aria-label="Select all"
                            />
                          </TableHead>
                          <TableHead className="min-w-[150px]">User Name</TableHead>
                          <TableHead className="min-w-[120px]">Preferred Date</TableHead>
                          <TableHead className="min-w-[100px]">Tickets</TableHead>
                          <TableHead className="min-w-[120px]">Status</TableHead>
                          <TableHead className="min-w-[150px]">Phone</TableHead>
                          <TableHead className="min-w-[150px]">Competition</TableHead>
                          <TableHead className="min-w-[150px]">Fixture</TableHead>
                          <TableHead className="min-w-[200px]">Comments</TableHead>
                          <TableHead className="text-right min-w-[150px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.map((r) => {
                          const isSelected = selectedIds.has(r._id)
                          const fixture = typeof r.fixture_id === 'object' && r.fixture_id ? r.fixture_id : null
                          return (
                            <TableRow key={r._id} className={isSelected ? 'bg-blue-50' : ''}>
                              <TableCell>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handleSelectOne(r._id, checked as boolean)}
                                  aria-label={`Select ${r.user_name}`}
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
                              <TableCell>
                                {getStatusBadge(r.status)}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {r.countryCode ? `${r.countryCode} ${r.phone}` : r.phone}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {r.competition || '—'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {fixture ? (fixture as any).title : '—'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-muted-foreground max-w-[200px] truncate" title={r.comments}>
                                  {r.comments || '—'}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Select
                                  value={r.status}
                                  onValueChange={async (newStatus) => {
                                    try {
                                      await apiClient.updateExternalTicketRequestStatus(r._id, newStatus as any)
                                      toast.success('Status updated')
                                      fetchRequests()
                                    } catch (error) {
                                      toast.error('Failed to update status')
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-[150px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STATUS_OPTIONS.filter(opt => opt.value !== '').map(opt => (
                                      <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          )
                        })}
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
