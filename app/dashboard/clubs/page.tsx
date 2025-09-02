"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { apiClient, Club, MembershipPlan } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Building2, Users, MapPin, Globe, Mail, Phone, Calendar, Star } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { ProtectedRoute } from '@/components/protected-route'
import Link from 'next/link'

interface ClubWithPlans extends Club {
  membershipPlans?: MembershipPlan[]
}

export default function ClubsPage() {
  const { user } = useAuth()
  const [clubs, setClubs] = useState<ClubWithPlans[]>([])
  const [loading, setLoading] = useState(true)
  const [joiningClub, setJoiningClub] = useState<string | null>(null)

  useEffect(() => {
    fetchClubs()
  }, [])

  const fetchClubs = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getPublicClubs()
      if (response.success && response.data) {
        setClubs(response.data.clubs)
      } else {
        toast.error(response.error || 'Failed to load clubs')
      }
    } catch (error) {
      console.error('Error fetching clubs:', error)
      toast.error('Failed to load clubs')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinClub = async (clubId: string, membershipPlanId?: string) => {
    try {
      setJoiningClub(clubId)
      const response = await apiClient.joinClub({
        clubId,
        membershipPlanId
      })

      if (response.success) {
        toast.success('Successfully joined club!')
        // Refresh user data to update club association
        window.location.reload()
      } else {
        toast.error(response.error || 'Failed to join club')
      }
    } catch (error) {
      console.error('Error joining club:', error)
      toast.error('Failed to join club')
    } finally {
      setJoiningClub(null)
    }
  }

  const handleLeaveClub = async () => {
    if (!user || user.role !== 'member' || !('club' in user) || !user.club) return

    try {
      const response = await apiClient.leaveClub()
      if (response.success) {
        toast.success('Successfully left club')
        window.location.reload()
      } else {
        toast.error(response.error || 'Failed to leave club')
      }
    } catch (error) {
      console.error('Error leaving club:', error)
      toast.error('Failed to leave club')
    }
  }

  const formatAddress = (address: any) => {
    if (!address) return 'Address not available'
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`
  }

  const getMembershipPlanPrice = (plan: MembershipPlan) => {
    return `${plan.currency} ${plan.price}`
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">Browse Clubs</h1>
                <p className="text-muted-foreground">Find and join clubs that interest you</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Browse Clubs</h1>
              <p className="text-muted-foreground">
                {user?.role === 'system_owner' 
                  ? 'Manage all clubs in the system' 
                  : 'Find and join clubs that interest you'}
              </p>
            </div>
            <div className="flex gap-2">
              {user?.role === 'system_owner' && (
                <Button asChild>
                  <Link href="/dashboard/club-management">
                    <Building2 className="w-4 h-4 mr-2" />
                    Manage Clubs
                  </Link>
                </Button>
              )}
              {user && user.role === 'member' && 'club' in user && user.club && (
                <Button variant="outline" onClick={handleLeaveClub}>
                  Leave Current Club
                </Button>
              )}
            </div>
          </div>

          {/* Current Club Status */}
          {user && user.role === 'member' && 'club' in user && user.club && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Your Current Club
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{user.club.name}</h3>
                    <p className="text-muted-foreground">{user.club.description}</p>
                  </div>
                  <Badge variant="secondary">Active Member</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clubs Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => {
              const isCurrentClub = user && user.role === 'member' && 'club' in user && (user as any).club?._id === club._id
              const isJoining = joiningClub === club._id

              return (
                <Card key={club._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                            {club.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{club.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {club.status === 'active' ? 'Active' : 'Inactive'}
                          </CardDescription>
                        </div>
                      </div>
                      {isCurrentClub && (
                        <Badge variant="secondary">Your Club</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {club.description || 'No description available'}
                    </p>

                    {/* Club Details */}
                    <div className="space-y-2 text-sm">
                      {club.website && (
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <a 
                            href={club.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Visit Website
                          </a>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{club.contactEmail}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{club.contactPhone}</span>
                      </div>
                      {club.address && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs">{formatAddress(club.address)}</span>
                        </div>
                      )}
                    </div>

                    {/* Membership Plans */}
                    {club.membershipPlans && club.membershipPlans.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Membership Plans:</h4>
                        <div className="space-y-1">
                          {club.membershipPlans.map((plan) => (
                            <div key={plan._id} className="flex items-center justify-between text-xs bg-muted p-2 rounded">
                              <span>{plan.name}</span>
                              <span className="font-medium">{getMembershipPlanPrice(plan)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    {!isCurrentClub ? (
                      <Button 
                        onClick={() => handleJoinClub(club._id)}
                        disabled={isJoining || club.status !== 'active'}
                        className="w-full"
                      >
                        {isJoining ? 'Joining...' : 'Join Club'}
                      </Button>
                    ) : (
                      <Button variant="outline" disabled className="w-full">
                        Already a Member
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {clubs.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">No clubs available</h3>
              <p className="text-muted-foreground">Check back later for new clubs to join.</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 