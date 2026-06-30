"use client"

import { useCallback, useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { apiClient } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Settings2,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  IndianRupee,
  LayoutGrid,
  Sliders,
  Clock,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { CONSTRAINT_KEYS, CONSTRAINT_LABELS } from "@/lib/billingConstraints"

// ── Static reference data ─────────────────────────────────────────────────────

const TIERS   = ["free", "starter", "pro", "enterprise"] as const
const TIER_COLORS: Record<string, string> = {
  free:       "text-slate-500",
  starter:    "text-blue-500",
  pro:        "text-violet-500",
  enterprise: "text-amber-500",
}

const FEATURE_KEYS = [
  "events", "merchandise", "news", "gallery", "polls", "chants",
  "external_ticketing", "volunteer", "leaderboard", "coupons", "refunds",
  "membership", "website", "reporting", "wa_marketing", "ads", "predictions", "onboarding",
] as const

const FEATURE_LABELS: Record<string, string> = {
  events:             "Events & Tickets",
  merchandise:        "Merchandise Store",
  news:               "News & Updates",
  gallery:            "Gallery",
  polls:              "Polls",
  chants:             "Club Chants",
  external_ticketing: "External Ticketing",
  volunteer:          "Volunteer",
  leaderboard:        "Leaderboard",
  coupons:            "Coupons",
  refunds:            "Refunds",
  membership:         "Membership",
  website:            "Group Website",
  reporting:          "Reporting",
  wa_marketing:       "WhatsApp Marketing",
  ads:                "Ad Engine",
  predictions:        "Guess the Score",
  onboarding:         "Onboarding & Promotions",
}

const ADDON_KEYS = [
  "wa_marketing", "ads", "predictions", "reporting",
  "external_ticketing", "leaderboard", "volunteer", "coupons",
] as const

const SERVICE_IDS: Record<string, string> = {
  events:             "SVC-EVENTS-001",
  merchandise:        "SVC-MERCH-001",
  news:               "SVC-NEWS-001",
  gallery:            "SVC-GALLERY-001",
  polls:              "SVC-POLLS-001",
  chants:             "SVC-CHANTS-001",
  external_ticketing: "SVC-EXTICK-001",
  volunteer:          "SVC-VOLUN-001",
  leaderboard:        "SVC-LBOARD-001",
  coupons:            "SVC-COUPONS-001",
  refunds:            "SVC-REFUNDS-001",
  membership:         "SVC-MEMBER-001",
  website:            "SVC-WEBSITE-001",
  reporting:          "SVC-REPORT-001",
  wa_marketing:       "SVC-WAMARK-001",
  ads:                "SVC-ADS-001",
  predictions:        "SVC-PREDIC-001",
  onboarding:         "SVC-ONBOARD-001",
}

// Hardcoded default values for the Reset button
const DEFAULT_TIER_PRICES: Record<string, number> = {
  free: 0, starter: 49, pro: 149, enterprise: 399,
}
const DEFAULT_ADDON_PRICES: Record<string, number> = {
  wa_marketing: 49, ads: 29, predictions: 19, reporting: 19,
  external_ticketing: 29, leaderboard: 15, volunteer: 15, coupons: 9,
}
const DEFAULT_TRIAL_DAYS = 14
const DEFAULT_DELINQUENT_HOURS = 24

// ── Page ──────────────────────────────────────────────────────────────────────

type Settings = {
  tier_prices:                  Record<string, number>
  tier_presets:                 Record<string, Record<string, boolean>>
  tier_constraints:             Record<string, Record<string, number>>
  addon_pricing:                Record<string, number>
  trial_period_days:            number
  delinquent_auto_toggle_hours: number
  updated_at?:                  string
  updated_by?:                  string
}

export default function BillingSettingsPage() {
  const { user, isLoading: authLoading } = useAuth()

  const [original,  setOriginal]  = useState<Settings | null>(null)
  const [settings,  setSettings]  = useState<Settings | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState<string | null>(null) // which tab is saving

  // ── Load ──────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.getBillingSettings()
      if (res.success && res.data) {
        const raw = res.data as Settings
        raw.tier_prices      ??= {}
        raw.tier_presets     ??= {}
        raw.tier_constraints ??= {}
        raw.addon_pricing    ??= {}
        setOriginal(raw)
        setSettings(structuredClone(raw))
      }
    } catch {
      toast.error("Failed to load billing settings")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Save helpers ──────────────────────────────────────────────────────

  const saveSection = async (tab: string, payload: Partial<Settings>) => {
    setSaving(tab)
    try {
      const res = await apiClient.updateBillingSettings(payload)
      if (res.success && res.data) {
        const updated = res.data as Settings
        setOriginal(updated)
        setSettings(structuredClone(updated))
        toast.success("Settings saved")
      } else {
        toast.error("Failed to save")
      }
    } catch {
      toast.error("Failed to save")
    } finally {
      setSaving(null)
    }
  }

  // ── Patch helpers ─────────────────────────────────────────────────────

  const setTierPrice = (tier: string, val: number) =>
    setSettings((s) => s ? { ...s, tier_prices: { ...s.tier_prices, [tier]: val } } : s)

  const setAddonPrice = (key: string, val: number) =>
    setSettings((s) => s ? { ...s, addon_pricing: { ...s.addon_pricing, [key]: val } } : s)

  const toggleBundle = (tier: string, featureKey: string, checked: boolean) =>
    setSettings((s) => {
      if (!s) return s
      return {
        ...s,
        tier_presets: {
          ...s.tier_presets,
          [tier]: { ...(s.tier_presets[tier] ?? {}), [featureKey]: checked },
        },
      }
    })

  const setConstraint = (tier: string, constraintKey: string, val: number | null) =>
    setSettings((s) => {
      if (!s) return s
      const next = { ...(s.tier_constraints[tier] ?? {}) }
      if (val === null) delete next[constraintKey]
      else next[constraintKey] = val
      return { ...s, tier_constraints: { ...s.tier_constraints, [tier]: next } }
    })

  // ── Auth guard ────────────────────────────────────────────────────────

  if (!authLoading && user?.role !== "system_owner") {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Only system owners can access Billing Settings.</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (loading || !settings) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const isSaving = (tab: string) => saving === tab

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-5 max-w-4xl mx-auto">

          {/* ── Header ──────────────────────────────────────────────── */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2.5">
                <Settings2 className="h-6 w-6 text-primary shrink-0" />
                Billing Settings
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Configure tier prices, feature bundles, add-on rates, and operational thresholds.
                Changes take effect on the next billing cycle recalculation.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {settings.updated_at && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  Saved {new Date(settings.updated_at).toLocaleDateString()}
                  {settings.updated_by && ` by ${settings.updated_by}`}
                </span>
              )}
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={load}>
                <RefreshCw className="h-3 w-3" />
                Reload
              </Button>
              <Link href="/dashboard/billing-auditor">
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <ArrowLeft className="h-3 w-3" />
                  Auditor
                </Button>
              </Link>
            </div>
          </div>

          {/* ── Tabs ────────────────────────────────────────────────── */}
          <Tabs defaultValue="pricing">
            <TabsList className="h-9">
              <TabsTrigger value="pricing"   className="text-xs gap-1.5"><IndianRupee className="h-3 w-3" />Pricing</TabsTrigger>
              <TabsTrigger value="bundles"   className="text-xs gap-1.5"><LayoutGrid className="h-3 w-3" />Feature Bundles</TabsTrigger>
              <TabsTrigger value="limits"    className="text-xs gap-1.5"><Sliders className="h-3 w-3" />Limits</TabsTrigger>
              <TabsTrigger value="ops"       className="text-xs gap-1.5"><ShieldCheck className="h-3 w-3" />Operations</TabsTrigger>
            </TabsList>

            {/* ── TAB: Pricing ─────────────────────────────────────── */}
            <TabsContent value="pricing" className="mt-4 space-y-6">

              {/* Tier base prices */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-semibold text-sm">Tier Base Prices</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Monthly subscription price (INR) per billing tier.</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => {
                      setSettings((s) => s ? { ...s, tier_prices: { ...DEFAULT_TIER_PRICES } } : s)
                      toast("Reset to defaults — click Save to apply")
                    }}
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    Reset defaults
                  </Button>
                </div>

                <div className="rounded-xl border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/40 border-b">
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5 w-[180px]">Tier</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Monthly price (₹)</th>
                        <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">Default</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {TIERS.map((tier) => (
                        <tr key={tier} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <span className={cn("font-semibold capitalize", TIER_COLORS[tier])}>{tier}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 max-w-[140px]">
                              <span className="text-muted-foreground text-sm">₹</span>
                              <Input
                                type="number"
                                min={0}
                                step={1}
                                className="h-7 text-sm w-24"
                                value={settings.tier_prices?.[tier] ?? 0}
                                onChange={(e) => setTierPrice(tier, Math.max(0, parseInt(e.target.value) || 0))}
                              />
                              <span className="text-xs text-muted-foreground">/mo</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-xs text-muted-foreground font-mono">
                              ₹{DEFAULT_TIER_PRICES[tier]}/mo
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Separator />

              {/* Add-on prices */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-semibold text-sm">Add-on Feature Prices</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Monthly price for features available as standalone add-ons on any tier.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => {
                      setSettings((s) => s ? { ...s, addon_pricing: { ...DEFAULT_ADDON_PRICES } } : s)
                      toast("Reset to defaults — click Save to apply")
                    }}
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    Reset defaults
                  </Button>
                </div>

                <div className="rounded-xl border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/40 border-b">
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Feature</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5 hidden sm:table-cell">Service ID</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Add-on price (₹)</th>
                        <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">Default</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {ADDON_KEYS.map((key) => (
                        <tr key={key} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-medium">{FEATURE_LABELS[key]}</span>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
                              {SERVICE_IDS[key]}
                            </code>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 max-w-[140px]">
                              <span className="text-muted-foreground text-sm">₹</span>
                              <Input
                                type="number"
                                min={0}
                                step={1}
                                className="h-7 text-sm w-24"
                                value={settings.addon_pricing?.[key] ?? 0}
                                onChange={(e) => setAddonPrice(key, Math.max(0, parseInt(e.target.value) || 0))}
                              />
                              <span className="text-xs text-muted-foreground">/mo</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-xs text-muted-foreground font-mono">
                              ₹{DEFAULT_ADDON_PRICES[key] ?? 0}/mo
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={isSaving("pricing")}
                  onClick={() => saveSection("pricing", {
                    tier_prices:  settings.tier_prices,
                    addon_pricing: settings.addon_pricing,
                  })}
                >
                  {isSaving("pricing") ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  Save pricing
                </Button>
              </div>
            </TabsContent>

            {/* ── TAB: Feature Bundles ─────────────────────────────── */}
            <TabsContent value="bundles" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-sm">Feature Bundles per Tier</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Check which features are included in each tier's base price. Unchecked features become paid add-ons.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="bg-muted/40 border-b">
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5 min-w-[200px]">Feature</th>
                      {TIERS.map((t) => (
                        <th key={t} className={cn("text-center text-xs font-semibold px-3 py-2.5 w-24 capitalize", TIER_COLORS[t])}>
                          {t}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {FEATURE_KEYS.map((key) => (
                      <tr key={key} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-medium">{FEATURE_LABELS[key]}</td>
                        {TIERS.map((tier) => (
                          <td key={tier} className="px-3 py-2.5 text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={Boolean(settings.tier_presets?.[tier]?.[key])}
                                onCheckedChange={(v) => toggleBundle(tier, key, Boolean(v))}
                                className="h-4 w-4"
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  Removing a feature from a tier will affect existing clubs on that tier at next billing run.
                </p>
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={isSaving("bundles")}
                  onClick={() => saveSection("bundles", { tier_presets: settings.tier_presets })}
                >
                  {isSaving("bundles") ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  Save bundles
                </Button>
              </div>
            </TabsContent>

            {/* ── TAB: Limits ──────────────────────────────────────── */}
            <TabsContent value="limits" className="mt-4 space-y-4">
              <div>
                <h2 className="font-semibold text-sm">Feature Limits per Tier</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Set usage caps per constraint key. Leave blank (0) to apply no limit for that tier.
                </p>
              </div>

              <div className="rounded-xl border overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="bg-muted/40 border-b">
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5 min-w-[220px]">Constraint</th>
                      {TIERS.map((t) => (
                        <th key={t} className={cn("text-center text-xs font-semibold px-3 py-2.5 w-28 capitalize", TIER_COLORS[t])}>
                          {t}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {CONSTRAINT_KEYS.map((cKey) => (
                      <tr key={cKey} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5">
                          <p className="font-medium leading-none mb-0.5">{CONSTRAINT_LABELS[cKey]}</p>
                          <code className="text-[10px] text-muted-foreground font-mono">{cKey}</code>
                        </td>
                        {TIERS.map((tier) => {
                          const val = settings.tier_constraints?.[tier]?.[cKey]
                          return (
                            <td key={tier} className="px-3 py-2.5 text-center">
                              <Input
                                type="number"
                                min={0}
                                step={1}
                                placeholder="∞"
                                className="h-7 text-xs w-full text-center"
                                value={val ?? ""}
                                onChange={(e) => {
                                  const n = parseInt(e.target.value)
                                  setConstraint(tier, cKey, isNaN(n) || n === 0 ? null : n)
                                }}
                              />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={isSaving("limits")}
                  onClick={() => saveSection("limits", { tier_constraints: settings.tier_constraints })}
                >
                  {isSaving("limits") ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  Save limits
                </Button>
              </div>
            </TabsContent>

            {/* ── TAB: Operations ──────────────────────────────────── */}
            <TabsContent value="ops" className="mt-4 space-y-6">

              <div className="rounded-xl border divide-y">

                {/* Trial period */}
                <div className="px-5 py-4 flex items-start justify-between gap-6">
                  <div>
                    <h3 className="font-semibold text-sm">Trial Period</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      Number of days a feature stays active after a trial is started.
                      After this period the feature auto-reverts to OFF.
                    </p>
                    <Badge variant="secondary" className="text-[10px] mt-2 font-mono">
                      Default: {DEFAULT_TRIAL_DAYS} days
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      className="h-8 w-20 text-sm text-center"
                      value={settings.trial_period_days}
                      onChange={(e) => {
                        const n = Math.max(1, parseInt(e.target.value) || 1)
                        setSettings((s) => s ? { ...s, trial_period_days: n } : s)
                      }}
                    />
                    <span className="text-xs text-muted-foreground">days</span>
                  </div>
                </div>

                {/* Delinquent grace period */}
                <div className="px-5 py-4 flex items-start justify-between gap-6">
                  <div>
                    <h3 className="font-semibold text-sm">Delinquent Grace Period</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      Hours after a club's billing status becomes delinquent before premium
                      features are automatically disabled by the billing cron.
                    </p>
                    <Badge variant="secondary" className="text-[10px] mt-2 font-mono">
                      Default: {DEFAULT_DELINQUENT_HOURS}h
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Input
                      type="number"
                      min={1}
                      max={720}
                      className="h-8 w-20 text-sm text-center"
                      value={settings.delinquent_auto_toggle_hours}
                      onChange={(e) => {
                        const n = Math.max(1, parseInt(e.target.value) || 1)
                        setSettings((s) => s ? { ...s, delinquent_auto_toggle_hours: n } : s)
                      }}
                    />
                    <span className="text-xs text-muted-foreground">hours</span>
                  </div>
                </div>

              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={isSaving("ops")}
                  onClick={() => saveSection("ops", {
                    trial_period_days:            settings.trial_period_days,
                    delinquent_auto_toggle_hours: settings.delinquent_auto_toggle_hours,
                  })}
                >
                  {isSaving("ops") ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  Save operations
                </Button>
              </div>
            </TabsContent>
          </Tabs>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
