"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2, Eye, Lock } from "lucide-react"

type Props = {
  clubId: string
  adminId: string
  adminName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminPermissionPreviewDialog({
  clubId,
  adminId,
  adminName,
  open,
  onOpenChange,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState<
    Array<{ moduleId: string; label: string; href?: string; canEdit: boolean; category: string }>
  >([])
  const [hiddenCount, setHiddenCount] = useState(0)

  useEffect(() => {
    if (!open || !clubId || !adminId) return
    setLoading(true)
    apiClient
      .getPermissionMatrixPreview(clubId, adminId)
      .then((res) => {
        if (res.success && res.data) {
          setVisible(res.data.visibleModules || [])
          setHiddenCount(res.data.hiddenCount ?? 0)
        }
      })
      .finally(() => setLoading(false))
  }, [open, clubId, adminId])

  const byCategory = visible.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, typeof visible>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview as {adminName}
          </DialogTitle>
          <DialogDescription>
            Dashboard modules this admin can see. Edit access is shown per item.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            {Object.keys(byCategory).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No dashboard modules visible with current permissions.
              </p>
            ) : (
              Object.entries(byCategory).map(([category, items]) => (
                <div key={category}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                    {category}
                  </p>
                  <ul className="space-y-1.5">
                    {items.map((item) => (
                      <li
                        key={item.moduleId}
                        className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                      >
                        <span>{item.label}</span>
                        <div className="flex items-center gap-2">
                          {item.canEdit ? (
                            <Badge variant="secondary" className="text-[10px]">
                              View + Edit
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">
                              View only
                            </Badge>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
            {hiddenCount > 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-2 border-t">
                <Lock className="h-3.5 w-3.5" />
                {hiddenCount} module{hiddenCount === 1 ? "" : "s"} hidden from this admin
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
