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
import { User, Mail, Phone, Shield, Save, Calendar, CheckCircle, XCircle, Edit, Building2, MapPin, Globe, Users, Search, Plus, ArrowRight, Loader2 } from "lucide-react"
import { MembershipRenewal } from "@/components/membership-renewal"
import { useRouter } from "next/navigation"
import { VolunteerSignUpModal } from "@/components/volunteer/volunteer-signup-modal"
import { VolunteerProfile } from "@/lib/api"
import { apiClient } from "@/lib/api"
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth"
import { auth } from "@/lib/firebase/config"

declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}

export default function UserProfilePage() {
  const { user, updateProfile, checkAuth } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false)
  const [volunteerProfile, setVolunteerProfile] = useState<VolunteerProfile | null>(null)
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone_number: "",
    countryCode: "+1"
  })

  // OTP related states
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        countryCode: user.countryCode || "+1"
      })
    }
  }, [user])

  useEffect(() => {
    const fetchVolunteerProfile = async () => {
      if (!user) return
      
      try {
        const profileResponse = await apiClient.getVolunteerProfile()
        if (profileResponse.success && profileResponse.data) {
          setVolunteerProfile(profileResponse.data)
        } else {
          setVolunteerProfile(null)
        }
      } catch (error) {
        setVolunteerProfile(null)
      }
    }

    fetchVolunteerProfile()
  }, [user])

  const setupRecaptcha = () => {
    if (typeof window !== "undefined") {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
        });
      }
      return window.recaptchaVerifier
    }
  }

  const handleSendOTP = async () => {
    if (!profileForm.phone_number) {
      toast.error("Please provide a phone number first")
      return
    }

    try {
      setLoading(true)
      const phoneNumber = (profileForm.countryCode.startsWith('+') ? profileForm.countryCode : '+' + profileForm.countryCode) + profileForm.phone_number
      const verifier = setupRecaptcha()
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier)
      window.confirmationResult = confirmationResult
      setOtpSent(true)
      setShowOtpInput(true)
      toast.success("OTP sent to your phone number")
    } catch (error: any) {
      console.error("Error sending OTP:", error)
      toast.error(error.message || "Failed to send OTP. Please check the phone number.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      toast.error("Please enter a valid 6-digit OTP")
      return
    }

    try {
      setIsVerifying(true)
      const confirmationResult = window.confirmationResult
      if (!confirmationResult) {
        toast.error("Session expired. Please request a new OTP.")
        setShowOtpInput(false)
        return
      }

      await confirmationResult.confirm(otp)
      
      if (user) {
        const result = await apiClient.verifyPhoneNumber({})

        if (result.success) {
          toast.success("Phone number verified successfully")
          setShowOtpInput(false)
          setOtpSent(false)
          setOtp("")
          await checkAuth()
        } else {
          toast.error(result.error || "Verification failed on server")
        }
      }
    } catch (error) {
      console.error("Error verifying OTP:", error)
      toast.error("Invalid OTP. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updateProfile({
        name: profileForm.name,
        email: profileForm.email,
        phone_number: profileForm.phone_number,
        countryCode: profileForm.countryCode
      })

      if (result.success) {
        toast.success("Profile updated successfully")
        setIsEditing(false)
      } else {
        toast.error(result.error || "Failed to update profile")
      }
    } catch (error) {
      // console.error("Error updating profile:", error)
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

  const handleVolunteerPreferencesSubmit = async (preferences: VolunteerProfile) => {
    try {
      // First check if volunteer profile exists
      const profileResponse = await apiClient.getVolunteerProfile();
      
      if (!profileResponse.success) {
        // Profile doesn't exist, create one first
        const createResponse = await apiClient.createVolunteerProfile({
          club: user?.club?._id || '',
          skills: preferences.skills || [],
          interests: preferences.interests || [],
          availability: {
            weekdays: preferences.availability?.weekdays || false,
            weekends: preferences.availability?.weekends || false,
            evenings: preferences.availability?.evenings || false,
            flexible: false
          },
          experience: {
            level: 'beginner',
            yearsOfExperience: 0,
            previousRoles: []
          },
          preferences: {
            preferredEventTypes: [],
            maxHoursPerWeek: 10,
            preferredTimeSlots: [],
            locationPreference: 'on-site'
          },
          emergencyContact: {
            name: '',
            relationship: '',
            phone: '',
            email: ''
          },
          notes: preferences.notes || ''
        });
        
        if (createResponse.success) {
          // Fetch the updated profile to get all data
          const updatedProfileResponse = await apiClient.getVolunteerProfile()
          if (updatedProfileResponse.success && updatedProfileResponse.data) {
            setVolunteerProfile(updatedProfileResponse.data)
          } else {
            setVolunteerProfile(preferences)
          }
          setIsVolunteerModalOpen(false);
          toast.success("Volunteer profile created successfully");
          // Refresh user data to update volunteering status
          await checkAuth()
        } else {
          toast.error(createResponse.error || "Failed to create volunteer profile");
        }
      } else {
        // Profile exists, update it
        const updateResponse = await apiClient.updateVolunteerProfile({
          skills: preferences.skills || [],
          interests: preferences.interests || [],
          availability: {
            weekdays: preferences.availability?.weekdays || false,
            weekends: preferences.availability?.weekends || false,
            evenings: preferences.availability?.evenings || false,
            flexible: false
          },
          notes: preferences.notes || ''
        });
        
        if (updateResponse.success) {
          // Fetch the updated profile to get all data
          const updatedProfileResponse = await apiClient.getVolunteerProfile()
          if (updatedProfileResponse.success && updatedProfileResponse.data) {
            setVolunteerProfile(updatedProfileResponse.data)
          } else {
            setVolunteerProfile(preferences)
          }
          setIsVolunteerModalOpen(false);
          toast.success("Volunteer preferences updated successfully");
          // Refresh user data to update volunteering status
          await checkAuth()
        } else {
          toast.error(updateResponse.error || "Failed to update volunteer preferences");
        }
      }
    } catch (error) {
      // // console.error("Error updating volunteer preferences:", error);
      toast.error("Error updating volunteer preferences");
    }
  };

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
                            value={profileForm.phone_number}
                            onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
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
                          <p className="text-sm">{user.countryCode} {user.phone_number}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Phone Verification</Label>
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                              {user.isPhoneVerified ? (
                                <CheckCircle className="hidden sm:inline-block w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="hidden sm:inline-block w-4 h-4 text-red-500" />
                              )}
                              <Badge variant={user.isPhoneVerified ? "default" : "secondary"}>
                                {user.isPhoneVerified ? "Verified" : "Not Verified"}
                              </Badge>
                              {!user.isPhoneVerified && !showOtpInput && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 text-xs"
                                  onClick={handleSendOTP}
                                  disabled={loading}
                                >
                                  {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                                  Verify Now
                                </Button>
                              )}
                            </div>

                            {!user.isPhoneVerified && showOtpInput && (
                              <div className="flex items-center gap-2 mt-1">
                                <Input
                                  placeholder="Enter 6-digit OTP"
                                  value={otp}
                                  onChange={(e) => setOtp(e.target.value)}
                                  className="h-8 w-32 text-sm"
                                  maxLength={6}
                                />
                                <Button 
                                  size="sm" 
                                  className="h-8 text-xs"
                                  onClick={handleVerifyOTP}
                                  disabled={isVerifying}
                                >
                                  {isVerifying ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                                  Confirm
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 text-xs"
                                  onClick={() => setShowOtpInput(false)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div id="recaptcha-container"></div>

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

            {/* Volunteer Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Volunteer Preferences
                </CardTitle>
                <CardDescription>
                  Manage your volunteering interests and availability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {volunteerProfile?.isVolunteer || (volunteerProfile && (volunteerProfile.skills?.length > 0 || volunteerProfile.interests?.length > 0)) ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Available for Volunteering
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsVolunteerModalOpen(true)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Update Preferences
                      </Button>
                    </div>
                    
                    {volunteerProfile.skills && volunteerProfile.skills.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Skills</Label>
                        <div className="flex flex-wrap gap-2">
                          {volunteerProfile.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {volunteerProfile.interests && volunteerProfile.interests.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Interests</Label>
                        <div className="flex flex-wrap gap-2">
                          {volunteerProfile.interests.map((interest, index) => (
                            <Badge key={index} variant="outline">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {volunteerProfile.availability && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Availability</Label>
                        <div className="space-y-1 text-sm">
                          {volunteerProfile.availability.weekdays && <p>✓ Weekdays</p>}
                          {volunteerProfile.availability.weekends && <p>✓ Weekends</p>}
                          {volunteerProfile.availability.evenings && <p>✓ Evenings</p>}
                        </div>
                      </div>
                    )}
                    
                    {volunteerProfile.notes && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                        <p className="text-sm">{volunteerProfile.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-semibold mb-2">Not a volunteer yet?</h3>
                    <p className="text-muted-foreground mb-4">
                      Join the volunteer team and help make a difference in your community.
                    </p>
                    <Button onClick={() => setIsVolunteerModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Become a Volunteer
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

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
      <VolunteerSignUpModal 
        open={isVolunteerModalOpen} 
        onClose={() => setIsVolunteerModalOpen(false)} 
        onSubmit={handleVolunteerPreferencesSubmit} 
        initialPreferences={volunteerProfile || undefined}
      />
    </ProtectedRoute>
  )
} 