"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { apiClient } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Shield } from "lucide-react"
import { toast } from "sonner"

function AcceptInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const verifyMode = searchParams.get("verify") === "1"

  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState<{
    clubId: string
    email: string
    roleLabel: string
    moduleSummary: string[]
    needsEmailVerification: boolean
  } | null>(null)
  const [otp, setOtp] = useState("")
  const [otpSending, setOtpSending] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    apiClient
      .validateAdminInvitation(token)
      .then((res) => {
        if (res.success && res.data) {
          setInvite({
            clubId: String(res.data.clubId),
            email: res.data.email,
            roleLabel: res.data.roleLabel,
            moduleSummary: res.data.moduleSummary || [],
            needsEmailVerification: res.data.needsEmailVerification,
          })
        }
      })
      .finally(() => setLoading(false))
  }, [token])

  const finishAccept = async () => {
    const res = await apiClient.acceptAdminInvitation(token)
    if (res.success) {
      toast.success("Welcome to the team!", {
        description: "Your admin access is active.",
      })
      router.replace("/dashboard")
    } else {
      toast.error(res.error || "Could not accept invitation")
    }
  }

  const handleGettingStarted = async () => {
    if (!token) return
    try {
      await finishAccept()
    } catch {
      toast.error("Something went wrong")
    }
  }

  const sendOtp = async () => {
    if (!invite?.email) return
    setOtpSending(true)
    try {
      const res = await apiClient.sendOtp({
        email: invite.email,
        role: "admin",
      })
      if (res.success) {
        toast.success("Verification code sent to your email")
      } else {
        toast.error(res.error || "Failed to send code")
      }
    } catch {
      toast.error("Failed to send verification code")
    } finally {
      setOtpSending(false)
    }
  }

  const verifyAndActivate = async () => {
    if (!invite?.email || otp.length !== 6) return
    setVerifying(true)
    try {
      const res = await apiClient.verifyEmailOTP({
        email: invite.email,
        otp,
        role: "admin",
      })
      if (res.success && res.data?.token) {
        localStorage.setItem("token", res.data.token)
        await finishAccept()
      } else {
        toast.error(res.error || "Invalid code")
      }
    } catch {
      toast.error("Verification failed")
    } finally {
      setVerifying(false)
    }
  }

  useEffect(() => {
    if (verifyMode && invite?.needsEmailVerification && !loading) {
      sendOtp()
    }
  }, [verifyMode, invite?.needsEmailVerification, loading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!token || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Invalid invitation</CardTitle>
            <CardDescription>This link is invalid or has expired.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const showVerify = verifyMode || invite.needsEmailVerification

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Welcome to the Team</CardTitle>
          <CardDescription>
            You have been granted <strong>{invite.roleLabel}</strong> access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invite.moduleSummary.length > 0 && (
            <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
              <p className="font-medium mb-2">You can now:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {invite.moduleSummary.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          {showVerify ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Verify your email ({invite.email}) to activate admin access.
              </p>
              <div className="space-y-2">
                <Label htmlFor="otp">6-digit code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={sendOtp} disabled={otpSending}>
                  {otpSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resend code"}
                </Button>
                <Button
                  className="flex-1"
                  onClick={verifyAndActivate}
                  disabled={otp.length !== 6 || verifying}
                >
                  {verifying ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Verify & Activate
                </Button>
              </div>
            </div>
          ) : (
            <Button className="w-full" onClick={handleGettingStarted}>
              Getting Started — Open Admin Dashboard
            </Button>
          )}

          <p className="text-xs text-center text-muted-foreground">
            <Link href="/login" className="underline">
              Sign in
            </Link>{" "}
            if you already have a session.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminInviteAcceptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  )
}
