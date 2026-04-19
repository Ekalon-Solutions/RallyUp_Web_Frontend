"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Shield, Mail, Phone, UserPlus, LogIn, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth"
import { auth } from "@/lib/firebase/config"

type Tab = "user" | "admin"

const COUNTRY_CODES = ["+91", "+1", "+44", "+61", "+971", "+65", "+81", "+49", "+33", "+86"]

const validateEmail = (email: string) => {
  if (!email) return ""
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Please enter a valid email address"
}

const validatePhone = (phone: string) => {
  if (!phone) return ""
  return /^\d{9,15}$/.test(phone) ? "" : "Phone number must be 9–15 digits"
}

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const { login, isAuthenticated } = useAuth()
  const router = useRouter()

  const [tab, setTab] = useState<Tab>("user")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [countryCode, setCountryCode] = useState("+91")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [emailError, setEmailError] = useState("")
  const [phoneError, setPhoneError] = useState("")

  const role = tab === "user" ? "user" : "admin"

  const resetForm = () => {
    setEmail("")
    setPhone("")
    setOtp("")
    setOtpSent(false)
    setSending(false)
    setVerifying(false)
    setResendCountdown(0)
    setEmailError("")
    setPhoneError("")
  }

  const startResendCountdown = () => {
    setResendCountdown(30)
    const tick = setInterval(() => {
      setResendCountdown((c) => {
        if (c <= 1) { clearInterval(tick); return 0 }
        return c - 1
      })
    }, 1000)
  }

  const handleSendOtp = async () => {
    if (!email && !phone) {
      toast.error("Please enter your email or phone number")
      return
    }

    if (email) {
      const err = validateEmail(email)
      if (err) { setEmailError(err); return }
      setSending(true)
      try {
        const res = await apiClient.sendOtp({ email, role })
        if (res.success) {
          toast.success(`Code sent to ${email}`)
          setOtpSent(true)
          startResendCountdown()
        } else {
          toast.error(res.message || res.error || "Failed to send OTP")
        }
      } catch {
        toast.error("Failed to send OTP. Please try again.")
      } finally {
        setSending(false)
      }
    } else {
      const err = validatePhone(phone)
      if (err) { setPhoneError(err); return }
      setSending(true)
      try {
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, "modal-recaptcha-container", {
            size: "invisible",
            callback: () => { },
          })
        }
        const confirmation = await signInWithPhoneNumber(auth, `${countryCode}${phone}`, window.recaptchaVerifier)
        window.confirmationResult = confirmation
        toast.success(`OTP sent to ${countryCode}${phone}`)
        setOtpSent(true)
        startResendCountdown()
      } catch {
        toast.error("Failed to send OTP. Please try again.")
      } finally {
        setSending(false)
      }
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp) { toast.error("Please enter the OTP"); return }
    setVerifying(true)
    try {
      if (email) {
        const res = await apiClient.verifyEmailOTP({ email, otp, role })
        if (res.success && (res.data as any)?.token) {
          localStorage.setItem("token", (res.data as any).token)
          localStorage.setItem("userType", tab === "user" ? "member" : "admin")
          toast.success("Signed in successfully!")
          onOpenChange(false)
          window.location.href = tab === "user" ? "/dashboard" : "/dashboard"
        } else {
          toast.error(res.message || res.error || "Invalid OTP")
        }
      } else {
        const confirmationResult = window.confirmationResult
        const result = await confirmationResult.confirm(otp)
        if (result.user) {
          const backendResult = await login(email, phone, countryCode, tab === "admin")
          if (backendResult?.success) {
            toast.success("Signed in successfully!")
            onOpenChange(false)
          } else {
            toast.error(backendResult?.error || "Login failed")
          }
        }
      }
    } catch {
      toast.error("Invalid OTP. Please try again.")
    } finally {
      setVerifying(false)
    }
  }

  const handleTabChange = (t: Tab) => {
    setTab(t)
    resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v) }}>
      <DialogContent className="p-0 gap-0 max-w-[420px] w-full overflow-hidden rounded-2xl border-0 shadow-2xl" hideCloseButton>
        {/* Header */}
        <div className="relative bg-primary px-5 pt-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => { resetForm(); onOpenChange(false) }}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 text-white/70 text-xs">
              <span>Powered By</span>
              <span className="text-base">✨</span>
            </div>
          </div>

          {/* Logo */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-background shadow">
              <Image src="/WingmanPro Logo (White BG).svg" alt="Wingman Pro" fill className="object-contain p-1.5" />
            </div>
            <span className="text-white font-black text-lg tracking-wide">
              WINGMAN <span className="text-[#f1441a]">PRO</span>
            </span>
          </div>

          {/* Tabs */}
          <div className="flex mt-5 rounded-full bg-white/10 p-1 gap-1">
            <button
              onClick={() => handleTabChange("user")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-semibold transition-all ${tab === "user" ? "bg-background text-primary" : "text-white/80 hover:text-white"
                }`}
            >
              <User className="w-4 h-4" />
              User
            </button>
            <button
              onClick={() => handleTabChange("admin")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-semibold transition-all ${tab === "admin" ? "bg-background text-primary" : "text-white/80 hover:text-white"
                }`}
            >
              <Shield className="w-4 h-4" />
              Admin
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="bg-card px-6 py-6 space-y-5">
          <div>
            <h2 className="text-2xl font-black text-card-foreground">
              Welcome, <span className="text-[#f1441a]">Champ!</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Login made easy! Enter your details and we'll send you a secure OTP.
            </p>
          </div>

          {!otpSent ? (
            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(""); if (e.target.value) setPhone("") }}
                    disabled={!!phone}
                    className="pl-9 h-12 rounded-xl border-input focus:border-primary disabled:opacity-40"
                  />
                </div>
                {emailError && <p className="text-red-500 text-xs">{emailError}</p>}
              </div>

              {/* OR */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-semibold text-muted-foreground">OR</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-1">
                  <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Country Code</label>
                  <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Country Code</label>
                </div>
                <div className="flex gap-2">
                  <div className="relative w-[100px]">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      disabled={!!email}
                      className="w-full h-12 pl-8 pr-2 rounded-xl border border-input text-sm font-medium text-foreground bg-background focus:outline-none focus:border-primary disabled:opacity-40 appearance-none"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setPhoneError(""); if (e.target.value) setEmail("") }}
                      disabled={!!email}
                      className="pl-9 h-12 rounded-xl border-input focus:border-primary disabled:opacity-40"
                    />
                  </div>
                </div>
                {phoneError && <p className="text-red-500 text-xs">{phoneError}</p>}
              </div>

              <div id="modal-recaptcha-container" />

              <Button
                onClick={handleSendOtp}
                disabled={sending || (!email && !phone)}
                className="w-full h-12 rounded-xl bg-[#f1441a] hover:bg-[#d93c16] text-white font-bold text-sm gap-2"
              >
                {sending ? "Sending..." : "Send OTP"}
                <Phone className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                A 6-digit code was sent to <strong className="text-card-foreground">{email || `${countryCode}${phone}`}</strong>
              </p>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">OTP Code</label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="h-12 rounded-xl text-center text-xl tracking-[0.4em] border-input focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleVerifyOtp}
                  disabled={verifying || otp.length < 6}
                  className="flex-1 h-12 rounded-xl bg-[#f1441a] hover:bg-[#d93c16] text-white font-bold gap-2"
                >
                  {verifying ? "Verifying..." : "Sign In"}
                  <LogIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSendOtp}
                  disabled={resendCountdown > 0 || sending}
                  className="h-12 px-4 rounded-xl border-input text-muted-foreground"
                >
                  {resendCountdown > 0 ? `${resendCountdown}s` : "Resend"}
                </Button>
              </div>
              <button
                onClick={resetForm}
                className="text-xs text-muted-foreground hover:text-foreground underline w-full text-center"
              >
                ← Back
              </button>
            </div>
          )}

          <Link href={`/login?tab=${tab}-register`} onClick={() => onOpenChange(false)}>
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl bg-[#3b3b6b] border-[#3b3b6b] text-white hover:bg-[#4f4f8a] hover:text-white font-bold text-sm gap-2"
            >
              Create Account
              <UserPlus className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}
