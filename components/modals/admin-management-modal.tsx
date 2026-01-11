"use client"

import { useState, useEffect } from 'react'
import { apiClient, Admin, User } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  UserPlus, 
  Users, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Shield,
  Mail,
  Phone,
  Search,
  UserCheck
} from 'lucide-react'

interface AdminManagementModalProps {
  clubId: string
  clubName: string
  trigger?: React.ReactNode
}

interface CreateAdminForm {
  name: string
  email: string
  phoneNumber: string
  countryCode: string
  role: 'admin'
}

export function AdminManagementModal({ clubId, clubName, trigger }: AdminManagementModalProps) {
  const [open, setOpen] = useState(false)
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [createForm, setCreateForm] = useState<CreateAdminForm>({
    name: '',
    email: '',
    phoneNumber: '',
    countryCode: '+1',
    role: 'admin'
  })
  const [creating, setCreating] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Admin[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (open) {
      fetchAdmins()
    }
  }, [open, clubId])

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      // Use the system owner endpoint for getting staff by club
      const response = await apiClient.getStaffByClub(clubId, { role: 'admin' })
      
      if (response.success && response.data) {
        setAdmins(response.data.staff)
      } else {
        toast.error(response.error || 'Failed to load admins')
      }
    } catch (error) {
      // console.error('Error fetching admins:', error)
      toast.error('Failed to load admins')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAdmin = async () => {
    try {
      setCreating(true)
      
      // Validate required fields
      if (!createForm.name || !createForm.email || !createForm.phoneNumber) {
        toast.error('Please fill in all required fields')
        return
      }

      // Validate admin name (not just spaces)
      if (!createForm.name.trim()) {
        toast.error('Admin name cannot be empty')
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(createForm.email)) {
        toast.error('Please enter a valid email address')
        return
      }

      // Validate phone number format (10-15 digits)
      const phoneRegex = /^\d{10,15}$/
      if (!phoneRegex.test(createForm.phoneNumber)) {
        toast.error('Phone number must be 10-15 digits')
        return
      }

      const response = await apiClient.createStaffForClub(clubId, {
        ...createForm,
        role: createForm.role as 'admin' | 'volunteer'
      })
      
      if (response.success) {
        toast.success('Admin created successfully!')
        setShowCreateDialog(false)
        setCreateForm({
          name: '',
          email: '',
          phoneNumber: '',
          countryCode: '+1',
          role: 'admin'
        })
        fetchAdmins()
      } else {
        toast.error(response.error || 'Failed to create admin')
      }
    } catch (error) {
      // console.error('Error creating admin:', error)
      toast.error('Failed to create admin')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (!confirm(`Are you sure you want to remove "${adminName}" as an admin?`)) {
      return
    }

    try {
      const response = await apiClient.deleteStaffForClub(clubId, adminId)
      
      if (response.success) {
        toast.success('Admin removed successfully!')
        fetchAdmins()
      } else {
        toast.error(response.error || 'Failed to remove admin')
      }
    } catch (error) {
      // console.error('Error removing admin:', error)
      toast.error('Failed to remove admin')
    }
  }



  const searchAdmins = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      setSearching(true)
      const response = await apiClient.searchAdmins(query)
      
      if (response.success && response.data) {
        // Show all admins but mark which ones are already assigned to this club
        setSearchResults(response.data)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      // console.error('Error searching admins:', error)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleAssignAdminToClub = async (admin: Admin, newRole: 'admin') => {
    try {
      setAssigning(true)
      
      const response = await apiClient.updateStaffForClub(clubId, admin._id, {
        ...admin,
        role: newRole
      })
      
      if (response.success) {
        toast.success(`${admin.name} has been assigned to this club!`)
        setShowAssignDialog(false)
        setSearchQuery('')
        setSearchResults([])
        fetchAdmins()
      } else {
        toast.error(response.error || 'Failed to assign admin to club')
      }
    } catch (error) {
      // console.error('Error assigning admin to club:', error)
      toast.error('Failed to assign admin to club')
    } finally {
      setAssigning(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchAdmins(searchQuery)
      } else {
        setSearchResults([])
      }
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchQuery, admins])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Users className="w-4 h-4 mr-2" />
            Manage Admins
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Admins - {clubName}</DialogTitle>
          <DialogDescription>
            Assign and manage administrators for this club
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Create Admin Button */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Club Administrators</h3>
              <p className="text-sm text-muted-foreground">
                Manage who can administer this club
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Assign Existing Admin
                  </Button>
                </DialogTrigger>
              </Dialog>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create New Admin
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>

            {/* Assign Existing User Dialog */}
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Assign Existing Admin to Club</DialogTitle>
                  <DialogDescription>
                    Search for existing admins to assign to {clubName}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminSearch">Search Admins</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="adminSearch"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or email..."
                        className="pl-10"
                      />
                    </div>
                    {searching && (
                      <p className="text-sm text-muted-foreground">Searching...</p>
                    )}
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <Label>Available Admins</Label>
                      <div className="max-h-60 overflow-y-auto border rounded-lg">
                                                 {searchResults.map((admin) => {
                           const isAlreadyInClub = admin.club && admin.club._id === clubId
                           const isCurrentClubAdmin = admins.find(existingAdmin => existingAdmin._id === admin._id)
                          
                          return (
                            <div key={admin._id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                                    {admin.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{admin.name}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      <Shield className="w-3 h-3 mr-1" />
                                      {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                                    </Badge>
                                                                         {admin.club && (
                                       <Badge variant="outline" className="text-xs">
                                         {admin.club.name}
                                       </Badge>
                                     )}
                                  </div>
                                  <div className="text-sm text-muted-foreground">{admin.email}</div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {isCurrentClubAdmin ? (
                                  <div className="text-sm text-muted-foreground">
                                    Already in this club
                                  </div>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleAssignAdminToClub(admin, 'admin')}
                                      disabled={assigning}
                                    >
                                      <Shield className="w-3 h-3 mr-1" />
                                      Assign to Club
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {searchQuery && !searching && searchResults.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2" />
                      <p>No admins found matching "{searchQuery}"</p>
                      <p className="text-sm">Try a different search term</p>
                    </div>
                  )}

                  {!searchQuery && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="w-8 h-8 mx-auto mb-2" />
                      <p>Search for admins to assign to this club</p>
                      <p className="text-sm">Enter a name or email address above</p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Create New Admin Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Administrator</DialogTitle>
                  <DialogDescription>
                    Create a new administrator for {clubName}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminName">Name *</Label>
                    <Input
                      id="adminName"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="Enter admin name"
                    />
                  </div>
                                     <div className="space-y-2">
                     <Label htmlFor="adminEmail">Email *</Label>
                     <Input
                       id="adminEmail"
                       type="email"
                       value={createForm.email}
                       onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                       placeholder="admin@club.com"
                     />
                     <p className={`text-xs ${createForm.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email) ? 'text-green-600' : 'text-muted-foreground'}`}>
                       {createForm.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email) 
                         ? '✓ Valid email format' 
                         : 'Enter a valid email address'}
                     </p>
                   </div>
                  <div className="grid grid-cols-2 gap-4">
                                         <div className="space-y-2">
                       <Label htmlFor="adminPhone">Phone Number *</Label>
                       <Input
                         id="adminPhone"
                         value={createForm.phoneNumber}
                         onChange={(e) => {
                           // Remove any non-digit characters and limit to 15 digits
                           const phoneNumber = e.target.value.replace(/\D/g, '').slice(0, 15)
                           setCreateForm({ ...createForm, phoneNumber })
                         }}
                         placeholder="1234567890"
                         maxLength={15}
                       />
                       <p className={`text-xs ${createForm.phoneNumber.length >= 10 && createForm.phoneNumber.length <= 15 ? 'text-green-600' : 'text-muted-foreground'}`}>
                         {createForm.phoneNumber.length >= 10 && createForm.phoneNumber.length <= 15 
                           ? '✓ Valid phone number format' 
                           : 'Enter phone number without country code (10-15 digits)'}
                       </p>
                     </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminCountryCode">Country Code</Label>
                      <Input
                        id="adminCountryCode"
                        value={createForm.countryCode}
                        onChange={(e) => setCreateForm({ ...createForm, countryCode: e.target.value })}
                        placeholder="+1"
                      />
                    </div>
                  </div>

                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAdmin} disabled={creating}>
                    {creating ? 'Creating...' : 'Create Admin'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Admins Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading admins...
                    </TableCell>
                  </TableRow>
                ) : admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <Users className="w-8 h-8 mx-auto mb-2" />
                        <p>No administrators assigned to this club</p>
                        <p className="text-sm">Add an admin to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => (
                    <TableRow key={admin._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                              {admin.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{admin.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {admin.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={admin.role === 'super_admin' ? 'default' : 'secondary'}>
                          <Shield className="w-3 h-3 mr-1" />
                          {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <span>{admin.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>{admin.countryCode} {admin.phoneNumber}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={admin.isActive ? 'default' : 'secondary'}>
                          {admin.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(admin.createdAt || '').toLocaleDateString()}
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

                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteAdmin(admin._id, admin.name)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove Admin
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
