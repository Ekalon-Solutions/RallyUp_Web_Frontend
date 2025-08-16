"use client"

import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, Users, Calendar, MapPin, CreditCard, Crown, Star, Shield } from 'lucide-react'
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

  const getPlanIcon = (planName?: string) => {
    if (!planName) return <Calendar className="w-4 h-4" />
    
    const lowerPlan = planName.toLowerCase()
    if (lowerPlan.includes('premium') || lowerPlan.includes('gold')) return <Crown className="w-4 h-4" />
    if (lowerPlan.includes('basic') || lowerPlan.includes('standard')) return <Shield className="w-4 h-4" />
    if (lowerPlan.includes('advanced') || lowerPlan.includes('pro')) return <Star className="w-4 h-4" />
    return <Calendar className="w-4 h-4" />
  }

  const getPlanBadgeVariant = (planName?: string) => {
    if (!planName) return "secondary"
    
    const lowerPlan = planName.toLowerCase()
    if (lowerPlan.includes('premium') || lowerPlan.includes('gold')) return "default"
    if (lowerPlan.includes('basic') || lowerPlan.includes('standard')) return "secondary"
    if (lowerPlan.includes('advanced') || lowerPlan.includes('pro')) return "outline"
    return "secondary"
  }

  if (!user?.club) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/25 bg-muted/5">
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
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          Club Membership
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Club Info Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">{user.club.name}</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              {user.club.description || 'No description available'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
              Active Member
            </Badge>
            {user.membershipPlan && (
              <Badge variant={getPlanBadgeVariant(user.membershipPlan.name)} className="text-xs">
                {getPlanIcon(user.membershipPlan.name)}
                <span className="ml-1">{user.membershipPlan.name}</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Membership Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="bg-background/50 rounded-lg p-4 border border-border/50">
              <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Membership Details
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Member since:</span>
                  <span className="font-medium">{new Date(user.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                {user.membershipPlan && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Plan duration:</span>
                    <span className="font-medium">{user.membershipPlan.duration || 'N/A'} months</span>
                  </div>
                )}
                {user.club.contactEmail && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Contact:</span>
                    <span className="font-medium text-primary">{user.club.contactEmail}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="bg-background/50 rounded-lg p-4 border border-border/50">
              <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Club Location
              </h4>
              <div className="space-y-3">
                {user.club.address ? (
                  <>
                    {user.club.address.city && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">City:</span>
                        <span className="font-medium">{user.club.address.city}</span>
                      </div>
                    )}
                    {user.club.address.state && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">State:</span>
                        <span className="font-medium">{user.club.address.state}</span>
                      </div>
                    )}
                    {user.club.address.country && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Country:</span>
                        <span className="font-medium">{user.club.address.country}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Location not specified</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border/50">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 sm:flex-none"
            asChild
          >
            <a href="/dashboard/user/membership-card">
              <CreditCard className="w-4 h-4 mr-2" />
              View Membership Card
            </a>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 sm:flex-none"
            asChild
          >
            <a href="/dashboard/clubs">Browse Other Clubs</a>
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleLeaveClub}
            disabled={leaving}
            className="flex-1 sm:flex-none"
          >
            {leaving ? 'Leaving...' : 'Leave Club'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
