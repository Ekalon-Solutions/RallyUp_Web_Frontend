"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api"
import { ADMIN_REMOVAL_REASONS, type AdminRemovalReason } from "@/lib/adminRemoval"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "sonner"

type AdminRow = {
  adminId: string
  name: string
  email: string
}

type Preflight = {
  requiresReplacement: boolean
  isLastClubAdmin: boolean
  blockingVenues: Array<{
    eventId: string
    eventTitle: string
    venueId: string
    venueName: string
  }>
  eligibleReplacements: Array<{
    adminId: string
    name: string
    email: string
    adminTier: string
  }>
}

type Props = {
  clubId: string
  admin: AdminRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRevoked: () => void
}

export function RevokeAdminDialog({ clubId, admin, open, onOpenChange, onRevoked }: Props) {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [preflight, setPreflight] = useState<Preflight | null>(null)
  const [reason, setReason] = useState<AdminRemovalReason | "">("")
  const [replacementAdminId, setReplacementAdminId] = useState("")

  useEffect(() => {
    if (!open || !clubId || !admin) {
      setPreflight(null)
      setReason("")
      setReplacementAdminId("")
      return
    }

    let cancelled = false
    setLoading(true)
    apiClient
      .checkDemoteAdmin(clubId, admin.adminId)
      .then((res) => {
        if (cancelled) return
        if (res.success && res.data) {
          setPreflight(res.data)
        } else {
          toast.error(res.error || "Could not verify removal requirements")
          onOpenChange(false)
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not verify removal requirements")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, clubId, admin, onOpenChange])

  const needsReplacement = preflight?.requiresReplacement === true
  const hasReplacementOptions = (preflight?.eligibleReplacements?.length ?? 0) > 0
  const replacementBlocked = needsReplacement && !hasReplacementOptions

  const handleRevoke = async () => {
    if (!admin || !reason) return
    if (needsReplacement && !replacementAdminId) {
      toast.error("Select a replacement admin to continue")
      return
    }

    setSubmitting(true)
    try {
      const res = await apiClient.demoteAdminFromClub(clubId, {
        adminId: admin.adminId,
        reason,
        replacementAdminId: replacementAdminId || undefined,
      })

      if (res.success) {
        const sessions = res.data?.sessionsTerminated
        toast.success(`${admin.name} no longer has admin access`, {
          description:
            sessions != null
              ? `Signed out on all devices (${sessions} session${sessions === 1 ? "" : "s"} ended).`
              : "All active sessions were terminated.",
        })
        onOpenChange(false)
        onRevoked()
      } else if ((res.data as any)?.code === "REPLACEMENT_REQUIRED" || res.status === 409) {
        toast.error(res.error || res.message || "A replacement admin is required")
        if (res.data) setPreflight(res.data as Preflight)
      } else {
        toast.error(res.error || res.message || "Failed to revoke access")
      }
    } catch {
      toast.error("Failed to revoke access")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            Revoke admin access?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground border border-destructive/30 bg-destructive/5 rounded-md px-3 py-2.5">
                Warning: {admin?.name} will lose all management access immediately.
              </p>
              <p>
                Their role reverts to member and all admin permissions for this club are removed.
                Active sessions are terminated on all devices.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <Label htmlFor="removal-reason">Reason for removal</Label>
              <Select value={reason} onValueChange={(v) => setReason(v as AdminRemovalReason)}>
                <SelectTrigger id="removal-reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_REMOVAL_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {needsReplacement && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 space-y-2 text-sm">
                {preflight?.isLastClubAdmin && (
                  <p className="font-medium text-foreground">
                    This is the last assigned club admin. Assign a replacement before removal.
                  </p>
                )}
                {(preflight?.blockingVenues?.length ?? 0) > 0 && (
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      Last assigned admin for venue(s):
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                      {preflight!.blockingVenues.map((v) => (
                        <li key={`${v.eventId}-${v.venueId}`}>
                          {v.venueName} — {v.eventTitle}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {hasReplacementOptions ? (
                  <div className="space-y-2 pt-1">
                    <Label htmlFor="replacement-admin">Replacement admin</Label>
                    <Select value={replacementAdminId} onValueChange={setReplacementAdminId}>
                      <SelectTrigger id="replacement-admin">
                        <SelectValue placeholder="Choose replacement" />
                      </SelectTrigger>
                      <SelectContent>
                        {preflight!.eligibleReplacements.map((r) => (
                          <SelectItem key={r.adminId} value={r.adminId}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <p className="text-amber-800 dark:text-amber-200">
                    No other admins are available. Elevate a member to admin first, then revoke
                    this user.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={
              loading ||
              submitting ||
              !reason ||
              replacementBlocked ||
              (needsReplacement && hasReplacementOptions && !replacementAdminId)
            }
            onClick={handleRevoke}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Revoking…
              </>
            ) : (
              "Revoke access"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
