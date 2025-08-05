"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, User, Mail, Lock, Phone, UserPlus, LogIn } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("user-login")
  const { login, register, isAuthenticated } = useAuth()
  const router = useRouter()

  // User form states
  const [userLoginData, setUserLoginData] = useState({ email: "", phoneNumber: "", countryCode: "+1" })
  const [userRegisterData, setUserRegisterData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    countryCode: "+1"
  })

  // Admin form states
  const [adminLoginData, setAdminLoginData] = useState({ email: "", phoneNumber: "", countryCode: "+1" })
  const [adminRegisterData, setAdminRegisterData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    countryCode: "+1",
    adminCode: ""
  })

  // OTP verification states
  const [userOtpSent, setUserOtpSent] = useState(false)
  const [adminOtpSent, setAdminOtpSent] = useState(false)
  const [userOtp, setUserOtp] = useState("")
  const [adminOtp, setAdminOtp] = useState("")
  const [generatedOtp, setGeneratedOtp] = useState("")

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push("/dashboard")
    return null
  }

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const result = await login(userLoginData.email, userLoginData.phoneNumber, userLoginData.countryCode, false)
      if (result.success) {
        toast.success("Login successful!")
        router.push("/dashboard")
      } else {
        toast.error(result.error || "Login failed. Please check your credentials.")
      }
    } catch (error) {
      console.error("Login error:", error)
      toast.error("An error occurred during login.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userOtpSent) {
      toast.error("Please verify your phone number first")
      return
    }

    if (userOtp !== generatedOtp) {
      toast.error("Invalid OTP. Please check and try again")
      return
    }

    setIsLoading(true)
    
    try {
      const result = await register({
        name: userRegisterData.name,
        email: userRegisterData.email,
        phoneNumber: userRegisterData.phoneNumber,
        countryCode: userRegisterData.countryCode
      }, false)
      
      if (result.success) {
        toast.success("Registration successful!")
        router.push("/dashboard")
      } else {
        toast.error(result.error || "Registration failed. Please try again.")
      }
    } catch (error) {
      console.error("Registration error:", error)
      toast.error("An error occurred during registration.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const result = await login(adminLoginData.email, adminLoginData.phoneNumber, adminLoginData.countryCode, true)
      console.log('Admin login result:', result)
      if (result.success) {
        toast.success("Admin login successful!")
        console.log('Redirecting admin to dashboard...')
        window.location.href = "/dashboard"
      } else {
        toast.error(result.error || "Admin login failed. Please check your credentials.")
      }
    } catch (error) {
      console.error("Admin login error:", error)
      toast.error("An error occurred during admin login.")
    } finally {
      setIsLoading(false)
    }
  }

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  const handleUserVerifyNumber = async () => {
    if (!userRegisterData.phoneNumber || !userRegisterData.countryCode) {
      toast.error("Please enter phone number and country code")
      return
    }
    
    // Generate OTP
    const otp = generateOTP()
    setGeneratedOtp(otp)
    
    // Simulate OTP sending
    toast.success(`OTP sent to ${userRegisterData.countryCode}${userRegisterData.phoneNumber}. Code: ${otp}`)
    setUserOtpSent(true)
  }

  const handleAdminVerifyNumber = async () => {
    if (!adminRegisterData.phoneNumber || !adminRegisterData.countryCode) {
      toast.error("Please enter phone number and country code")
      return
    }
    
    // Generate OTP
    const otp = generateOTP()
    setGeneratedOtp(otp)
    
    // Simulate OTP sending
    toast.success(`OTP sent to ${adminRegisterData.countryCode}${adminRegisterData.phoneNumber}. Code: ${otp}`)
    setAdminOtpSent(true)
  }

  const handleAdminRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!adminOtpSent) {
      toast.error("Please verify your phone number first")
      return
    }

    if (adminOtp !== generatedOtp) {
      toast.error("Invalid OTP. Please check and try again")
      return
    }

    setIsLoading(true)
    
    try {
      const result = await register({
        name: adminRegisterData.name,
        email: adminRegisterData.email,
        phoneNumber: adminRegisterData.phoneNumber,
        countryCode: adminRegisterData.countryCode,
        adminCode: adminRegisterData.adminCode
      }, true)
      
      if (result.success) {
        toast.success("Admin registration successful!")
        router.push("/dashboard")
      } else {
        toast.error(result.error || "Admin registration failed. Please check your admin code.")
      }
    } catch (error) {
      console.error("Admin registration error:", error)
      toast.error("An error occurred during admin registration.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to RallyUp</CardTitle>
          <CardDescription>
            Manage your supporter group with ease
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="user-login">User Login</TabsTrigger>
              <TabsTrigger value="admin-login">Admin Login</TabsTrigger>
            </TabsList>
            
            <TabsContent value="user-login" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="Enter your email"
                    value={userLoginData.email}
                    onChange={(e) => setUserLoginData({ ...userLoginData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="user-login-country-code">Country Code</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="user-login-country-code"
                      type="text"
                      placeholder="+1"
                      value={userLoginData.countryCode}
                      onChange={(e) => setUserLoginData({ ...userLoginData, countryCode: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="user-login-phone">Phone Number</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="user-login-phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={userLoginData.phoneNumber}
                      onChange={(e) => setUserLoginData({ ...userLoginData, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <Button onClick={handleUserLogin} className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
                <LogIn className="ml-2 w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("user-register")} 
                className="w-full"
              >
                Create Account
                <UserPlus className="ml-2 w-4 h-4" />
              </Button>
            </TabsContent>

            <TabsContent value="user-register" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Full Name</Label>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="user-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={userRegisterData.name}
                    onChange={(e) => setUserRegisterData({ ...userRegisterData, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-register-email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="user-register-email"
                    type="email"
                    placeholder="Enter your email"
                    value={userRegisterData.email}
                    onChange={(e) => setUserRegisterData({ ...userRegisterData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="user-country-code">Country Code</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="user-country-code"
                      type="text"
                      placeholder="+1"
                      value={userRegisterData.countryCode}
                      onChange={(e) => setUserRegisterData({ ...userRegisterData, countryCode: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="user-phone">Phone Number</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="user-phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={userRegisterData.phoneNumber}
                      onChange={(e) => setUserRegisterData({ ...userRegisterData, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleUserVerifyNumber}
                  disabled={userOtpSent || !userRegisterData.phoneNumber || !userRegisterData.countryCode}
                  className="flex-1"
                >
                  {userOtpSent ? "OTP Sent ✓" : "Verify Number"}
                </Button>
              </div>
              {userOtpSent && (
                <div className="space-y-2">
                  <Label htmlFor="user-otp">Enter OTP</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="user-otp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={userOtp}
                      onChange={(e) => setUserOtp(e.target.value)}
                      maxLength={6}
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setUserOtpSent(false)
                        setUserOtp("")
                        setGeneratedOtp("")
                      }}
                      size="sm"
                    >
                      Resend
                    </Button>
                  </div>
                </div>
              )}

              <Button onClick={handleUserRegister} className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
                <UserPlus className="ml-2 w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("user-login")} 
                className="w-full"
              >
                Back to Login
                <LogIn className="ml-2 w-4 h-4" />
              </Button>
            </TabsContent>

            <TabsContent value="admin-login" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="Enter admin email"
                    value={adminLoginData.email}
                    onChange={(e) => setAdminLoginData({ ...adminLoginData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-login-country-code">Country Code</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="admin-login-country-code"
                      type="text"
                      placeholder="+1"
                      value={adminLoginData.countryCode}
                      onChange={(e) => setAdminLoginData({ ...adminLoginData, countryCode: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="admin-login-phone">Phone Number</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="admin-login-phone"
                      type="tel"
                      placeholder="Enter admin phone number"
                      value={adminLoginData.phoneNumber}
                      onChange={(e) => setAdminLoginData({ ...adminLoginData, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <Button onClick={handleAdminLogin} className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Admin Sign In"}
                <Shield className="ml-2 w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("admin-register")} 
                className="w-full"
              >
                Create Admin Account
                <UserPlus className="ml-2 w-4 h-4" />
              </Button>
            </TabsContent>

            <TabsContent value="admin-register" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-name">Admin Name</Label>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="admin-name"
                    type="text"
                    placeholder="Enter admin name"
                    value={adminRegisterData.name}
                    onChange={(e) => setAdminRegisterData({ ...adminRegisterData, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-register-email">Admin Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="admin-register-email"
                    type="email"
                    placeholder="Enter admin email"
                    value={adminRegisterData.email}
                    onChange={(e) => setAdminRegisterData({ ...adminRegisterData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-country-code">Country Code</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="admin-country-code"
                      type="text"
                      placeholder="+1"
                      value={adminRegisterData.countryCode}
                      onChange={(e) => setAdminRegisterData({ ...adminRegisterData, countryCode: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="admin-phone">Phone Number</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="admin-phone"
                      type="tel"
                      placeholder="Enter phone number"
                      value={adminRegisterData.phoneNumber}
                      onChange={(e) => setAdminRegisterData({ ...adminRegisterData, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleAdminVerifyNumber}
                  disabled={adminOtpSent || !adminRegisterData.phoneNumber || !adminRegisterData.countryCode}
                  className="flex-1"
                >
                  {adminOtpSent ? "OTP Sent ✓" : "Verify Number"}
                </Button>
              </div>
              {adminOtpSent && (
                <div className="space-y-2">
                  <Label htmlFor="admin-otp">Enter OTP</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="admin-otp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={adminOtp}
                      onChange={(e) => setAdminOtp(e.target.value)}
                      maxLength={6}
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setAdminOtpSent(false)
                        setAdminOtp("")
                        setGeneratedOtp("")
                      }}
                      size="sm"
                    >
                      Resend
                    </Button>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="admin-code">Admin Code</Label>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="admin-code"
                    type="text"
                    placeholder="Enter admin registration code"
                    value={adminRegisterData.adminCode}
                    onChange={(e) => setAdminRegisterData({ ...adminRegisterData, adminCode: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleAdminRegister} className="w-full" disabled={isLoading}>
                {isLoading ? "Creating admin account..." : "Create Admin Account"}
                <Shield className="ml-2 w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("admin-login")} 
                className="w-full"
              >
                Back to Admin Login
                <LogIn className="ml-2 w-4 h-4" />
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
