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
import { Loader2, Mail, Phone, CheckCircle2, XCircle, Info } from "lucide-react"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import Link from "next/link"

interface MemberValidationModalProps {
  isOpen: boolean
  onClose: () => void
  clubId: string
  clubName?: string
  onMemberFound: () => void // Callback when member is found - should redirect to login
  onNonMemberContinue: () => void // Callback when user chooses to continue as non-member
  onBecomeMember: () => void // Callback when user chooses to become a member
}

export function MemberValidationModal({
  isOpen,
  onClose,
  clubId,
  clubName,
  onMemberFound,
  onNonMemberContinue,
  onBecomeMember,
}: MemberValidationModalProps) {
  const [email, setEmail] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")
  const [countryCode, setCountryCode] = useState("+1")
  const [loading, setLoading] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    isMember: boolean
    message?: string
  } | null>(null)

  const handleValidate = async () => {
    if (!email && !mobileNumber) {
      toast.error("Please provide either email or mobile number")
      return
    }

    if (mobileNumber && !countryCode) {
      toast.error("Please provide country code for mobile number")
      return
    }

    setLoading(true)
    setValidationResult(null)

    try {
      const response = await apiClient.validateMemberStatus({
        clubId,
        email: email || undefined,
        mobileNumber: mobileNumber || undefined,
        countryCode: mobileNumber ? countryCode : undefined,
      })

      if (response.success && response.data) {
        const payload = (response.data as any)?.data ?? response.data
        setValidationResult(payload)
      } else {
        toast.error(response.message || "Failed to validate member status")
      }
    } catch (error) {
      console.error("Validation error:", error)
      toast.error("An error occurred while validating member status")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setEmail("")
    setMobileNumber("")
    setCountryCode("+1")
    setValidationResult(null)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Check Member Status</DialogTitle>
          <DialogDescription>
            Enter your email or mobile number to check if you're already a member of {clubName || "this club"} and eligible for member discounts.
          </DialogDescription>
        </DialogHeader>

        {!validationResult ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="countryCode">Country Code</Label>
              <Input
                id="countryCode"
                type="text"
                placeholder="+1"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="mb-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="mobileNumber"
                  type="tel"
                  placeholder="1234567890"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              onClick={handleValidate}
              disabled={loading || (!email && !mobileNumber)}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                "Check Status"
              )}
            </Button>
          </div>
        ) : validationResult.isMember ? (
          <div className="space-y-4 py-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>You are already a member!</strong>
                <br />
                Login using your mobile/email to check for any discounts.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  handleClose()
                  onMemberFound()
                }}
                className="flex-1"
              >
                Go to Login
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1"
              >
                Check Another
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
                Register and create an account to see member benefits and discounts.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button
                onClick={() => {
                  handleClose()
                  onBecomeMember()
                }}
                className="w-full"
              >
                Become a Member
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  handleClose()
                  onNonMemberContinue()
                }}
                className="w-full"
              >
                Continue as Non-Member
              </Button>
              <Button
                variant="ghost"
                onClick={handleReset}
                className="w-full"
              >
                Check Another
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
