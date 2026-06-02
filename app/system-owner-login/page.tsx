"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Mail, Phone, ArrowLeft, Crown, MessageCircle, MessageSquare } from "lucide-react"
import Link from "next/link"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import {
  useSystemOwnerLogin,
  validateSystemOwnerEmail,
  validateSystemOwnerPhone,
} from "@/hooks/useSystemOwnerLogin"

export default function SystemOwnerLoginPage() {
  const {
    loginData,
    setLoginData,
    errors,
    setErrors,
    otpSent,
    otp,
    setOtp,
    isLoading,
    otpButtonLoading,
    resendCountdown,
    handleSendOtp,
    handleResendOtp,
    handleSignIn,
    resetToPhone,
    useEmail,
  } = useSystemOwnerLogin()

  return (
    <div className="public-theme">
      <SiteNavbar brandName="Wingman Pro" />
      <div className="relative min-h-screen">
        <div className="absolute inset-0">
          <div className="absolute top-0 z-[-2] h-full w-full bg-[#000000] bg-[radial-gradient(#ffffff33_1px,#000000_1px)] bg-[size:20px_20px]" />
        </div>

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
          <div className="max-w-md w-full">
            <Card className="backdrop-blur-sm bg-white/10 border-white/20 shadow-2xl">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-sky-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">System Owner Login</CardTitle>
                <CardDescription className="text-slate-300">
                  Sign in with email (SendGrid) or phone (WhatsApp / SMS)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="system-owner-email" className="text-white font-medium">
                    Email
                  </Label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    <Input
                      id="system-owner-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginData.email}
                      disabled={otpSent}
                      onChange={(e) => {
                        const email = e.target.value
                        setLoginData({ ...loginData, email, phoneNumber: "", countryCode: "+91" })
                        setErrors({ ...errors, email: validateSystemOwnerEmail(email) })
                      }}
                      onBlur={(e) => {
                        setErrors({ ...errors, email: validateSystemOwnerEmail(e.target.value) })
                      }}
                      className={`bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400 ${errors.email ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
                </div>

                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-1 h-px bg-white/30" />
                    <div className="text-white text-sm font-medium px-3">OR</div>
                    <div className="flex-1 h-px bg-white/30" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="system-owner-login-country-code" className="text-white font-medium">
                      Country Code
                    </Label>
                    <Input
                      id="system-owner-login-country-code"
                      type="text"
                      placeholder="+91"
                      value={loginData.countryCode}
                      disabled={otpSent || useEmail}
                      onChange={(e) => setLoginData({ ...loginData, countryCode: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 disabled:opacity-50"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="system-owner-login-phone" className="text-white font-medium">
                      Phone Number
                    </Label>
                    <Input
                      id="system-owner-login-phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={loginData.phoneNumber}
                      disabled={otpSent || useEmail}
                      onChange={(e) => {
                        const phone = e.target.value.replace(/\D/g, "")
                        setLoginData({ ...loginData, phoneNumber: phone, email: "" })
                        setErrors({ ...errors, phoneNumber: validateSystemOwnerPhone(phone) })
                      }}
                      onBlur={(e) => {
                        setErrors({ ...errors, phoneNumber: validateSystemOwnerPhone(e.target.value) })
                      }}
                      className={`bg-white/10 border-white/20 text-white placeholder:text-slate-400 disabled:opacity-50 ${errors.phoneNumber ? "border-red-500" : ""}`}
                    />
                    {errors.phoneNumber && (
                      <p className="text-red-400 text-sm">{errors.phoneNumber}</p>
                    )}
                  </div>
                </div>

                {!otpSent ? (
                  <Button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={
                      otpButtonLoading ||
                      (!loginData.email.trim() &&
                        (!loginData.phoneNumber || !loginData.countryCode))
                    }
                    className="w-full bg-sky-400 text-slate-900 hover:bg-sky-300 h-12 text-lg font-medium"
                  >
                    {otpButtonLoading ? "Sending OTP…" : "Send OTP"}
                    <Phone className="ml-2 w-4 h-4" />
                  </Button>
                ) : (
                  <div className="space-y-4">
                    {useEmail && (
                      <p className="text-slate-300 text-sm">
                        A 6-digit code has been sent to{" "}
                        <strong className="text-white">{loginData.email}</strong>. Enter it below.
                      </p>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="system-owner-login-otp" className="text-white font-medium">
                        OTP Code
                      </Label>
                      <Input
                        id="system-owner-login-otp"
                        type="text"
                        inputMode="numeric"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400 h-12 text-center text-lg tracking-widest"
                        maxLength={6}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={handleSignIn}
                        className="flex-1 bg-sky-400 text-slate-900 hover:bg-sky-300 h-12 text-lg font-medium"
                        disabled={isLoading}
                      >
                        {isLoading ? "Signing in…" : "System Owner Sign In"}
                        <Crown className="ml-2 w-4 h-4" />
                      </Button>
                      {useEmail && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleResendOtp()}
                          disabled={resendCountdown > 0}
                          className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 h-12 px-4"
                        >
                          {resendCountdown > 0 ? `Resend (${resendCountdown}s)` : "Resend"}
                        </Button>
                      )}
                    </div>
                    {!useEmail && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          onClick={() => handleResendOtp("whatsapp")}
                          disabled={resendCountdown > 0}
                          className="bg-green-700 hover:bg-green-600 text-white h-11 text-xs sm:text-sm gap-1.5"
                        >
                          <MessageCircle className="w-4 h-4 shrink-0" />
                          {resendCountdown > 0 ? `Resend (${resendCountdown}s)` : "Resend via WhatsApp"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleResendOtp("sms")}
                          disabled={resendCountdown > 0}
                          className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 h-11 text-xs sm:text-sm gap-1.5"
                        >
                          <MessageSquare className="w-4 h-4 shrink-0" />
                          {resendCountdown > 0 ? `Resend (${resendCountdown}s)` : "Resend via SMS"}
                        </Button>
                      </div>
                    )}
                    {useEmail && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetToPhone}
                        className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700 h-11"
                      >
                        Use Phone Instead
                      </Button>
                    )}
                  </div>
                )}

                <Link href="/login?tab=system-owner-login" className="block">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                  >
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Main login (System tab)
                  </Button>
                </Link>

                <div className="text-center">
                  <Link
                    href="/login?tab=system-owner-register"
                    className="text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    Don&apos;t have a system owner account? Register
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <SiteFooter brandName="Wingman Pro" />
    </div>
  )
}
