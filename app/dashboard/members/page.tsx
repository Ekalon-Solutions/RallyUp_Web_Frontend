"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Search, MoreHorizontal, Edit, Trash2, Eye, Plus, Filter } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { apiClient, User } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

export default function MembersPage() {
  const { isAdmin } = useAuth()
  const [members, setMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    verifiedMembers: 0,
    newMembersThisMonth: 0,
    inactiveMembers: 0,
    unverifiedMembers: 0
  })

  // Form states for add/edit member
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<User | null>(null)
  const [memberForm, setMemberForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    countryCode: "+1",
    role: "member",
    isActive: true,
    isPhoneVerified: false
  })

  useEffect(() => {
    fetchMembers()
    fetchStats()
  }, [currentPage, searchTerm, statusFilter])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      console.log('Fetching members with params:', {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter === "all" ? undefined : (statusFilter as "active" | "inactive")
      })
      
      const response = await apiClient.getMembers({
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter === "all" ? undefined : (statusFilter as "active" | "inactive")
      })

      console.log('Members response:', response)

      if (response.success && response.data) {
        setMembers(response.data.members)
        setTotalPages(response.data.pagination.pages)
      } else {
        console.error("Failed to fetch members:", response.error)
        toast.error("Failed to fetch members")
      }
    } catch (error) {
      console.error("Error fetching members:", error)
      toast.error("Error fetching members")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await apiClient.getMemberStats()
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // For now, we'll use the user registration endpoint
      // In a real app, you might have a separate admin endpoint for adding members
      const response = await apiClient.userRegister({
        name: memberForm.name,
        email: memberForm.email,
        password: "temporaryPassword123", // You might want to generate this
        phoneNumber: memberForm.phoneNumber,
        countryCode: memberForm.countryCode
      })

      if (response.success) {
        toast.success("Member added successfully")
        setIsAddDialogOpen(false)
        resetForm()
        fetchMembers()
        fetchStats()
      } else {
        toast.error(response.error || "Failed to add member")
      }
    } catch (error) {
      console.error("Error adding member:", error)
      toast.error("Error adding member")
    }
  }

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingMember) return

    try {
      const response = await apiClient.updateMember(editingMember._id, {
        name: memberForm.name,
        email: memberForm.email,
        phoneNumber: memberForm.phoneNumber,
        countryCode: memberForm.countryCode,
        role: memberForm.role,
        isActive: memberForm.isActive,
        isPhoneVerified: memberForm.isPhoneVerified
      })

      if (response.success) {
        toast.success("Member updated successfully")
        setEditingMember(null)
        resetForm()
        fetchMembers()
        fetchStats()
      } else {
        toast.error(response.error || "Failed to update member")
      }
    } catch (error) {
      console.error("Error updating member:", error)
      toast.error("Error updating member")
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to delete this member?")) return

    try {
      const response = await apiClient.deleteMember(memberId)
      if (response.success) {
        toast.success("Member deleted successfully")
        fetchMembers()
        fetchStats()
      } else {
        toast.error(response.error || "Failed to delete member")
      }
    } catch (error) {
      console.error("Error deleting member:", error)
      toast.error("Error deleting member")
    }
  }

  const resetForm = () => {
    setMemberForm({
      name: "",
      email: "",
      phoneNumber: "",
      countryCode: "+1",
      role: "member",
      isActive: true,
      isPhoneVerified: false
    })
  }

  const openEditDialog = (member: User) => {
    setEditingMember(member)
    setMemberForm({
      name: member.name,
      email: member.email,
      phoneNumber: member.phoneNumber,
      countryCode: member.countryCode,
      role: member.role,
      isActive: member.isActive || true,
      isPhoneVerified: member.isPhoneVerified
    })
  }

  const statsCards = [
    { title: "Total Members", value: stats.totalMembers, color: "text-blue-600" },
    { title: "Active Members", value: stats.activeMembers, color: "text-green-600" },
    { title: "Verified Members", value: stats.verifiedMembers, color: "text-purple-600" },
    { title: "New This Month", value: stats.newMembersThisMonth, color: "text-orange-600" },
  ]

  return (
    <ProtectedRoute requireAdmin={true}>
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Members Management</h1>
              <p className="text-muted-foreground">Manage your supporter group members</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Member</DialogTitle>
                  <DialogDescription>Add a new member to your supporter group</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={memberForm.name}
                      onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={memberForm.email}
                      onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={memberForm.phoneNumber}
                      onChange={(e) => setMemberForm({ ...memberForm, phoneNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={memberForm.role} onValueChange={(value) => setMemberForm({ ...memberForm, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={memberForm.isActive}
                      onChange={(e) => setMemberForm({ ...memberForm, isActive: e.target.checked })}
                    />
                    <Label htmlFor="isActive">Active Member</Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Member</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
        </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsCards.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Users className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
          ))}
        </div>

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>Search and filter your members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading members...
                        </TableCell>
                      </TableRow>
                    ) : members.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No members found
                        </TableCell>
                      </TableRow>
                    ) : (
                      members.map((member) => (
                        <TableRow key={member._id}>
                          <TableCell className="font-medium">{member.name}</TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>{member.countryCode} {member.phoneNumber}</TableCell>
                      <TableCell>
                            <Badge variant={member.role === "admin" ? "destructive" : "secondary"}>
                              {member.role}
                            </Badge>
                      </TableCell>
                      <TableCell>
                            <Badge variant={member.isActive ? "default" : "secondary"}>
                              {member.isActive ? "Active" : "Inactive"}
                            </Badge>
                      </TableCell>
                      <TableCell>
                            <Badge variant={member.isPhoneVerified ? "default" : "outline"}>
                              {member.isPhoneVerified ? "Verified" : "Unverified"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(member)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteMember(member._id)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Member Dialog */}
          <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Member</DialogTitle>
                <DialogDescription>Update member information</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateMember} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={memberForm.name}
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={memberForm.email}
                    onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    value={memberForm.phoneNumber}
                    onChange={(e) => setMemberForm({ ...memberForm, phoneNumber: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select value={memberForm.role} onValueChange={(value) => setMemberForm({ ...memberForm, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-isActive"
                    checked={memberForm.isActive}
                    onChange={(e) => setMemberForm({ ...memberForm, isActive: e.target.checked })}
                  />
                  <Label htmlFor="edit-isActive">Active Member</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-isPhoneVerified"
                    checked={memberForm.isPhoneVerified}
                    onChange={(e) => setMemberForm({ ...memberForm, isPhoneVerified: e.target.checked })}
                  />
                  <Label htmlFor="edit-isPhoneVerified">Phone Verified</Label>
          </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setEditingMember(null)}>
                    Cancel
                </Button>
                  <Button type="submit">Update Member</Button>
          </div>
              </form>
            </DialogContent>
          </Dialog>
      </div>
    </DashboardLayout>
    </ProtectedRoute>
  )
}
