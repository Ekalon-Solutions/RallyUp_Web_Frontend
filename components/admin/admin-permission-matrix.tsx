"use client"

import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { apiClient } from "@/lib/api"
import { usePrimaryClubOwner } from "@/hooks/usePrimaryClubOwner"
import {
  PERMISSION_MATRIX_CATEGORIES,
  FINANCE_REQUIRES_REPORTING_CODE,
  type PermissionAccessType,
  type PermissionMatrixMap,
} from "@/lib/permissionMatrix"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2, Grid3X3, Eye, Check, Lock, Shield } from "lucide-react"
import { toast } from "sonner"
import { AdminPermissionPreviewDialog } from "@/components/admin/admin-permission-preview-dialog"

type MatrixAdmin = {
  adminId: string
  name: string
  email: string
  adminTier: string
  isOwner: boolean
  isLocked: boolean
  permissionsMatrix: PermissionMatrixMap
}

type SaveState = "idle" | "saving" | "saved" | "error"

function cellKey(adminId: string, moduleId: string, accessType: PermissionAccessType) {
  return `${adminId}:${moduleId}:${accessType}`
}

export function AdminPermissionMatrix() {
  const { clubId, isPrimaryOwner, loading: ownerLoading } = usePrimaryClubOwner()
  const [loading, setLoading] = useState(true)
  const [modules, setModules] = useState<
    Array<{ id: string; label: string; category: string; navHref?: string }>
  >([])
  const [admins, setAdmins] = useState<MatrixAdmin[]>([])
  const [selectedAdminId, setSelectedAdminId] = useState<string>("")
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({})
  const [previewOpen, setPreviewOpen] = useState(false)
  const [financeDialog, setFinanceDialog] = useState<{
    open: boolean
    pending: {
      moduleId: string
      accessType: PermissionAccessType
      value: boolean
      mode: "cell" | "category"
      category?: string
    } | null
  }>({ open: false, pending: null })

  const loadMatrix = useCallback(async () => {
    if (!clubId) return
    setLoading(true)
    try {
      const res = await apiClient.getPermissionMatrix(clubId)
      if (res.success && res.data) {
        setModules(res.data.modules || [])
        setAdmins(res.data.admins || [])
        const firstEditable = (res.data.admins || []).find((a) => !a.isLocked)
        setSelectedAdminId((prev) => {
          if (prev && res.data!.admins.some((a) => a.adminId === prev)) return prev
          return firstEditable?.adminId || res.data!.admins[0]?.adminId || ""
        })
      }
    } catch {
      toast.error("Failed to load permission matrix")
    } finally {
      setLoading(false)
    }
  }, [clubId])

  useEffect(() => {
    if (clubId && isPrimaryOwner) loadMatrix()
  }, [clubId, isPrimaryOwner, loadMatrix])

  const selectedAdmin = useMemo(
    () => admins.find((a) => a.adminId === selectedAdminId),
    [admins, selectedAdminId]
  )

  const modulesByCategory = useMemo(() => {
    const map: Record<string, typeof modules> = {}
    for (const cat of PERMISSION_MATRIX_CATEGORIES) {
      map[cat] = modules.filter((m) => m.category === cat)
    }
    return map
  }, [modules])

  const patchCell = async (
    moduleId: string,
    accessType: PermissionAccessType,
    value: boolean,
    confirmFinanceReporting = false
  ) => {
    if (!clubId || !selectedAdmin || selectedAdmin.isLocked) return

    const key = cellKey(selectedAdmin.adminId, moduleId, accessType)
    setSaveStates((s) => ({ ...s, [key]: "saving" }))

    const matrix = { ...selectedAdmin.permissionsMatrix }
    matrix[moduleId] = { ...(matrix[moduleId] || { view: false, edit: false }), [accessType]: value }
    if (accessType === "edit" && value) matrix[moduleId].view = true
    if (accessType === "view" && !value) matrix[moduleId].edit = false

    try {
      const res = await apiClient.patchPermissionMatrix(clubId, {
        adminId: selectedAdmin.adminId,
        moduleId,
        accessType,
        value,
        confirmFinanceReporting,
      })

      if (
        !res.success &&
        res.data?.code === FINANCE_REQUIRES_REPORTING_CODE &&
        res.data?.requiresConfirmation
      ) {
        setSaveStates((s) => ({ ...s, [key]: "error" }))
        setFinanceDialog({
          open: true,
          pending: { moduleId, accessType, value, mode: "cell" },
        })
        return
      }

      if (res.success && res.data?.permissionsMatrix) {
        setAdmins((prev) =>
          prev.map((a) =>
            a.adminId === selectedAdmin.adminId
              ? { ...a, permissionsMatrix: res.data!.permissionsMatrix! }
              : a
          )
        )
        setSaveStates((s) => ({ ...s, [key]: "saved" }))
        setTimeout(() => {
          setSaveStates((s) => ({ ...s, [key]: "idle" }))
        }, 2000)
      } else {
        setSaveStates((s) => ({ ...s, [key]: "error" }))
        toast.error(res.error || res.message || "Failed to save")
      }
    } catch {
      setSaveStates((s) => ({ ...s, [key]: "error" }))
      toast.error("Failed to save permission")
    }
  }

  const toggleCategory = async (
    category: string,
    accessType: PermissionAccessType,
    value: boolean,
    confirmFinanceReporting = false
  ) => {
    if (!clubId || !selectedAdmin || selectedAdmin.isLocked) return
    const key = `cat:${selectedAdmin.adminId}:${category}:${accessType}`
    setSaveStates((s) => ({ ...s, [key]: "saving" }))
    try {
      const res = await apiClient.patchPermissionMatrixCategory(clubId, {
        adminId: selectedAdmin.adminId,
        category,
        accessType,
        value,
        confirmFinanceReporting,
      })
      if (
        !res.success &&
        res.data?.code === FINANCE_REQUIRES_REPORTING_CODE &&
        res.data?.requiresConfirmation
      ) {
        setFinanceDialog({
          open: true,
          pending: { moduleId: "refunds", accessType, value, mode: "category", category },
        })
        setSaveStates((s) => ({ ...s, [key]: "error" }))
        return
      }
      if (res.success && res.data?.permissionsMatrix) {
        setAdmins((prev) =>
          prev.map((a) =>
            a.adminId === selectedAdmin.adminId
              ? { ...a, permissionsMatrix: res.data!.permissionsMatrix! }
              : a
          )
        )
        setSaveStates((s) => ({ ...s, [key]: "saved" }))
        setTimeout(() => setSaveStates((s) => ({ ...s, [key]: "idle" })), 2000)
      }
    } catch {
      toast.error("Failed to update category")
    }
  }

  const SaveIndicator = ({ adminId, moduleId, accessType }: { adminId: string; moduleId: string; accessType: PermissionAccessType }) => {
    const st = saveStates[cellKey(adminId, moduleId, accessType)]
    if (st === "saving") return <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
    if (st === "saved") return <Check className="h-3.5 w-3.5 text-emerald-600" />
    return null
  }

  if (ownerLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isPrimaryOwner) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Grid3X3 className="h-7 w-7 text-primary" />
          Permission Matrix
        </h2>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Customize View and Edit access per admin across all platform modules. Changes auto-save.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-end gap-4 pb-4">
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg">Team member</CardTitle>
            <CardDescription>Select an admin to edit their permissions</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Select value={selectedAdminId} onValueChange={setSelectedAdminId}>
              <SelectTrigger className="w-full sm:w-[260px]">
                <SelectValue placeholder="Select admin" />
              </SelectTrigger>
              <SelectContent>
                {admins.map((a) => (
                  <SelectItem key={a.adminId} value={a.adminId}>
                    {a.name}
                    {a.isOwner ? " (Owner)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAdmin && (
              <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Preview as User
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          {selectedAdmin?.isLocked && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
              <Lock className="h-4 w-4 text-primary shrink-0" />
              <span>
                <strong>Owner</strong> — all permissions are permanently enabled and cannot be changed.
              </span>
            </div>
          )}

          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 pr-4 font-semibold w-[200px]">Module</th>
                <th className="text-center py-3 px-2 font-semibold w-[100px]">View</th>
                <th className="text-center py-3 px-2 font-semibold w-[100px]">Edit</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSION_MATRIX_CATEGORIES.map((category) => {
                const catModules = modulesByCategory[category] || []
                if (catModules.length === 0) return null
                const matrix = selectedAdmin?.permissionsMatrix || {}
                const allView = catModules.every((m) => matrix[m.id]?.view)
                const allEdit = catModules.every((m) => matrix[m.id]?.edit)
                const locked = selectedAdmin?.isLocked

                return (
                  <Fragment key={category}>
                    <tr className="bg-muted/40">
                      <td className="py-2 pr-4 font-semibold text-xs uppercase tracking-wider">
                        {category}
                      </td>
                      <td className="py-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Label className="text-[10px] text-muted-foreground">All</Label>
                          <Switch
                            checked={allView}
                            disabled={locked}
                            onCheckedChange={(v) => toggleCategory(category, "view", v)}
                          />
                        </div>
                      </td>
                      <td className="py-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Label className="text-[10px] text-muted-foreground">All</Label>
                          <Switch
                            checked={allEdit}
                            disabled={locked}
                            onCheckedChange={(v) => toggleCategory(category, "edit", v)}
                          />
                        </div>
                      </td>
                    </tr>
                    {catModules.map((mod) => {
                      const cell = matrix[mod.id] || { view: false, edit: false }
                      const isElevate = mod.id === "elevateAdmins"
                      return (
                        <tr key={mod.id} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="py-2.5 pr-4 pl-3">
                            <span className="font-medium">{mod.label}</span>
                            {isElevate && (
                              <Badge variant="outline" className="ml-2 text-[10px]">
                                Owner only
                              </Badge>
                            )}
                          </td>
                          <td className="py-2.5 text-center">
                            <div className="inline-flex items-center gap-1.5 justify-center">
                              <Switch
                                checked={cell.view}
                                disabled={locked || isElevate}
                                onCheckedChange={(v) =>
                                  patchCell(mod.id, "view", v)
                                }
                              />
                              {selectedAdmin && (
                                <SaveIndicator
                                  adminId={selectedAdmin.adminId}
                                  moduleId={mod.id}
                                  accessType="view"
                                />
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 text-center">
                            <div className="inline-flex items-center gap-1.5 justify-center">
                              <Switch
                                checked={cell.edit}
                                disabled={locked || isElevate || !cell.view}
                                onCheckedChange={(v) =>
                                  patchCell(mod.id, "edit", v)
                                }
                              />
                              {selectedAdmin && (
                                <SaveIndicator
                                  adminId={selectedAdmin.adminId}
                                  moduleId={mod.id}
                                  accessType="edit"
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </Fragment>
                )
              })}
            </tbody>
          </table>

          {selectedAdmin && (
            <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              Tier: {selectedAdmin.adminTier.replace(/_/g, " ")} · Changes apply only to this club
            </p>
          )}
        </CardContent>
      </Card>

      {selectedAdmin && clubId && (
        <AdminPermissionPreviewDialog
          clubId={clubId}
          adminId={selectedAdmin.adminId}
          adminName={selectedAdmin.name}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
        />
      )}

      <AlertDialog
        open={financeDialog.open}
        onOpenChange={(open) => setFinanceDialog((f) => ({ ...f, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable Reporting access?</AlertDialogTitle>
            <AlertDialogDescription>
              Finance access usually requires Reporting access. Enable both?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const p = financeDialog.pending
                if (p) {
                  if (p.mode === "category" && p.category) {
                    toggleCategory(p.category, p.accessType, p.value, true)
                  } else {
                    patchCell(p.moduleId, p.accessType, p.value, true)
                  }
                }
                setFinanceDialog({ open: false, pending: null })
              }}
            >
              Enable both
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
