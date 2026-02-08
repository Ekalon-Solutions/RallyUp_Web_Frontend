"use client"

import { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { apiClient, User } from '@/lib/api'
import { toast } from 'sonner'
import { triggerBlobDownload } from '@/lib/utils'
import { useRequiredClubId } from '@/hooks/useRequiredClubId'
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
import { formatDisplayDate } from '@/lib/utils'
import { AddMemberModal } from '@/components/modals/add-member-modal'
import ImportMembersModal from '@/components/modals/import-members-modal'
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
import { Award } from 'lucide-react'
import AdjustPointsModal from '@/components/modals/adjust-points-modal'
import { Checkbox } from '@/components/ui/checkbox'

interface Member {
  _id: string
  name: string
  email: string
  phoneNumber: string
  countryCode: string
  isPhoneVerified: boolean
  role?: string
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
  const clubId = useRequiredClubId()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const [metadata, setMetadata] = useState({ total: 0, active: 0, verified: 0, thisMonth: 0 })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false)
  const [isAdjustPointsOpen, setIsAdjustPointsOpen] = useState(false)
  const [adjustMemberId, setAdjustMemberId] = useState<string | null>(null)
  const [adjustMemberClub, setAdjustMemberClub] = useState<string | null>(null)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set())
  const [isSelectAll, setIsSelectAll] = useState(false)
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [addMode, setAddMode] = useState<'new' | 'existing'>('new')
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    countryCode: '',
    isActive: true
  })

  useEffect(() => {
    fetchMembers()
  }, [currentPage, searchTerm, statusFilter, verificationFilter, clubId])
   

  const fetchMembers = async () => {
    try {
      setLoading(true)
      if (!clubId) {
        setMembers([])
        setPagination({ page: 1, limit: 20, total: 0, pages: 0 })
        setMetadata({ total: 0, active: 0, verified: 0, thisMonth: 0 })
        setLoading(false)
        return
      }
      const response = await apiClient.getClubMemberDirectory({
        search: searchTerm || undefined,
        page: currentPage,
        limit: pagination.limit,
        status: statusFilter === 'all' ? undefined : statusFilter,
        verification: verificationFilter === 'all' ? undefined : verificationFilter,
        clubId
      })

      if (response.success && response.data) {
        const nextMembers = (response.data.members as unknown as Member[]) || []
        setMembers(nextMembers)

        setSelectedMemberIds(new Set())
        setIsSelectAll(false)

        const respPagination = response.data.pagination || { page: currentPage, limit: pagination.limit, total: 0, pages: 0 }
        const safeLimit = respPagination.limit || pagination.limit
        const safeTotal = typeof respPagination.total === 'number' ? respPagination.total : 0
        const safePages =
          typeof respPagination.pages === 'number'
            ? respPagination.pages
            : (safeLimit > 0 ? Math.ceil(safeTotal / safeLimit) : 0)

        setPagination({
          page: respPagination.page || 1,
          limit: safeLimit,
          total: safeTotal,
          pages: safePages
        })

        setCurrentPage(respPagination.page || 1)
        setMetadata(response.data.metadata || { total: 0, active: 0, verified: 0, thisMonth: 0 })
      } else {
        toast.error(response.error || 'Failed to load members')
      }
    } catch (error) {
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

  const handleVerificationFilter = (value: string): void => {
    setVerificationFilter(value as 'all' | 'verified' | 'unverified')
    setCurrentPage(1)
  }

  const handlePageChange = (page: number): void => {
    setCurrentPage(page)
  }

  const getVisiblePages = (totalPages: number, current: number, maxVisible = 7) => {
    if (totalPages <= 1) return [1]
    if (totalPages <= maxVisible) return Array.from({ length: totalPages }, (_, i) => i + 1)

    const pages: (number | string)[] = []
    pages.push(1)

    let start = Math.max(2, current - 2)
    let end = Math.min(totalPages - 1, current + 2)

    if (current <= 3) {
      start = 2
      end = Math.min(5, totalPages - 1)
    }

    if (current >= totalPages - 2) {
      start = Math.max(2, totalPages - 4)
      end = totalPages - 1
    }

    if (start > 2) pages.push('left-ellipsis')
    for (let p = start; p <= end; p++) pages.push(p)
    if (end < totalPages - 1) pages.push('right-ellipsis')

    pages.push(totalPages)
    return pages
  }

  const pagesToShow = getVisiblePages(pagination.pages, currentPage)

  const formatPhoneNumber = (phoneNumber: string, countryCode: string): string => {
    return `${countryCode} ${phoneNumber}`
  }

  const getStatusColor = (isActive: boolean): string => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const getVerificationColor = (isVerified: boolean): string => {
    return isVerified ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
  }

  const handleUserSearch = async (query: string): Promise<void> => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiClient.searchUsers(query);

      if (response.success) {
        const users = response.data || [];
        setSearchResults(users);

        if (users.length === 0) {
          toast.info('No users found matching your search');
        } else {
          toast.success(`Found ${users.length} user${users.length === 1 ? '' : 's'}`);
        }
      } else {
        toast.error(response.error || 'Failed to search users');
        setSearchResults([]);
      }
    } catch (error) {
      toast.error('Failed to search users');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  const handleAddExistingUser = async (): Promise<void> => {
    if (!selectedUser || !clubId) {
      toast.error(selectedUser ? 'Please select a club first' : 'Please select a user to add');
      return;
    }
    try {
      const response = await apiClient.addMemberWithDefaultPlan({
        user_id: selectedUser._id,
        club_id: clubId
      });
      if (response.success) {
        toast.success('Member added successfully');
        setIsAddDialogOpen(false);
        fetchMembers();
        setSelectedUser(null);
        setSearchQuery('');
        setSearchResults([]);
        setAddMode('new');
      } else {
        toast.error(response.error || 'Failed to add member');
      }
    } catch (error) {
      toast.error('Failed to add member');
    }
  }

  const handleAddMember = async (data: { name: string; email: string; phoneNumber: string; countryCode: string }): Promise<void> => {
    try {
      if (!clubId) {
        toast.error('Please select a club first')
        return
      }
      const response = await apiClient.adminAddMember({
        ...data,
        club_id: clubId
      })
      if (response.success) {
        toast.success('Member added successfully')
        setIsAddDialogOpen(false)
        fetchMembers()
      } else {
        toast.error(response.error || 'Failed to add member')
      }
    } catch (error) {
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
      toast.error('Failed to delete member')
    }
  }

  const openViewDialog = (member: Member) => {
    setSelectedMember(member)
    setIsViewDialogOpen(true)
  }

  const openEditDialog = (member: Member) => {
    setSelectedMember(member)
    setEditFormData({
      name: member.name,
      email: member.email,
      phoneNumber: member.phoneNumber,
      countryCode: member.countryCode,
      isActive: member.isActive
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (member: Member) => {
    setSelectedMember(member)
    setIsDeleteDialogOpen(true)
  }

  const handleSelectMember = (memberId: string) => {
    const newSelected = new Set(selectedMemberIds)
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId)
    } else {
      newSelected.add(memberId)
    }
    setSelectedMemberIds(newSelected)
    setIsSelectAll(newSelected.size === members.length && members.length > 0)
  }

  const handleSelectAll = () => {
    if (isSelectAll) {
      setSelectedMemberIds(new Set())
      setIsSelectAll(false)
    } else {
      const allIds = new Set(members.map(m => m._id))
      setSelectedMemberIds(allIds)
      setIsSelectAll(true)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedMemberIds.size === 0) return

    try {
      const response = await apiClient.deleteMembersBulk(Array.from(selectedMemberIds))

      if (response.success) {
        toast.success(`Successfully deleted ${response.data?.deletedCount || selectedMemberIds.size} member(s)`)
        setIsBulkDeleteDialogOpen(false)
        setSelectedMemberIds(new Set())
        setIsSelectAll(false)
        fetchMembers()
      } else {
        toast.error(response.error || 'Failed to delete members')
      }
    } catch (error) {
      toast.error('Failed to delete members')
    }
  }

  const openBulkDeleteDialog = () => {
    if (selectedMemberIds.size === 0) {
      toast.error('Please select at least one member to delete')
      return
    }
    setIsBulkDeleteDialogOpen(true)
  }

  const openDeleteAllDialog = () => {
    if ((metadata?.total || 0) === 0) {
      toast.error('No members to delete')
      return
    }
    setIsDeleteAllDialogOpen(true)
  }

  const handleDeleteAllMembers = async () => {
    try {
      const response = await apiClient.deleteAllClubMembers(clubId ?? undefined)

      if (response.success) {
        const deletedCount = response.data?.deletedCount ?? 0
        toast.success(`Successfully deleted ${deletedCount} member(s)`)
        setIsDeleteAllDialogOpen(false)
        setSelectedMemberIds(new Set())
        setIsSelectAll(false)
        setCurrentPage(1)
        fetchMembers()
      } else {
        toast.error(response.error || 'Failed to delete all members')
      }
    } catch (error) {
      toast.error('Failed to delete all members')
    }
  }

  const exportMembers = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Club', 'Membership Plan', 'Status', 'Joined Date'].join(','),
      ...members.map((member: Member) => [
        member.name,
        member.email,
        formatPhoneNumber(member.phoneNumber, member.countryCode),
        member.club?.name || 'N/A',
        member.membershipPlan?.name || 'N/A',
        member.isActive ? 'Active' : 'Inactive',
        formatDisplayDate(member.createdAt)
      ].join(','))
    ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const filename = `members-${new Date().toISOString().split('T')[0]}.csv`
  triggerBlobDownload(blob, filename)
  toast.success('Members exported successfully!')
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Member Directory</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Manage and view all club members</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'system_owner') && (metadata?.total || 0) > 0 && (
                <Button variant="destructive" onClick={openDeleteAllDialog} className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All Members ({metadata.total})
                </Button>
              )}
              {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'system_owner') && selectedMemberIds.size > 0 && (
                <Button variant="destructive" onClick={openBulkDeleteDialog} className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Members ({selectedMemberIds.size})
                </Button>
              )}
              <Button variant="outline" onClick={exportMembers} className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <AddMemberModal 
                clubId={clubId}
                trigger={
                  <Button className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                }
                onMemberAdded={() => {
                  fetchMembers()
                  toast.success("Member added successfully!")
                }}
              />
              {/* Bulk import modal */}
              <ImportMembersModal
                clubId={clubId}
                trigger={
                  <Button className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Import Members in Bulk
                  </Button>
                }
                onImported={() => fetchMembers()}
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
                <div className="text-2xl font-bold">{metadata.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                <Shield className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metadata.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verified Members</CardTitle>
                <Mail className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{metadata.verified}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <Calendar className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {metadata.thisMonth}
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
                <div className="w-full sm:w-56">
                  <Select value={verificationFilter} onValueChange={handleVerificationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by verification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All (Verified + Unverified)</SelectItem>
                      <SelectItem value="verified">Verified Only</SelectItem>
                      <SelectItem value="unverified">Unverified Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 text-sm text-muted-foreground">
                <div>
                  {loading
                    ? 'Loading results...'
                    : members.length === 0
                    ? 'Showing 0 results'
                    : `Showing ${(currentPage - 1) * pagination.limit + 1}-${(currentPage - 1) * pagination.limit + members.length} of ${pagination.total} results`}
                </div>
                {(searchTerm || statusFilter !== 'all' || verificationFilter !== 'all') && (
                  <div>
                    Total in directory: {metadata.total}
                  </div>
                )}
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
                  {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'system_owner') && members.length > 0 && (
                    <div className="flex items-center space-x-4 p-4 border-b bg-muted/30 rounded-t-lg">
                      <Checkbox
                        checked={isSelectAll}
                        onCheckedChange={handleSelectAll}
                        className="data-[state=checked]:bg-primary"
                      />
                      <Label className="text-sm font-semibold cursor-pointer" onClick={handleSelectAll}>
                        Select all on this page ({members.length})
                      </Label>
                    </div>
                  )}
                  {members.map((member: Member, idx: number) => (
                    <div key={member._id + String(idx)} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'system_owner') && (
                          <Checkbox
                            checked={selectedMemberIds.has(member._id)}
                            onCheckedChange={() => handleSelectMember(member._id)}
                            className="data-[state=checked]:bg-primary"
                          />
                        )}
                        <Avatar className="flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                            {member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold break-words">{member.name}</h3>
                            <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(member.isActive)}`}>
                              {member.isActive ? 'Active' : 'Inactive'}
                            </div>
                            <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getVerificationColor(member.isPhoneVerified)}`}>
                              {member.isPhoneVerified ? 'Verified' : 'Unverified'}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground mt-1">
                            {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'system_owner') && (
                              <>
                                <div className="flex items-center space-x-1">
                                  <Mail className="w-3 h-3 flex-shrink-0" />
                                  <span className="break-all">{member.email}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Phone className="w-3 h-3 flex-shrink-0" />
                                  <span className="break-words">{formatPhoneNumber(member.phoneNumber, member.countryCode)}</span>
                                </div>
                              </>
                            )}
                            {member.club && (
                              <div className="flex items-center space-x-1">
                                <Building2 className="w-3 h-3 flex-shrink-0" />
                                <span className="break-words">{member.club.name}</span>
                              </div>
                            )}
                          </div>
                          {member.membershipPlan && (
                            <div className="text-xs text-muted-foreground mt-1 break-words">
                              Plan: {member.membershipPlan.name} ({member.membershipPlan.price} {member.membershipPlan.currency})
                            </div>
                          )}
                        </div>
                      </div>
                      {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'system_owner') && (
                        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                          <Button variant="ghost" size="sm" onClick={() => openViewDialog(member)} className="flex-1 sm:flex-initial" title="View details">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(member)} className="flex-1 sm:flex-initial">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-1 sm:flex-initial"
                            onClick={() => openDeleteDialog(member)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAdjustMemberId(member._id)
                              const primaryClub = (user as any)?.clubs?.[0]
                              setAdjustMemberClub(primaryClub?._id ?? primaryClub ?? clubId ?? null)
                              setIsAdjustPointsOpen(true)
                            }}
                            className="flex-1 sm:flex-initial"
                          >
                            <Award className="w-4 h-4" />
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
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {pagesToShow.map((p) => {
                        if (typeof p === 'number') {
                          return (
                            <PaginationItem key={`bottom-page-${p}`}>
                              <PaginationLink
                                onClick={() => handlePageChange(p)}
                                isActive={currentPage === p}
                                className="cursor-pointer"
                              >
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        }

                        return (
                          <PaginationItem key={`bottom-${p}`}>
                            <span className="px-3 py-2 text-muted-foreground select-none">...</span>
                          </PaginationItem>
                        )
                      })}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(Math.min(pagination.pages, currentPage + 1))}
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
            <DialogContent className="w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
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
                        return (
                          <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-lg p-2">
                            {searchResults.map((user: User) => {
                              return (
                                <div
                                  key={user._id}
                                  className={`flex items-center space-x-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                                    selectedUser?._id === user._id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                                  }`}
                                  onClick={() => {
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
                                        <span>{formatPhoneNumber(user.phoneNumber, user.countryCode)}</span>
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
                      phoneNumber: formData.get('phoneNumber') as string,
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="countryCode">Country Code</Label>
                          <Input id="countryCode" name="countryCode" placeholder="+1" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phoneNumber">Phone Number</Label>
                          <Input id="phoneNumber" name="phoneNumber" required />
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

          {/* View Member Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="w-[95vw] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Member Details</DialogTitle>
                <DialogDescription>
                  View member information and membership plan.
                </DialogDescription>
              </DialogHeader>
              {selectedMember && (
                <div className="space-y-4 py-4">
                  <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                    <Avatar className="h-14 w-14 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-bold">
                        {selectedMember.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg break-words">{selectedMember.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge className={getStatusColor(selectedMember.isActive)}>
                          {selectedMember.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge className={getVerificationColor(selectedMember.isPhoneVerified)}>
                          {selectedMember.isPhoneVerified ? 'Verified' : 'Unverified'}
                        </Badge>
                        {selectedMember.role && (
                          <Badge variant="outline">{selectedMember.role}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="break-all">{selectedMember.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span>{formatPhoneNumber(selectedMember.phoneNumber, selectedMember.countryCode)}</span>
                    </div>
                    {selectedMember.club && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span>{selectedMember.club.name}</span>
                      </div>
                    )}
                    {selectedMember.createdAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span>Joined {formatDisplayDate(selectedMember.createdAt)}</span>
                      </div>
                    )}
                  </div>
                  {selectedMember.membershipPlan && (
                    <div className="rounded-lg border p-4 space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Membership Plan
                      </h4>
                      <div className="text-sm space-y-1">
                        <p className="font-medium">{selectedMember.membershipPlan.name}</p>
                        {selectedMember.membershipPlan.description && (
                          <p className="text-muted-foreground">{selectedMember.membershipPlan.description}</p>
                        )}
                        <p className="text-muted-foreground">
                          {selectedMember.membershipPlan.price} {selectedMember.membershipPlan.currency}
                          {selectedMember.membershipPlan.duration
                            ? ` / ${selectedMember.membershipPlan.duration} day${selectedMember.membershipPlan.duration !== 1 ? 's' : ''}`
                            : ''}
                        </p>
                        {selectedMember.membershipExpiry && (
                          <p className="text-muted-foreground pt-1">
                            Expires: {formatDisplayDate(selectedMember.membershipExpiry)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {!selectedMember.membershipPlan && (
                    <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                      No membership plan assigned
                    </div>
                  )}
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                      Close
                    </Button>
                    <Button type="button" onClick={() => { setIsViewDialogOpen(false); openEditDialog(selectedMember); }}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Member
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <AdjustPointsModal
            isOpen={isAdjustPointsOpen}
            onClose={() => {
              setIsAdjustPointsOpen(false)
              setAdjustMemberId(null)
              setAdjustMemberClub(null)
            }}
            memberId={adjustMemberId}
            clubId={adjustMemberClub}
            onSuccess={() => fetchMembers()}
          />

          {/* Edit Member Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
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
                  {selectedMember && (
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                      <h4 className="text-sm font-semibold text-muted-foreground">Member details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge className={getStatusColor(selectedMember.isActive)}>
                            {selectedMember.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Verification:</span>
                          <Badge className={getVerificationColor(selectedMember.isPhoneVerified)}>
                            {selectedMember.isPhoneVerified ? 'Verified' : 'Unverified'}
                          </Badge>
                        </div>
                        {selectedMember.membershipPlan && (
                          <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
                            <span className="text-muted-foreground">Plan:</span>
                            <span className="font-medium">{selectedMember.membershipPlan.name}</span>
                            <span className="text-muted-foreground">
                              ({selectedMember.membershipPlan.price} {selectedMember.membershipPlan.currency})
                            </span>
                            {selectedMember.membershipExpiry && (
                              <span className="text-muted-foreground">
                                · Expires {formatDisplayDate(selectedMember.membershipExpiry)}
                              </span>
                            )}
                          </div>
                        )}
                        {selectedMember.createdAt && (
                          <div className="sm:col-span-2 flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            Joined {formatDisplayDate(selectedMember.createdAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <Label htmlFor="edit-phoneNumber">Phone Number</Label>
                      <Input 
                        id="edit-phoneNumber" 
                        value={editFormData.phoneNumber}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
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

          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="w-[95vw] sm:w-full max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-destructive">Delete Member</DialogTitle>
                <DialogDescription className="text-base pt-2">
                  This action cannot be undone. This will permanently delete the member from your club.
                </DialogDescription>
              </DialogHeader>
              <div className="py-6">
                {selectedMember && (
                  <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-lg font-bold">
                        {selectedMember.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base break-words">{selectedMember.name}</h3>
                      <p className="text-sm text-muted-foreground break-all">{selectedMember.email}</p>
                      {selectedMember.phoneNumber && (
                        <p className="text-sm text-muted-foreground">{formatPhoneNumber(selectedMember.phoneNumber, selectedMember.countryCode)}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 sm:flex-initial">
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  variant="destructive"
                  onClick={handleDeleteMember}
                  className="flex-1 sm:flex-initial shadow-md hover:shadow-lg"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Member
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
            <DialogContent className="w-[95vw] sm:w-full max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-destructive">Delete All Members</DialogTitle>
                <DialogDescription className="text-base pt-2">
                  This action cannot be undone. This will permanently delete all members from your club directory.
                </DialogDescription>
              </DialogHeader>
              <div className="py-6">
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                        <Trash2 className="w-6 h-6 text-destructive" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base text-destructive">
                        {metadata.total} Member{metadata.total !== 1 ? 's' : ''} Will Be Deleted
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        All members currently in your directory will be permanently deleted.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setIsDeleteAllDialogOpen(false)} className="flex-1 sm:flex-initial">
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteAllMembers}
                  className="flex-1 sm:flex-initial shadow-md hover:shadow-lg"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All Members
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
            <DialogContent className="w-[95vw] sm:w-full max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-destructive">Delete Members</DialogTitle>
                <DialogDescription className="text-base pt-2">
                  This action cannot be undone. This will permanently delete {selectedMemberIds.size} member{selectedMemberIds.size !== 1 ? 's' : ''} from your club.
                </DialogDescription>
              </DialogHeader>
              <div className="py-6">
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                        <Trash2 className="w-6 h-6 text-destructive" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base text-destructive">
                        {selectedMemberIds.size} Member{selectedMemberIds.size !== 1 ? 's' : ''} Selected
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        All selected members will be permanently removed from your club directory.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)} className="flex-1 sm:flex-initial">
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  variant="destructive"
                  onClick={handleBulkDelete}
                  className="flex-1 sm:flex-initial shadow-md hover:shadow-lg"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete {selectedMemberIds.size} Member{selectedMemberIds.size !== 1 ? 's' : ''}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
