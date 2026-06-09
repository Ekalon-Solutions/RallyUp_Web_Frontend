"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Save, ShieldCheck, History } from "lucide-react"
import { toast } from "sonner"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { apiClient } from "@/lib/api"

export function RefundPolicySettingsTab() {
  const clubId = useRequiredClubId()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [grandfatherPurchasedRefunds, setGrandfatherPurchasedRefunds] = useState(true)

  useEffect(() => {
    if (clubId) loadSettings()
  }, [clubId])

  const loadSettings = async () => {
    if (!clubId) return
    try {
      setLoading(true)
      const res = await apiClient.getClubSettings(clubId)
      if (res.success && res.data) {
        const s = (res.data as any)?.data ?? res.data
        const val = s?.refundPolicy?.grandfatherPurchasedRefunds
        setGrandfatherPurchasedRefunds(val === undefined || val === null ? true : Boolean(val))
      }
    } catch {
      toast.error("Failed to load refund policy settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!clubId) return
    setSaving(true)
    try {
      const res = await apiClient.updateClubRefundPolicy(clubId, { grandfatherPurchasedRefunds })
      if (res.success) {
        toast.success("Refund policy settings saved")
      } else {
        toast.error((res as any).message ?? "Failed to save settings")
      }
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Grandfathering Policy
          </CardTitle>
          <CardDescription>
            Controls whether members who purchased tickets while refunds were allowed retain their
            refund rights if the admin later disables refunds mid-event.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between gap-6 rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="grandfather-toggle" className="text-base font-semibold">
                Honour refunds for pre-policy-change purchasers
              </Label>
              <p className="text-sm text-muted-foreground">
                When <strong>enabled</strong>: members who bought a ticket while refunds were active
                will still see the Cancel / Refund button, even after an admin switches the event to
                Non-Refundable. The Policy Change Timestamp is used to determine eligibility.
              </p>
              <p className="text-sm text-muted-foreground">
                When <strong>disabled</strong>: the current refund policy applies to all ticket
                holders regardless of when they purchased.
              </p>
            </div>
            <Switch
              id="grandfather-toggle"
              checked={grandfatherPurchasedRefunds}
              onCheckedChange={setGrandfatherPurchasedRefunds}
              disabled={saving}
              className="shrink-0 mt-1"
            />
          </div>

          <Separator />

          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
              <History className="h-4 w-4" />
              How grandfathering works
            </div>
            <ul className="list-disc pl-5 space-y-1 text-amber-700 dark:text-amber-400">
              <li>
                When an admin changes an active event from Refundable → Non-Refundable, a{" "}
                <strong>Policy Change Timestamp</strong> is automatically recorded.
              </li>
              <li>
                Any member whose registration date is <em>before</em> that timestamp (or whose
                ticket has <code>policyAtPurchase.isRefundAllowed = true</code>) is considered
                grandfathered.
              </li>
              <li>
                Grandfathered members continue to see the Cancel / Refund action in their app.
              </li>
              <li>
                Every mid-event policy change is broadcast to the Admin Action Audit Trail with
                Old Policy and New Policy for legal protection.
              </li>
            </ul>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
