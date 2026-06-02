"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Phone, CheckCircle2, Info, MessageCircle } from "lucide-react"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"

const PURCHASE_INTENT_KEY = "rallyup_purchase_intent"

export interface PurchaseIntentMerchandiseItem {
  _id: string
  name: string
  price: number
  currency: string
  quantity?: number
  featuredImage?: string
  stockQuantity?: number
  tags?: string[]
  club: { _id: string; name: string; logo?: string }
}

export type PurchaseIntent =
  | {
      type: "event"
      clubId: string
      slug?: string
      eventId: string
      event?: unknown
      attendees: Array<{ name: string; phone: string }>
      couponCode?: string
      waitlistToken?: string | null
      returnPath: string
    }
  | {
      type: "merchandise"
      clubId: string
      slug?: string
      item: PurchaseIntentMerchandiseItem
      returnPath: string
    }

export function parsePhoneForValidation(
  phone: string,
  fallbackCountryCode = "+91"
): { countryCode: string; mobileNumber: string } {
  const trimmed = phone.trim()
  if (!trimmed) {
    return { countryCode: fallbackCountryCode, mobileNumber: "" }
  }

  if (trimmed.startsWith("+")) {
    const match = trimmed.match(/^(\+\d{1,4})(\d{6,15})$/)
    if (match) {
      return { countryCode: match[1], mobileNumber: match[2] }
    }
  }

  const digits = trimmed.replace(/\D/g, "")
  return { countryCode: fallbackCountryCode, mobileNumber: digits }
}

export function formatPhoneForDisplay(countryCode: string, mobileNumber: string): string {
  const code = countryCode.trim() || "+91"
  const digits = mobileNumber.replace(/\D/g, "")
  if (!digits) return ""
  return `${code.startsWith("+") ? code : `+${code}`} ${digits}`
}

export function getStoredPurchaseIntent(): PurchaseIntent | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(PURCHASE_INTENT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PurchaseIntent
  } catch {
    return null
  }
}

export function setStoredPurchaseIntent(intent: PurchaseIntent | null): void {
  if (typeof window === "undefined") return
  try {
    if (intent) localStorage.setItem(PURCHASE_INTENT_KEY, JSON.stringify(intent))
    else localStorage.removeItem(PURCHASE_INTENT_KEY)
  } catch {
  }
}

export function clearStoredPurchaseIntent(): void {
  setStoredPurchaseIntent(null)
}

interface PurchaseFlowModalProps {
  isOpen: boolean
  onClose: () => void
  clubId: string
  clubName?: string
  onContinueToPayment: () => void
  onLogin?: (returnUrl: string) => void
  onRegister?: (returnUrl: string) => void
  returnPath: string
  /** When set (e.g. from attendee step), membership is checked automatically — no second phone prompt. */
  initialMobileNumber?: string
  initialCountryCode?: string
}

export function PurchaseFlowModal({
  isOpen,
  onClose,
  clubId,
  clubName,
  onContinueToPayment,
  onLogin,
  onRegister,
  returnPath,
  initialMobileNumber,
  initialCountryCode = "+91",
}: PurchaseFlowModalProps) {
  const [mobileNumber, setMobileNumber] = useState("")
  const [countryCode, setCountryCode] = useState("+91")
  const [loading, setLoading] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    isMember: boolean
    message?: string
  } | null>(null)
  const [allowManualEntry, setAllowManualEntry] = useState(false)
  const autoValidatedRef = useRef(false)
  const otpAutoSendRef = useRef(false)

  const [phoneVerified, setPhoneVerified] = useState(false)
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpSessionInfo, setOtpSessionInfo] = useState<string | null>(null)
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)

  const usePrefilledPhone = Boolean(initialMobileNumber?.trim()) && !allowManualEntry
  const returnUrl =
    returnPath + (returnPath.includes("?") ? "&" : "?") + "resumePurchase=1"
  const registerNextUrl =
    clubName && clubName.trim()
      ? `/clubs?search=${encodeURIComponent(clubName.trim())}`
      : "/clubs"

  const resetOtpState = () => {
    otpAutoSendRef.current = false
    setPhoneVerified(false)
    setOtp("")
    setOtpSent(false)
    setOtpSessionInfo(null)
    setOtpSending(false)
    setOtpVerifying(false)
    setResendCountdown(0)
  }

  const startResendCountdown = () => {
    setResendCountdown(30)
  }

  const validatePhone = useCallback(
    async (digits: string, code: string) => {
      if (!digits || digits.length < 6 || digits.length > 15) {
        toast.error("Please enter a valid mobile number (6–15 digits)")
        return false
      }

      setLoading(true)
      setValidationResult(null)

      try {
        const response = await apiClient.validateMemberStatus({
          clubId,
          mobileNumber: digits,
          countryCode: code.trim() || "+91",
        })

        if (response.success && response.data) {
          const payload = (response.data as { data?: { isMember?: boolean; message?: string } })?.data ?? response.data
          setValidationResult({ isMember: !!payload?.isMember, message: payload?.message })
          return true
        }

        toast.error(response.message || "Failed to check member status")
        return false
      } catch (error) {
        console.error("Validation error:", error)
        toast.error("An error occurred while checking. Please try again.")
        return false
      } finally {
        setLoading(false)
      }
    },
    [clubId]
  )

  const sendPhoneVerificationOtp = useCallback(async () => {
    const digits = mobileNumber.replace(/\D/g, "")
    if (!digits || digits.length < 6) {
      toast.error("Please enter a valid mobile number")
      return false
    }

    setOtpSending(true)
    try {
      const res = await apiClient.sendGuestPhoneVerificationOTP({
        phoneNumber: digits,
        countryCode: countryCode.trim() || "+91",
      })

      if (res.success && res.data?.sessionInfo) {
        setOtpSessionInfo(res.data.sessionInfo)
        setOtpSent(true)
        startResendCountdown()
        toast.success(`Verification code sent via WhatsApp to ${formatPhoneForDisplay(countryCode, digits)}`)
        return true
      }

      toast.error(res.message || res.error || "Failed to send WhatsApp verification code")
      return false
    } catch (error) {
      console.error("Send phone verification OTP error:", error)
      toast.error("Failed to send verification code. Please try again.")
      return false
    } finally {
      setOtpSending(false)
    }
  }, [mobileNumber, countryCode])

  const handleVerifyPhoneOtp = async () => {
    if (!otp || otp.length < 6) {
      toast.error("Please enter the 6-digit code")
      return
    }

    if (!otpSessionInfo) {
      toast.error("Please request a verification code first")
      return
    }

    const digits = mobileNumber.replace(/\D/g, "")
    setOtpVerifying(true)
    try {
      const res = await apiClient.verifyGuestPhoneVerificationOTP({
        phoneNumber: digits,
        countryCode: countryCode.trim() || "+91",
        otp,
        sessionInfo: otpSessionInfo,
      })

      if (res.success && res.data?.verified) {
        setPhoneVerified(true)
        toast.success("Phone number verified")
      } else {
        toast.error(res.message || res.error || "Invalid or expired code")
      }
    } catch (error) {
      console.error("Verify phone OTP error:", error)
      toast.error("Failed to verify code. Please try again.")
    } finally {
      setOtpVerifying(false)
    }
  }

  const handleResendPhoneOtp = async () => {
    if (resendCountdown > 0) return

    const digits = mobileNumber.replace(/\D/g, "")
    setOtpSending(true)
    try {
      const res = await apiClient.resendGuestPhoneVerificationOTP({
        phoneNumber: digits,
        countryCode: countryCode.trim() || "+91",
      })

      if (res.success && res.data?.sessionInfo) {
        setOtpSessionInfo(res.data.sessionInfo)
        setOtp("")
        startResendCountdown()
        toast.success("Verification code resent via WhatsApp")
      } else {
        toast.error(res.message || res.error || "Failed to resend code")
      }
    } catch (error) {
      console.error("Resend phone OTP error:", error)
      toast.error("Failed to resend code. Please try again.")
    } finally {
      setOtpSending(false)
    }
  }

  const handleNotAMember = () => {
    const digits = mobileNumber.replace(/\D/g, "")
    if (!digits || digits.length < 6 || digits.length > 15) {
      toast.error("Please enter your mobile number first")
      return
    }
    setValidationResult({ isMember: false })
  }

  const handleValidate = async () => {
    const digits = mobileNumber.replace(/\D/g, "")
    await validatePhone(digits, countryCode)
  }

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

  useEffect(() => {
    if (!isOpen) {
      autoValidatedRef.current = false
      setAllowManualEntry(false)
      setMobileNumber("")
      setCountryCode("+91")
      setValidationResult(null)
      setLoading(false)
      resetOtpState()
      return
    }

    if (!initialMobileNumber?.trim() || autoValidatedRef.current) return

    const { countryCode: code, mobileNumber: digits } = parsePhoneForValidation(
      initialMobileNumber,
      initialCountryCode
    )
    setCountryCode(code)
    setMobileNumber(digits)
    autoValidatedRef.current = true
    void validatePhone(digits, code).then((ok) => {
      if (!ok) setAllowManualEntry(true)
    })
  }, [isOpen, initialMobileNumber, initialCountryCode, validatePhone])

  useEffect(() => {
    if (
      !validationResult ||
      validationResult.isMember ||
      phoneVerified ||
      otpSent ||
      otpAutoSendRef.current
    ) {
      return
    }

    otpAutoSendRef.current = true
    void sendPhoneVerificationOtp()
  }, [validationResult, phoneVerified, otpSent, sendPhoneVerificationOtp])

  const handleLogin = () => {
    onClose()
    if (onLogin) {
      onLogin(returnUrl)
    } else {
      window.location.href = `/login?next=${encodeURIComponent(returnUrl)}`
    }
  }

  const handleRegister = () => {
    onClose()
    if (onRegister) {
      onRegister(registerNextUrl)
    } else {
      window.location.href = registerNextUrl
    }
  }

  const handleContinue = () => {
    onClose()
    onContinueToPayment()
  }

  const handleReset = () => {
    autoValidatedRef.current = false
    setAllowManualEntry(false)
    setMobileNumber("")
    setCountryCode("+91")
    setValidationResult(null)
    resetOtpState()
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const checkedPhoneLabel = formatPhoneForDisplay(countryCode, mobileNumber)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Continue to purchase</DialogTitle>
          <DialogDescription>
            {usePrefilledPhone
              ? `Checking your membership status for ${clubName || "this club"}.`
              : `Enter your mobile number to check your status for ${clubName || "this club"}.`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground text-center">
              {usePrefilledPhone && checkedPhoneLabel
                ? `Checking membership for ${checkedPhoneLabel}…`
                : "Checking membership status…"}
            </p>
          </div>
        ) : !validationResult ? (
          usePrefilledPhone ? (
            <div className="space-y-4 py-4">
              <Alert>
                <Phone className="h-4 w-4" />
                <AlertDescription>
                  Using the mobile number you already entered
                  {checkedPhoneLabel ? `: ${checkedPhoneLabel}` : "."}
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => void validatePhone(mobileNumber.replace(/\D/g, ""), countryCode)}
                disabled={!mobileNumber.trim()}
                className="w-full"
              >
                Check again
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-[auto_1fr] gap-2 items-end">
                <div className="space-y-2">
                  <Label htmlFor="countryCode">Code</Label>
                  <Input
                    id="countryCode"
                    type="text"
                    placeholder="+91"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-24"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">Mobile number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="mobileNumber"
                      type="tel"
                      placeholder="9876543210"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleValidate}
                  disabled={loading || !mobileNumber.trim()}
                  className="flex-1"
                >
                  Continue
                </Button>

                <Button
                  variant="secondary"
                  onClick={handleNotAMember}
                  disabled={loading}
                  className="flex-1 border border-input"
                >
                  I&apos;m not a member
                </Button>
              </div>
            </div>
          )
        ) : validationResult.isMember ? (
          <div className="space-y-4 py-4">
            {checkedPhoneLabel && (
              <p className="text-xs text-muted-foreground text-center">
                Checked: {checkedPhoneLabel}
              </p>
            )}
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Existing member</strong>
                <br />
                Log in to use your account or continue as guest to proceed to payment.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={handleLogin} className="flex-1">
                Login
              </Button>
              <Button variant="outline" onClick={handleContinue} className="flex-1">
                Continue as Guest
              </Button>
            </div>
          </div>
        ) : !phoneVerified ? (
          <div className="space-y-4 py-4">
            {checkedPhoneLabel && (
              <p className="text-xs text-muted-foreground text-center">
                Verifying: {checkedPhoneLabel}
              </p>
            )}
            <Alert className="border-blue-200 bg-blue-50">
              <MessageCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Verify your mobile number</strong>
                <br />
                We&apos;ll send a one-time code via WhatsApp to confirm this number is valid.
              </AlertDescription>
            </Alert>

            {otpSending && !otpSent ? (
              <div className="flex flex-col items-center justify-center gap-3 py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Sending WhatsApp code…</p>
              </div>
            ) : (
              <>
                {!otpSent ? (
                  <Button
                    onClick={() => void sendPhoneVerificationOtp()}
                    disabled={otpSending || !mobileNumber.trim()}
                    className="w-full"
                  >
                    {otpSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      "Send code via WhatsApp"
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="phoneVerificationOtp">WhatsApp verification code</Label>
                      <Input
                        id="phoneVerificationOtp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="Enter 6-digit code"
                        value={otp}
                        maxLength={6}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      />
                    </div>

                    <Button
                      onClick={() => void handleVerifyPhoneOtp()}
                      disabled={otpVerifying || otp.length < 6}
                      className="w-full"
                    >
                      {otpVerifying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying…
                        </>
                      ) : (
                        "Verify code"
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => void handleResendPhoneOtp()}
                      disabled={otpSending || resendCountdown > 0}
                      className="w-full"
                    >
                      {otpSending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Resending…
                        </>
                      ) : resendCountdown > 0 ? (
                        `Resend via WhatsApp (${resendCountdown}s)`
                      ) : (
                        "Resend via WhatsApp"
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}

            <Button variant="ghost" onClick={handleReset} className="w-full">
              Use a different number
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {checkedPhoneLabel && (
              <p className="text-xs text-muted-foreground text-center">
                Checked: {checkedPhoneLabel}
              </p>
            )}
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Not a member yet</strong>
                <br />
                Register for an account or continue as guest to proceed to payment.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={handleRegister} className="flex-1">
                Register
              </Button>
              <Button variant="outline" onClick={handleContinue} className="flex-1">
                Continue as Guest
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
