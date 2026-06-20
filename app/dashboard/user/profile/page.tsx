"use client"

import React, { useState, useEffect, useMemo } from "react"
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
import { User, Shield, Save, CheckCircle, XCircle, Edit, Building2, MapPin, Loader2, Camera, Search, ArrowRight, Users, FileText, Calendar } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { MembershipRenewal } from "@/components/membership-renewal"
import { useRouter } from "next/navigation"
import { VolunteerSignUpModal } from "@/components/volunteer/volunteer-signup-modal"
import { VolunteerProfile } from "@/lib/api"
import { apiClient } from "@/lib/api"
import { formatDisplayDate } from "@/lib/utils"

const isSystemAdmin = (role: string | undefined) =>
  role === "admin" || role === "super_admin" || role === "system_owner"

const isMember = (role: string | undefined) => role === "member" || !role

function normalizeClubId(c: any): string | null {
  if (!c) return null
  const id = c?._id?.toString?.()
  if (id) return id
  return typeof c === "string" ? c : null
}

export default function UserProfilePage() {
  const { user, updateProfile, checkAuth, activeClubId } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false)
  const [volunteerProfile, setVolunteerProfile] = useState<VolunteerProfile | null>(null)
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    countryCode: "+1",
    address_line1: "",
    address_line2: "",
    city: "",
    state_province: "",
    zip_code: "",
    country: "",
  })

  const [showOtpInput, setShowOtpInput] = useState(false)
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [sessionInfo, setSessionInfo] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [resendLoading, setResendLoading] = useState<"whatsapp" | "sms" | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const cooldownRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const startCooldown = () => {
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    setResendCooldown(30)
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!)
          cooldownRef.current = null
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  React.useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }, [])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const showSystemAdminProfile = user ? isSystemAdmin(user.role) : false

  // Derive current club for membership renewal (when applicable)
  const currentClub = useMemo(() => {
    if (!user || (user as any).role === "system_owner") return null
    const u = user as any
    if (activeClubId) {
      const fromClubs = Array.isArray(u.clubs) && u.clubs.find((c: any) => normalizeClubId(c) === activeClubId)
      if (fromClubs) return typeof fromClubs === "object" ? fromClubs : null
      const fromMembership = u.memberships?.find(
        (m: any) => m?.status === "active" && (normalizeClubId(m.club_id) === activeClubId || normalizeClubId(m.club) === activeClubId)
      )
      const clubRef = fromMembership?.club_id ?? fromMembership?.club
      if (clubRef) return typeof clubRef === "object" ? clubRef : null
    }
    if (u.club) return typeof u.club === "object" ? u.club : null
    const firstMembership = u.memberships?.find((m: any) => m?.status === "active")
    const ref = firstMembership?.club_id ?? firstMembership?.club
    if (ref) return typeof ref === "object" ? ref : null
    const firstAdminClub = Array.isArray(u.clubs) ? u.clubs[0] : null
    return firstAdminClub && typeof firstAdminClub === "object" ? firstAdminClub : null
  }, [user, activeClubId])

  useEffect(() => {
    if (user) {
      const u = user as any
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        countryCode: user.countryCode || "+1",
        address_line1: u.address_line1 || "",
        address_line2: u.address_line2 || "",
        city: u.city || "",
        state_province: u.state_province || "",
        zip_code: u.zip_code || "",
        country: u.country || "",
      })
    }
  }, [user])

  useEffect(() => {
    if (!user || isSystemAdmin(user.role)) return
    const fetchVolunteerProfile = async () => {
      try {
        const profileResponse = await apiClient.getVolunteerProfile()
        if (profileResponse.success && profileResponse.data) {
          setVolunteerProfile(profileResponse.data)
        } else {
          setVolunteerProfile(null)
        }
      } catch {
        setVolunteerProfile(null)
      }
    }
    fetchVolunteerProfile()
  }, [user])

  const handleSendOTP = async () => {
    if (!profileForm.phoneNumber) {
      toast.error("Please provide a phone number first")
      return
    }
    try {
      setLoading(true)
      const cc = profileForm.countryCode.startsWith('+') ? profileForm.countryCode : '+' + profileForm.countryCode
      const res = await apiClient.sendOtp({
        phoneNumber: profileForm.phoneNumber,
        countryCode: cc,
        role: "user",
      })
      if (res.success) {
        setSessionInfo(res.data?.sessionInfo ?? null)
        setOtpSent(true)
        setShowOtpInput(true)
        startCooldown()
        toast.success("OTP sent via WhatsApp")
      } else {
        toast.error((res as any).errorDetails?.details?.message || res.error || "Failed to send OTP")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async (channel: "whatsapp" | "sms") => {
    setResendLoading(channel)
    try {
      const cc = profileForm.countryCode.startsWith('+') ? profileForm.countryCode : '+' + profileForm.countryCode
      const res = await apiClient.resendOTP({
        phoneNumber: profileForm.phoneNumber,
        countryCode: cc,
        role: "user",
        channel,
      })
      if (res.success) {
        if (res.data?.sessionInfo) setSessionInfo(res.data.sessionInfo)
        startCooldown()
        toast.success(channel === "whatsapp" ? "OTP resent via WhatsApp" : "OTP resent via SMS")
      } else {
        toast.error((res as any).errorDetails?.details?.message || res.error || "Failed to resend OTP")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to resend OTP")
    } finally {
      setResendLoading(null)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      toast.error("Please enter a valid 6-digit OTP")
      return
    }
    if (!sessionInfo) {
      toast.error("Session expired. Please request a new OTP.")
      setShowOtpInput(false)
      return
    }
    try {
      setIsVerifying(true)
      const cc = profileForm.countryCode.startsWith('+') ? profileForm.countryCode : '+' + profileForm.countryCode
      const verifyRes = await apiClient.verifyOTP({
        phoneNumber: profileForm.phoneNumber,
        countryCode: cc,
        otp,
        sessionInfo,
        role: "user",
      })
      if (verifyRes.success) {
        const result = await apiClient.verifyPhoneNumber({})
        if (result.success) {
          toast.success("Phone number verified successfully")
          setShowOtpInput(false)
          setOtpSent(false)
          setOtp("")
          setSessionInfo(null)
          await checkAuth()
        } else {
          toast.error(result.error || "Verification failed on server")
        }
      } else {
        toast.error((verifyRes as any).errorDetails?.details?.message || verifyRes.error || "Invalid OTP. Please try again.")
      }
    } catch (error) {
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
        phoneNumber: profileForm.phoneNumber,
        countryCode: profileForm.countryCode,
        address_line1: profileForm.address_line1 || undefined,
        address_line2: profileForm.address_line2 || undefined,
        city: profileForm.city || undefined,
        state_province: profileForm.state_province || undefined,
        zip_code: profileForm.zip_code || undefined,
        country: profileForm.country || undefined,
      })

      if (result.success) {
        toast.success("Profile updated successfully")
        setIsEditing(false)
      } else {
        toast.error(result.error || "Failed to update profile")
      }
    } catch (error) {
      toast.error("Error updating profile")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => formatDisplayDate(dateString)

  const handleDiscoverClubs = () => {
    router.push('/clubs')
  }

  const getInitials = (name: string) => {
    const parts = (name || "").trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    if (parts[0]) return parts[0].slice(0, 2).toUpperCase()
    return "?"
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowed.includes(file.type)) {
      toast.error("Please choose a JPEG, PNG, GIF, or WebP image")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB")
      return
    }
    setUploadingPhoto(true)
    apiClient.uploadProfilePicture(file).then((res) => {
      if (res.success && res.data?.url) {
        updateProfile({ profilePicture: res.data.url }).then((updateResult) => {
          if (updateResult.success) {
            checkAuth()
            toast.success("Profile picture updated")
          } else {
            toast.error(updateResult.error || "Failed to update profile")
          }
        })
      } else {
        toast.error(res.error || "Failed to upload photo")
      }
    }).finally(() => {
      setUploadingPhoto(false)
      e.target.value = ""
    })
  }

  const handleVolunteerPreferencesSubmit = async (preferences: VolunteerProfile) => {
    try {
      const profileResponse = await apiClient.getVolunteerProfile();
      
      if (!profileResponse.success) {
        const createResponse = await apiClient.createVolunteerProfile({
          skills: preferences.skills || [],
          interests: preferences.interests || [],
          availability: {
            weekdays: preferences.availability?.weekdays || false,
            weekends: preferences.availability?.weekends || false,
            evenings: preferences.availability?.evenings || false,
            flexible: preferences.availability?.flexible || false
          },
          notes: preferences.notes || '',
          clubId: activeClubId || undefined,
        });

        if (createResponse.success) {
          const updatedProfileResponse = await apiClient.getVolunteerProfile()
          if (updatedProfileResponse.success && updatedProfileResponse.data) {
            setVolunteerProfile(updatedProfileResponse.data)
          } else {
            setVolunteerProfile(preferences)
          }
          setIsVolunteerModalOpen(false)
          toast.success("Volunteer profile created successfully")
          await checkAuth()
        } else {
          toast.error(createResponse.error || "Failed to create volunteer profile");
        }
      } else {
        const updateResponse = await apiClient.updateVolunteerProfile({
          skills: preferences.skills || [],
          interests: preferences.interests || [],
          availability: {
            weekdays: preferences.availability?.weekdays || false,
            weekends: preferences.availability?.weekends || false,
            evenings: preferences.availability?.evenings || false
          },
          notes: preferences.notes || '',
          clubId: activeClubId || undefined,
        });
        
        if (updateResponse.success) {
          const updatedProfileResponse = await apiClient.getVolunteerProfile()
          if (updatedProfileResponse.success && updatedProfileResponse.data) {
            setVolunteerProfile(updatedProfileResponse.data)
          } else {
            setVolunteerProfile(preferences)
          }
          setIsVolunteerModalOpen(false)
          toast.success("Volunteer preferences updated successfully")
          await checkAuth()
        } else {
          toast.error(updateResponse.error || "Failed to update volunteer preferences");
        }
      }
    } catch {
      toast.error("Error updating volunteer preferences")
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
        <div className="space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
                {showSystemAdminProfile && (
                  <Badge variant="secondary" className="text-xs font-semibold uppercase tracking-wider">
                    {user.role?.replace("_", " ")}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">Manage your personal information and account settings</p>
            </div>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
              className="shrink-0"
            >
              <Edit className="w-4 h-4 mr-2" />
              {isEditing ? "Cancel Edit" : "Edit Profile"}
            </Button>
          </div>

          <div className={`grid gap-6 ${showSystemAdminProfile ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
            <div className={showSystemAdminProfile ? "space-y-6" : "md:col-span-2 space-y-6"}>
              <Card className="overflow-hidden rounded-xl border shadow-sm">
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
                  <div className="flex items-center gap-4 mb-6">
                    {uploadingPhoto ? (
                      // Skeleton loader while the Image Scaling Engine optimizes the
                      // card photo in the background (square crop + WebP conversion).
                      <div className="relative h-24 w-24 shrink-0">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={(user as { profilePicture?: string }).profilePicture} alt={user.name} />
                        <AvatarFallback className="text-2xl bg-muted">
                          {getInitials(user.name || "")}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={handlePhotoChange}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingPhoto}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                        {user?.profilePicture ? "Change photo" : "Upload photo"}
                      </Button>
                    </div>
                  </div>
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
                      {isMember(user?.role) && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="address_line1">Address Line 1</Label>
                              <Input
                                id="address_line1"
                                value={profileForm.address_line1}
                                onChange={(e) => setProfileForm({ ...profileForm, address_line1: e.target.value })}
                                placeholder="Street address"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="address_line2">Address Line 2</Label>
                              <Input
                                id="address_line2"
                                value={profileForm.address_line2}
                                onChange={(e) => setProfileForm({ ...profileForm, address_line2: e.target.value })}
                                placeholder="Apt, suite, etc. (optional)"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="city">City</Label>
                              <Input
                                id="city"
                                value={profileForm.city}
                                onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                                placeholder="City"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="state_province">State / Province</Label>
                              <Input
                                id="state_province"
                                value={profileForm.state_province}
                                onChange={(e) => setProfileForm({ ...profileForm, state_province: e.target.value })}
                                placeholder="State or province"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="zip_code">ZIP / Postal Code</Label>
                              <Input
                                id="zip_code"
                                value={profileForm.zip_code}
                                onChange={(e) => setProfileForm({ ...profileForm, zip_code: e.target.value })}
                                placeholder="ZIP or postal code"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="country">Country</Label>
                              <Input
                                id="country"
                                value={profileForm.country}
                                onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                                placeholder="Country"
                              />
                            </div>
                          </div>
                        </>
                      )}
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
                                  Verify via WhatsApp
                                </Button>
                              )}
                            </div>

                            {!user.isPhoneVerified && showOtpInput && (
                              <div className="flex flex-col gap-2 mt-1">
                                <div className="flex items-center gap-2">
                                  <Input
                                    placeholder="Enter 6-digit OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
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
                                    onClick={() => { setShowOtpInput(false); setSessionInfo(null); setOtp("") }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                                {resendCooldown > 0 ? (
                                  <p className="text-xs text-muted-foreground">
                                    Resend in <span className="font-medium">{resendCooldown}s</span>
                                  </p>
                                ) : (
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs text-green-600 border-green-300"
                                      onClick={() => handleResendOTP("whatsapp")}
                                      disabled={resendLoading !== null}
                                    >
                                      {resendLoading === "whatsapp" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                                      Resend via WhatsApp
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => handleResendOTP("sms")}
                                      disabled={resendLoading !== null}
                                    >
                                      {resendLoading === "sms" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                                      Resend via SMS
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Other (read-only, not editable) */}
                      {isMember(user?.role) && (user as any).other != null && (user as any).other !== "" && (
                        <>
                          <Separator className="my-4" />
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Other</Label>
                            <p className="text-sm whitespace-pre-wrap mt-1">{(user as any).other}</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>


              {!showSystemAdminProfile && (
              <Card className="overflow-hidden rounded-xl border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Joined Clubs
                  </CardTitle>
                  <CardDescription>
                    Your club memberships and quick actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(user as any).memberships && (user as any).memberships.length > 0 ? (
                    <div className="space-y-3">
                      {(user as any).memberships.map((m: any) => (
                        <div key={m._id || m.club_id?._id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{m.club_id?.name || 'Club'}</p>
                            {m.membership_level_id && (
                              <p className="text-xs text-muted-foreground">{m.membership_level_id.name}</p>
                            )}
                            {m.status && (
                              <p className="text-xs text-muted-foreground">Status: {m.status}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {m.end_date && (
                              <p className="text-sm text-muted-foreground">Expires {formatDate(m.end_date)}</p>
                            )}
                            <Button size="sm" variant="outline" onClick={() => {
                              const clubSlug = m.club_id?.slug || m.club_id?._id || '';
                              router.push(`/clubs/${clubSlug}`);
                            }}>
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
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
                  )}
                </CardContent>
              </Card>
              )}
            </div>

            {!showSystemAdminProfile && (
            <Card className="overflow-hidden rounded-xl border shadow-sm">
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
                {volunteerProfile ? (
                  <div className="space-y-4">
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

                    {(volunteerProfile as any)?.emergencyContact && ((volunteerProfile as any).emergencyContact.name || (volunteerProfile as any).emergencyContact.phone) && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Emergency Contact</Label>
                        <div className="text-sm space-y-1">
                          {(volunteerProfile as any).emergencyContact.name && <p>{(volunteerProfile as any).emergencyContact.name}</p>}
                          {(volunteerProfile as any).emergencyContact.relationship && <p className="text-xs text-muted-foreground">{(volunteerProfile as any).emergencyContact.relationship}</p>}
                          {(volunteerProfile as any).emergencyContact.phone && <p className="text-sm">{(volunteerProfile as any).emergencyContact.phone}</p>}
                        </div>
                      </div>
                    )}

                    {(volunteerProfile as any)?.certifications && (volunteerProfile as any).certifications.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Certifications</Label>
                        <div className="space-y-1 text-sm">
                          {(volunteerProfile as any).certifications.map((c: any, idx: number) => (
                            <div key={idx}>
                              <p className="font-medium">{c.name} {(c.issuingOrganization) ? `— ${c.issuingOrganization}` : ''}</p>
                              {c.issueDate && <p className="text-xs text-muted-foreground">Issued: {formatDisplayDate(c.issueDate)}</p>}
                            </div>
                          ))}
                        </div>
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
                  </div>
                )}
                <div className="mt-4 flex flex-col items-center justify-end gap-2">
                  <Button onClick={() => setIsVolunteerModalOpen(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Update Preferences
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/dashboard/volunteer')}>
                    <Users className="w-4 h-4 mr-2" />
                    Volunteer Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
            )}

            <Card className="overflow-hidden rounded-xl border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Account Information
                </CardTitle>
                <CardDescription>Your account details and status (read-only)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Account Type</Label>
                  <Badge variant="outline" className="capitalize">
                    {(() => {
                      const role = (user as any).role;
                      if (!role) return 'Member';
                      return role === 'member' ? 'Member' : String(role).replace(/_/g, ' ');
                    })()}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Account Status</Label>
                  <Badge variant={(user as any).is_active ?? user.isActive ? "default" : "secondary"}>
                    {(user as any).is_active ?? user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Joined</Label>
                  <p className="text-sm">{formatDate((user as any).registration_date || user.createdAt || '')}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                  <p className="text-sm">{formatDate(user.updatedAt || '')}</p>
                </div>

                {/* Member-only read-only details from user table */}
                {isMember(user?.role) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(user as any).username != null && (user as any).username !== '' && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Username</Label>
                          <p className="text-sm">{((user as any).username)}</p>
                        </div>
                      )}
                      {(user as any).date_of_birth != null && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Date of birth
                          </Label>
                          <p className="text-sm">{formatDate((user as any).date_of_birth)}</p>
                        </div>
                      )}
                      {(user as any).gender != null && (user as any).gender !== '' && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Gender</Label>
                          <p className="text-sm capitalize">{(user as any).gender}</p>
                        </div>
                      )}
                      {(user as any).id_proof_type != null && (user as any).id_proof_type !== '' && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            ID proof type
                          </Label>
                          <p className="text-sm">{(user as any).id_proof_type}</p>
                        </div>
                      )}
                      {(user as any).id_proof_number != null && (user as any).id_proof_number !== '' && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">ID proof number</Label>
                          <p className="text-sm font-mono">{(user as any).id_proof_number}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        Address
                      </Label>
                      {((user as any).address_line1 || (user as any).city || (user as any).state_province || (user as any).zip_code || (user as any).country) ? (
                        <div className="text-sm space-y-0.5">
                          {(user as any).address_line1 && <p>{(user as any).address_line1}</p>}
                          {(user as any).address_line2 && <p>{(user as any).address_line2}</p>}
                          {(() => {
                            const parts = [(user as any).city, (user as any).state_province, (user as any).zip_code, (user as any).country].filter(Boolean);
                            return parts.length > 0 ? <p>{parts.join(', ')}</p> : null;
                          })()}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No address on file — edit your profile to add one.</p>
                      )}
                    </div>
                    {(user as any).last_login != null && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Last login</Label>
                        <p className="text-sm">{formatDate((user as any).last_login)}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {currentClub && (user as any).membershipExpiry && (
            <MembershipRenewal 
              user={(user as any)}
              membershipPlans={[]}
              onRenewal={async (planId: string, reservationToken?: string | null, redeemedPoints?: number) => {
                try {
                  const params = new URLSearchParams()
                  const clubId = currentClub?._id || currentClub?.slug || ''
                  if (clubId) params.set('clubId', String(clubId))
                  params.set('planId', planId)
                  if (reservationToken) params.set('reservationToken', reservationToken)
                  if (typeof redeemedPoints === 'number') params.set('redeemedPoints', String(redeemedPoints))
                  router.push(`/membership-plans?${params.toString()}`)
                } catch (e) {
                  // fallback: navigate to membership plans
                  router.push('/membership-plans')
                }
              }}
            />
          )}
        </div>
      </DashboardLayout>
      {!showSystemAdminProfile && (
        <VolunteerSignUpModal
          open={isVolunteerModalOpen}
          onClose={() => setIsVolunteerModalOpen(false)}
          onSubmit={handleVolunteerPreferencesSubmit}
          initialPreferences={volunteerProfile || undefined}
        />
      )}
    </ProtectedRoute>
  )
} 