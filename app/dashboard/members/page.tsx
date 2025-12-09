"use client"

import { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { apiClient, User } from '@/lib/api'
import { toast } from 'sonner'
import { triggerBlobDownload } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { DashboardLayout } from '@/components/dashboard-layout'
import { ProtectedRoute } from '@/components/protected-route'
import { AddMemberModal } from '@/components/modals/add-member-modal'
import { 
  Search, 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  Building2, 
  Shield,
  Eye,
  Edit,
  Trash2,
  Filter,
  Download,
  Plus,
  Check
} from 'lucide-react'

interface Member {
  _id: string
  name: string
  email: string
  phone_number: string
  countryCode: string
  isPhoneVerified: boolean
  role: string
  club?: {
    _id: string
    name: string
    description?: string
    logo?: string
  }
  membershipPlan?: {
    _id: string
    name: string
    description: string
    price: number
    currency: string
    duration: number
  }
  membershipExpiry?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function MembersPage() {
  const { user } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [addMode, setAddMode] = useState<'new' | 'existing'>('new')
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    countryCode: '',
    isActive: true
  })

  useEffect(() => {
    fetchMembers()
  }, [currentPage, searchTerm, statusFilter])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getMemberDirectory({
        search: searchTerm || undefined,
        page: currentPage,
        limit: 20,
        status: statusFilter
      })

      if (response.success && response.data) {
        setMembers(response.data.members)
        setPagination(response.data.pagination)
      } else {
        toast.error(response.error || 'Failed to load members')
      }
    } catch (error) {
      // console.error('Error fetching members:', error)
      toast.error('Error loading members')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string): void => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleStatusFilter = (value: string): void => {
    setStatusFilter(value as 'all' | 'active' | 'inactive')
    setCurrentPage(1)
  }

  const handlePageChange = (page: number): void => {
    setCurrentPage(page)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPhoneNumber = (phone_number: string, countryCode: string): string => {
    return `${countryCode} ${phone_number}`
  }

  const getStatusColor = (isActive: boolean): string => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const getVerificationColor = (isVerified: boolean): string => {
    return isVerified ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
  }

  const handleUserSearch = async (query: string): Promise<void> => {
//     console.log('handleUserSearch - Starting search with query:', query);
    
    // Only search if we have at least 2 characters
    if (query.trim().length < 2) {
      // // console.log('handleUserSearch - Query too short, clearing results');
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // // console.log('handleUserSearch - Calling API...');
      const response = await apiClient.searchUsers(query);
      // // console.log('handleUserSearch - API Response:', response);

      if (response.success) {
        const users = response.data || [];
        // // console.log('handleUserSearch - Setting search results:', users);
        setSearchResults(users);

        // Update UI based on results
        if (users.length === 0) {
          // // console.log('handleUserSearch - No users found');
          toast.info('No users found matching your search');
        } else {
          // // console.log('handleUserSearch - Found', users.length, 'users');
          toast.success(`Found ${users.length} user${users.length === 1 ? '' : 's'}`);
        }
      } else {
        // // console.error('handleUserSearch - Search failed:', response);
        toast.error(response.error || 'Failed to search users');
        setSearchResults([]);
      }
    } catch (error) {
      // // console.error('handleUserSearch - Error:', error);
      toast.error('Failed to search users');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  const handleAddExistingUser = async (): Promise<void> => {
    if (!selectedUser) {
      toast.error('Please select a user to add');
      return;
    }

    try {
      // // console.log('Adding user:', selectedUser);
      const response = await apiClient.addUserToClub({
        email: selectedUser.email,
        name: selectedUser.name,
        phone_number: selectedUser.phone_number
      });
      // // console.log('Add user response:', response);
      
      if (response.success) {
        toast.success('Member added successfully');
        setIsAddDialogOpen(false);
        fetchMembers();
        // Reset states
        setSelectedUser(null);
        setSearchQuery('');
        setSearchResults([]);
        setAddMode('new');
      } else {
        toast.error(response.error || 'Failed to add member');
      }
    } catch (error) {
      // // console.error('Error adding member:', error);
      toast.error('Failed to add member');
    }
  }

  const handleAddMember = async (data: { name: string; email: string; phone_number: string; countryCode: string }): Promise<void> => {
    try {
      const response = await apiClient.userRegister({
        ...data,
        clubId: user?.club?._id,
      })

      if (response.success) {
        toast.success('Member added successfully')
        setIsAddDialogOpen(false)
        fetchMembers()
      } else {
        toast.error(response.error || 'Failed to add member')
      }
    } catch (error) {
      // console.error('Error adding member:', error)
      toast.error('Failed to add member')
    }
  }

  const handleEditMember = async () => {
    if (!selectedMember) return

    try {
      const response = await apiClient.updateMember(selectedMember._id, editFormData)

      if (response.success) {
        toast.success('Member updated successfully')
        setIsEditDialogOpen(false)
        fetchMembers()
      } else {
        toast.error(response.error || 'Failed to update member')
      }
    } catch (error) {
      // console.error('Error updating member:', error)
      toast.error('Failed to update member')
    }
  }

  const handleDeleteMember = async () => {
    if (!selectedMember) return

    try {
      const response = await apiClient.deleteMember(selectedMember._id)

      if (response.success) {
        toast.success('Member deleted successfully')
        setIsDeleteDialogOpen(false)
        fetchMembers()
      } else {
        toast.error(response.error || 'Failed to delete member')
      }
    } catch (error) {
      // console.error('Error deleting member:', error)
      toast.error('Failed to delete member')
    }
  }

  const openEditDialog = (member: Member) => {
    setSelectedMember(member)
    setEditFormData({
      name: member.name,
      email: member.email,
      phone_number: member.phone_number,
      countryCode: member.countryCode,
      isActive: member.isActive
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (member: Member) => {
    setSelectedMember(member)
    setIsDeleteDialogOpen(true)
  }

  const exportMembers = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Club', 'Membership Plan', 'Status', 'Joined Date'].join(','),
      ...members.map((member: Member) => [
        member.name,
        member.email,
        formatPhoneNumber(member.phone_number, member.countryCode),
        member.club?.name || 'N/A',
        member.membershipPlan?.name || 'N/A',
        member.isActive ? 'Active' : 'Inactive',
        formatDate(member.createdAt)
      ].join(','))
    ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const filename = `members-${new Date().toISOString().split('T')[0]}.csv`
  triggerBlobDownload(blob, filename)
  toast.success('Members exported successfully!')
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Member Directory</h1>
              <p className="text-muted-foreground">Manage and view all club members</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportMembers}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <AddMemberModal 
                trigger={
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                }
                onMemberAdded={() => {
                  fetchMembers()
                  toast.success("Member added successfully!")
                }}
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                <Shield className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {members.filter((m: Member) => m.isActive).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verified Members</CardTitle>
                <Mail className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {members.filter((m: Member) => m.isPhoneVerified).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <Calendar className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {members.filter((m: Member) => {
                    const memberDate = new Date(m.createdAt)
                    const now = new Date()
                    return memberDate.getMonth() === now.getMonth() && 
                           memberDate.getFullYear() === now.getFullYear()
                  }).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>Search and filter your members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search members by name, email, or phone..."
                      value={searchTerm}
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <Select value={statusFilter} onValueChange={handleStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Members</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  <p className="text-muted-foreground">Try adjusting your search or filters.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {members.map((member: Member) => (
                    <div key={member._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                            {member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{member.name}</h3>
                            <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(member.isActive)}`}>
                              {member.isActive ? 'Active' : 'Inactive'}
                            </div>
                            <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getVerificationColor(member.isPhoneVerified)}`}>
                              {member.isPhoneVerified ? 'Verified' : 'Unverified'}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                            {/* Only show contact info to admins/system owners */}
                            {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'system_owner') && (
                              <>
                                <div className="flex items-center space-x-1">
                                  <Mail className="w-3 h-3" />
                                  <span>{member.email}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Phone className="w-3 h-3" />
                                  <span>{formatPhoneNumber(member.phone_number, member.countryCode)}</span>
                                </div>
                              </>
                            )}
                            {member.club && (
                              <div className="flex items-center space-x-1">
                                <Building2 className="w-3 h-3" />
                                <span>{member.club.name}</span>
                              </div>
                            )}
                          </div>
                          {member.membershipPlan && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Plan: {member.membershipPlan.name} ({member.membershipPlan.price} {member.membershipPlan.currency})
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Only show action buttons to admins/system owners */}
                      {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'system_owner') && (
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(member)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(member)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
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

          {/* Add Member Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={(open: boolean) => {
            setIsAddDialogOpen(open)
            if (!open) {
              setSelectedUser(null)
              setSearchQuery('')
              setSearchResults([])
              setAddMode('new')
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Member</DialogTitle>
                <DialogDescription>
                  Add a new member or search for an existing user to add to your club.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Mode Selection */}
                <div className="flex gap-4 pb-4 border-b">
                  <Button
                    type="button"
                    variant={addMode === 'new' ? 'default' : 'outline'}
                    onClick={() => setAddMode('new')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Member
                  </Button>
                  <Button
                    type="button"
                    variant={addMode === 'existing' ? 'default' : 'outline'}
                    onClick={() => setAddMode('existing')}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search Existing
                  </Button>
                </div>

                {addMode === 'existing' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Search Users</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          value={searchQuery}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setSearchQuery(e.target.value)
                            handleUserSearch(e.target.value)
                          }}
                          placeholder="Search by name, email, or phone..."
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {(() => {
//                       console.log('Rendering search results section:', {
//                         isSearching,
//                         searchResults,
//                         searchResultsLength: searchResults?.length,
//                         searchQuery
//                       });

                      if (isSearching) {
                        return (
                          <div className="space-y-2">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                                <div className="w-10 h-10 bg-muted rounded-full"></div>
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 bg-muted rounded w-1/4"></div>
                                  <div className="h-3 bg-muted rounded w-1/3"></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      if (searchResults && searchResults.length > 0) {
                        // // console.log('Rendering user list with', searchResults.length, 'results');
                        return (
                          <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-lg p-2">
                            {searchResults.map((user: User) => {
                              // // console.log('Rendering user:', user);
                              return (
                                <div
                                  key={user._id}
                                  className={`flex items-center space-x-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                                    selectedUser?._id === user._id ? 'bg-primary/10' : 'hover:bg-muted/50'
                                  }`}
                                  onClick={() => {
                                    // // console.log('Selecting user:', user);
                                    setSelectedUser(user);
                                    toast.success('User selected');
                                  }}
                                >
                                  <Avatar>
                                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                      {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <h3 className="font-semibold">{user.name}</h3>
                                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                      <div className="flex items-center space-x-1">
                                        <Mail className="w-3 h-3" />
                                        <span>{user.email}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Phone className="w-3 h-3" />
                                        <span>{formatPhoneNumber(user.phone_number, user.countryCode)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  {selectedUser?._id === user._id && (
                                    <div className="text-primary">
                                      <Check className="w-5 h-5" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      }

                      if (searchQuery && !isSearching) {
                        return (
                          <div className="text-center py-8 border rounded-lg">
                            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No users found</h3>
                            <p className="text-muted-foreground">Try a different search term.</p>
                          </div>
                        );
                      }

                      return null;
                    })()}
                  </div>
                ) : (
                  <form onSubmit={(e: FormEvent<HTMLFormElement>) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget as HTMLFormElement)
                    handleAddMember({
                      name: formData.get('name') as string,
                      email: formData.get('email') as string,
                      phone_number: formData.get('phone_number') as string,
                      countryCode: formData.get('countryCode') as string
                    })
                  }}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="countryCode">Country Code</Label>
                          <Input id="countryCode" name="countryCode" placeholder="+1" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone_number">Phone Number</Label>
                          <Input id="phone_number" name="phone_number" required />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Add New Member</Button>
                      </DialogFooter>
                    </div>
                  </form>
                )}
              </div>
              {addMode === 'existing' && (
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddExistingUser}
                    disabled={!selectedUser}
                  >
                    Add Selected User
                  </Button>
                </DialogFooter>
              )}
            </DialogContent>
          </Dialog>

          {/* Edit Member Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Member</DialogTitle>
                <DialogDescription>
                  Update member information and status.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault()
                handleEditMember()
              }}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Full Name</Label>
                    <Input 
                      id="edit-name" 
                      value={editFormData.name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setEditFormData({ ...editFormData, name: e.target.value })}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input 
                      id="edit-email" 
                      type="email" 
                      value={editFormData.email}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setEditFormData({ ...editFormData, email: e.target.value })}
                      required 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-countryCode">Country Code</Label>
                      <Input 
                        id="edit-countryCode" 
                        value={editFormData.countryCode}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEditFormData({ ...editFormData, countryCode: e.target.value })}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone_number">Phone Number</Label>
                      <Input 
                        id="edit-phone_number" 
                        value={editFormData.phone_number}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                        required 
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="edit-active"
                      checked={editFormData.isActive}
                      onCheckedChange={(checked: boolean) => setEditFormData({ ...editFormData, isActive: checked })}
                    />
                    <Label htmlFor="edit-active">Active Member</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Member Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Member</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this member? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                {selectedMember && (
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback className="bg-gradient-to-r from-red-500 to-pink-600 text-white">
                        {selectedMember.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{selectedMember.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  variant="destructive"
                  onClick={handleDeleteMember}
                >
                  Delete Member
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
