"use client"

import { useCallback, useEffect, useState } from "react"
import { apiClient } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, ScanLine, FileBarChart, Shield, Eye } from "lucide-react"
import { toast } from "sonner"

type VendorFeature = {
  moduleId: string
  label: string
  href?: string
  category: string
  active: boolean
  canEdit?: boolean
}

export function VendorRoleToggle() {
  const [loading, setLoading] = useState(true)
  const [previewAsVendor, setPreviewAsVendor] = useState(false)
  const [roleLabel, setRoleLabel] = useState("Vendor / Match-Day Crew")
  const [activeFeatures, setActiveFeatures] = useState<VendorFeature[]>([])
  const [inactiveFeatures, setInactiveFeatures] = useState<VendorFeature[]>([])

  const loadPreview = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.getVendorRolePreview()
      if (res.success && res.data) {
        setRoleLabel(res.data.roleLabel || "Vendor / Match-Day Crew")
        setActiveFeatures(
          (res.data.activeFeatures || []).map((f: VendorFeature) => ({ ...f, active: true }))
        )
        setInactiveFeatures(
          (res.data.inactiveFeatures || []).map((f: VendorFeature) => ({ ...f, active: false }))
        )
      }
    } catch {
      toast.error("Failed to load vendor role preview")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPreview()
  }, [loadPreview])

  const displayedActive = previewAsVendor
    ? activeFeatures
    : activeFeatures.map((f) => ({ ...f, active: true }))
  const displayedBlocked = previewAsVendor ? inactiveFeatures : []

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Vendor Role Audit
            </CardTitle>
            <CardDescription>
              Toggle to preview exactly which features are active for the {roleLabel} role during match-day operations.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
            <Label htmlFor="vendor-role-toggle" className="text-sm font-medium">
              Role Toggle
            </Label>
            <Switch
              id="vendor-role-toggle"
              checked={previewAsVendor}
              onCheckedChange={setPreviewAsVendor}
            />
            <span className="text-xs text-muted-foreground">
              {previewAsVendor ? "Vendor view" : "Full admin view"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="mb-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            Active for Vendor ({displayedActive.length})
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {displayedActive.map((feature) => (
              <div
                key={feature.moduleId}
                className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50/50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-950/30"
              >
                <div className="flex items-center gap-2">
                  {feature.moduleId === "eventScanner" ? (
                    <ScanLine className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <FileBarChart className="h-4 w-4 text-emerald-600" />
                  )}
                  <span className="text-sm font-medium">{feature.label}</span>
                </div>
                <Badge variant="outline" className="text-emerald-700">
                  {feature.canEdit ? "Scan" : "View"}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {displayedBlocked.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-semibold text-destructive">
              Blocked for Vendor ({displayedBlocked.length})
            </h4>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {displayedBlocked.map((feature) => (
                <div
                  key={feature.moduleId}
                  className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 opacity-75"
                >
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground line-through">{feature.label}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Attempts to access finance, settings, or member directory return 403 Forbidden and are logged as
              &quot;Unauthorized Access Attempt.&quot;
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
