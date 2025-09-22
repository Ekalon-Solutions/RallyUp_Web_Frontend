"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Users, Calendar, DollarSign, Crown, Plus } from "lucide-react"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"

interface UserMembership {
  _id: string
  club_id: {
    _id: string
    name: string
    description: string
    status: string
  }
  membership_level_id: {
    _id: string
    name: string
    description: string
    price: number
    currency: string
  }
  level_name: string
  status: string
  start_date: string
  end_date?: string
  user_membership_id: string
}

interface ClubSelectorProps {
  onClubSelect: (clubId: string) => void
  selectedClubId?: string
}

export const ClubSelector: React.FC<ClubSelectorProps> = ({ onClubSelect, selectedClubId }) => {
  const [memberships, setMemberships] = useState<UserMembership[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUserMemberships()
  }, [])

  const loadUserMemberships = async () => {
    try {
      setIsLoading(true)
      // You'll need to create this API endpoint
      const response = await apiClient.getUserMemberships()
      
      if (response.success) {
        const membershipData = Array.isArray(response.data) ? response.data : []
        const activeMemberships = membershipData.filter((m: UserMembership) => m.status === 'active')
        setMemberships(activeMemberships)
        
        // Auto-select first club if none selected
        if (!selectedClubId && activeMemberships.length > 0) {
          onClubSelect(activeMemberships[0].club_id._id)
        }
      } else {
        toast.error("Failed to load your club memberships")
      }
    } catch (error) {
      console.error('Error loading memberships:', error)
      toast.error("Failed to load your club memberships")
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Loading Your Clubs...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (memberships.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Your Club Memberships
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">You are not a member of any clubs yet.</p>
          <Button className="mt-4" onClick={() => window.location.href = '/dashboard/user/clubs'}>
            <Plus className="h-4 w-4 mr-2" />
            Browse Clubs
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Your Club Memberships ({memberships.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Club Selector Dropdown */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select club to view plans:</label>
          <Select value={selectedClubId} onValueChange={onClubSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a club..." />
            </SelectTrigger>
            <SelectContent>
              {memberships.map((membership) => (
                <SelectItem key={membership.club_id._id} value={membership.club_id._id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{membership.club_id.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {membership.level_name}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Membership Details */}
        <div className="space-y-3">
          {memberships.map((membership) => (
            <div 
              key={membership._id} 
              className={`p-3 rounded-lg border transition-colors ${
                selectedClubId === membership.club_id._id 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{membership.club_id.name}</h4>
                    {selectedClubId === membership.club_id._id && (
                      <Badge variant="default" className="text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        Selected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {membership.club_id.description}
                  </p>
                </div>
                <Badge 
                  variant={membership.status === 'active' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {membership.status}
                </Badge>
              </div>
              
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">{membership.level_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span>{formatPrice(membership.membership_level_id.price, membership.membership_level_id.currency)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>Since {formatDate(membership.start_date)}</span>
                </div>
                {membership.end_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-red-500" />
                    <span>Until {formatDate(membership.end_date)}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  ID: {membership.user_membership_id}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}