"use client"

import { useCallback, useEffect, useState } from "react"
import { apiClient } from "@/lib/api"
import { usePrimaryClubOwner } from "@/hooks/usePrimaryClubOwner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, ShieldOff, Users, Mail, AlertTriangle, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { RevokeAdminDialog } from "@/components/admin/revoke-admin-dialog"

type RosterAdmin = {
  adminId: string
  name: string
  email: string
  adminTier: string
  roleLabel: string
  isOwner: boolean
  canRevoke: boolean
  profilePicture?: string
  invitationEmail?: {
    status: string
    sentAt?: string
    label: string
  } | null
}

function invitationBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "sent" || status === "accepted") return "default"
  if (status === "bounced" || status === "failed") return "destructive"
  if (status === "pending") return "secondary"
  return "outline"
}

export function ClubAdminRoster() {
  const { clubId, isPrimaryOwner, loading: ownerLoading } = usePrimaryClubOwner()
  const [loading, setLoading] = useState(true)
  const [admins, setAdmins] = useState<RosterAdmin[]>([])
  const [bouncedAlerts, setBouncedAlerts] = useState<
    Array<{ adminId: string; email: string; bouncedAt?: string }>
  >([])
  const [revokeTarget, setRevokeTarget] = useState<RosterAdmin | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)

  const loadRoster = useCallback(async () => {
    if (!clubId) return
    setLoading(true)
    try {
      const res = await apiClient.getClubAdminRoster(clubId)
      if (res.success && res.data?.admins) {
        setAdmins(res.data.admins)
        setBouncedAlerts(res.data.bouncedInvitations || [])
      }
    } finally {
      setLoading(false)
    }
  }, [clubId])

  useEffect(() => {
    if (clubId && isPrimaryOwner) loadRoster()
  }, [clubId, isPrimaryOwner, loadRoster])

  const handleResend = async (adminId: string) => {
    if (!clubId) return
    setResendingId(adminId)
    try {
      const res = await apiClient.resendAdminInvitationEmail(clubId, adminId)
      if (res.success) {
        toast.success("Invitation email queued")
        loadRoster()
      } else {
        toast.error(res.error || "Failed to resend invitation")
      }
    } finally {
      setResendingId(null)
    }
  }

  if (ownerLoading || loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isPrimaryOwner) return null

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-7 w-7 text-primary" />
          Team admins
        </h2>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Invitation emails are sent automatically when you elevate a member. Track delivery status
          below.
        </p>
      </div>

      {bouncedAlerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Invitation email bounced</AlertTitle>
          <AlertDescription>
            {bouncedAlerts.map((b) => (
              <span key={b.adminId} className="block mt-1">
                Could not deliver to <strong>{b.email}</strong> — please verify the spelling and
                resend.
              </span>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current admins</CardTitle>
          <CardDescription>
            The owner cannot be revoked. Invitation status shows whether the welcome email was
            delivered.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {admins.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No admins found.</p>
          ) : (
            admins.map((admin) => (
              <div
                key={admin.adminId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={admin.profilePicture} alt={admin.name} />
                    <AvatarFallback>
                      {admin.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{admin.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{admin.email}</p>
                    {admin.invitationEmail && !admin.isOwner && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3" />
                        Invite: {admin.invitationEmail.label}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Badge variant={admin.isOwner ? "default" : "secondary"}>
                    {admin.isOwner ? "Owner" : admin.roleLabel}
                  </Badge>
                  {admin.invitationEmail && !admin.isOwner && (
                    <Badge variant={invitationBadgeVariant(admin.invitationEmail.status)}>
                      {admin.invitationEmail.label}
                    </Badge>
                  )}
                  {!admin.isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={resendingId === admin.adminId}
                      onClick={() => handleResend(admin.adminId)}
                    >
                      {resendingId === admin.adminId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      <span className="sr-only">Resend invitation</span>
                    </Button>
                  )}
                  {admin.canRevoke ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/40 hover:bg-destructive/10"
                      onClick={() => setRevokeTarget(admin)}
                    >
                      <ShieldOff className="h-4 w-4 mr-1.5" />
                      Revoke access
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground px-2">Locked</span>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {clubId && (
        <RevokeAdminDialog
          clubId={clubId}
          admin={revokeTarget}
          open={Boolean(revokeTarget)}
          onOpenChange={(open) => !open && setRevokeTarget(null)}
          onRevoked={() => {
            setRevokeTarget(null)
            loadRoster()
          }}
        />
      )}
    </div>
  )
}
