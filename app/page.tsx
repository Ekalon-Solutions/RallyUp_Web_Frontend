"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, User, Mail, Lock, Phone, UserPlus, LogIn, Crown, Building2, Sparkles } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

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
    countryCode: "+1",
    clubId: "",
    membershipPlanId: ""
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

  // System Owner form states
  const [systemOwnerLoginData, setSystemOwnerLoginData] = useState({ email: "", phoneNumber: "", countryCode: "+1" })
  const [systemOwnerRegisterData, setSystemOwnerRegisterData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    countryCode: "+1",
    accessKey: ""
  })

  // OTP verification states
  const [userOtpSent, setUserOtpSent] = useState(false)
  const [adminOtpSent, setAdminOtpSent] = useState(false)
  const [systemOwnerOtpSent, setSystemOwnerOtpSent] = useState(false)
  const [userOtp, setUserOtp] = useState("")
  const [adminOtp, setAdminOtp] = useState("")
  const [systemOwnerOtp, setSystemOwnerOtp] = useState("")
  const [generatedOtp, setGeneratedOtp] = useState("")

  // Login OTP states
  const [userLoginOtpSent, setUserLoginOtpSent] = useState(false)
  const [adminLoginOtpSent, setAdminLoginOtpSent] = useState(false)
  const [systemOwnerLoginOtpSent, setSystemOwnerLoginOtpSent] = useState(false)
  const [userLoginOtp, setUserLoginOtp] = useState("")
  const [adminLoginOtp, setAdminLoginOtp] = useState("")
  const [systemOwnerLoginOtp, setSystemOwnerLoginOtp] = useState("")
  const [generatedLoginOtp, setGeneratedLoginOtp] = useState("")

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push("/dashboard")
    return null
  }

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userLoginOtpSent) {
      toast.error("Please verify your phone number first")
      return
    }

    if (userLoginOtp !== generatedLoginOtp) {
      toast.error("Invalid OTP. Please check and try again")
      return
    }

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
        countryCode: userRegisterData.countryCode,
        clubId: userRegisterData.clubId,
        membershipPlanId: userRegisterData.membershipPlanId
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

    if (!adminLoginOtpSent) {
      toast.error("Please verify your phone number first")
      return
    }

    if (adminLoginOtp !== generatedLoginOtp) {
      toast.error("Invalid OTP. Please check and try again")
      return
    }

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

  const handleSystemOwnerVerifyNumber = async () => {
    if (!systemOwnerRegisterData.phoneNumber || !systemOwnerRegisterData.countryCode) {
      toast.error("Please enter phone number and country code")
      return
    }
    
    // Generate OTP
    const otp = generateOTP()
    setGeneratedOtp(otp)
    
    // Simulate OTP sending
    toast.success(`OTP sent to ${systemOwnerRegisterData.countryCode}${systemOwnerRegisterData.phoneNumber}. Code: ${otp}`)
    setSystemOwnerOtpSent(true)
  }

  // Login OTP verification handlers
  const handleUserLoginVerifyNumber = async () => {
    if (!userLoginData.phoneNumber || !userLoginData.countryCode) {
      toast.error("Please enter phone number and country code")
      return
    }
    
    // Generate OTP
    const otp = generateOTP()
    setGeneratedLoginOtp(otp)
    
    // Simulate OTP sending
    toast.success(`OTP sent to ${userLoginData.countryCode}${userLoginData.phoneNumber}. Code: ${otp}`)
    setUserLoginOtpSent(true)
  }

  const handleAdminLoginVerifyNumber = async () => {
    if (!adminLoginData.phoneNumber || !adminLoginData.countryCode) {
      toast.error("Please enter phone number and country code")
      return
    }
    
    // Generate OTP
    const otp = generateOTP()
    setGeneratedLoginOtp(otp)
    
    // Simulate OTP sending
    toast.success(`OTP sent to ${adminLoginData.countryCode}${adminLoginData.phoneNumber}. Code: ${otp}`)
    setAdminLoginOtpSent(true)
  }

  const handleSystemOwnerLoginVerifyNumber = async () => {
    if (!systemOwnerLoginData.phoneNumber || !systemOwnerLoginData.countryCode) {
      toast.error("Please enter phone number and country code")
      return
    }
    
    // Generate OTP
    const otp = generateOTP()
    setGeneratedLoginOtp(otp)
    
    // Simulate OTP sending
    toast.success(`OTP sent to ${systemOwnerLoginData.countryCode}${systemOwnerLoginData.phoneNumber}. Code: ${otp}`)
    setSystemOwnerLoginOtpSent(true)
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

  const handleSystemOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!systemOwnerLoginOtpSent) {
      toast.error("Please verify your phone number first")
      return
    }

    if (systemOwnerLoginOtp !== generatedLoginOtp) {
      toast.error("Invalid OTP. Please check and try again")
      return
    }

    setIsLoading(true)
    
    try {
      const result = await login(systemOwnerLoginData.email, systemOwnerLoginData.phoneNumber, systemOwnerLoginData.countryCode, false, true)
      if (result.success) {
        toast.success("System Owner login successful!")
        router.push("/dashboard")
      } else {
        toast.error(result.error || "System Owner login failed. Please check your credentials.")
      }
    } catch (error) {
      console.error("System Owner login error:", error)
      toast.error("An error occurred during System Owner login.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSystemOwnerRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!systemOwnerOtpSent) {
      toast.error("Please verify your phone number first")
      return
    }

    if (systemOwnerOtp !== generatedOtp) {
      toast.error("Invalid OTP. Please check and try again")
      return
    }

    setIsLoading(true)
    
    try {
      const result = await register({
        name: systemOwnerRegisterData.name,
        email: systemOwnerRegisterData.email,
        phoneNumber: systemOwnerRegisterData.phoneNumber,
        countryCode: systemOwnerRegisterData.countryCode,
        accessKey: systemOwnerRegisterData.accessKey
      }, false, true)
      
      if (result.success) {
        toast.success("System Owner registration successful!")
        router.push("/dashboard")
      } else {
        toast.error(result.error || "System Owner registration failed.")
      }
    } catch (error) {
      console.error("System Owner registration error:", error)
      toast.error("An error occurred during System Owner registration.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative h-screen">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-0 z-[-2] h-screen w-screen bg-[#000000] bg-[radial-gradient(#ffffff33_1px,#000000_1px)] bg-[size:20px_20px]"></div>
      </div>
      
      {/* Hero Content */}
      <div className="relative  z-10 flex h-full flex-col items-center justify-center px-4">
        <div className="max-w-md w-full">
          <Card className="backdrop-blur-sm bg-black/10 border-white/20 shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-sky-100 to-blue-200 rounded-full flex items-center justify-center shadow-lg">
                <Shield className="w-8 h-8 text-black" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">Welcome to RallyUp</CardTitle>
              <CardDescription className="text-slate-300">
                Manage your supporter group with ease
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-white/10 border-white/20">
                  <TabsTrigger value="user-login" className="text-white data-[state=active]:bg-sky-400 data-[state=active]:text-slate-900">User</TabsTrigger>
                  <TabsTrigger value="admin-login" className="text-white data-[state=active]:bg-sky-400 data-[state=active]:text-slate-900">Admin</TabsTrigger>
                  <TabsTrigger value="system-owner-login" className="text-white data-[state=active]:bg-sky-400 data-[state=active]:text-slate-900">System</TabsTrigger>
                </TabsList>
                
                <TabsContent value="user-login" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-email" className="text-white">Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-300" />
                      <Input
                        id="user-email"
                        type="email"
                        placeholder="Enter your email"
                        value={userLoginData.email}
                        onChange={(e) => setUserLoginData({ ...userLoginData, email: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="user-login-country-code" className="text-white">Country Code</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-300" />
                        <Input
                          id="user-login-country-code"
                          type="text"
                          placeholder="+1"
                          value={userLoginData.countryCode}
                          onChange={(e) => setUserLoginData({ ...userLoginData, countryCode: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="user-login-phone" className="text-white">Phone Number</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-300" />
                        <Input
                          id="user-login-phone"
                          type="tel"
                          placeholder="Enter your phone number"
                          value={userLoginData.phoneNumber}
                          onChange={(e) => setUserLoginData({ ...userLoginData, phoneNumber: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                  {!userLoginOtpSent ? (
                    <Button onClick={handleUserLoginVerifyNumber} className="w-full bg-sky-400 text-slate-900 hover:bg-sky-300">
                      Send OTP
                      <Phone className="ml-2 w-4 h-4" />
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="user-login-otp" className="text-white">OTP Code</Label>
                        <Input
                          id="user-login-otp"
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={userLoginOtp}
                          onChange={(e) => setUserLoginOtp(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        />
                      </div>
                      <Button onClick={handleUserLogin} className="w-full bg-sky-400 text-slate-900 hover:bg-sky-300" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign In"}
                        <LogIn className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("user-register")} 
                    className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                  >
                    Create Account
                    <UserPlus className="ml-2 w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => router.push("/clubs")} 
                    className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                  >
                    Browse Clubs
                    <Building2 className="ml-2 w-4 h-4" />
                  </Button>
                </TabsContent>

                <TabsContent value="user-register" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-name" className="text-white">Full Name</Label>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-300" />
                      <Input
                        id="user-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={userRegisterData.name}
                        onChange={(e) => setUserRegisterData({ ...userRegisterData, name: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-register-email" className="text-white">Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-300" />
                      <Input
                        id="user-register-email"
                        type="email"
                        placeholder="Enter your email"
                        value={userRegisterData.email}
                        onChange={(e) => setUserRegisterData({ ...userRegisterData, email: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="user-country-code" className="text-white">Country Code</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-300" />
                        <Input
                          id="user-country-code"
                          type="text"
                          placeholder="+1"
                          value={userRegisterData.countryCode}
                          onChange={(e) => setUserRegisterData({ ...userRegisterData, countryCode: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="user-phone" className="text-white">Phone Number</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-300" />
                        <Input
                          id="user-phone"
                          type="tel"
                          placeholder="Enter your phone number"
                          value={userRegisterData.phoneNumber}
                          onChange={(e) => setUserRegisterData({ ...userRegisterData, phoneNumber: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
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
                      className="flex-1 border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                    >
                      {userOtpSent ? "OTP Sent ✓" : "Verify Number"}
                    </Button>
                  </div>
                  {userOtpSent && (
                    <div className="space-y-2">
                      <Label htmlFor="user-otp" className="text-white">Enter OTP</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="user-otp"
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={userOtp}
                          onChange={(e) => setUserOtp(e.target.value)}
                          maxLength={6}
                          className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-slate-400"
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
                          className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                        >
                          Resend
                        </Button>
                      </div>
                    </div>
                  )}

                  <Button onClick={handleUserRegister} className="w-full bg-sky-400 text-slate-900 hover:bg-sky-300" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                    <UserPlus className="ml-2 w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("user-login")} 
                    className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                  >
                    Back to Login
                    <LogIn className="ml-2 w-4 h-4" />
                  </Button>
                </TabsContent>

                <TabsContent value="admin-login" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email" className="text-white">Admin Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-300" />
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder="Enter admin email"
                        value={adminLoginData.email}
                        onChange={(e) => setAdminLoginData({ ...adminLoginData, email: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="admin-login-country-code" className="text-white">Country Code</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-300" />
                        <Input
                          id="admin-login-country-code"
                          type="text"
                          placeholder="+1"
                          value={adminLoginData.countryCode}
                          onChange={(e) => setAdminLoginData({ ...adminLoginData, countryCode: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="admin-login-phone" className="text-white">Phone Number</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-300" />
                        <Input
                          id="admin-login-phone"
                          type="tel"
                          placeholder="Enter admin phone number"
                          value={adminLoginData.phoneNumber}
                          onChange={(e) => setAdminLoginData({ ...adminLoginData, phoneNumber: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                  {!adminLoginOtpSent ? (
                    <Button onClick={handleAdminLoginVerifyNumber} className="w-full bg-sky-400 text-slate-900 hover:bg-sky-300">
                      Send OTP
                      <Phone className="ml-2 w-4 h-4" />
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin-login-otp" className="text-white">OTP Code</Label>
                        <Input
                          id="admin-login-otp"
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={adminLoginOtp}
                          onChange={(e) => setAdminLoginOtp(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        />
                      </div>
                      <Button onClick={handleAdminLogin} className="w-full bg-sky-400 text-slate-900 hover:bg-sky-300" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Admin Sign In"}
                        <Shield className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("admin-register")} 
                    className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                  >
                    Create Admin Account
                    <UserPlus className="ml-2 w-4 h-4" />
                  </Button>
                </TabsContent>

                <TabsContent value="admin-register" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-name" className="text-white">Admin Name</Label>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-300" />
                      <Input
                        id="admin-name"
                        type="text"
                        placeholder="Enter admin name"
                        value={adminRegisterData.name}
                        onChange={(e) => setAdminRegisterData({ ...adminRegisterData, name: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-register-email" className="text-white">Admin Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-300" />
                      <Input
                        id="admin-register-email"
                        type="email"
                        placeholder="Enter admin email"
                        value={adminRegisterData.email}
                        onChange={(e) => setAdminRegisterData({ ...adminRegisterData, email: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="admin-country-code" className="text-white">Country Code</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-300" />
                        <Input
                          id="admin-country-code"
                          type="text"
                          placeholder="+1"
                          value={adminRegisterData.countryCode}
                          onChange={(e) => setAdminRegisterData({ ...adminRegisterData, countryCode: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="admin-phone" className="text-white">Phone Number</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-300" />
                        <Input
                          id="admin-phone"
                          type="tel"
                          placeholder="Enter phone number"
                          value={adminRegisterData.phoneNumber}
                          onChange={(e) => setAdminRegisterData({ ...adminRegisterData, phoneNumber: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
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
                      className="flex-1 border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                    >
                      {adminOtpSent ? "OTP Sent ✓" : "Verify Number"}
                    </Button>
                  </div>
                  {adminOtpSent && (
                    <div className="space-y-2">
                      <Label htmlFor="admin-otp" className="text-white">Enter OTP</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="admin-otp"
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={adminOtp}
                          onChange={(e) => setAdminOtp(e.target.value)}
                          maxLength={6}
                          className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-slate-400"
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
                          className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                        >
                          Resend
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="admin-code" className="text-white">Admin Code</Label>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-slate-300" />
                      <Input
                        id="admin-code"
                        type="text"
                        placeholder="Enter admin registration code"
                        value={adminRegisterData.adminCode}
                        onChange={(e) => setAdminRegisterData({ ...adminRegisterData, adminCode: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <Button onClick={handleAdminRegister} className="w-full bg-sky-400 text-slate-900 hover:bg-sky-300" disabled={isLoading}>
                    {isLoading ? "Creating admin account..." : "Create Admin Account"}
                    <Shield className="ml-2 w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("admin-login")} 
                    className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                  >
                    Back to Admin Login
                    <LogIn className="ml-2 w-4 h-4" />
                  </Button>
                </TabsContent>

                <TabsContent value="system-owner-login" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="system-owner-email" className="text-white">Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-300" />
                      <Input
                        id="system-owner-email"
                        type="email"
                        placeholder="Enter your email"
                        value={systemOwnerLoginData.email}
                        onChange={(e) => setSystemOwnerLoginData({ ...systemOwnerLoginData, email: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="system-owner-login-country-code" className="text-white">Country Code</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-300" />
                        <Input
                          id="system-owner-login-country-code"
                          type="text"
                          placeholder="+1"
                          value={systemOwnerLoginData.countryCode}
                          onChange={(e) => setSystemOwnerLoginData({ ...systemOwnerLoginData, countryCode: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="system-owner-login-phone" className="text-white">Phone Number</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-300" />
                        <Input
                          id="system-owner-login-phone"
                          type="tel"
                          placeholder="Enter your phone number"
                          value={systemOwnerLoginData.phoneNumber}
                          onChange={(e) => setSystemOwnerLoginData({ ...systemOwnerLoginData, phoneNumber: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                  {!systemOwnerLoginOtpSent ? (
                    <Button onClick={handleSystemOwnerLoginVerifyNumber} className="w-full bg-sky-400 text-slate-900 hover:bg-sky-300">
                      Send OTP
                      <Phone className="ml-2 w-4 h-4" />
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="system-owner-login-otp" className="text-white">OTP Code</Label>
                        <Input
                          id="system-owner-login-otp"
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={systemOwnerLoginOtp}
                          onChange={(e) => setSystemOwnerLoginOtp(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        />
                      </div>
                      <Button onClick={handleSystemOwnerLogin} className="w-full bg-sky-400 text-slate-900 hover:bg-sky-300" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "System Owner Sign In"}
                        <Crown className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("system-owner-register")} 
                    className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                  >
                    Create System Owner Account
                    <Crown className="ml-2 w-4 h-4" />
                  </Button>
                </TabsContent>

                <TabsContent value="system-owner-register" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="system-owner-name" className="text-white">Full Name</Label>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-300" />
                      <Input
                        id="system-owner-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={systemOwnerRegisterData.name}
                        onChange={(e) => setSystemOwnerRegisterData({ ...systemOwnerRegisterData, name: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="system-owner-register-email" className="text-white">Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-300" />
                      <Input
                        id="system-owner-register-email"
                        type="email"
                        placeholder="Enter your email"
                        value={systemOwnerRegisterData.email}
                        onChange={(e) => setSystemOwnerRegisterData({ ...systemOwnerRegisterData, email: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="system-owner-country-code" className="text-white">Country Code</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-300" />
                        <Input
                          id="system-owner-country-code"
                          type="text"
                          placeholder="+1"
                          value={systemOwnerRegisterData.countryCode}
                          onChange={(e) => setSystemOwnerRegisterData({ ...systemOwnerRegisterData, countryCode: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="system-owner-phone" className="text-white">Phone Number</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-300" />
                        <Input
                          id="system-owner-phone"
                          type="tel"
                          placeholder="Enter phone number"
                          value={systemOwnerRegisterData.phoneNumber}
                          onChange={(e) => setSystemOwnerRegisterData({ ...systemOwnerRegisterData, phoneNumber: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleSystemOwnerVerifyNumber}
                      disabled={systemOwnerOtpSent || !systemOwnerRegisterData.phoneNumber || !systemOwnerRegisterData.countryCode}
                      className="flex-1 border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                    >
                      {systemOwnerOtpSent ? "OTP Sent ✓" : "Verify Number"}
                    </Button>
                  </div>
                  {systemOwnerOtpSent && (
                    <div className="space-y-2">
                      <Label htmlFor="system-owner-otp" className="text-white">Enter OTP</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="system-owner-otp"
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={systemOwnerOtp}
                          onChange={(e) => setSystemOwnerOtp(e.target.value)}
                          maxLength={6}
                          className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setSystemOwnerOtpSent(false)
                            setSystemOwnerOtp("")
                            setGeneratedOtp("")
                          }}
                          size="sm"
                          className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                        >
                          Resend
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="system-owner-access-key" className="text-white">Access Key</Label>
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-slate-300" />
                      <Input
                        id="system-owner-access-key"
                        type="text"
                        placeholder="Enter system owner access key"
                        value={systemOwnerRegisterData.accessKey}
                        onChange={(e) => setSystemOwnerRegisterData({ ...systemOwnerRegisterData, accessKey: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <Button onClick={handleSystemOwnerRegister} className="w-full bg-sky-400 text-slate-900 hover:bg-sky-300" disabled={isLoading}>
                    {isLoading ? "Creating system owner account..." : "Create System Owner Account"}
                    <Crown className="ml-2 w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("system-owner-login")} 
                    className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                  >
                    Back to System Owner Login
                    <LogIn className="ml-2 w-4 h-4" />
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
