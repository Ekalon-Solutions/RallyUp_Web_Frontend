"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { User, Mail, Phone, Shield, Save, Building2, MapPin, Globe, Loader2, CheckCircle, XCircle } from "lucide-react"
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth"
import { auth } from "@/lib/firebase/config"
import { apiClient } from "@/lib/api"

declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}

export default function SettingsPage() {
  const { user, updateProfile, checkAuth } = useAuth()
  const [loading, setLoading] = useState(false)
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
      
      // Call backend to update verification status
      if (user) {
        const result = await apiClient.verifyPhoneNumber({})

        if (result.success) {
          toast.success("Phone number verified successfully")
          setShowOtpInput(false)
          setOtpSent(false)
          setOtp("")
          // Update user state locally
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
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
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
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Updating..." : "Update Profile"}
                    <Save className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  View your account details and status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Account Type</Label>
                    <p className="text-sm text-muted-foreground capitalize">
                      {user.role}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Account Status</Label>
                    <p className="text-sm text-muted-foreground">
                      {user.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Phone Verification</Label>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        {user.isPhoneVerified ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
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
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="h-8 w-24 text-sm"
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
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Member Since</Label>
                    <p className="text-sm text-muted-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div id="recaptcha-container"></div>

          {/* Club Information for Admins */}
          {user.club && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'system_owner') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Club Information
                </CardTitle>
                <CardDescription>
                  View your club details and management information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Club Name</Label>
                    <p className="text-sm font-medium">{user.club.name}</p>
                  </div>
                  {user.club.description && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Description</Label>
                      <p className="text-sm text-muted-foreground">{user.club.description}</p>
                    </div>
                  )}
                  {user.club.website && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Website</Label>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={user.club.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {user.club.website}
                        </a>
                      </div>
                    </div>
                  )}
                  {user.club.address && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Address</Label>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <p className="text-sm text-muted-foreground">
                          {user.club.address.street}, {user.club.address.city}, {user.club.address.state} {user.club.address.zipCode}, {user.club.address.country}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Contact Information</Label>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <a href={`mailto:${user.club.contactEmail}`} className="text-sm text-blue-600 hover:underline">
                          {user.club.contactEmail}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a href={`tel:${user.club.contactPhone}`} className="text-sm text-blue-600 hover:underline">
                          {user.club.contactPhone}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Club Status</Label>
                    <p className="text-sm text-muted-foreground capitalize">
                      {user.club.status}
                    </p>
                  </div>
                  {user.club.settings && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Club Settings</Label>
                      <div className="grid gap-2 text-sm text-muted-foreground">
                        <div>Max Members: {user.club.settings.maxMembers}</div>
                        <div>Public Registration: {user.club.settings.allowPublicRegistration ? 'Enabled' : 'Disabled'}</div>
                        <div>Approval Required: {user.club.settings.requireApproval ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
