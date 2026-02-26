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
  Building2, 
  CheckCircle, 
  Clock,
  XCircle,
  CreditCard,
  UserCheck
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"

interface Club {
  _id: string
  name: string
  description: string
  status: string
}

interface MembershipLevel {
  _id: string
  name: string
  description: string
  price: number
  currency: string
  features?: {
    eventsAccess?: boolean
    merchandiseDiscount?: number
    pollsParticipation?: boolean
    newsAccess?: boolean
    chantsAccess?: boolean
    specialBadge?: boolean
    prioritySupport?: boolean
    exclusiveContent?: boolean
  }
}

interface UserMembership {
  _id: string
  club_id: Club
  membership_level_id: MembershipLevel
  level_name: string
  status: string
  start_date: string
  end_date?: string
  user_membership_id: string
}

export default function ExternalTicketingPage() {
  const { user } = useAuth()
  const clubId = useRequiredClubId()
  const router = useRouter()
  const [memberships, setMemberships] = useState<UserMembership[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [requestingFor, setRequestingFor] = useState<UserMembership | null>(null)
  const [availableFixtures, setAvailableFixtures] = useState<ExternalTicketFixture[]>([])
  const [loadingFixtures, setLoadingFixtures] = useState(false)
  const [selectedCompetition, setSelectedCompetition] = useState<string>("")
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>("")
  const [requestForm, setRequestForm] = useState({ name: '', phone: '', countryCode: '', tickets: 1, preferredDate: '', comments: '', memberId: '' })
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
  const [myRequests, setMyRequests] = useState<any[]>([])
  const [loadingMyRequests, setLoadingMyRequests] = useState(false)
  const [respondingRequestId, setRespondingRequestId] = useState<string | null>(null)
  const [responseCommentById, setResponseCommentById] = useState<Record<string, string>>({})
  const ticketCountOptions = Array.from({ length: 500 }, (_, idx) => idx + 1)

  useEffect(() => {
    if (user) {
      loadUserMemberships()
      loadMyRequests()
    }
  }, [user, clubId])

  const loadUserMemberships = async () => {
    const fallbackMemberships = Array.isArray((user as any)?.memberships) ? (user as any).memberships : []
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await apiClient.getUserMemberships()
      // console.log('User memberships response:', response)
      
      if (response.success && response.data) {
        // Normalize the response: the API may return either an array or an object
        let membershipData: any[] = []
        const data = response.data as any
        if (Array.isArray(data)) membershipData = data
        else if (data.memberships && Array.isArray(data.memberships)) membershipData = data.memberships
        else if (data.data && Array.isArray(data.data)) membershipData = data.data
        // Include all memberships, even free tiers
        const filtered = clubId
          ? membershipData.filter((m: any) => String(m?.club_id?._id || m?.club_id) === String(clubId))
          : membershipData
        setMemberships(filtered as any)
        return
      }

      if (fallbackMemberships.length > 0) {
        const filtered = clubId
          ? fallbackMemberships.filter((m: any) => String(m?.club_id?._id || m?.club_id) === String(clubId))
          : fallbackMemberships
        setMemberships(filtered as UserMembership[])
        return
      }

      setError('Failed to load your club memberships')
    } catch (err) {
      // console.error('Error loading user memberships:', err)
      if (fallbackMemberships.length > 0) {
        setMemberships(fallbackMemberships as UserMembership[])
        setError(null)
      } else {
        setError('Failed to load your club memberships')
        setMemberships([])
        toast.error('Failed to load your club memberships')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
      case 'expired':
        return <Badge variant="destructive"><Clock className="w-3 h-3 mr-1" />Expired</Badge>
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const navigateToClub = (clubId: string, clubName?: string) => {
    const slug = clubName 
      ? clubName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      : 'club'
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('selectedClubId', clubId)
    }
    router.push(`/dashboard/clubs/${slug}`)
  }

  const navigateToPlans = () => {
    router.push('/dashboard/user/browse-plans')
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

  const loadAvailableFixtures = async (clubIdToLoad: string) => {
    setLoadingFixtures(true)
    try {
      const resp = await apiClient.listAvailableExternalTicketFixtures(clubIdToLoad)
      if (resp.success && resp.data) {
        const payload: any = resp.data
        const arr = Array.isArray(payload) ? payload : (payload.data || payload)
        if (Array.isArray(arr)) {
          setAvailableFixtures(arr as ExternalTicketFixture[])
        } else {
          setAvailableFixtures([])
          toast.error('Failed to load available fixtures')
        }
      } else {
        setAvailableFixtures([])
        toast.error(resp.error || 'Failed to load available fixtures')
      }
    } catch {
      setAvailableFixtures([])
      toast.error('Failed to load available fixtures')
    } finally {
      setLoadingFixtures(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">External Ticketing</h1>
              <p className="text-muted-foreground">
                Integrate with external ticketing platforms and manage ticket
                sales
              </p>
            </div>
          </div>

          {/* Memberships UI (from My Clubs) */}
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your club memberships...</p>
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
                        onClick={loadUserMemberships}
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
                            <TableHead>Club Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Membership Level</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Joined Date</TableHead>
                            <TableHead>Expires Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {!Array.isArray(memberships) || memberships.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-12">
                                <div className="flex flex-col items-center space-y-4">
                                  <Building2 className="h-12 w-12 text-muted-foreground" />
                                  <div className="space-y-2">
                                    <h3 className="text-lg font-semibold">No Club Memberships</h3>
                                    <p className="text-muted-foreground max-w-md">
                                      You haven't joined any clubs yet. Explore available clubs and find communities that match your interests.
                                    </p>
                                  </div>
                                  <div className="flex gap-3">
                                    <Button variant="outline" onClick={navigateToPlans}>
                                      <CreditCard className="h-4 w-4 mr-2" />
                                      Browse Plans
                                    </Button>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            memberships.map((membership) => (
                              <TableRow key={membership._id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{membership.club_id.name}</div>
                                    <div className="text-sm text-muted-foreground line-clamp-1">
                                      {membership.club_id?.description}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(membership?.status)}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{membership.level_name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {membership.membership_level_id?.name}
                                    </div>
                                  </div>
                                </TableCell>
                                 <TableCell className="font-semibold">
                                   {formatPrice(
                                     membership.membership_level_id?.price ?? 0, 
                                     membership.membership_level_id?.currency ?? 'USD'
                                   )}
                                </TableCell>
                                <TableCell>
                                  {formatDate(membership.start_date)}
                                </TableCell>
                                <TableCell>
                                  {membership.end_date ? formatDate(membership.end_date) : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    variant="default" 
                                    size="sm" 
                                    onClick={async () => {
                                      const profilePhone = (user as any)?.phoneNumber || ''
                                      const profileCountryCode = (user as any)?.countryCode || ''
                                      const profileName = user?.name || ''
                                      if (!profileName || !profilePhone || !profileCountryCode) {
                                        toast.error('Your profile details are incomplete. Please update name and contact details first.')
                                        router.push('/dashboard/user/profile')
                                        return
                                      }
                                      setRequestingFor(membership)
                                      setAvailableFixtures([])
                                      setSelectedCompetition("")
                                      setSelectedFixtureId("")
                                      setRequestForm({
                                        name: user?.name || '',
                                        phone: (user as any)?.phoneNumber || '',
                                        countryCode: (user as any)?.countryCode || '',
                                        tickets: 1,
                                        preferredDate: '',
                                        comments: '',
                                        memberId: membership.user_membership_id || (user as any)?._id || '',
                                      })
                                      await loadAvailableFixtures(membership.club_id._id)
                                      setShowRequestDialog(true)
                                    }}
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
                  <DialogTitle>Request Tickets{requestingFor ? ` — ${requestingFor.club_id.name}` : ''}</DialogTitle>
                </DialogHeader>

                <form className="space-y-4" onSubmit={async (e) => {
                  e.preventDefault()
                  if (!requestingFor) return
                  const errors: { [key: string]: string } = {}
                  const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/
                  const countryCodeRegex = /^\+?[0-9]{1,6}$/
                  const today = new Date()
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
                  if (!requestForm.preferredDate) {
                    errors.preferredDate = 'Preferred date is required'
                  } else {
                    const selected = new Date(requestForm.preferredDate + 'T00:00:00')
                    // Zero out time for today comparison
                    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate())
                    if (selected < todayZero) {
                      errors.preferredDate = 'Preferred date cannot be in the past'
                    }
                  }
                  if (!selectedFixtureId) {
                    errors.fixtureId = 'Please select a fixture'
                  }
                  if (!selectedCompetition) {
                    errors.competition = 'Please select a competition'
                  }
                  setFormErrors(errors)
                  if (Object.keys(errors).length > 0) {
                    // Focus first invalid field (optional)
                    const firstKey = Object.keys(errors)[0]
                    const el = document.querySelector(`[name=\"${firstKey}\"]`) as HTMLElement | null
                    if (el && typeof el.focus === 'function') el.focus()
                    return
                  }
                  setIsSubmittingRequest(true)
                  try {
                    const selectedFixture = availableFixtures.find((f) => f._id === selectedFixtureId)
                    const payload = {
                      clubId: requestingFor.club_id._id,
                      userName: requestForm.name,
                      phone: requestForm.phone,
                      countryCode: requestForm.countryCode,
                      tickets: requestForm.tickets,
                      preferredDate: requestForm.preferredDate,
                      comments: requestForm.comments,
                      fixtureId: selectedFixtureId || undefined,
                      competition: selectedFixture?.competition || undefined,
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
                    // console.error('Ticket request error:', err)
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
                      <Input name="countryCode" placeholder="+1" style={{width: '100px'}} value={requestForm.countryCode} readOnly disabled />
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

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                    <Label>Competition</Label>
                    <Select
                      value={selectedCompetition}
                      onValueChange={(value) => {
                        setSelectedCompetition(value)
                        setSelectedFixtureId("")
                        setRequestForm((prev) => ({ ...prev, preferredDate: "" }))
                        if (formErrors.fixtureId || formErrors.competition) {
                          setFormErrors((prev) => {
                            const next = { ...prev }
                            delete next.fixtureId
                            delete next.competition
                            return next
                          })
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingFixtures ? "Loading competitions..." : "Select competition"} />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(new Set(availableFixtures.map((f) => f.competition).filter(Boolean))).map((competition) => (
                          <SelectItem key={competition} value={competition}>
                            {competition}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.competition && <div className="text-destructive text-sm mt-1">{formErrors.competition}</div>}
                  </div>

                  <div>
                    <Label>Fixture</Label>
                    <Select
                      value={selectedFixtureId}
                      disabled={!selectedCompetition || loadingFixtures}
                      onValueChange={(value) => {
                        setSelectedFixtureId(value)
                        const selected = availableFixtures.find((f) => f._id === value)
                        const selectedDate = selected?.startTime ? new Date(selected.startTime) : null
                        const yyyy = selectedDate ? selectedDate.getFullYear() : ''
                        const mm = selectedDate ? String(selectedDate.getMonth() + 1).padStart(2, '0') : ''
                        const dd = selectedDate ? String(selectedDate.getDate()).padStart(2, '0') : ''
                        setRequestForm((prev) => ({ ...prev, preferredDate: selectedDate ? `${yyyy}-${mm}-${dd}` : '' }))
                        if (formErrors.fixtureId || formErrors.preferredDate) {
                          setFormErrors((prev) => {
                            const next = { ...prev }
                            delete next.fixtureId
                            delete next.preferredDate
                            return next
                          })
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingFixtures
                              ? "Loading fixtures..."
                              : selectedCompetition
                              ? "Select fixture"
                              : "Select competition first"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFixtures
                          .filter((f) => (selectedCompetition ? f.competition === selectedCompetition : false))
                          .map((fixture) => (
                            <SelectItem key={fixture._id} value={fixture._id}>
                              {fixture.title} ({new Date(fixture.startTime).toLocaleDateString()})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {formErrors.fixtureId && <div className="text-destructive text-sm mt-1">{formErrors.fixtureId}</div>}
                    {!loadingFixtures && availableFixtures.length === 0 && (
                      <div className="text-sm text-muted-foreground mt-1">
                        No published fixtures are currently available for external ticket requests.
                      </div>
                    )}
                  </div>

                  <div>
                      <Label>Preferred Date</Label>
                      <Input
                        name="preferredDate"
                        type="date"
                        value={requestForm.preferredDate}
                      onChange={(e) => setRequestForm({...requestForm, preferredDate: e.target.value})}
                      readOnly
                      disabled
                      />
                      {formErrors.preferredDate && <div className="text-destructive text-sm mt-1">{formErrors.preferredDate}</div>}
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
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="submit" disabled={isSubmittingRequest || loadingFixtures || availableFixtures.length === 0}>
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
