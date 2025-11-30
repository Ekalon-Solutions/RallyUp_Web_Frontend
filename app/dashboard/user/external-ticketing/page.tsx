"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, MembershipPlan, User } from "@/lib/api"
import { toast } from "sonner"
import { 
  Building2, 
  Users, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  ArrowRight,
  Crown,
  Award,
  Clock,
  Eye,
  Settings,
  CreditCard,
  UserCheck,
  Plus
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
        membershipData = membershipData.filter((m) => m.membership_level_id.price>0)

        setMemberships(membershipData)
      } else {
        setError('Failed to load your club memberships')
      }
    } catch (err) {
      // console.error('Error loading user memberships:', err)
      setError('Failed to load your club memberships')
      setMemberships([])
      toast.error('Failed to load your club memberships')
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

  const navigateToClub = (clubId: string) => {
    router.push(`/dashboard/clubs/${clubId}`)
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
                <>
                  {!Array.isArray(memberships) || memberships.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
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
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {Array.isArray(memberships) && memberships.map((membership) => (
                        <Card key={membership._id} className="hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1">
                                <CardTitle className="text-xl">{membership.club_id.name}</CardTitle>
                                <CardDescription className="text-sm">
                                  {membership.club_id.description}
                                </CardDescription>
                              </div>
                              <div className="flex flex-col gap-2 ml-3">
                                {getStatusBadge(membership.status)}
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="space-y-4">
                            {/* Club Info */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{membership.club_id.status}</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{membership.level_name}</Badge>
                              </div>
                            </div>

                            {/* Membership Plan Info */}
                            <div className="border-t pt-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">Current Plan</h4>
                                <div className="text-right">
                                  <div className="font-semibold">
                                    {formatPrice(membership.membership_level_id.price, membership.membership_level_id.currency)}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="text-sm font-medium">{membership.membership_level_id.name}</div>
                                <div className="text-xs text-muted-foreground">{membership.membership_level_id.description}</div>
                                
                                {/* Key Features */}
                                {membership.membership_level_id.features && (
                                  <div className="flex flex-wrap gap-1">
                                    {membership.membership_level_id.features.eventsAccess && (
                                      <Badge variant="outline" className="text-xs">Events</Badge>
                                    )}
                                    {membership.membership_level_id.features.merchandiseDiscount && membership.membership_level_id.features.merchandiseDiscount > 0 && (
                                      <Badge variant="outline" className="text-xs">
                                        {membership.membership_level_id.features.merchandiseDiscount}% Off Merch
                                      </Badge>
                                    )}
                                    {membership.membership_level_id.features.pollsParticipation && (
                                      <Badge variant="outline" className="text-xs">Polls</Badge>
                                    )}
                                    {membership.membership_level_id.features.specialBadge && (
                                      <Badge variant="outline" className="text-xs">Special Badge</Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Membership Dates */}
                            <div className="border-t pt-4 space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Joined:</span>
                                <span>{formatDate(membership.start_date)}</span>
                              </div>
                              {membership.end_date && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Expires:</span>
                                  <span>{formatDate(membership.end_date)}</span>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                              <Button 
                                variant="default" 
                                size="sm" 
                                onClick={() => {
                                  setRequestingFor(membership)
                                  setRequestForm({ name: user?.name || '', phone: '', phone_country_code: (user as any)?.countryCode || '', tickets: 1, preferredDate: '', comments: '' })
                                  setShowRequestDialog(true)
                                }}
                                className="flex-1"
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Submit Request
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
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
