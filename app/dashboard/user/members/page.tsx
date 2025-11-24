"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardLayout } from '@/components/dashboard-layout'
import { ProtectedRoute } from '@/components/protected-route'
import MemberConnections from '@/components/member-connections'
import { 
  Search, 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  Shield,
  UserCheck,
  Clock,
  Network
} from 'lucide-react'

interface ClubMember {
  _id: string
  name: string
  email: string
  phoneNumber: string
  countryCode: string
  isPhoneVerified: boolean
  membershipPlan?: {
    _id: string
    name: string
    description: string
    price: number
    currency: string
    duration: number
  }
  membershipExpiry?: string
  createdAt: string
}

export default function ClubMembersPage() {
  const { user } = useAuth()
  const [members, setMembers] = useState<ClubMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeClubId, setActiveClubId] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    console.log('User data in ClubMembersPage:', user)
    console.log('User memberships:', (user as any)?.memberships)
    console.log('User memberships length:', (user as any)?.memberships?.length)
    if (user) {
      fetchClubMembers()
    }
  }, [currentPage, searchTerm, user])

  const fetchClubMembers = async () => {
    try {
      setLoading(true)
      
      // Check if user has club memberships
      console.log('Checking user memberships in fetchClubMembers:')
      console.log('User object keys:', Object.keys(user || {}))
      console.log('User memberships:', (user as any)?.memberships)
      console.log('User memberships length:', (user as any)?.memberships?.length)
      
      if (!(user as any)?.memberships || (user as any).memberships.length === 0) {
        console.log('No memberships found - showing error')
        toast.error('No club memberships found. Please join a club first.')
        setLoading(false)
        return
      }

      // Get the first active membership (assuming user can only be in one club at a time)
      const activeMembership = (user as any).memberships.find((membership: any) => 
        membership.status === 'active'
      )

      if (!activeMembership?.club_id?._id) {
        console.log('No active club membership found')
        toast.error('No active club membership found. Please join a club first.')
        setLoading(false)
        return
      }

      setActiveClubId(activeMembership.club_id._id)

      console.log('Fetching club members for club ID:', activeMembership.club_id._id)
      const response = await apiClient.getClubMemberDirectory({
        search: searchTerm || undefined,
        page: currentPage,
        limit: 20,
        clubId: activeMembership.club_id._id
      })

      console.log('API response:', response)
      if (response.success && response.data) {
        console.log('Members data:', response.data.members)
        console.log('Pagination data:', response.data.pagination)
        setMembers(response.data.members as ClubMember[])
        setPagination(response.data.pagination)
      } else {
        console.error('API error:', response.error)
        toast.error(response.error || 'Failed to load club members')
      }
    } catch (error) {
      console.error('Error fetching club members:', error)
      toast.error('Error loading club members')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPhoneNumber = (phoneNumber: string, countryCode: string) => {
    return `${countryCode} ${phoneNumber}`
  }

  const getVerificationColor = (isVerified: boolean) => {
    return isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
  }

  const getMembershipStatus = (expiryDate?: string) => {
    if (!expiryDate) return { status: 'No Plan', color: 'bg-gray-100 text-gray-800' }
    
    const expiry = new Date(expiryDate)
    const now = new Date()
    
    if (expiry < now) {
      return { status: 'Expired', color: 'bg-red-100 text-red-800' }
    } else if (expiry.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000) {
      return { status: 'Expiring Soon', color: 'bg-orange-100 text-orange-800' }
    } else {
      return { status: 'Active', color: 'bg-green-100 text-green-800' }
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Club Members</h1>
              <p className="text-muted-foreground">Connect with fellow club members</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{pagination.total} members</span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pagination.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verified Members</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {members.filter(m => m.isPhoneVerified).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
                <Clock className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {members.filter(m => {
                    if (!m.membershipExpiry) return false
                    return new Date(m.membershipExpiry) > new Date()
                  }).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content with Tabs */}
          <Tabs defaultValue="directory" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="directory" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Member Directory
              </TabsTrigger>
              <TabsTrigger value="connections" className="flex items-center gap-2">
                <Network className="w-4 h-4" />
                My Connections
              </TabsTrigger>
            </TabsList>

            {/* Member Directory Tab */}
            <TabsContent value="directory" className="mt-6">
              {/* Search */}
              <Card>
                <CardHeader>
                  <CardTitle>Club Members</CardTitle>
                  <CardDescription>Search and connect with fellow members</CardDescription>
                </CardHeader>
                <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search members by name or email..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Members List */}
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                      <div className="w-10 h-10 bg-muted rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-3 bg-muted rounded w-1/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">No members found</h3>
                  <p className="text-muted-foreground">Try adjusting your search.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {members.map((member) => {
                    const membershipStatus = getMembershipStatus(member.membershipExpiry)
                    return (
                      <div key={member._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                              {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold">{member.name}</h3>
                              <Badge className={getVerificationColor(member.isPhoneVerified)}>
                                {member.isPhoneVerified ? 'Verified' : 'Unverified'}
                              </Badge>
                              <Badge className={membershipStatus.color}>
                                {membershipStatus.status}
                              </Badge>
                            </div>

                            {member.membershipPlan && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Plan: {member.membershipPlan.name} ({member.membershipPlan.price} {member.membershipPlan.currency})
                                {member.membershipExpiry && (
                                  <span className="ml-2">
                                    • Expires {formatDate(member.membershipExpiry)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(currentPage - 1)}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {[...Array(pagination.pages)].map((_, i) => {
                        const page = i + 1
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      })}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(currentPage + 1)}
                          className={currentPage === pagination.pages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
            </TabsContent>

            {/* Member Connections Tab */}
            <TabsContent value="connections" className="mt-6">
              {activeClubId && user ? (
                <MemberConnections 
                  currentUser={{
                    ...user,
                    token: localStorage.getItem('token')
                  }} 
                  clubId={activeClubId} 
                />
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Network className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Club Found</h3>
                    <p className="text-muted-foreground">You need to be a member of a club to connect with other members.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 