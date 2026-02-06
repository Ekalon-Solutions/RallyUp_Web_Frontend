"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, Settings, Users, Mail, Phone, Globe, MapPin, Save, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { getApiUrl, API_ENDPOINTS } from "@/lib/config"
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth"
import { auth } from "@/lib/firebase/config"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api"
import { formatDisplayDate } from "@/lib/utils"

declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}

interface Club {
  _id: string
  name: string
  description?: string
  contactEmail: string
  contactPhone: string
  website?: string
  status: 'active' | 'inactive' | 'suspended'
  address?: {
    street: string
    city: string
    state: string
    country: string
    zipCode: string
  }
  superAdmin?: {
    _id: string
    name: string
    email: string
  }
  createdAt: string
}

interface ClubManagementModalProps {
  isOpen: boolean
  onClose: () => void
  club: Club | null
  onClubUpdated?: () => void
}

export default function ClubManagementModal({ isOpen, onClose, club, onClubUpdated }: ClubManagementModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [resendCountdown, setResendCountdown] = useState(0)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    status: "active" as 'active' | 'inactive' | 'suspended',
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      zipCode: ""
    }
  })

  useEffect(() => {
    if (club) {
      setFormData({
        name: club.name || "",
        description: club.description || "",
        contactEmail: club.contactEmail || "",
        contactPhone: club.contactPhone || "",
        website: club.website || "",
        status: club.status || "active",
        address: {
          street: club.address?.street || "",
          city: club.address?.city || "",
          state: club.address?.state || "",
          country: club.address?.country || "",
          zipCode: club.address?.zipCode || ""
        }
      })
    }
  }, [club])

  const handleUpdateClub = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!club) return

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl(API_ENDPOINTS.clubs.getById(club._id)), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Club updated successfully!")
        setIsEditing(false)
        onClubUpdated?.()
      } else {
        toast.error(data.message || "Failed to update club")
      }
    } catch (error) {
      // console.error("Update club error:", error)
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

  const handleSendOTP = async () => {
    if (!user || !club) return

    const phoneNumber = (user as any).phoneNumber || (user as any).phoneNumber
    const countryCode = (user as any).countryCode || '+1'

    if (!phoneNumber || phoneNumber.trim() === '') {
      const userType = (user as any).role === 'system_owner' ? 'system owner' : 'admin'
      toast.error(`Phone number not found in your ${userType} profile. Please update your profile with a phone number to delete clubs.`)
      return
    }

    if (!countryCode || countryCode.trim() === '') {
      toast.error("Country code not found. Please update your profile with a valid country code.")
      return
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber}`

    try {
      const recaptchaVerifier = setupRecaptcha(fullPhoneNumber)
      const confirmationResult = await signInWithPhoneNumber(auth, fullPhoneNumber, recaptchaVerifier)

      window.confirmationResult = confirmationResult
      toast.success(`OTP sent to ${fullPhoneNumber}`)
      setOtpSent(true)
      setResendCountdown(10)
    } catch (error) {
      toast.error("Failed to send OTP. Please try again.")
    }
  }

  const handleDeleteClubWithOTP = async () => {
    if (!club || !otp) {
      toast.error("Please enter the OTP")
      return
    }

    try {
      setLoading(true)
      const confirmationResult = window.confirmationResult
      const firebaseResult = await confirmationResult.confirm(otp)

      if (firebaseResult.user) {
        const response = await apiClient.deleteClub(club._id)

        if (response.success) {
          toast.success("Club deleted successfully!")
          setIsDeleteDialogOpen(false)
          setOtpSent(false)
          setOtp("")
          onClose()
          onClubUpdated?.()
        } else {
          toast.error(response.error || "Failed to delete club")
        }
      }
    } catch (error) {
      toast.error("Invalid OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClub = () => {
    if (!club) return
    setIsDeleteDialogOpen(true)
    handleSendOTP()
  }

  const handleResendOTP = () => {
    handleSendOTP()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!club) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            {isEditing ? "Edit Club" : "Club Management"} - {club.name}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Update club information and settings" : "View and manage club details"}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Club Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Club Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{club.name}</h3>
                      <p className="text-sm text-muted-foreground">{club.description}</p>
                    </div>
                    <Badge className={getStatusColor(club.status)}>
                      {club.status}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4" />
                      <span>{club.contactEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4" />
                      <span>{club.contactPhone}</span>
                    </div>
                    {club.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4" />
                        <a href={club.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {club.website}
                        </a>
                      </div>
                    )}
                  </div>

                  {club.address && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Address</h4>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {club.address.street}, {club.address.city}, {club.address.state} {club.address.zipCode}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Super Admin Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Super Admin
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {club.superAdmin ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">{club.superAdmin.name}</span>
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
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => setIsEditing(!isEditing)}
                variant={isEditing ? "outline" : "default"}
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditing ? "Cancel Edit" : "Edit Club"}
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteClub}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Club
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {isEditing ? (
              <form onSubmit={handleUpdateClub} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
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
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'active' | 'inactive' | 'suspended') => 
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4">Address</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        value={formData.address.street}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          address: { ...formData.address, street: e.target.value }
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.address.city}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          address: { ...formData.address, city: e.target.value }
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={formData.address.state}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          address: { ...formData.address, state: e.target.value }
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={formData.address.country}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          address: { ...formData.address, country: e.target.value }
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                      <Input
                        id="zipCode"
                        value={formData.address.zipCode}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          address: { ...formData.address, zipCode: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8">
                <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Edit Mode Required</h3>
                <p className="text-muted-foreground mb-4">
                  Click "Edit Club" to modify club details
                </p>
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Club
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Club Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">Club Status</h4>
                      <p className="text-sm text-muted-foreground">Current status: {club.status}</p>
                    </div>
                    <Badge className={getStatusColor(club.status)}>
                      {club.status}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">Created Date</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDisplayDate(club.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">Club ID</h4>
                      <p className="text-sm text-muted-foreground font-mono">{club._id}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Club</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this club? This action cannot be undone. Please verify with OTP.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {otpSent ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                  />
                </div>
                {resendCountdown > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Resend OTP in {resendCountdown} seconds
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResendOTP}
                    className="w-full"
                  >
                    Resend OTP
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  An OTP will be sent to your registered phone number to confirm deletion.
                </p>
                <Button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full"
                >
                  Send OTP
                </Button>
              </div>
            )}
          </div>
          <div id="recaptcha-container-club-delete"></div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setOtpSent(false)
                setOtp("")
              }}
            >
              Cancel
            </Button>
            {otpSent && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteClubWithOTP}
                disabled={loading || !otp}
              >
                {loading ? "Deleting..." : "Delete Club"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
} 