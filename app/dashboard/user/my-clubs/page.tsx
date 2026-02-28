"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api"
import { formatDisplayDate } from "@/lib/utils"
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
  website?: string
  slug?: string
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

export default function MyClubsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [memberships, setMemberships] = useState<UserMembership[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      // console.log('Response data type:', typeof response.data)
      // console.log('Is response.data an array?', Array.isArray(response.data))
      // console.log('Response.data contents:', response.data)
      // console.log('Response.data keys:', Object.keys(response.data || {}))
      
      if (response.success && response.data) {
        // Check if data is an array or if it contains an array
        let membershipData = []
        const data = response.data as any
        
        if (Array.isArray(data)) {
          membershipData = data
        } else if (data.memberships && Array.isArray(data.memberships)) {
          membershipData = data.memberships
        } else if (data.data && Array.isArray(data.data)) {
          membershipData = data.data
        }
        membershipData = membershipData.filter((m: any) => m.status === 'active')
        
        // console.log('Setting memberships:', membershipData)
        setMemberships(membershipData)
      } else {
        // console.log('API response failed or no data')
        setError('Failed to load your club memberships')
      }
    } catch (error) {
      // console.error('Error loading user memberships:', error)
      setError('Failed to load your club memberships')
      setMemberships([]) // Ensure it's always an array
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

  const formatDate = (dateString: string) => formatDisplayDate(dateString)

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

  const navigateToClub = (clubName?: string, clubWebsite?: string, clubSlug?: string) => {
    if (clubWebsite) {
      window.open(clubWebsite, '_blank', 'noopener,noreferrer')
      return
    }
    const slug =
      clubSlug ||
      (clubName ? clubName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '')
    if (slug && typeof window !== 'undefined') {
      window.open(`${window.location.origin}/clubs/${slug}`, '_blank', 'noopener,noreferrer')
    }
  }

  const navigateToPlans = () => {
    router.push('/dashboard/user/browse-plans')
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your club memberships...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">My Clubs</h1>
              <p className="text-lg text-muted-foreground">
                Manage your club memberships and view details
              </p>
            </div>
            <Button onClick={navigateToPlans} className="gap-2">
              <Plus className="h-4 w-4" />
              Browse Plans
            </Button>
          </div>

          {/* Error State */}
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

          {/* Memberships */}
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
                        <Button onClick={navigateToPlans}>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Browse Plans
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Array.isArray(memberships) && memberships.map((membership) => {
                    const club = membership?.club_id
                    const clubName = club?.name ?? 'Unknown Club'
                    const clubDescription = club?.description ?? 'No description available'
                    const clubStatus = club?.status ?? 'Unknown'
                    const clubId = club?._id
                    const level = membership?.membership_level_id
                    const levelName = level?.name ?? membership?.level_name ?? 'Unknown Plan'
                    const levelDescription = level?.description ?? 'No description available'
                    const levelPrice = level?.price ?? 0
                    const levelCurrency = level?.currency ?? 'USD'

                    return (
                    <Card key={membership._id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <CardTitle className="text-xl">{clubName}</CardTitle>
                            <CardDescription className="text-sm">
                              {clubDescription}
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
                            <Badge variant="outline">{clubStatus}</Badge>
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
                                {formatPrice(levelPrice, levelCurrency)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{levelName}</div>
                            <div className="text-xs text-muted-foreground">{levelDescription}</div>
                            
                            {/* Key Features */}
                            {level?.features && (
                              <div className="flex flex-wrap gap-1">
                                {level.features.eventsAccess && (
                                  <Badge variant="outline" className="text-xs">Events</Badge>
                                )}
                                {level.features.merchandiseDiscount && level.features.merchandiseDiscount > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {level.features.merchandiseDiscount}% Off Merch
                                  </Badge>
                                )}
                                {level.features.pollsParticipation && (
                                  <Badge variant="outline" className="text-xs">Polls</Badge>
                                )}
                                {level.features.specialBadge && (
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
                            variant="outline" 
                            size="sm" 
                            onClick={() => navigateToClub(clubName, (club as Club)?.website, (club as Club)?.slug)}
                            disabled={!clubName}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Club
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* Quick Actions */}
          {memberships.length > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <h3 className="font-semibold">Quick Actions</h3>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button variant="outline" size="sm" onClick={navigateToPlans}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Upgrade Plans
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/user/membership-card')}>
                      <Award className="h-4 w-4 mr-2" />
                      View Membership Cards
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}