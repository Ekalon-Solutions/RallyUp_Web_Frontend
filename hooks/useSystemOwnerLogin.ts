"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

declare global {
  interface Window {
    otpSessionInfo?: string
  }
}

export function validateSystemOwnerEmail(email: string): string {
  if (!email) return ""
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return "Please enter a valid email address"
  return ""
}

export function validateSystemOwnerPhone(phone: string): string {
  if (!phone) return ""
  if (!/^\d{9,15}$/.test(phone)) return "Phone number must be 9-15 digits"
  return ""
}

const RESEND_SECONDS = 30

export function useSystemOwnerLogin() {
  const router = useRouter()
  const { login, checkAuth } = useAuth()

  const [loginData, setLoginData] = useState({
    email: "",
    phoneNumber: "",
    countryCode: "+91",
  })
  const [errors, setErrors] = useState({ email: "", phoneNumber: "" })
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [otpButtonLoading, setOtpButtonLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)

  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCountdown])

  const sendPhoneOtp = useCallback(async () => {
    if (!loginData.phoneNumber || !loginData.countryCode) {
      toast.error("Please provide a valid phone number and country code.")
      return
    }
    setOtpButtonLoading(true)
    try {
      const res = await apiClient.sendOtp({
        phoneNumber: loginData.phoneNumber,
        countryCode: loginData.countryCode,
        role: "system_owner",
      })
      if (res.success) {
        const phoneNumber = `${loginData.countryCode}${loginData.phoneNumber}`
        const channel = res.data?.deliveryChannel || "SMS"
        const channelText = channel === "whatsapp" ? "WhatsApp" : "SMS"
        toast.success(`OTP sent via ${channelText} to ${phoneNumber}`)
        setOtpSent(true)
        setResendCountdown(RESEND_SECONDS)
        window.otpSessionInfo = res.data?.sessionInfo
      } else {
        toast.error(res.message || res.error || "Failed to send OTP. Please try again.")
      }
    } catch (error) {
      console.error("Error sending OTP:", error)
      toast.error("Failed to send OTP. Please try again.")
    } finally {
      setOtpButtonLoading(false)
    }
  }, [loginData.countryCode, loginData.phoneNumber])

  const sendEmailOtp = useCallback(async () => {
    const emailError = validateSystemOwnerEmail(loginData.email)
    if (emailError) {
      setErrors((e) => ({ ...e, email: emailError }))
      toast.error(emailError)
      return
    }
    setOtpButtonLoading(true)
    try {
      const res = await apiClient.sendOtp({
        email: loginData.email.trim(),
        role: "system_owner",
      })
      if (res.success) {
        toast.success(`Code sent to ${loginData.email}. Check your email.`)
        setOtpSent(true)
        setResendCountdown(RESEND_SECONDS)
      } else {
        toast.error(res.message || res.error || "Failed to send code.")
      }
    } catch {
      toast.error("Failed to send sign-in code. Please try again.")
    } finally {
      setOtpButtonLoading(false)
    }
  }, [loginData.email])

  const handleSendOtp = useCallback(async () => {
    if (loginData.email.trim()) {
      await sendEmailOtp()
      return
    }
    if (loginData.phoneNumber && loginData.countryCode) {
      await sendPhoneOtp()
      return
    }
    toast.error("Please enter either email or phone number")
  }, [loginData, sendEmailOtp, sendPhoneOtp])

  const handleResendOtp = useCallback(
    async (channel?: "whatsapp" | "sms") => {
      if (loginData.email.trim()) {
        try {
          const res = await apiClient.sendOtp({
            email: loginData.email.trim(),
            role: "system_owner",
          })
          if (res.success) {
            toast.success(`Code resent to ${loginData.email}.`)
            setResendCountdown(RESEND_SECONDS)
          } else {
            toast.error(res.message || res.error || "Failed to resend code.")
          }
        } catch {
          toast.error("Failed to resend code. Please try again.")
        }
        return
      }

      if (!loginData.phoneNumber || !loginData.countryCode) return

      try {
        const res = await apiClient.resendOTP({
          phoneNumber: loginData.phoneNumber,
          countryCode: loginData.countryCode,
          role: "system_owner",
          channel,
        })
        if (res.success) {
          const phoneNumber = `${loginData.countryCode}${loginData.phoneNumber}`
          const ch = res.data?.deliveryChannel || "sms"
          const channelText = ch === "whatsapp" ? "WhatsApp" : "SMS"
          toast.success(`OTP resent via ${channelText} to ${phoneNumber}`)
          setResendCountdown(RESEND_SECONDS)
          window.otpSessionInfo = res.data?.sessionInfo
        } else {
          toast.error(res.message || res.error || "Failed to resend OTP.")
        }
      } catch {
        toast.error("Failed to resend OTP. Please try again.")
      }
    },
    [loginData]
  )

  const completeSession = useCallback(async () => {
    await checkAuth()
    toast.success("System Owner signed in successfully!")
    router.push("/dashboard")
  }, [checkAuth, router])

  const handleSignIn = useCallback(async () => {
    if (!otpSent) {
      toast.error("Please request the OTP first.")
      return
    }
    if (!otp || otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP.")
      return
    }

    setIsLoading(true)
    try {
      if (loginData.email.trim()) {
        const res = await apiClient.verifyEmailOTP({
          email: loginData.email.trim(),
          otp,
          role: "system_owner",
        })
        if (res.success && res.data?.token) {
          localStorage.setItem("token", res.data.token)
          localStorage.setItem("userType", "system_owner")
          await completeSession()
        } else {
          toast.error(res.message || res.error || "Invalid or expired code. Please try again.")
        }
        return
      }

      const verifyRes = await apiClient.verifyOTP({
        phoneNumber: loginData.phoneNumber,
        countryCode: loginData.countryCode,
        otp,
        role: "system_owner",
        sessionInfo: window.otpSessionInfo,
      })

      if (!verifyRes.success) {
        toast.error(verifyRes.message || verifyRes.error || "Invalid or expired OTP. Please try again.")
        return
      }

      const loginRes = await login(
        "",
        loginData.phoneNumber,
        loginData.countryCode,
        false,
        true
      )
      if (loginRes.success) {
        await completeSession()
      } else {
        toast.error(loginRes.error || "System Owner login failed. Please check your credentials.")
      }
    } catch (error) {
      console.error("OTP verification error:", error)
      toast.error("Invalid OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [otp, otpSent, loginData, login, completeSession])

  const resetToPhone = useCallback(() => {
    setOtpSent(false)
    setOtp("")
    setLoginData((d) => ({ ...d, email: "" }))
  }, [])

  return {
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
    useEmail: Boolean(loginData.email.trim()),
  }
}
