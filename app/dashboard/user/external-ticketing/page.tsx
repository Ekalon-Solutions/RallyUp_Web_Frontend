"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, ExternalTicketFixture } from "@/lib/api"
import { toast } from "sonner"
import {
  Ticket,
  CheckCircle,
  XCircle,
  UserCheck
} from "lucide-react"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"

export default function ExternalTicketingPage() {
  const { user } = useAuth()
  const clubId = useRequiredClubId()
  const [availableFixtures, setAvailableFixtures] = useState<ExternalTicketFixture[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [requestingFixture, setRequestingFixture] = useState<ExternalTicketFixture | null>(null)
  const [requestForm, setRequestForm] = useState({ name: '', phone: '', countryCode: '', tickets: 1, preferredDate: '', comments: '', memberId: '' })
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
  const [myRequests, setMyRequests] = useState<any[]>([])
  const [loadingMyRequests, setLoadingMyRequests] = useState(false)
  const [respondingRequestId, setRespondingRequestId] = useState<string | null>(null)
  const [responseCommentById, setResponseCommentById] = useState<Record<string, string>>({})
  const ticketCountOptions = Array.from({ length: 500 }, (_, idx) => idx + 1)

  useEffect(() => {
    if (user && clubId) {
      loadAvailableFixtures(clubId)
      loadMyRequests()
    }
  }, [user, clubId])

  const loadAvailableFixtures = async (clubIdToLoad: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const resp = await apiClient.listAvailableExternalTicketFixtures(clubIdToLoad)
      if (resp.success && resp.data) {
        const payload: any = resp.data
        const arr = Array.isArray(payload) ? payload : (payload.data || payload)
        if (Array.isArray(arr)) {
          const now = new Date()
          const published = arr.filter((f: ExternalTicketFixture) =>
            f.isVisibleForMembers === true &&
            (!f.visibilityEndsAt || new Date(f.visibilityEndsAt) > now)
          )
          setAvailableFixtures(published as ExternalTicketFixture[])
        } else {
          setAvailableFixtures([])
          setError('Failed to load external tickets')
        }
      } else {
        setAvailableFixtures([])
        setError(resp.error || 'Failed to load external tickets')
      }
    } catch {
      setAvailableFixtures([])
      setError('Failed to load external tickets')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatFixtureDateTime = (isoDate: string) => {
    const d = new Date(isoDate)
    if (isNaN(d.getTime())) return ''
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }
    const formatted = d.toLocaleString('en-IN', options)
    return `${formatted} IST`
  }

  const loadMyRequests = async () => {
    try {
      setLoadingMyRequests(true)
      const resp = await apiClient.listMyExternalTicketRequests()
      if (resp.success && resp.data) {
        const payload: any = resp.data
        const arr = Array.isArray(payload) ? payload : (payload.data || payload)
        if (Array.isArray(arr)) {
          const filtered = clubId
            ? arr.filter((r: any) => String(r?.club_id?._id || r?.club_id) === String(clubId))
            : arr
          setMyRequests(filtered)
        } else {
          setMyRequests([])
        }
      } else {
        setMyRequests([])
      }
    } catch {
      setMyRequests([])
    } finally {
      setLoadingMyRequests(false)
    }
  }

  const respondToReschedule = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      setRespondingRequestId(requestId)
      const comment = responseCommentById[requestId]
      const resp = await apiClient.respondToRescheduledExternalTicketRequest(requestId, {
        action,
        comment: comment?.trim() ? comment.trim() : undefined,
      })
      if (resp.success) {
        toast.success(action === 'accept' ? 'Reschedule accepted. Status moved to Approved.' : 'Reschedule rejected.')
        await loadMyRequests()
      } else {
        toast.error(resp.error || 'Failed to submit response')
      }
    } catch {
      toast.error('Failed to submit response')
    } finally {
      setRespondingRequestId(null)
    }
  }

  const openRequestDialog = (fixture: ExternalTicketFixture) => {
    const profilePhone = (user as any)?.phoneNumber || ''
    const profileCountryCode = (user as any)?.countryCode || ''
    const profileName = user?.name || ''
    if (!profileName || !profilePhone || !profileCountryCode) {
      toast.error('Your profile details are incomplete. Please update name and contact details first.')
      return
    }
    const startDate = new Date(fixture.startTime)
    const yyyy = startDate.getFullYear()
    const mm = String(startDate.getMonth() + 1).padStart(2, '0')
    const dd = String(startDate.getDate()).padStart(2, '0')
    setRequestingFixture(fixture)
    setRequestForm({
      name: profileName,
      phone: profilePhone,
      countryCode: profileCountryCode,
      tickets: 1,
      preferredDate: `${yyyy}-${mm}-${dd}`,
      comments: '',
      memberId: (user as any)?._id || '',
    })
    setFormErrors({})
    setShowRequestDialog(true)
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">External Ticketing</h1>
              <p className="text-muted-foreground">
                Browse published fixtures for your club and request tickets
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading external tickets...</p>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <Card className="border-destructive">
                  <CardContent className="pt-6">
                    <div className="text-center text-destructive">
                      <p>{error}</p>
                      <Button
                        variant="outline"
                        onClick={() => clubId && loadAvailableFixtures(clubId)}
                        className="mt-4"
                      >
                        Try Again
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!error && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fixture</TableHead>
                            <TableHead>Competition</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {availableFixtures.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-12">
                                <div className="flex flex-col items-center space-y-4">
                                  <Ticket className="h-12 w-12 text-muted-foreground" />
                                  <div className="space-y-2">
                                    <h3 className="text-lg font-semibold">No External Tickets Available</h3>
                                    <p className="text-muted-foreground max-w-md">
                                      There are no published fixtures for external ticket requests right now. Check back later.
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            availableFixtures.map((fixture) => (
                              <TableRow key={fixture._id}>
                                <TableCell className="font-medium">{fixture.title}</TableCell>
                                <TableCell>{fixture.competition}</TableCell>
                                <TableCell>{formatFixtureDateTime(fixture.startTime)}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => openRequestDialog(fixture)}
                                  >
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Submit Request
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">My Ticket Applications</h3>
                    <p className="text-sm text-muted-foreground">
                      Track your external ticket requests and respond when an event is rescheduled.
                    </p>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fixture</TableHead>
                          <TableHead>Competition</TableHead>
                          <TableHead>Preferred Date</TableHead>
                          <TableHead>Tickets</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Admin Note</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingMyRequests ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              Loading requests...
                            </TableCell>
                          </TableRow>
                        ) : myRequests.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No requests submitted yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          myRequests.map((r) => {
                            const status = r.status
                            const statusLabel =
                              status === 'fulfilled'
                                ? 'Approved'
                                : status === 'on_hold'
                                ? 'Event Rescheduled (On Hold)'
                                : status === 'cancelled_by_member'
                                ? 'Cancelled by Member'
                                : status
                            const fixtureTitle =
                              typeof r.fixture_id === 'object' && r.fixture_id ? r.fixture_id.title : '—'
                            return (
                              <TableRow key={r._id}>
                                <TableCell className="font-medium">{fixtureTitle}</TableCell>
                                <TableCell>{r.competition || '—'}</TableCell>
                                <TableCell>{formatDate(r.preferred_date)}</TableCell>
                                <TableCell>{r.tickets}</TableCell>
                                <TableCell>
                                  <Badge variant={status === 'fulfilled' ? 'default' : status === 'rejected' ? 'destructive' : 'secondary'}>
                                    {statusLabel}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-[220px]">
                                  <div className="text-sm text-muted-foreground truncate" title={r.adminComment || ''}>
                                    {r.adminComment || '—'}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  {status === 'on_hold' ? (
                                    <div className="flex items-center justify-end gap-2">
                                      <Input
                                        placeholder="Optional comment"
                                        value={responseCommentById[r._id] || ''}
                                        onChange={(e) =>
                                          setResponseCommentById((prev) => ({ ...prev, [r._id]: e.target.value }))
                                        }
                                        className="max-w-[200px]"
                                      />
                                      <Button
                                        size="sm"
                                        onClick={() => respondToReschedule(r._id, 'accept')}
                                        disabled={respondingRequestId === r._id}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Accept
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => respondToReschedule(r._id, 'reject')}
                                        disabled={respondingRequestId === r._id}
                                      >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Reject
                                      </Button>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">No action required</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

            {/* Request Dialog */}
            <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Tickets{requestingFixture ? ` — ${requestingFixture.title}` : ''}</DialogTitle>
                </DialogHeader>

                <form className="space-y-4" onSubmit={async (e) => {
                  e.preventDefault()
                  if (!requestingFixture || !clubId) return
                  const errors: { [key: string]: string } = {}
                  const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/
                  const countryCodeRegex = /^\+?[0-9]{1,6}$/
                  if (!requestForm.name || requestForm.name.trim().length === 0) {
                    errors.name = 'Name is required'
                  }
                  if (!requestForm.phone || !phoneRegex.test(requestForm.phone)) {
                    errors.phone = 'Please enter a valid phone number'
                  }
                  if (requestForm.countryCode && !countryCodeRegex.test(requestForm.countryCode)) {
                    errors.countryCode = 'Please enter a valid country code (e.g. +44)'
                  }
                  if (!requestForm.tickets || Number(requestForm.tickets) < 1) {
                    errors.tickets = 'Please request at least 1 ticket'
                  }
                  setFormErrors(errors)
                  if (Object.keys(errors).length > 0) {
                    const firstKey = Object.keys(errors)[0]
                    const el = document.querySelector(`[name=\"${firstKey}\"]`) as HTMLElement | null
                    if (el && typeof el.focus === 'function') el.focus()
                    return
                  }
                  setIsSubmittingRequest(true)
                  try {
                    const payload = {
                      clubId,
                      userName: requestForm.name,
                      phone: requestForm.phone,
                      countryCode: requestForm.countryCode,
                      tickets: requestForm.tickets,
                      preferredDate: requestForm.preferredDate,
                      comments: requestForm.comments,
                      fixtureId: requestingFixture._id,
                      competition: requestingFixture.competition,
                    }
                    const resp = await apiClient.createExternalTicketRequest(payload)
                    if (resp.success) {
                      toast.success('Request submitted — the club will contact you shortly')
                      setShowRequestDialog(false)
                      loadMyRequests()
                    } else {
                      const message = resp.error || (resp.data as any)?.message || 'Failed to submit request'
                      toast.error(message)
                    }
                  } catch (err) {
                    toast.error('Failed to submit request')
                  } finally {
                    setIsSubmittingRequest(false)
                  }
                }}>
                  <div>
                    <Label>Member ID</Label>
                    <Input name="memberId" value={requestForm.memberId} readOnly disabled />
                  </div>
                  <div>
                    <Label>Name</Label>
                    <Input name="name" value={requestForm.name} readOnly disabled />
                    {formErrors.name && <div className="text-destructive text-sm mt-1">{formErrors.name}</div>}
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <div className="flex gap-2">
                      <Input name="countryCode" placeholder="+91" style={{width: '100px'}} value={requestForm.countryCode} readOnly disabled />
                      <Input name="phone" value={requestForm.phone} readOnly disabled />
                    </div>
                    {formErrors.phone && <div className="text-destructive text-sm mt-1">{formErrors.phone}</div>}
                    {formErrors.countryCode && <div className="text-destructive text-sm mt-1">{formErrors.countryCode}</div>}
                  </div>
                  <div>
                    <Label>Number of Tickets</Label>
                    <Select
                      value={String(requestForm.tickets)}
                      onValueChange={(value) => setRequestForm({ ...requestForm, tickets: Number(value) || 1 })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ticket count" />
                      </SelectTrigger>
                      <SelectContent>
                        {ticketCountOptions.map((count) => (
                          <SelectItem key={count} value={String(count)}>
                            {count}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.tickets && <div className="text-destructive text-sm mt-1">{formErrors.tickets}</div>}
                  </div>

                  <div>
                    <Label>Competition</Label>
                    <Input value={requestingFixture?.competition || ''} readOnly disabled />
                  </div>

                  <div>
                    <Label>Preferred Date</Label>
                    <Input
                      name="preferredDate"
                      type="date"
                      value={requestForm.preferredDate}
                      readOnly
                      disabled
                    />
                  </div>

                  <div>
                    <Label>Comments</Label>
                    <textarea
                      value={requestForm.comments}
                      onChange={(e) => setRequestForm({...requestForm, comments: e.target.value})}
                      className="w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground"
                      rows={4}
                      placeholder="Event information, ticket preferences, accessibility needs, or other relevant details"
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="submit" disabled={isSubmittingRequest}>
                      {isSubmittingRequest ? 'Sending...' : 'Submit Request'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowRequestDialog(false)}>Cancel</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
