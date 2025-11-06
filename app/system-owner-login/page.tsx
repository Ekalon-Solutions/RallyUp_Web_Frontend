"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Mail, Phone, ArrowLeft, Crown } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { useAuth } from "@/contexts/auth-context"

export default function SystemOwnerLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [generatedOtp, setGeneratedOtp] = useState("")
  const [resendCountdown, setResendCountdown] = useState(0)
  const [formData, setFormData] = useState({
    email: "",
    phoneNumber: "",
    countryCode: "+1"
  })

  const router = useRouter()
  const { login } = useAuth()

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  const handleSendOTP = () => {
    if (!formData.email && (!formData.phoneNumber || !formData.countryCode)) {
      toast.error("Please enter either email or phone number with country code")
      return
    }
    
    const otp = generateOTP()
    setGeneratedOtp(otp)
    
    if (formData.email) {
      toast.success(`OTP sent to ${formData.email}. Code: ${otp}`)
    } else {
      toast.success(`OTP sent to ${formData.countryCode}${formData.phoneNumber}. Code: ${otp}`)
    }
    setOtpSent(true)
    setResendCountdown(10)
  }

  const handleResendOTP = () => {
    if (formData.phoneNumber && formData.countryCode) {
      toast.success(`OTP resent to ${formData.countryCode}${formData.phoneNumber}. Code: ${generatedOtp}`)
      setResendCountdown(10)
    } else if (formData.email) {
      toast.success(`OTP resent to ${formData.email}. Code: ${generatedOtp}`)
      setResendCountdown(10)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otpSent) {
      toast.error("Please verify your phone number first")
      return
    }

    if (otp !== generatedOtp) {
      toast.error("Invalid OTP. Please check and try again")
      return
    }

    setIsLoading(true)

    try {
      const result = await login(formData.email, formData.phoneNumber, formData.countryCode, false, true)
      
      if (result.success) {
        toast.success("System owner login successful!")
        router.push("/dashboard")
      } else {
        toast.error(result.error || "Failed to login as system owner")
      }
    } catch (error) {
      console.error("System owner login error:", error)
      toast.error("An error occurred during system owner login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <SiteNavbar brandName="Wingman Pro" />
      <div className="relative min-h-screen">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-0 z-[-2] h-full w-full bg-[#000000] bg-[radial-gradient(#ffffff33_1px,#000000_1px)] bg-[size:20px_20px]"></div>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
          <div className="max-w-md w-full">
            <Card className="backdrop-blur-sm bg-white/10 border-white/20 shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-sky-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">System Owner Login</CardTitle>
              <CardDescription className="text-slate-300">
                Access the Wingman Pro platform as a system owner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-300" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="country-code" className="text-white">Country Code</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-300" />
                      <Input
                        id="country-code"
                        type="text"
                        placeholder="+1"
                        value={formData.countryCode}
                        onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                        required
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="phone" className="text-white">Phone Number</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-300" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        required
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {!otpSent ? (
                  <Button 
                    type="button" 
                    onClick={handleSendOTP} 
                    disabled={!formData.email && (!formData.phoneNumber || !formData.countryCode)}
                    className="w-full bg-sky-400 text-slate-900 hover:bg-sky-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send OTP
                    <Phone className="ml-2 w-4 h-4" />
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp" className="text-white">OTP Code</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        maxLength={6}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="submit" className="flex-1 bg-sky-400 text-slate-900 hover:bg-sky-300" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign In as System Owner"}
                        <Crown className="ml-2 w-4 h-4" />
                      </Button>
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={handleResendOTP}
                        disabled={resendCountdown > 0}
                        className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 px-4"
                      >
                        {resendCountdown > 0 ? `Resend (${resendCountdown}s)` : "Resend"}
                      </Button>
                    </div>
                  </div>
                )}

                <Link href="/" className="block">
                  <Button variant="outline" className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700">
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Back to Main Login
                  </Button>
                </Link>

                <div className="text-center">
                  <Link href="/system-owner" className="text-sm text-slate-300 hover:text-white transition-colors">
                    Don't have a system owner account? Create one
                  </Link>
                </div>
              </form>
            </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <SiteFooter brandName="Wingman Pro" />
    </>
  )
} 