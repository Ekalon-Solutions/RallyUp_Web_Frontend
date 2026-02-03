"use client"

import { useState, useEffect } from 'react'
import { apiClient, Club } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  BarChart3, 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Calendar,
  TrendingUp,
  Activity,
  Globe,
  Mail,
  Phone,
  MapPin
} from 'lucide-react'

interface ClubStatsModalProps {
  club: Club
  trigger?: React.ReactNode
}

interface ClubStats {
  totalMembers: number
  totalAdmins: number
  activeMembers: number
  verifiedMembers: number
  inactiveMembers: number
  unverifiedMembers: number
  maxMembers: number
  membershipPlans: number
  recentActivity?: {
    newMembers: number
    newAdmins: number
    eventsCreated: number
    newsPublished: number
  }
}

export function ClubStatsModal({ club, trigger }: ClubStatsModalProps) {
  const [open, setOpen] = useState(false)
  const [stats, setStats] = useState<ClubStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchStats()
    }
  }, [open, club._id])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getClubStats(club._id)
      
      if (response.success && response.data) {
        setStats(response.data)
      } else {
        toast.error(response.error || 'Failed to load club statistics')
      }
    } catch (error) {
      // console.error('Error fetching club stats:', error)
      toast.error('Failed to load club statistics')
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = (address: any) => {
    if (!address) return 'Address not available'
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`
  }

  const getMembershipUtilization = () => {
    if (!stats) return 0
    return Math.round((stats.totalMembers / stats.maxMembers) * 100)
  }

  const getVerificationRate = () => {
    if (!stats || stats.totalMembers === 0) return 0
    return Math.round((stats.verifiedMembers / stats.totalMembers) * 100)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            View Statistics
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={club.logo} alt={club.name} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                {club.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div>{club.name} - Statistics</div>
              <div className="text-sm font-normal text-muted-foreground">
                Detailed analytics and insights
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Comprehensive statistics and performance metrics for {club.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Club Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Club Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant={club.status === 'active' ? 'default' : 'secondary'}>
                          {club.status}
                        </Badge>
                        <span className="text-muted-foreground">Status</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Created: {new Date(club.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span>Public Registration: {club.settings.allowPublicRegistration ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{club.contactEmail}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{club.contactPhone}</span>
                      </div>
                      {club.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <a href={club.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {club.website}
                          </a>
                        </div>
                      )}
                      {club.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs">{formatAddress(club.address)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {club.description || 'No description provided'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                      <p className="text-2xl font-bold">{stats.totalMembers}</p>
                    </div>
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <TrendingUp className="w-3 h-3" />
                      <span>{getMembershipUtilization()}% of capacity</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                      <p className="text-2xl font-bold">{stats.activeMembers}</p>
                    </div>
                    <UserCheck className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{stats.inactiveMembers} inactive</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Verified Members</p>
                      <p className="text-2xl font-bold">{stats.verifiedMembers}</p>
                    </div>
                    <UserCheck className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{getVerificationRate()}% verification rate</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Administrators</p>
                      <p className="text-2xl font-bold">{stats.totalAdmins}</p>
                    </div>
                    <Shield className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Managing {stats.totalMembers} members</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Max Capacity</p>
                      <p className="text-2xl font-bold">{stats.maxMembers}</p>
                    </div>
                    <Users className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{stats.maxMembers - stats.totalMembers} spots available</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Membership Plans</p>
                      <p className="text-2xl font-bold">{stats.membershipPlans}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Available plans</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Unverified</p>
                      <p className="text-2xl font-bold">{stats.unverifiedMembers}</p>
                    </div>
                    <UserX className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Need verification</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                      <p className="text-2xl font-bold">{stats.inactiveMembers}</p>
                    </div>
                    <UserX className="h-8 w-8 text-gray-600" />
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Not currently active</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Statistics Available</h3>
                <p className="text-muted-foreground">Unable to load statistics for this club.</p>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          {stats?.recentActivity && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.recentActivity.newMembers}</div>
                    <div className="text-sm text-muted-foreground">New Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.recentActivity.newAdmins}</div>
                    <div className="text-sm text-muted-foreground">New Admins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.recentActivity.eventsCreated}</div>
                    <div className="text-sm text-muted-foreground">Events Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.recentActivity.newsPublished}</div>
                    <div className="text-sm text-muted-foreground">News Published</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
