"use client"

import { useCallback, useEffect, useState } from "react"
import { apiClient } from "@/lib/api"
import { formatDisplayDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, History, ShieldAlert } from "lucide-react"

export type AdminActivityEntry = {
  _id: string
  actorId: string
  actorName?: string
  actorType: string
  targetId?: string
  targetType?: string
  action: string
  oldState: string
  newState: string
  summary?: string
  riskLevel: "low" | "medium" | "high"
  permissionSnapshotAtAction?: Record<string, unknown>
  ipAddress: string
  deviceInfo?: { userAgent?: string; deviceType?: string }
  timestamp: string
}

const ACTION_LABELS: Record<string, string> = {
  PROMOTE_TO_ADMIN: "Promotion",
  DEMOTE_ADMIN: "Demotion",
  PERMISSION_CHANGE: "Permission change",
  ADMIN_ACTIVATED: "Admin activated",
  ADMIN_DEACTIVATED: "Admin deactivated",
  REFUND_PROCESSED: "Refund processed",
  REFUND_RECALCULATED: "Refund recalculated",
  REFUND_POLICY_CHANGED: "Refund policy changed",
  NOTIFICATION_TEMPLATE_UPDATED: "Notification template updated",
  NOTIFICATION_TEMPLATE_RESET: "Notification template reset",
  NOTIFICATION_TEMPLATE_GLOBAL_RESET: "Notification templates global reset",
  HIGH_RISK_ACTION: "High-risk action",
}

function riskBadgeVariant(level: string): "default" | "secondary" | "destructive" {
  if (level === "high") return "destructive"
  if (level === "medium") return "secondary"
  return "default"
}

type Props = {
  clubId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminActivityLogDialog({ clubId, open, onOpenChange }: Props) {
  const [entries, setEntries] = useState<AdminActivityEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = useCallback(
    async (pageNum: number) => {
      if (!clubId) return
      setLoading(true)
      try {
        const res = await apiClient.getClubAdminActivityLog(clubId, { page: pageNum, limit: 25 })
        if (res.success && res.data) {
          setEntries(res.data.entries)
          setTotalPages(res.data.pagination.totalPages)
          setPage(res.data.pagination.currentPage)
        } else {
          setEntries([])
        }
      } catch {
        setEntries([])
      } finally {
        setLoading(false)
      }
    },
    [clubId]
  )

  useEffect(() => {
    if (open && clubId) {
      load(1)
    }
  }, [open, clubId, load])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Admin activity log
          </DialogTitle>
          <DialogDescription>
            Permanent, read-only audit trail of promotions, demotions, permission changes, and
            high-risk actions. Entries cannot be deleted.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4 min-h-[320px]">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              No admin actions recorded yet.
            </p>
          ) : (
            <ul className="space-y-4 pb-4">
              {entries.map((entry) => (
                <li
                  key={entry._id}
                  className="rounded-lg border p-4 space-y-2 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {ACTION_LABELS[entry.action] || entry.action}
                      </Badge>
                      <Badge variant={riskBadgeVariant(entry.riskLevel)}>
                        {entry.riskLevel} risk
                      </Badge>
                    </div>
                    <time className="text-xs text-muted-foreground">
                      {formatDisplayDate(entry.timestamp)}
                    </time>
                  </div>

                  {entry.summary && (
                    <p className="font-medium text-foreground">{entry.summary}</p>
                  )}

                  <div className="grid gap-1 text-muted-foreground">
                    <p>
                      <span className="text-foreground/70">Before: </span>
                      {entry.oldState}
                    </p>
                    <p>
                      <span className="text-foreground/70">After: </span>
                      {entry.newState}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Actor: {entry.actorName || entry.actorId}
                    {entry.targetId ? ` · Target: ${entry.targetId}` : ""}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    IP: {entry.ipAddress}
                    {entry.deviceInfo?.deviceType
                      ? ` · Device: ${entry.deviceInfo.deviceType}`
                      : ""}
                  </p>

                  {entry.riskLevel === "high" && entry.permissionSnapshotAtAction && (
                    <div className="mt-2 rounded-md bg-muted/50 p-2 text-xs flex gap-2">
                      <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
                      <div>
                        <p className="font-medium text-foreground mb-1">
                          Permissions at time of action
                        </p>
                        <pre className="whitespace-pre-wrap break-words font-sans text-muted-foreground">
                          {typeof entry.permissionSnapshotAtAction === "object"
                            ? JSON.stringify(entry.permissionSnapshotAtAction, null, 2)
                            : String(entry.permissionSnapshotAtAction)}
                        </pre>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => load(page - 1)}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => load(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
