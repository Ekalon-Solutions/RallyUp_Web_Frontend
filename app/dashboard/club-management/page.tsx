"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { apiClient, Club, Admin } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  Building2, 
  Users, 
  MapPin, 
  Globe, 
  Mail, 
  Phone, 
  Calendar, 
  Star,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  Settings,
  BarChart3,
  Eye
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { ProtectedRoute } from '@/components/protected-route'
import { AdminManagementModal } from '@/components/modals/admin-management-modal'
import { ClubStatsModal } from '@/components/modals/club-stats-modal'
import { EditClubModal } from '@/components/modals/edit-club-modal'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ClubWithDetails extends Club {
  superAdmin?: Admin
  createdBy?: {
    _id: string
    name: string
    email: string
  }
  stats?: {
    totalMembers: number
    totalAdmins: number
    activeMembers: number
    verifiedMembers: number
  }
}

interface CreateClubForm {
  name: string
  description: string
  website: string
  contactEmail: string
  contactPhone: string
  address: {
    street: string
    city: string
    state: string
    country: string
    zipCode: string
  }
  settings: {
    allowPublicRegistration: boolean
    requireApproval: boolean
    maxMembers: number
  }
  superAdminEmail: string
  superAdminPhone: string
  superAdminCountryCode: string
}

export default function ClubManagementPage() {
  const { user } = useAuth()
  const [clubs, setClubs] = useState<ClubWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState<CreateClubForm>({
    name: '',
    description: '',
    website: '',
    contactEmail: '',
    contactPhone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    settings: {
      allowPublicRegistration: true,
      requireApproval: false,
      maxMembers: 1000
    },
    superAdminEmail: '',
    superAdminPhone: '',
    superAdminCountryCode: '+1'
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (user?.role === 'system_owner') {
      fetchClubs()
    }
  }, [user])

  const fetchClubs = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getClubs({
        page: 1,
        limit: 100,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      })
      
      if (response.success && response.data) {
        const clubsWithDetails = await Promise.all(
          response.data.clubs.map(async (club: Club) => {
            try {
              const statsResponse = await apiClient.getClubStats(club._id)
              return {
                ...club,
                stats: statsResponse.success ? statsResponse.data : undefined
              }
            } catch (error) {
              // console.error('Error fetching club stats:', error)
              return club
            }
          })
        )
        setClubs(clubsWithDetails)
      } else {
        toast.error(response.error || 'Failed to load clubs')
      }
    } catch (error) {
      // console.error('Error fetching clubs:', error)
      toast.error('Failed to load clubs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'system_owner') {
      fetchClubs()
    }
  }, [searchTerm, statusFilter])

  const handleCreateClub = async () => {
    try {
      setCreating(true)
      
      // Validate required fields
      if (!createForm.name || !createForm.contactEmail || !createForm.contactPhone || 
          !createForm.superAdminEmail || !createForm.superAdminPhone) {
        toast.error('Please fill in all required fields')
        return
      }

      // Validate club name (not just spaces)
      if (!createForm.name.trim()) {
        toast.error('Club name cannot be empty')
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(createForm.contactEmail)) {
        toast.error('Please enter a valid contact email address')
        return
      }
      if (!emailRegex.test(createForm.superAdminEmail)) {
        toast.error('Please enter a valid super admin email address')
        return
      }

      // Validate phone number format (10-15 digits)
      const phoneRegex = /^\d{10,15}$/
      if (!phoneRegex.test(createForm.contactPhone)) {
        toast.error('Contact phone number must be 10-15 digits')
        return
      }
      if (!phoneRegex.test(createForm.superAdminPhone)) {
        toast.error('Super admin phone number must be 10-15 digits')
        return
      }

      const response = await apiClient.createClub(createForm)
      
      if (response.success) {
        toast.success('Club created successfully!')
        setShowCreateDialog(false)
        setCreateForm({
          name: '',
          description: '',
          website: '',
          contactEmail: '',
          contactPhone: '',
          address: {
            street: '',
            city: '',
            state: '',
            country: '',
            zipCode: ''
          },
          settings: {
            allowPublicRegistration: true,
            requireApproval: false,
            maxMembers: 1000
          },
          superAdminEmail: '',
          superAdminPhone: '',
          superAdminCountryCode: '+1'
        })
        fetchClubs()
      } else {
        toast.error(response.error || 'Failed to create club')
      }
    } catch (error) {
      // console.error('Error creating club:', error)
      toast.error('Failed to create club')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteClub = async (clubId: string, clubName: string) => {
    if (!confirm(`Are you sure you want to delete "${clubName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await apiClient.deleteClub(clubId)
      
      if (response.success) {
        toast.success('Club deleted successfully!')
        fetchClubs()
      } else {
        toast.error(response.error || 'Failed to delete club')
      }
    } catch (error) {
      // console.error('Error deleting club:', error)
      toast.error('Failed to delete club')
    }
  }

  const formatAddress = (address: any) => {
    if (!address) return 'Address not available'
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`
  }

  const filteredClubs = clubs.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         club.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         club.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || club.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (user?.role !== 'system_owner') {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-muted-foreground mb-2">Access Denied</h2>
              <p className="text-muted-foreground">Only system owners can access club management.</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">Club Management</h1>
                <p className="text-muted-foreground">Manage all clubs and their administrators</p>
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
              <h1 className="text-3xl font-bold">Club Management</h1>
              <p className="text-muted-foreground">Manage all clubs and their administrators</p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Club
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Club</DialogTitle>
                  <DialogDescription>
                    Create a new club and assign a super administrator to manage it.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Club Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Club Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Club Name *</Label>
                        <Input
                          id="name"
                          value={createForm.name}
                          onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                          placeholder="Enter club name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={createForm.website}
                          onChange={(e) => setCreateForm({ ...createForm, website: e.target.value })}
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={createForm.description}
                        onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                        placeholder="Enter club description"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contactEmail">Contact Email *</Label>
                        <Input
                          id="contactEmail"
                          type="email"
                          value={createForm.contactEmail}
                          onChange={(e) => setCreateForm({ ...createForm, contactEmail: e.target.value })}
                          placeholder="contact@club.com"
                        />
                        <p className={`text-xs ${createForm.contactEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.contactEmail) ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {createForm.contactEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.contactEmail) 
                            ? '✓ Valid email format' 
                            : 'Enter a valid email address'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactPhone">Contact Phone *</Label>
                        <Input
                          id="contactPhone"
                          value={createForm.contactPhone}
                          onChange={(e) => {
                            // Remove any non-digit characters and limit to 15 digits
                            const phoneNumber = e.target.value.replace(/\D/g, '').slice(0, 15)
                            setCreateForm({ ...createForm, contactPhone: phoneNumber })
                          }}
                          placeholder="1234567890"
                          maxLength={15}
                        />
                        <p className={`text-xs ${createForm.contactPhone.length >= 10 && createForm.contactPhone.length <= 15 ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {createForm.contactPhone.length >= 10 && createForm.contactPhone.length <= 15 
                            ? '✓ Valid phone number format' 
                            : 'Enter phone number without country code (10-15 digits)'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="street">Street</Label>
                        <Input
                          id="street"
                          value={createForm.address.street}
                          onChange={(e) => setCreateForm({ 
                            ...createForm, 
                            address: { ...createForm.address, street: e.target.value }
                          })}
                          placeholder="123 Main St"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={createForm.address.city}
                          onChange={(e) => setCreateForm({ 
                            ...createForm, 
                            address: { ...createForm.address, city: e.target.value }
                          })}
                          placeholder="City"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={createForm.address.state}
                          onChange={(e) => setCreateForm({ 
                            ...createForm, 
                            address: { ...createForm.address, state: e.target.value }
                          })}
                          placeholder="State"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input
                          id="zipCode"
                          value={createForm.address.zipCode}
                          onChange={(e) => setCreateForm({ 
                            ...createForm, 
                            address: { ...createForm.address, zipCode: e.target.value }
                          })}
                          placeholder="12345"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={createForm.address.country}
                          onChange={(e) => setCreateForm({ 
                            ...createForm, 
                            address: { ...createForm.address, country: e.target.value }
                          })}
                          placeholder="Country"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Super Admin Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Administrator</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="superAdminEmail">Email *</Label>
                        <Input
                          id="superAdminEmail"
                          type="email"
                          value={createForm.superAdminEmail}
                          onChange={(e) => setCreateForm({ ...createForm, superAdminEmail: e.target.value })}
                          placeholder="admin@club.com"
                        />
                        <p className={`text-xs ${createForm.superAdminEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.superAdminEmail) ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {createForm.superAdminEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.superAdminEmail) 
                            ? '✓ Valid email format' 
                            : 'Enter a valid email address'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="superAdminPhone">Phone *</Label>
                        <Input
                          id="superAdminPhone"
                          value={createForm.superAdminPhone}
                          onChange={(e) => {
                            // Remove any non-digit characters and limit to 15 digits
                            const phoneNumber = e.target.value.replace(/\D/g, '').slice(0, 15)
                            setCreateForm({ ...createForm, superAdminPhone: phoneNumber })
                          }}
                          placeholder="1234567890"
                          maxLength={15}
                        />
                        <p className={`text-xs ${createForm.superAdminPhone.length >= 10 && createForm.superAdminPhone.length <= 15 ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {createForm.superAdminPhone.length >= 10 && createForm.superAdminPhone.length <= 15 
                            ? '✓ Valid phone number format' 
                            : 'Enter phone number without country code (10-15 digits)'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="superAdminCountryCode">Country Code</Label>
                        <Input
                          id="superAdminCountryCode"
                          value={createForm.superAdminCountryCode}
                          onChange={(e) => setCreateForm({ ...createForm, superAdminCountryCode: e.target.value })}
                          placeholder="+1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Club Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Allow Public Registration</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow users to join this club without admin approval
                          </p>
                        </div>
                        <Switch
                          checked={createForm.settings.allowPublicRegistration}
                          onCheckedChange={(checked) => 
                            setCreateForm({ 
                              ...createForm, 
                              settings: { ...createForm.settings, allowPublicRegistration: checked }
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Require Approval</Label>
                          <p className="text-sm text-muted-foreground">
                            Require admin approval for new members
                          </p>
                        </div>
                        <Switch
                          checked={createForm.settings.requireApproval}
                          onCheckedChange={(checked) => 
                            setCreateForm({ 
                              ...createForm, 
                              settings: { ...createForm.settings, requireApproval: checked }
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxMembers">Maximum Members</Label>
                        <Input
                          id="maxMembers"
                          type="number"
                          value={createForm.settings.maxMembers}
                          onChange={(e) => setCreateForm({ 
                            ...createForm, 
                            settings: { ...createForm.settings, maxMembers: parseInt(e.target.value) || 1000 }
                          })}
                          placeholder="1000"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateClub} disabled={creating}>
                    {creating ? 'Creating...' : 'Create Club'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search clubs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clubs Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Clubs ({filteredClubs.length})</CardTitle>
              <CardDescription>
                Manage clubs, view statistics, and assign administrators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Club</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Super Admin</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClubs.map((club) => (
                    <TableRow key={club._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                              {club.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{club.name}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {club.description || 'No description'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          club.status === 'active' ? 'default' :
                          club.status === 'inactive' ? 'secondary' : 'destructive'
                        }>
                          {club.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {club.superAdmin ? (
                          <div>
                            <div className="font-medium">{club.superAdmin.name}</div>
                            <div className="text-sm text-muted-foreground">{club.superAdmin.email}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {club.stats ? (
                          <div className="text-sm">
                            <div>{club.stats.totalMembers} total</div>
                            <div className="text-muted-foreground">{club.stats.activeMembers} active</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Loading...</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <span>{club.contactEmail}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>{club.contactPhone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(club.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <ClubStatsModal 
                              club={club}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                              }
                            />
                            <AdminManagementModal 
                              clubId={club._id} 
                              clubName={club.name}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Manage Admins
                                </DropdownMenuItem>
                              }
                            />
                            <EditClubModal
                              club={club}
                              onClubUpdated={fetchClubs}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Club
                                </DropdownMenuItem>
                              }
                            />
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteClub(club._id, club.name)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Club
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredClubs.length === 0 && (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">No clubs found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.' 
                      : 'Create your first club to get started.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
