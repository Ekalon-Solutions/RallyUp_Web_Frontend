"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit, Trash2, Users, UserCheck, UserX } from "lucide-react"
import { toast } from "sonner"
import config from "@/lib/config"

interface StaffMember {
  _id: string
  name: string
  email: string
  phoneNumber: string
  countryCode: string
  role: 'admin' | 'volunteer'
  isActive: boolean
  createdAt: string
}

interface Club {
  _id: string
  name: string
}

interface StaffManagementModalProps {
  isOpen: boolean
  onClose: () => void
  club: Club | null
}

export default function StaffManagementModal({ isOpen, onClose, club }: StaffManagementModalProps) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [stats, setStats] = useState({
    totalAdmins: 0,
    totalVolunteers: 0,
    activeAdmins: 0,
    activeVolunteers: 0
  })
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    countryCode: "+1",
    role: "volunteer" as 'admin' | 'volunteer'
  })

  useEffect(() => {
    if (isOpen && club) {
      loadStaff()
      loadStats()
    }
  }, [isOpen, club])

  const loadStaff = async () => {
    if (!club) return

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${config.apiBaseUrl}/staff/club/${club._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStaff(data.staff || [])
      } else {
        toast.error("Failed to load staff")
      }
    } catch (error) {
      // console.error("Error loading staff:", error)
      toast.error("Error loading staff")
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!club) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${config.apiBaseUrl}/staff/club/${club._id}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      // console.error("Error loading stats:", error)
    }
  }

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!club) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${config.apiBaseUrl}/staff/club/${club._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Staff member created successfully!")
        setShowCreateForm(false)
        setFormData({
          name: "",
          email: "",
          phoneNumber: "",
          countryCode: "+1",
          role: "volunteer"
        })
        loadStaff()
        loadStats()
      } else {
        toast.error(data.message || "Failed to create staff member")
      }
    } catch (error) {
      // console.error("Create staff error:", error)
      toast.error("An error occurred")
    }
  }

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!club || !editingStaff) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${config.apiBaseUrl}/staff/club/${club._id}/${editingStaff._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Staff member updated successfully!")
        setEditingStaff(null)
        setFormData({
          name: "",
          email: "",
          phoneNumber: "",
          countryCode: "+1",
          role: "volunteer"
        })
        loadStaff()
        loadStats()
      } else {
        toast.error(data.message || "Failed to update staff member")
      }
    } catch (error) {
      // console.error("Update staff error:", error)
      toast.error("An error occurred")
    }
  }

  const handleDeleteStaff = async (staffId: string) => {
    if (!club) return

    if (!confirm("Are you sure you want to delete this staff member?")) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${config.apiBaseUrl}/staff/club/${club._id}/${staffId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast.success("Staff member deleted successfully!")
        loadStaff()
        loadStats()
      } else {
        toast.error("Failed to delete staff member")
      }
    } catch (error) {
      // console.error("Delete staff error:", error)
      toast.error("An error occurred")
    }
  }

  const handleEditStaff = (staffMember: StaffMember) => {
    setEditingStaff(staffMember)
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      phoneNumber: staffMember.phoneNumber,
      countryCode: staffMember.countryCode,
      role: staffMember.role
    })
  }

  const handleCancelEdit = () => {
    setEditingStaff(null)
    setFormData({
      name: "",
      email: "",
      phoneNumber: "",
      countryCode: "+1",
      role: "volunteer"
    })
  }

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Staff Management - {club?.name}
          </DialogTitle>
          <DialogDescription>
            Manage staff members for this club
          </DialogDescription>
        </DialogHeader>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAdmins}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Volunteers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVolunteers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeAdmins}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active Volunteers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeVolunteers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Create/Edit Form */}
        {(showCreateForm || editingStaff) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingStaff ? handleUpdateStaff : handleCreateStaff} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="countryCode">Country Code</Label>
                    <Input
                      id="countryCode"
                      value={formData.countryCode}
                      onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: 'admin' | 'volunteer') => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="volunteer">Volunteer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingStaff ? "Update Staff Member" : "Create Staff Member"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={editingStaff ? handleCancelEdit : () => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Staff List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Staff Members</h3>
            {!showCreateForm && !editingStaff && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Staff Member
              </Button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading staff...</p>
            </div>
          ) : staff.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Staff Members</h3>
                <p className="text-muted-foreground mb-4">
                  Add staff members to help manage this club
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Staff Member
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {staff.map((member) => (
                <Card key={member._id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{member.name}</h4>
                            <Badge className={getRoleColor(member.role)}>
                              {member.role}
                            </Badge>
                            <Badge className={getStatusColor(member.isActive)}>
                              {member.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.countryCode} {member.phoneNumber}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditStaff(member)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteStaff(member._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 