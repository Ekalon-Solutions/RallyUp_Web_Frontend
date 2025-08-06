"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { User, Mail, Phone, Shield, Save, Calendar, CheckCircle, XCircle, Edit, Building2, MapPin, Globe, Users, Search, Plus, ArrowRight } from "lucide-react"
import { MembershipRenewal } from "@/components/membership-renewal"
import { useRouter } from "next/navigation"

export default function UserProfilePage() {
  const { user, updateProfile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    countryCode: "+1"
  })

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        countryCode: user.countryCode || "+1"
      })
    }
  }, [user])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updateProfile({
        name: profileForm.name,
        email: profileForm.email,
        phoneNumber: profileForm.phoneNumber,
        countryCode: profileForm.countryCode
      })

      if (result.success) {
        toast.success("Profile updated successfully")
        setIsEditing(false)
      } else {
        toast.error(result.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Error updating profile")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleDiscoverClubs = () => {
    router.push('/clubs')
  }

  if (!user) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading user profile...</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Profile</h1>
              <p className="text-muted-foreground">Manage your personal information and account settings</p>
            </div>
            <Button 
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
            >
              <Edit className="w-4 h-4 mr-2" />
              {isEditing ? "Cancel Edit" : "Edit Profile"}
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Profile Information */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Your basic profile information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={profileForm.phoneNumber}
                            onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="countryCode">Country Code</Label>
                          <Input
                            id="countryCode"
                            value={profileForm.countryCode}
                            onChange={(e) => setProfileForm({ ...profileForm, countryCode: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={loading}>
                          {loading ? "Saving..." : "Save Changes"}
                          <Save className="w-4 h-4 ml-2" />
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
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                          <p className="text-sm">{user.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                          <p className="text-sm">{user.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                          <p className="text-sm">{user.countryCode} {user.phoneNumber}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Phone Verification</Label>
                          <div className="flex items-center gap-2">
                            {user.isPhoneVerified ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <Badge variant={user.isPhoneVerified ? "default" : "secondary"}>
                              {user.isPhoneVerified ? "Verified" : "Not Verified"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Club Discovery */}
              {!user.club && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Join a Club
                    </CardTitle>
                    <CardDescription>
                      Discover and join supporter clubs to connect with fellow fans
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Not a member of any club yet?</h3>
                      <p className="text-muted-foreground mb-6">
                        Join a supporter club to access exclusive events, news, and connect with fellow fans.
                      </p>
                      <Button onClick={handleDiscoverClubs} className="w-full sm:w-auto">
                        <Search className="w-4 h-4 mr-2" />
                        Discover Clubs
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Club Information */}
            {user.club && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Club Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Club Name</Label>
                    <p className="text-sm font-medium">{user.club.name}</p>
                  </div>
                  {user.club.description && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                      <p className="text-sm">{user.club.description}</p>
                    </div>
                  )}
                  {user.club.website && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Website</Label>
                      <a 
                        href={user.club.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Globe className="w-3 h-3" />
                        Visit Website
                      </a>
                    </div>
                  )}
                  {user.club.address && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                      <p className="text-sm flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {user.club.address.city}, {user.club.address.state}
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Contact</Label>
                    <div className="space-y-1">
                      <p className="text-sm flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.club.contactEmail}
                      </p>
                      <p className="text-sm flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {user.club.contactPhone}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                    <p className="text-sm">{formatDate(user.createdAt || '')}</p>
                  </div>
                  {user.membershipExpiry && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Membership Expires</Label>
                      <p className="text-sm">{formatDate(user.membershipExpiry)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Account Type</Label>
                  <Badge variant="outline">
                    {user.role === 'member' ? 'Member' : user.role}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Account Status</Label>
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Joined</Label>
                  <p className="text-sm">{formatDate(user.createdAt || '')}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                  <p className="text-sm">{formatDate(user.updatedAt || '')}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Membership Renewal Component */}
          {user.club && user.membershipExpiry && (
            <MembershipRenewal 
              clubName={user.club.name}
              expiryDate={user.membershipExpiry}
            />
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 