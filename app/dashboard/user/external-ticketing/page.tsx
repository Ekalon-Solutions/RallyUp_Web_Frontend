"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import { 
  Building2, 
  CheckCircle, 
  Clock,
  Eye,
  CreditCard,
  UserCheck
} from "lucide-react"
import { useRouter } from "next/navigation"

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
  const router = useRouter()
  const [memberships, setMemberships] = useState<UserMembership[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [requestingFor, setRequestingFor] = useState<UserMembership | null>(null)
  const [requestForm, setRequestForm] = useState({ name: '', phone: '', phone_country_code: '', tickets: 1, preferredDate: '', comments: '' })
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (user) {
      loadUserMemberships()
    }
  }, [user])

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
        setMemberships(membershipData)
        return
      }

      if (fallbackMemberships.length > 0) {
        setMemberships(fallbackMemberships as UserMembership[])
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
    // Store club ID in sessionStorage to avoid exposing it in URL
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('selectedClubId', clubId)
    }
    router.push(`/dashboard/clubs/${slug}`)
  }

  const navigateToPlans = () => {
    router.push('/dashboard/user/browse-plans')
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
                                    <Button onClick={() => router.push('/dashboard/user/clubs')}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Discover Clubs
                                    </Button>
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
                                      {membership.club_id.description}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(membership.status)}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{membership.level_name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {membership.membership_level_id.name}
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
                                    onClick={() => {
                                      setRequestingFor(membership)
                                      setRequestForm({ name: user?.name || '', phone: '', phone_country_code: (user as any)?.countryCode || '', tickets: 1, preferredDate: '', comments: '' })
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
          
            {/* Request Dialog */}
            <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Tickets{requestingFor ? ` — ${requestingFor.club_id.name}` : ''}</DialogTitle>
                </DialogHeader>

                <form className="space-y-4" onSubmit={async (e) => {
                  e.preventDefault()
                  if (!requestingFor) return
                  // Validate form before submitting
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
                  if (requestForm.phone_country_code && !countryCodeRegex.test(requestForm.phone_country_code)) {
                    errors.phone_country_code = 'Please enter a valid country code (e.g. +44)'
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
                    const payload = {
                      clubId: requestingFor.club_id._id,
                      userName: requestForm.name,
                      phone: requestForm.phone,
                      phone_country_code: requestForm.phone_country_code,
                      tickets: requestForm.tickets,
                      preferredDate: requestForm.preferredDate,
                      comments: requestForm.comments,
                    }
                    const resp = await apiClient.createExternalTicketRequest(payload)
                    if (resp.success) {
                      toast.success('Request submitted — the club will contact you shortly')
                      setShowRequestDialog(false)
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
                    <Label>Name</Label>
                    <Input name="name" value={requestForm.name} onChange={(e) => setRequestForm({...requestForm, name: e.target.value})} />
                    {formErrors.name && <div className="text-destructive text-sm mt-1">{formErrors.name}</div>}
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <div className="flex gap-2">
                      <Input name="phone_country_code" placeholder="+1" style={{width: '100px'}} value={requestForm.phone_country_code} onChange={(e) => setRequestForm({...requestForm, phone_country_code: e.target.value})} />
                      <Input name="phone" value={requestForm.phone} onChange={(e) => setRequestForm({...requestForm, phone: e.target.value})} />
                    </div>
                    {formErrors.phone && <div className="text-destructive text-sm mt-1">{formErrors.phone}</div>}
                    {formErrors.phone_country_code && <div className="text-destructive text-sm mt-1">{formErrors.phone_country_code}</div>}
                  </div>
                  <div>
                    <Label>Number of Tickets</Label>
                    <Input name="tickets" type="number" min={1} value={requestForm.tickets} onChange={(e) => setRequestForm({...requestForm, tickets: Number(e.target.value) || 1})} />
                    {formErrors.tickets && <div className="text-destructive text-sm mt-1">{formErrors.tickets}</div>}
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label>Preferred Date</Label>
                      <Input
                        name="preferredDate"
                        type="date"
                        value={requestForm.preferredDate}
                        onChange={(e) => setRequestForm({...requestForm, preferredDate: e.target.value})}
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
