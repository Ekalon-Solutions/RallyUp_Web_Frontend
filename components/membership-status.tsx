"use client"

import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, Users, Calendar, MapPin } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import { useState } from 'react'

export function MembershipStatus() {
  const { user, refreshUser } = useAuth()
  const [leaving, setLeaving] = useState(false)

  const handleLeaveClub = async () => {
    if (!user?.club) return

    try {
      setLeaving(true)
      const response = await apiClient.leaveClub()
      if (response.success) {
        toast.success('Successfully left club')
        await refreshUser()
      } else {
        toast.error(response.error || 'Failed to leave club')
      }
    } catch (error) {
      console.error('Error leaving club:', error)
      toast.error('Failed to leave club')
    } finally {
      setLeaving(false)
    }
  }

  if (!user?.club) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/25">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="w-5 h-5" />
            No Club Membership
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            You are not currently a member of any club. Browse available clubs to join one.
          </p>
          <Button asChild>
            <a href="/dashboard/clubs">Browse Clubs</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Club Membership
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{user.club.name}</h3>
            <p className="text-muted-foreground text-sm">
              {user.club.description || 'No description available'}
            </p>
          </div>
          <Badge variant="secondary">Active Member</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>Member since: {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            {user.club.contactEmail && (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span>Contact: {user.club.contactEmail}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {user.club.address && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs">
                  {user.club.address.city}, {user.club.address.state}
                </span>
              </div>
            )}
            {user.membershipPlan && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Plan: {user.membershipPlan.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/dashboard/clubs">Browse Other Clubs</a>
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleLeaveClub}
            disabled={leaving}
          >
            {leaving ? 'Leaving...' : 'Leave Club'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
