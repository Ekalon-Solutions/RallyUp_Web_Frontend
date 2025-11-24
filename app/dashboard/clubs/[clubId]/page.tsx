"use client"

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Users, Calendar, TrendingUp, Award, MapPin, Phone, Mail, Globe } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'

interface ClubDetails {
  _id: string
  name: string
  description?: string
  logo?: string
  status: string
  location?: string
  contact_email?: string
  contact_phone?: string
  website?: string
  founded_date?: string
  total_members?: number
  active_events?: number
  createdAt: string
  updatedAt: string
}

export default function ClubDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [searchParams] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search)
    }
    return new URLSearchParams()
  })
  
  // Get club ID from query parameter, fallback to route param if it's a valid ObjectId
  const clubIdFromQuery = searchParams.get('id')
  const clubIdFromParam = params.clubId as string
  const clubId = clubIdFromQuery || clubIdFromParam

  const [club, setClub] = React.useState<ClubDetails | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetchClubDetails()
  }, [clubId])

  const fetchClubDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.get<ClubDetails>(`/clubs/${clubId}`)
      
      if (response.success && response.data) {
        setClub(response.data)
      } else {
        setError(response.error || 'Failed to load club details')
      }
    } catch (err) {
      console.error('Error fetching club details:', err)
      setError('Failed to load club details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading club details...</p>
        </div>
      </div>
    )
  }

  if (error || !club) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">{error || 'Club not found'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to My Clubs
      </Button>

      {/* Club Header */}
      <div className="mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Club Logo */}
              <div className="flex-shrink-0">
                {club.logo ? (
                  <img
                    src={club.logo}
                    alt={club.name}
                    className="w-32 h-32 rounded-lg object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Award className="w-16 h-16 text-primary" />
                  </div>
                )}
              </div>

              {/* Club Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{club.name}</h1>
                    <Badge variant={club.status === 'active' ? 'default' : 'secondary'}>
                      {club.status}
                    </Badge>
                  </div>
                </div>

                {club.description && (
                  <p className="text-muted-foreground mb-4">{club.description}</p>
                )}

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {club.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{club.location}</span>
                    </div>
                  )}
                  {club.contact_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${club.contact_email}`} className="hover:underline">
                        {club.contact_email}
                      </a>
                    </div>
                  )}
                  {club.contact_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${club.contact_phone}`} className="hover:underline">
                        {club.contact_phone}
                      </a>
                    </div>
                  )}
                  {club.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={club.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {club.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{club.total_members || 0}</div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{club.active_events || 0}</div>
            <p className="text-xs text-muted-foreground">Upcoming events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Founded</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {club.founded_date
                ? new Date(club.founded_date).getFullYear()
                : new Date(club.createdAt).getFullYear()}
            </div>
            <p className="text-xs text-muted-foreground">Year established</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Additional Information */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Club Information</CardTitle>
              <CardDescription>General information about the club</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {club.description || 'No description available'}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Status</h4>
                <Badge variant={club.status === 'active' ? 'default' : 'secondary'}>
                  {club.status}
                </Badge>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Created</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(club.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Club Members</CardTitle>
              <CardDescription>View and manage club members</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Member list coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Club Events</CardTitle>
              <CardDescription>View upcoming and past events</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Event list coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates and activities</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Activity feed coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
