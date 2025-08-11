"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Building, Users, Calendar, Settings, Mail, Phone } from "lucide-react"
import { toast } from "sonner"
import StaffManagementModal from "@/components/modals/staff-management-modal"
import ClubManagementModal from "@/components/modals/club-management-modal"

interface Club {
  _id: string
  name: string
  description?: string
  contactEmail: string
  contactPhone: string
  status: 'active' | 'inactive' | 'suspended'
  superAdmin?: {
    _id: string
    name: string
    email: string
  }
  createdAt: string
}

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [showClubModal, setShowClubModal] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    superAdminEmail: "",
    superAdminPhone: "",
    superAdminCountryCode: "+1"
  })

  useEffect(() => {
    loadClubs()
  }, [])

  const loadClubs = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://3.111.169.32:5050/api/clubs', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setClubs(data.clubs || [])
      } else {
        toast.error("Failed to load clubs")
      }
    } catch (error) {
      toast.error("Failed to load clubs")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://3.111.169.32:5050/api/clubs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Club created successfully!")
        setShowCreateDialog(false)
        setFormData({
          name: "",
          description: "",
          contactEmail: "",
          contactPhone: "",
          superAdminEmail: "",
          superAdminPhone: "",
          superAdminCountryCode: "+1"
        })
        loadClubs()
      } else {
        toast.error(data.message || "Failed to create club")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsCreating(false)
    }
  }

  const handleManageStaff = (club: Club) => {
    setSelectedClub(club)
    setShowStaffModal(true)
  }

  const handleManageClub = (club: Club) => {
    setSelectedClub(club)
    setShowClubModal(true)
  }

  const handleClubUpdated = () => {
    loadClubs()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading clubs...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clubs Management</h1>
          <p className="text-muted-foreground">Manage all clubs and their super admins</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 w-4 h-4" />
              Create Club
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Club</DialogTitle>
              <DialogDescription>
                Create a new club and assign a super admin
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateClub} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Club Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  required
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Super Admin Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="superAdminEmail">Super Admin Email</Label>
                  <Input
                    id="superAdminEmail"
                    type="email"
                    value={formData.superAdminEmail}
                    onChange={(e) => setFormData({ ...formData, superAdminEmail: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="superAdminCountryCode">Country Code</Label>
                    <Input
                      id="superAdminCountryCode"
                      value={formData.superAdminCountryCode}
                      onChange={(e) => setFormData({ ...formData, superAdminCountryCode: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="superAdminPhone">Phone Number</Label>
                    <Input
                      id="superAdminPhone"
                      value={formData.superAdminPhone}
                      onChange={(e) => setFormData({ ...formData, superAdminPhone: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isCreating} className="flex-1">
                  {isCreating ? "Creating..." : "Create Club"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {clubs.map((club) => (
          <Card key={club._id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    {club.name}
                  </CardTitle>
                  <CardDescription>{club.description}</CardDescription>
                </div>
                <Badge className={getStatusColor(club.status)}>
                  {club.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4" />
                  <span>{club.contactEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4" />
                  <span>{club.contactPhone}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-2">Super Admin</h4>
                {club.superAdmin ? (
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{club.superAdmin.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{club.superAdmin.email}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No super admin assigned
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleManageClub(club)}
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Manage
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleManageStaff(club)}
                >
                  <Users className="w-4 h-4 mr-1" />
                  Staff
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {clubs.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Clubs Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first club to get started with RallyUp
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 w-4 h-4" />
              Create First Club
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Staff Management Modal */}
      <StaffManagementModal
        isOpen={showStaffModal}
        onClose={() => {
          setShowStaffModal(false)
          setSelectedClub(null)
        }}
        club={selectedClub}
      />

      {/* Club Management Modal */}
      <ClubManagementModal
        isOpen={showClubModal}
        onClose={() => {
          setShowClubModal(false)
          setSelectedClub(null)
        }}
        club={selectedClub}
        onClubUpdated={handleClubUpdated}
      />
    </div>
  )
} 