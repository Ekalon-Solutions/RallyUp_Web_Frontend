"use client"

import React, { useState } from "react"
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
import { Loader2, Phone, CheckCircle2, Info } from "lucide-react"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"

const PURCHASE_INTENT_KEY = "rallyup_purchase_intent"

/** CartItem-shaped object for storing merchandise quick-buy in intent */
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
    // ignore
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
  /** Called when user chooses Continue (skip login/register); proceed to payment. */
  onContinueToPayment: () => void
  /** Called when user chooses Login; caller should redirect. Optional if using built-in redirect. */
  onLogin?: (returnUrl: string) => void
  /** Called when user chooses Register; caller should redirect. Optional if using built-in redirect. */
  onRegister?: (returnUrl: string) => void
  /** Base path for return URL after login/register (e.g. /clubs/my-club). Query params like resumePurchase=1 will be appended. */
  returnPath: string
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
}: PurchaseFlowModalProps) {
  const [mobileNumber, setMobileNumber] = useState("")
  const [countryCode, setCountryCode] = useState("+91")
  const [loading, setLoading] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    isMember: boolean
    message?: string
  } | null>(null)

  const returnUrl =
    returnPath + (returnPath.includes("?") ? "&" : "?") + "resumePurchase=1"
  const registerNextUrl =
    clubName && clubName.trim()
      ? `/clubs?search=${encodeURIComponent(clubName.trim())}`
      : "/clubs"

  const handleValidate = async () => {
    if (!mobileNumber || !mobileNumber.trim()) {
      toast.error("Please enter your mobile number")
      return
    }
    const digits = mobileNumber.replace(/\D/g, "")
    if (digits.length < 6 || digits.length > 15) {
      toast.error("Please enter a valid mobile number (6–15 digits)")
      return
    }

    setLoading(true)
    setValidationResult(null)

    try {
      const response = await apiClient.validateMemberStatus({
        clubId,
        mobileNumber: digits,
        countryCode: countryCode.trim() || "+91",
      })

      if (response.success && response.data) {
        const payload = (response.data as any)?.data ?? response.data
        setValidationResult({ isMember: !!payload?.isMember, message: payload?.message })
      } else {
        toast.error(response.message || "Failed to check member status")
      }
    } catch (error) {
      console.error("Validation error:", error)
      toast.error("An error occurred while checking. Please try again.")
    } finally {
      setLoading(false)
    }
  }

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
    setMobileNumber("")
    setCountryCode("+91")
    setValidationResult(null)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Continue to purchase</DialogTitle>
          <DialogDescription>
            Enter your mobile number to check your status for {clubName || "this club"}.
          </DialogDescription>
        </DialogHeader>

        {!validationResult ? (
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

            <Button
              onClick={handleValidate}
              disabled={loading || !mobileNumber.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        ) : validationResult.isMember ? (
          <div className="space-y-4 py-4">
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
                Continue
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
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
                Continue
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
