"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { apiClient } from "@/lib/api"
import { usePrimaryClubOwner } from "@/hooks/usePrimaryClubOwner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Loader2, Search, UserPlus, ArrowUpCircle } from "lucide-react"
import { toast } from "sonner"
import { roleBadgeClass } from "@/components/admin/club-admin-roster"

type ElevationMember = {
  _id: string
  name: string
  email?: string
  phoneNumber?: string
  countryCode?: string
  profilePicture?: string
  membershipStatus: string
  isAlreadyAdmin: boolean
  existingRoleType?: "owner" | "admin" | "vendor" | null
  existingRoleLabel?: string | null
  existingTierKey?: string | null
  canElevate: boolean
  elevateDisabledReason: string | null
}

const ROLE_ACCESS_DESCRIPTION: Record<string, string> = {
  sub_admin:
    "Full dashboard access except elevating other admins — manage members, events, news, and club settings.",
  venue_partner: "Manage merchandise, orders, inventory, and store-related club content.",
  events_manager: "Create and manage events, ticketing, registrations, and attendance.",
  vendor: "Scan-only match-day access — event scanner and vendor reports only. No finance, settings, or member directory.",
}

export function ElevateMemberAdminPanel() {
  const { isPrimaryOwner, loading: ownerLoading, quota, startingRoles, clubId } = usePrimaryClubOwner()
  const [search, setSearch] = useState("")
  const [members, setMembers] = useState<ElevationMember[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedMember, setSelectedMember] = useState<ElevationMember | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [startingRole, setStartingRole] = useState("")
  const [acknowledged, setAcknowledged] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const runSearch = useCallback(
    async (q: string) => {
      if (!clubId || q.trim().length < 2) {
        setMembers([])
        return
      }
      setSearching(true)
      try {
        const res = await apiClient.searchMembersForElevation(clubId, q.trim())
        if (res.success && res.data?.members) {
          setMembers(res.data.members)
        } else {
          setMembers([])
        }
      } catch {
        setMembers([])
      } finally {
        setSearching(false)
      }
    },
    [clubId]
  )

  useEffect(() => {
    const t = setTimeout(() => runSearch(search), 300)
    return () => clearTimeout(t)
  }, [search, runSearch])

  const openConfirm = (member: ElevationMember) => {
    setSelectedMember(member)
    setStartingRole(startingRoles[0]?.value || "sub_admin")
    setAcknowledged(false)
    setConfirmOpen(true)
  }

  const handleElevate = async () => {
    if (!clubId || !selectedMember || !startingRole || !acknowledged) return
    setSubmitting(true)
    try {
      const res = await apiClient.elevateMemberToAdmin(clubId, {
        userId: selectedMember._id,
        startingRole,
        acknowledged: true,
      })
      if (res.success) {
        const roleLabel =
          res.data?.admin?.startingRoleLabel ||
          startingRoles.find((r) => r.value === startingRole)?.label ||
          "Admin"
        const isVendor = startingRole === "vendor"
        const roleType = (res.data?.member?.existingRoleType ||
          (isVendor ? "vendor" : "admin")) as "owner" | "admin" | "vendor"
        toast.success(
          isVendor
            ? `${selectedMember.name} is now a vendor`
            : `${selectedMember.name} is now ${roleLabel}`,
          {
            description: isVendor
              ? "Scan-only match-day access granted. No admin invitation email is sent for vendors."
              : `Role: ${roleLabel}. A welcome email with getting started instructions was sent.`,
            classNames: {
              toast: "bg-emerald-600 text-white border-emerald-700",
              title: "text-white font-bold",
              description: "text-emerald-50",
            },
          }
        )
        setMembers((prev) =>
          prev.map((m) =>
            m._id === selectedMember._id
              ? {
                  ...m,
                  isAlreadyAdmin: true,
                  canElevate: false,
                  existingRoleType: roleType,
                  existingRoleLabel: res.data?.member?.existingRoleLabel || roleLabel,
                  existingTierKey: res.data?.member?.existingTierKey || startingRole,
                  elevateDisabledReason: isVendor
                    ? "This member is already a vendor for this club"
                    : `This member already has ${roleLabel} access for this club`,
                }
              : m
          )
        )
        setConfirmOpen(false)
        setSelectedMember(null)
      } else if (
        (res.data as any)?.code === "ADMIN_QUOTA_REACHED" ||
        res.error?.toLowerCase().includes("admin limit")
      ) {
        toast.error("Admin limit reached", {
          description: "Upgrade your membership plan to add more admins.",
        })
      } else {
        toast.error(res.error || res.message || "Elevation failed")
      }
    } catch {
      toast.error("Failed to elevate member")
    } finally {
      setSubmitting(false)
    }
  }

  if (ownerLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isPrimaryOwner) {
    return null
  }

  const atLimit = quota?.atLimit === true

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {quota && (
          <Card>
            <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm">
                <span className="font-medium">Admin seats used: </span>
                <span>
                  {quota.current}
                  {quota.max != null ? ` / ${quota.max}` : " (unlimited)"}
                </span>
                <span className="text-muted-foreground ml-2">
                  Vendors don&apos;t count toward admin seats.
                </span>
              </div>
              {atLimit && (
                <Button asChild variant="default" size="sm">
                  <Link href="/dashboard/membership-plans">Upgrade Plan</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Elevate a member</CardTitle>
            <CardDescription>
              Search by name or phone (min. 2 characters), then choose a role — Sub-Admin, Venue
              Partner, Events Manager, or Vendor. Only members with an Active membership can be
              elevated; Pending or cancelled memberships appear disabled.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members by name or phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-[420px] overflow-y-auto rounded-lg border divide-y">
              {search.trim().length < 2 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">
                  Type at least 2 characters to search active members.
                </p>
              ) : searching ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : members.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">No members found.</p>
              ) : (
                members.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors"
                  >
                    <Avatar className="h-11 w-11 shrink-0 border">
                      <AvatarImage src={member.profilePicture} alt={member.name} />
                      <AvatarFallback>
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate">{member.name}</p>
                        {member.isAlreadyAdmin && (
                          <Badge className={roleBadgeClass(member.existingTierKey || "admin")}>
                            {member.existingRoleLabel || "Admin"}
                          </Badge>
                        )}
                        {member.membershipStatus !== "active" && !member.isAlreadyAdmin && (
                          <Badge variant="secondary" className="capitalize">
                            {member.membershipStatus}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.email}
                        {member.phoneNumber
                          ? ` · ${member.countryCode || ""}${member.phoneNumber}`
                          : ""}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {atLimit ? (
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/dashboard/membership-plans">Upgrade Plan</Link>
                        </Button>
                      ) : member.canElevate ? (
                        <Button size="sm" onClick={() => openConfirm(member)} className="gap-1.5">
                          <UserPlus className="h-4 w-4" />
                          Elevate
                        </Button>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex={0}>
                              <Button size="sm" variant="secondary" disabled className="gap-1.5">
                                <ArrowUpCircle className="h-4 w-4" />
                                Elevate
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs">
                            <p>{member.elevateDisabledReason}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Elevate {selectedMember?.name}?</DialogTitle>
              <DialogDescription>
                {startingRole === "vendor"
                  ? "You are granting scan-only match-day access for this club. Vendors can use the event scanner and view vendor reports — no finance, settings, or member directory."
                  : "You are granting dashboard admin access for this club. They will be able to manage club data according to their role."}
              </DialogDescription>
            </DialogHeader>
            {selectedMember && (
              <div className="space-y-4 py-2">
                <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-2">
                  <p>
                    <strong>Member:</strong> {selectedMember.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedMember.email || "—"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="starting-role">Starting Role</Label>
                  <Select value={startingRole} onValueChange={setStartingRole}>
                    <SelectTrigger id="starting-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {startingRoles.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {startingRole && ROLE_ACCESS_DESCRIPTION[startingRole] && (
                    <p className="text-xs text-muted-foreground">
                      {ROLE_ACCESS_DESCRIPTION[startingRole]}
                    </p>
                  )}
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-3">
                  <Checkbox
                    id="ack-admin"
                    checked={acknowledged}
                    onCheckedChange={(v) => setAcknowledged(v === true)}
                  />
                  <Label htmlFor="ack-admin" className="text-sm font-normal leading-snug cursor-pointer">
                    I understand this user will have access to club data.
                  </Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleElevate} disabled={!acknowledged || !startingRole || submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Elevating…
                  </>
                ) : (
                  "Confirm elevation"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
