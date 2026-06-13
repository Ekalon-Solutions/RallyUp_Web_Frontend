"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { apiClient } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Download,
  Eye,
  FileText,
  Globe,
  Hash,
  Loader2,
  Lock,
  MessageSquare,
  Monitor,
  Search,
  Shield,
  ShieldAlert,
  ToggleRight,
  User,
  Users,
  X,
  Zap,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { CLUB_FEATURE_KEYS, FEATURE_DESCRIPTIONS, FEATURE_LABELS } from "@/lib/clubFeatures"
import type { ClubFeatureKey } from "@/lib/clubFeatures"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AuditEntry = {
  _id: string
  club: { _id: string; name: string; slug: string } | string
  actorId: string
  actorType: "system_owner" | "admin"
  actorName?: string
  featureKey: ClubFeatureKey | "billing_tier" | "bulk_update"
  oldValue: string
  newValue: string
  reasonCode?: string
  summary: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

type AdminActionEntry = {
  _id: string
  club: { _id: string; name: string; slug: string } | string
  actorId: string
  actorType: "admin" | "system_owner" | "user"
  actorName?: string
  targetId?: string
  targetType?: "admin" | "user" | "refund" | "order"
  action: string
  oldState: string
  newState: string
  summary?: string
  riskLevel: "low" | "medium" | "high"
  ipAddress?: string
  deviceInfo?: { userAgent?: string; deviceType?: string }
  metadata?: Record<string, unknown>
  createdAt: string
}

type Pagination = {
  page: number
  limit: number
  total: number
  pages: number
}

// ---------------------------------------------------------------------------
// Date range presets
// ---------------------------------------------------------------------------

const DATE_PRESETS = [
  { label: "Last 7 days",    days: 7 },
  { label: "Last 30 days",   days: 30 },
  { label: "Last 90 days",   days: 90 },
  { label: "Last 12 months", days: 365 },
]

function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}
function nowISO(): string {
  return new Date().toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const REASON_LABELS: Record<string, string> = {
  tier_upgrade:                    "Tier Upgrade",
  tier_downgrade:                  "Tier Downgrade",
  manual_override:                 "Manual Override",
  billing_change:                  "Billing Change",
  trial_start:                     "Trial Start",
  trial_end:                       "Trial End",
  service_matrix_save:             "Matrix Save",
  feature_request:                 "Feature Request",
  compliance:                      "Compliance",
  support_request:                 "Support Request",
  UPGRADE_INQUIRY:                 "Upgrade Inquiry",
}

const ACTION_LABELS: Record<string, string> = {
  PROMOTE_TO_ADMIN:                  "Promote to Admin",
  DEMOTE_ADMIN:                      "Demote Admin",
  PERMISSION_CHANGE:                 "Permission Change",
  ADMIN_ACTIVATED:                   "Admin Activated",
  ADMIN_DEACTIVATED:                 "Admin Deactivated",
  REFUND_PROCESSED:                  "Refund Processed",
  REFUND_RECALCULATED:               "Refund Recalculated",
  REFUND_POLICY_CHANGED:             "Refund Policy Changed",
  EVENT_CREATED:                     "Event Created",
  EVENT_UPDATED:                     "Event Updated",
  NOTIFICATION_TEMPLATE_UPDATED:    "Template Updated",
  NOTIFICATION_TEMPLATE_RESET:      "Template Reset",
  NOTIFICATION_TEMPLATE_GLOBAL_RESET: "Global Template Reset",
  HIGH_RISK_ACTION:                  "High-Risk Action",
}

const RISK_CONFIG: Record<string, { label: string; cls: string }> = {
  low:    { label: "Low",    cls: "border-emerald-300 text-emerald-700 bg-emerald-50/50 dark:border-emerald-700 dark:text-emerald-400 dark:bg-emerald-950/20" },
  medium: { label: "Medium", cls: "border-amber-300  text-amber-700  bg-amber-50/50  dark:border-amber-700  dark:text-amber-400  dark:bg-amber-950/20"  },
  high:   { label: "High",   cls: "border-red-300    text-red-700    bg-red-50/50    dark:border-red-700    dark:text-red-400    dark:bg-red-950/20"    },
}

function renderValue(raw: string): { text: string; isOn: boolean; isOff: boolean } {
  if (!raw || raw === "—") return { text: "—", isOn: false, isOff: false }
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed === "object" && parsed !== null) {
      const { enabled, state } = parsed
      if (enabled !== undefined) {
        const stateLabel = state ?? (enabled ? "active" : "inactive")
        return { text: enabled ? `ON (${stateLabel})` : `OFF (${stateLabel})`, isOn: enabled, isOff: !enabled }
      }
      return { text: JSON.stringify(parsed), isOn: false, isOff: false }
    }
    return { text: String(parsed), isOn: false, isOff: false }
  } catch {
    return { text: raw, isOn: false, isOff: false }
  }
}

function getClubName(entry: { club: { _id: string; name: string; slug: string } | string }): string {
  if (typeof entry.club === "object" && entry.club?.name) return entry.club.name
  return "—"
}

function formatTs(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  })
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function ActorAvatar({ name, role }: { name: string; role: string }) {
  const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")
  const isSystem = role === "system_owner"
  return (
    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ${
      isSystem
        ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm shadow-violet-200 dark:shadow-violet-900/30"
        : "bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-sm shadow-blue-200 dark:shadow-blue-900/30"
    }`}>
      {initials || "?"}
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  return (
    <Badge variant="outline" className={
      role === "system_owner"
        ? "border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 text-[10px] bg-violet-50/50 dark:bg-violet-950/20"
        : "border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 text-[10px] bg-blue-50/50 dark:bg-blue-950/20"
    }>
      {role === "system_owner" ? "System Owner" : "Admin"}
    </Badge>
  )
}

function FeatureKeyBadge({ featureKey }: { featureKey: string }) {
  const isSpecial = featureKey === "billing_tier" || featureKey === "bulk_update"
  const description =
    featureKey in FEATURE_DESCRIPTIONS
      ? FEATURE_DESCRIPTIONS[featureKey as ClubFeatureKey]
      : featureKey === "billing_tier" ? "Billing tier change for the club."
      : featureKey === "bulk_update"  ? "Bulk feature update across multiple clubs."
      : null
  const badge = (
    <code className={`text-[10px] font-mono px-1.5 py-0.5 rounded cursor-default transition-colors ${
      isSpecial
        ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40"
        : "bg-muted text-muted-foreground hover:bg-muted/80"
    }`}>
      {featureKey}
    </code>
  )
  if (!description) return badge
  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] text-xs">{description}</TooltipContent>
    </Tooltip>
  )
}

function ChangeIndicator({ oldVal, newVal }: { oldVal: string; newVal: string }) {
  const o = renderValue(oldVal)
  const n = renderValue(newVal)
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className={`px-1.5 py-0.5 rounded font-medium ${
        o.isOn ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
               : o.isOff ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
               : "bg-muted text-muted-foreground"
      }`}>{o.text}</span>
      <ArrowRight className="h-3 w-3 text-muted-foreground/60 flex-shrink-0" />
      <span className={`px-1.5 py-0.5 rounded font-semibold ${
        n.isOn ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
               : n.isOff ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
               : "bg-muted text-foreground"
      }`}>{n.text}</span>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, accent }: {
  icon: React.ElementType; label: string; value: string | number; accent: string
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-4 transition-all hover:shadow-md group">
      <div className={`absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity bg-gradient-to-br ${accent}`} />
      <div className="relative flex items-center gap-3">
        <div className={`rounded-lg p-2 bg-gradient-to-br ${accent} text-white shadow-sm`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  )
}

function PaginationBar({ pagination, page, setPage }: {
  pagination: Pagination; page: number; setPage: (p: number) => void
}) {
  if (pagination.pages <= 1) return null
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground tabular-nums">
        Page {pagination.page} of {pagination.pages} &mdash; {pagination.total.toLocaleString()} records
      </p>
      <div className="flex items-center gap-1.5">
        <div className="hidden sm:flex items-center gap-1 mr-2">
          {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
            let pn: number
            if (pagination.pages <= 7)               pn = i + 1
            else if (page <= 4)                       pn = i + 1
            else if (page >= pagination.pages - 3)   pn = pagination.pages - 6 + i
            else                                      pn = page - 3 + i
            return (
              <button key={pn} onClick={() => setPage(pn)}
                className={`h-7 min-w-[28px] px-1.5 rounded text-xs font-medium transition-colors ${
                  pn === page ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
                }`}>
                {pn}
              </button>
            )
          })}
        </div>
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(Math.max(1, page - 1))} className="gap-1">
          <ChevronLeft className="h-4 w-4" /><span className="hidden sm:inline">Previous</span>
        </Button>
        <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)} className="gap-1">
          <span className="hidden sm:inline">Next</span><ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function DetailSection({ icon: Icon, label, children }: {
  icon: React.ElementType; label: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <Icon className="h-3 w-3" />{label}
      </div>
      <div className="pl-[18px]">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Feature Change Audit detail sheet
// ---------------------------------------------------------------------------

function FeatureAuditDetailSheet({ entry, open, onClose }: {
  entry: AuditEntry | null; open: boolean; onClose: () => void
}) {
  if (!entry) return null
  const clubName = typeof entry.club === "object" && entry.club?.name ? entry.club.name : "—"
  const clubId = typeof entry.club === "object" ? entry.club._id : typeof entry.club === "string" ? entry.club : "—"
  const formatFull = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      fractionalSecondDigits: 3, hour12: false, timeZoneName: "short",
    } as Intl.DateTimeFormatOptions)
  const newParsed = renderValue(entry.newValue)
  const isHighRisk = entry.featureKey === "wa_marketing" && newParsed.isOn

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />Audit Entry Detail
          </SheetTitle>
          <SheetDescription>
            Log entry <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{entry._id.slice(-8)}</code>
          </SheetDescription>
        </SheetHeader>
        {isHighRisk && (
          <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-lg p-3 mb-4">
            <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-red-700 dark:text-red-400">
              <strong>Security Alert Triggered</strong>
              <p className="mt-0.5 text-red-600 dark:text-red-400/80">
                This toggle enabled WA Marketing — an automated email alert was sent to the security lead.
              </p>
            </div>
          </div>
        )}
        <div className="space-y-5">
          <DetailSection icon={Clock} label="Timestamp">
            <p className="text-sm font-mono">{formatFull(entry.createdAt)}</p>
          </DetailSection>
          <Separator />
          <DetailSection icon={User} label="Actor">
            <div className="flex items-center gap-2">
              <ActorAvatar name={entry.actorName ?? "Unknown"} role={entry.actorType} />
              <div>
                <p className="text-sm font-medium">{entry.actorName ?? "Unknown"}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <RoleBadge role={entry.actorType} />
                  <code className="text-[10px] text-muted-foreground font-mono">UID: {entry.actorId.slice(-12)}</code>
                </div>
              </div>
            </div>
          </DetailSection>
          <Separator />
          <DetailSection icon={Building2} label="Club">
            <p className="text-sm font-medium">{clubName}</p>
            <code className="text-[10px] text-muted-foreground font-mono block mt-0.5">ID: {clubId}</code>
          </DetailSection>
          <Separator />
          <DetailSection icon={ToggleRight} label="Feature Key">
            <div className="space-y-1">
              <FeatureKeyBadge featureKey={entry.featureKey} />
              {entry.featureKey in FEATURE_DESCRIPTIONS && (
                <p className="text-xs text-muted-foreground mt-1">{FEATURE_DESCRIPTIONS[entry.featureKey as ClubFeatureKey]}</p>
              )}
            </div>
          </DetailSection>
          <Separator />
          <DetailSection icon={Activity} label="Change">
            <ChangeIndicator oldVal={entry.oldValue} newVal={entry.newValue} />
          </DetailSection>
          <Separator />
          <DetailSection icon={FileText} label="Description">
            <p className="text-sm leading-relaxed">{entry.summary}</p>
          </DetailSection>
          {entry.reasonCode && (
            <>
              <Separator />
              <DetailSection icon={Hash} label="Reason Code">
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{entry.reasonCode}</code>
                  {REASON_LABELS[entry.reasonCode] && (
                    <span className="text-xs text-muted-foreground">({REASON_LABELS[entry.reasonCode]})</span>
                  )}
                </div>
              </DetailSection>
            </>
          )}
          <Separator />
          <DetailSection icon={Globe} label="Request IP Address">
            <code className="text-sm font-mono bg-muted px-2 py-1 rounded block">{entry.ipAddress ?? "Not recorded"}</code>
          </DetailSection>
          <DetailSection icon={Monitor} label="User-Agent">
            <code className="text-xs font-mono bg-muted px-2 py-1.5 rounded block break-all leading-relaxed">{entry.userAgent ?? "Not recorded"}</code>
          </DetailSection>
          <Separator />
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-lg p-3">
            <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              This record is <strong>write-once</strong> and cannot be modified or deleted by any user, including root admins.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ---------------------------------------------------------------------------
// Admin Action detail sheet
// ---------------------------------------------------------------------------

function AdminActionDetailSheet({ entry, open, onClose }: {
  entry: AdminActionEntry | null; open: boolean; onClose: () => void
}) {
  if (!entry) return null
  const clubName = typeof entry.club === "object" && (entry.club as any)?.name ? (entry.club as any).name : "—"
  const clubId = typeof entry.club === "object" ? (entry.club as any)._id : typeof entry.club === "string" ? entry.club : "—"
  const risk = RISK_CONFIG[entry.riskLevel] ?? RISK_CONFIG.low
  const formatFull = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      fractionalSecondDigits: 3, hour12: false, timeZoneName: "short",
    } as Intl.DateTimeFormatOptions)

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />Admin Action Detail
          </SheetTitle>
          <SheetDescription>
            Log entry <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{entry._id.slice(-8)}</code>
          </SheetDescription>
        </SheetHeader>
        {entry.riskLevel === "high" && (
          <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-lg p-3 mb-4">
            <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-red-700 dark:text-red-400">
              <strong>High-Risk Action</strong>
              <p className="mt-0.5 text-red-600 dark:text-red-400/80">This action was classified as high-risk at the time of execution.</p>
            </div>
          </div>
        )}
        <div className="space-y-5">
          <DetailSection icon={Clock} label="Timestamp">
            <p className="text-sm font-mono">{formatFull(entry.createdAt)}</p>
          </DetailSection>
          <Separator />
          <DetailSection icon={User} label="Actor">
            <div className="flex items-center gap-2">
              <ActorAvatar name={entry.actorName ?? "Unknown"} role={entry.actorType} />
              <div>
                <p className="text-sm font-medium">{entry.actorName ?? "Unknown"}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <RoleBadge role={entry.actorType} />
                  <code className="text-[10px] text-muted-foreground font-mono">UID: {entry.actorId.slice(-12)}</code>
                </div>
              </div>
            </div>
          </DetailSection>
          <Separator />
          <DetailSection icon={Building2} label="Club">
            <p className="text-sm font-medium">{clubName}</p>
            <code className="text-[10px] text-muted-foreground font-mono block mt-0.5">ID: {clubId}</code>
          </DetailSection>
          <Separator />
          <DetailSection icon={Zap} label="Action">
            <div className="flex items-center gap-2">
              <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{entry.action}</code>
              {ACTION_LABELS[entry.action] && (
                <span className="text-xs text-muted-foreground">({ACTION_LABELS[entry.action]})</span>
              )}
            </div>
          </DetailSection>
          <Separator />
          <DetailSection icon={Activity} label="State Change">
            <ChangeIndicator oldVal={entry.oldState} newVal={entry.newState} />
          </DetailSection>
          {entry.summary && (
            <>
              <Separator />
              <DetailSection icon={FileText} label="Summary">
                <p className="text-sm leading-relaxed">{entry.summary}</p>
              </DetailSection>
            </>
          )}
          {typeof entry.metadata?.reason === "string" && entry.metadata.reason.trim() !== "" && (
            <>
              <Separator />
              <DetailSection icon={MessageSquare} label="Reason for Change">
                <p className="text-sm leading-relaxed bg-muted/50 rounded-lg p-3 border">{entry.metadata.reason}</p>
              </DetailSection>
            </>
          )}
          <Separator />
          <DetailSection icon={AlertTriangle} label="Risk Level">
            <Badge variant="outline" className={`text-[10px] ${risk.cls}`}>{risk.label}</Badge>
          </DetailSection>
          <Separator />
          <DetailSection icon={Globe} label="IP Address">
            <code className="text-sm font-mono bg-muted px-2 py-1 rounded block">{entry.ipAddress ?? "Not recorded"}</code>
          </DetailSection>
          <DetailSection icon={Monitor} label="User-Agent">
            <code className="text-xs font-mono bg-muted px-2 py-1.5 rounded block break-all leading-relaxed">
              {entry.deviceInfo?.userAgent ?? "Not recorded"}
            </code>
          </DetailSection>
          <Separator />
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-lg p-3">
            <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              This record is <strong>write-once</strong> and cannot be modified or deleted by any user, including root admins.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ---------------------------------------------------------------------------
// Tab: Feature Changes
// ---------------------------------------------------------------------------

function FeatureChangesTab() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [search, setSearch] = useState("")
  const [featureKey, setFeatureKey] = useState("all")
  const [datePreset, setDatePreset] = useState(365)
  const [page, setPage] = useState(1)
  const [detailEntry, setDetailEntry] = useState<AuditEntry | null>(null)

  const buildParams = useCallback(() => ({
    search: search.trim() || undefined,
    featureKey: featureKey !== "all" ? featureKey : undefined,
    startDate: daysAgoISO(datePreset),
    endDate: nowISO(),
    page,
    limit: 50,
  }), [search, featureKey, datePreset, page])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.getClubFeatureAuditLog(buildParams())
      if (res.success) {
        const body = (res as any).data
        setEntries(Array.isArray(body?.data) ? body.data : [])
        if (body?.pagination) setPagination(body.pagination)
      }
    } catch { toast.error("Failed to load audit log") }
    finally { setLoading(false) }
  }, [buildParams])

  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t) }, [load])
  useEffect(() => { setPage(1) }, [search, featureKey, datePreset])

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return {
      total: pagination.total,
      todayCount: entries.filter(e => e.createdAt.slice(0, 10) === today).length,
      uniqueClubs: new Set(entries.map(e => typeof e.club === "object" ? e.club._id : e.club).filter(Boolean)).size,
      securityAlerts: entries.filter(e => e.featureKey === "wa_marketing" && renderValue(e.newValue).isOn).length,
    }
  }, [entries, pagination.total])

  const handleExport = async () => {
    setExporting(true)
    try {
      const p = buildParams()
      const html = await apiClient.fetchAuditReportHtml({ search: p.search, featureKey: p.featureKey, startDate: p.startDate, endDate: p.endDate })
      if (!html) { toast.error("Failed to generate compliance report"); return }
      const blob = new Blob([html], { type: "text/html;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const win = window.open(url, "_blank")
      if (!win) toast.info("Please allow popups to open the compliance report.")
      setTimeout(() => URL.revokeObjectURL(url), 30_000)
    } catch { toast.error("Failed to generate compliance report") }
    finally { setExporting(false) }
  }

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={ClipboardList} label="Total Records"    value={stats.total.toLocaleString()} accent="from-primary to-violet-600" />
        <StatCard icon={Calendar}     label="Changes Today"    value={stats.todayCount}             accent="from-blue-500 to-cyan-600" />
        <StatCard icon={Building2}    label="Clubs Affected"   value={stats.uniqueClubs}            accent="from-amber-500 to-orange-600" />
        <StatCard icon={ShieldAlert}  label="Security Alerts"  value={stats.securityAlerts}
          accent={stats.securityAlerts > 0 ? "from-red-500 to-rose-600" : "from-emerald-500 to-teal-600"} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Search className="h-4 w-4 text-muted-foreground" />Search & Filter</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="gap-1.5">
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Compliance PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative min-w-[240px] flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="pl-9 pr-8 text-sm" placeholder="Search by actor name…" value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted" onClick={() => setSearch("")}><X className="h-3 w-3 text-muted-foreground" /></button>}
            </div>
            <Select value={featureKey} onValueChange={setFeatureKey}>
              <SelectTrigger className="w-52"><SelectValue placeholder="All features" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All features</SelectItem>
                <SelectItem value="billing_tier">Billing Tier</SelectItem>
                <SelectItem value="bulk_update">Bulk Update</SelectItem>
                {CLUB_FEATURE_KEYS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(datePreset)} onValueChange={v => setDatePreset(parseInt(v, 10))}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>{DATE_PRESETS.map(p => <SelectItem key={p.days} value={String(p.days)}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground ml-auto tabular-nums">{pagination.total.toLocaleString()} record{pagination.total !== 1 ? "s" : ""}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
              <p className="text-sm text-muted-foreground">Loading audit records…</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="rounded-full bg-muted p-4"><ClipboardList className="h-8 w-8 text-muted-foreground/30" /></div>
              <p className="text-muted-foreground font-medium">No audit records found.</p>
              <p className="text-xs text-muted-foreground max-w-sm">Try adjusting the date range or clearing the search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="whitespace-nowrap w-[150px]">Timestamp</TableHead>
                    <TableHead className="w-[160px]">Actor</TableHead>
                    <TableHead className="w-[130px]">Club</TableHead>
                    <TableHead className="w-[120px]">Feature</TableHead>
                    <TableHead className="w-[220px]">Change</TableHead>
                    <TableHead className="min-w-[200px]">Description</TableHead>
                    <TableHead className="w-[100px]">Reason</TableHead>
                    <TableHead className="w-[140px]">
                      <Tooltip>
                        <TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-2">IP / UA</TooltipTrigger>
                        <TooltipContent side="top">Request IP Address and User-Agent string</TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map(entry => {
                    const isWaAlert = entry.featureKey === "wa_marketing" && renderValue(entry.newValue).isOn
                    return (
                      <TableRow key={entry._id} className={`cursor-pointer transition-colors group ${isWaAlert ? "bg-red-50/40 dark:bg-red-950/10 hover:bg-red-50/70" : "hover:bg-muted/40"}`} onClick={() => setDetailEntry(entry)}>
                        <TableCell className="whitespace-nowrap">
                          <div className="text-xs font-mono text-foreground">{formatTs(entry.createdAt)}</div>
                          <div className="text-[10px] text-muted-foreground">{formatRelative(entry.createdAt)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ActorAvatar name={entry.actorName ?? entry.actorId.slice(-6)} role={entry.actorType} />
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate max-w-[110px]">{entry.actorName ?? entry.actorId.slice(-8)}</div>
                              <RoleBadge role={entry.actorType} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-[130px]"><span className="truncate block font-medium">{getClubName(entry)}</span></TableCell>
                        <TableCell>
                          <FeatureKeyBadge featureKey={entry.featureKey} />
                          {isWaAlert && <div className="mt-1"><Badge variant="destructive" className="text-[9px] px-1 py-0"><AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Alert</Badge></div>}
                        </TableCell>
                        <TableCell><ChangeIndicator oldVal={entry.oldValue} newVal={entry.newValue} /></TableCell>
                        <TableCell className="text-sm max-w-[260px]">
                          <Tooltip>
                            <TooltipTrigger asChild><span className="line-clamp-2 cursor-pointer">{entry.summary}</span></TooltipTrigger>
                            <TooltipContent side="top" className="max-w-sm text-xs">{entry.summary}</TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {entry.reasonCode ? (
                            <Tooltip>
                              <TooltipTrigger asChild><code className="bg-muted px-1.5 py-0.5 rounded text-[10px] cursor-help">{entry.reasonCode}</code></TooltipTrigger>
                              {REASON_LABELS[entry.reasonCode] && <TooltipContent side="top" className="text-xs">{REASON_LABELS[entry.reasonCode]}</TooltipContent>}
                            </Tooltip>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[140px]">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help space-y-0.5">
                                <div className="truncate font-mono">{entry.ipAddress ?? "—"}</div>
                                <div className="truncate text-[10px]">{entry.userAgent?.slice(0, 35) ?? "—"}{(entry.userAgent?.length ?? 0) > 35 ? "…" : ""}</div>
                              </div>
                            </TooltipTrigger>
                            {entry.userAgent && (
                              <TooltipContent side="left" className="max-w-xs text-xs font-mono break-all">
                                <strong>IP:</strong> {entry.ipAddress ?? "unknown"}<br /><strong>UA:</strong> {entry.userAgent}
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={e => { e.stopPropagation(); setDetailEntry(entry) }} aria-label="View details">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PaginationBar pagination={pagination} page={page} setPage={setPage} />

      <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground border-t pt-4">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Feature ON</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" />Feature OFF</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" />Special (Tier/Bulk)</span>
        <span className="flex items-center gap-1.5"><AlertTriangle className="h-2.5 w-2.5 text-red-500" />Security alert triggered</span>
      </div>

      <FeatureAuditDetailSheet entry={detailEntry} open={!!detailEntry} onClose={() => setDetailEntry(null)} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab: Upgrade Inquiries
// ---------------------------------------------------------------------------

function UpgradeInquiriesTab() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [featureKey, setFeatureKey] = useState("all")
  const [datePreset, setDatePreset] = useState(365)
  const [page, setPage] = useState(1)
  const [detailEntry, setDetailEntry] = useState<AuditEntry | null>(null)

  const buildParams = useCallback(() => ({
    search: search.trim() || undefined,
    featureKey: featureKey !== "all" ? featureKey : undefined,
    reasonCode: "UPGRADE_INQUIRY",
    startDate: daysAgoISO(datePreset),
    endDate: nowISO(),
    page,
    limit: 50,
  }), [search, featureKey, datePreset, page])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.getClubFeatureAuditLog(buildParams())
      if (res.success) {
        const body = (res as any).data
        setEntries(Array.isArray(body?.data) ? body.data : [])
        if (body?.pagination) setPagination(body.pagination)
      }
    } catch { toast.error("Failed to load inquiries") }
    finally { setLoading(false) }
  }, [buildParams])

  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t) }, [load])
  useEffect(() => { setPage(1) }, [search, featureKey, datePreset])

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const featureCounts: Record<string, number> = {}
    entries.forEach(e => { featureCounts[e.featureKey] = (featureCounts[e.featureKey] ?? 0) + 1 })
    const topFeature = Object.entries(featureCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"
    return {
      total: pagination.total,
      todayCount: entries.filter(e => e.createdAt.slice(0, 10) === today).length,
      uniqueClubs: new Set(entries.map(e => typeof e.club === "object" ? e.club._id : e.club).filter(Boolean)).size,
      topFeature,
    }
  }, [entries, pagination.total])

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={MessageSquare} label="Total Inquiries"  value={pagination.total.toLocaleString()} accent="from-primary to-violet-600" />
        <StatCard icon={Calendar}      label="Today"            value={stats.todayCount}                  accent="from-blue-500 to-cyan-600" />
        <StatCard icon={Building2}     label="Clubs Requesting" value={stats.uniqueClubs}                 accent="from-amber-500 to-orange-600" />
        <StatCard icon={Lock}          label="Most Wanted"      value={stats.topFeature}                  accent="from-emerald-500 to-teal-600" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Search className="h-4 w-4 text-muted-foreground" />Filter Inquiries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative min-w-[240px] flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="pl-9 pr-8 text-sm" placeholder="Search by admin name…" value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted" onClick={() => setSearch("")}><X className="h-3 w-3 text-muted-foreground" /></button>}
            </div>
            <Select value={featureKey} onValueChange={setFeatureKey}>
              <SelectTrigger className="w-52"><SelectValue placeholder="All features" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All features</SelectItem>
                {CLUB_FEATURE_KEYS.map(k => (
                  <SelectItem key={k} value={k}>{(FEATURE_LABELS as Record<string, string>)[k] ?? k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(datePreset)} onValueChange={v => setDatePreset(parseInt(v, 10))}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>{DATE_PRESETS.map(p => <SelectItem key={p.days} value={String(p.days)}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground ml-auto tabular-nums">{pagination.total.toLocaleString()} inquir{pagination.total !== 1 ? "ies" : "y"}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
              <p className="text-sm text-muted-foreground">Loading inquiries…</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="rounded-full bg-muted p-4"><MessageSquare className="h-8 w-8 text-muted-foreground/30" /></div>
              <p className="text-muted-foreground font-medium">No upgrade inquiries found.</p>
              <p className="text-xs text-muted-foreground max-w-sm">Inquiries appear here when club admins click "Request Reactivation" or "Upgrade to Unlock."</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="whitespace-nowrap w-[150px]">Submitted</TableHead>
                    <TableHead className="w-[160px]">Admin</TableHead>
                    <TableHead className="w-[140px]">Club</TableHead>
                    <TableHead className="w-[140px]">Feature Requested</TableHead>
                    <TableHead className="min-w-[200px]">Message</TableHead>
                    <TableHead className="w-[140px]">IP / UA</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map(entry => (
                    <TableRow key={entry._id} className="cursor-pointer hover:bg-muted/40 group" onClick={() => setDetailEntry(entry)}>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-xs font-mono text-foreground">{formatTs(entry.createdAt)}</div>
                        <div className="text-[10px] text-muted-foreground">{formatRelative(entry.createdAt)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ActorAvatar name={entry.actorName ?? "?"} role={entry.actorType} />
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate max-w-[110px]">{entry.actorName ?? "—"}</div>
                            <RoleBadge role={entry.actorType} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium truncate max-w-[140px]">{getClubName(entry)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <code className="text-[10px] font-mono bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 px-1.5 py-0.5 rounded">
                            {entry.featureKey}
                          </code>
                        </div>
                        {(FEATURE_LABELS as Record<string, string>)[entry.featureKey] && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">{(FEATURE_LABELS as Record<string, string>)[entry.featureKey]}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm max-w-[300px]">
                        <Tooltip>
                          <TooltipTrigger asChild><span className="line-clamp-2 cursor-pointer">{entry.summary}</span></TooltipTrigger>
                          <TooltipContent side="top" className="max-w-sm text-xs">{entry.summary}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[140px]">
                        <div className="truncate font-mono">{entry.ipAddress ?? "—"}</div>
                        <div className="truncate text-[10px]">{entry.userAgent?.slice(0, 30) ?? "—"}{(entry.userAgent?.length ?? 0) > 30 ? "…" : ""}</div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={e => { e.stopPropagation(); setDetailEntry(entry) }}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PaginationBar pagination={pagination} page={page} setPage={setPage} />
      <FeatureAuditDetailSheet entry={detailEntry} open={!!detailEntry} onClose={() => setDetailEntry(null)} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab: Admin Actions
// ---------------------------------------------------------------------------

const ACTION_TYPES = [
  "PROMOTE_TO_ADMIN", "DEMOTE_ADMIN", "PERMISSION_CHANGE", "ADMIN_ACTIVATED",
  "ADMIN_DEACTIVATED", "REFUND_PROCESSED", "REFUND_RECALCULATED",
  "REFUND_POLICY_CHANGED", "EVENT_CREATED", "EVENT_UPDATED", "NOTIFICATION_TEMPLATE_UPDATED",
  "NOTIFICATION_TEMPLATE_RESET", "NOTIFICATION_TEMPLATE_GLOBAL_RESET", "HIGH_RISK_ACTION",
]

function AdminActionsTab() {
  const [entries, setEntries] = useState<AdminActionEntry[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [actionType, setActionType] = useState("all")
  const [riskLevel, setRiskLevel] = useState("all")
  const [datePreset, setDatePreset] = useState(365)
  const [page, setPage] = useState(1)
  const [detailEntry, setDetailEntry] = useState<AdminActionEntry | null>(null)

  const buildParams = useCallback(() => ({
    search: search.trim() || undefined,
    action: actionType !== "all" ? actionType : undefined,
    riskLevel: riskLevel !== "all" ? riskLevel : undefined,
    startDate: daysAgoISO(datePreset),
    endDate: nowISO(),
    page,
    limit: 50,
  }), [search, actionType, riskLevel, datePreset, page])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.getAdminActionsAuditLog(buildParams())
      if (res.success) {
        const body = (res as any).data
        setEntries(Array.isArray(body?.data) ? body.data : [])
        if (body?.pagination) setPagination(body.pagination)
      }
    } catch { toast.error("Failed to load admin actions") }
    finally { setLoading(false) }
  }, [buildParams])

  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t) }, [load])
  useEffect(() => { setPage(1) }, [search, actionType, riskLevel, datePreset])

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return {
      total: pagination.total,
      todayCount: entries.filter(e => e.createdAt.slice(0, 10) === today).length,
      highRisk: entries.filter(e => e.riskLevel === "high").length,
      uniqueClubs: new Set(entries.map(e => typeof e.club === "object" ? (e.club as any)._id : e.club).filter(Boolean)).size,
    }
  }, [entries, pagination.total])

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={ClipboardList} label="Total Actions"   value={pagination.total.toLocaleString()} accent="from-primary to-violet-600" />
        <StatCard icon={Calendar}      label="Today"           value={stats.todayCount}                  accent="from-blue-500 to-cyan-600" />
        <StatCard icon={Building2}     label="Clubs Affected"  value={stats.uniqueClubs}                 accent="from-amber-500 to-orange-600" />
        <StatCard icon={ShieldAlert}   label="High-Risk"       value={stats.highRisk}
          accent={stats.highRisk > 0 ? "from-red-500 to-rose-600" : "from-emerald-500 to-teal-600"} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Search className="h-4 w-4 text-muted-foreground" />Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative min-w-[240px] flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="pl-9 pr-8 text-sm" placeholder="Search by actor name…" value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted" onClick={() => setSearch("")}><X className="h-3 w-3 text-muted-foreground" /></button>}
            </div>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger className="w-56"><SelectValue placeholder="All action types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All action types</SelectItem>
                {ACTION_TYPES.map(a => <SelectItem key={a} value={a}>{ACTION_LABELS[a] ?? a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={riskLevel} onValueChange={setRiskLevel}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All risk levels" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All risk levels</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(datePreset)} onValueChange={v => setDatePreset(parseInt(v, 10))}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>{DATE_PRESETS.map(p => <SelectItem key={p.days} value={String(p.days)}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground ml-auto tabular-nums">{pagination.total.toLocaleString()} record{pagination.total !== 1 ? "s" : ""}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
              <p className="text-sm text-muted-foreground">Loading admin actions…</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="rounded-full bg-muted p-4"><Users className="h-8 w-8 text-muted-foreground/30" /></div>
              <p className="text-muted-foreground font-medium">No admin actions found.</p>
              <p className="text-xs text-muted-foreground max-w-sm">Admin actions appear here as club roles and permissions are managed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="whitespace-nowrap w-[150px]">Timestamp</TableHead>
                    <TableHead className="w-[160px]">Actor</TableHead>
                    <TableHead className="w-[130px]">Club</TableHead>
                    <TableHead className="w-[180px]">Action</TableHead>
                    <TableHead className="w-[80px]">Risk</TableHead>
                    <TableHead className="min-w-[200px]">Description</TableHead>
                    <TableHead className="w-[140px]">IP / Device</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map(entry => {
                    const risk = RISK_CONFIG[entry.riskLevel] ?? RISK_CONFIG.low
                    return (
                      <TableRow key={entry._id}
                        className={`cursor-pointer transition-colors group ${entry.riskLevel === "high" ? "bg-red-50/40 dark:bg-red-950/10 hover:bg-red-50/70" : "hover:bg-muted/40"}`}
                        onClick={() => setDetailEntry(entry)}>
                        <TableCell className="whitespace-nowrap">
                          <div className="text-xs font-mono text-foreground">{formatTs(entry.createdAt)}</div>
                          <div className="text-[10px] text-muted-foreground">{formatRelative(entry.createdAt)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ActorAvatar name={entry.actorName ?? "?"} role={entry.actorType} />
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate max-w-[110px]">{entry.actorName ?? "—"}</div>
                              <RoleBadge role={entry.actorType} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium truncate max-w-[130px]">
                          {getClubName(entry as unknown as AuditEntry)}
                        </TableCell>
                        <TableCell>
                          <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{entry.action}</code>
                          {ACTION_LABELS[entry.action] && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">{ACTION_LABELS[entry.action]}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${risk.cls}`}>{risk.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-[260px]">
                          <Tooltip>
                            <TooltipTrigger asChild><span className="line-clamp-2 cursor-pointer">{entry.summary ?? "—"}</span></TooltipTrigger>
                            {entry.summary && <TooltipContent side="top" className="max-w-sm text-xs">{entry.summary}</TooltipContent>}
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[140px]">
                          <div className="truncate font-mono">{entry.ipAddress ?? "—"}</div>
                          <div className="truncate text-[10px]">{entry.deviceInfo?.deviceType ?? entry.deviceInfo?.userAgent?.slice(0, 30) ?? "—"}</div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={e => { e.stopPropagation(); setDetailEntry(entry) }}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PaginationBar pagination={pagination} page={page} setPage={setPage} />

      <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground border-t pt-4">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Low Risk</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" />Medium Risk</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" />High Risk</span>
      </div>

      <AdminActionDetailSheet entry={detailEntry} open={!!detailEntry} onClose={() => setDetailEntry(null)} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminAuditPage() {
  const { user } = useAuth()

  if (user?.role !== "system_owner") {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <ShieldAlert className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">Only system owners can access the Audit Log.</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <TooltipProvider delayDuration={300}>
          <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-black flex items-center gap-2.5">
                  <div className="rounded-lg p-1.5 bg-gradient-to-br from-primary to-violet-600 text-white">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  System Audit Logs
                </h1>
                <p className="text-muted-foreground text-sm mt-1.5 max-w-xl">
                  Comprehensive, tamper-proof audit trail — feature toggles, upgrade inquiries, and admin management actions.
                </p>
              </div>
            </div>

            <Tabs defaultValue="feature-changes">
              <TabsList className="grid w-full grid-cols-3 max-w-lg">
                <TabsTrigger value="feature-changes" className="flex items-center gap-1.5">
                  <ToggleRight className="h-3.5 w-3.5" />Feature Changes
                </TabsTrigger>
                <TabsTrigger value="inquiries" className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />Upgrade Inquiries
                </TabsTrigger>
                <TabsTrigger value="admin-actions" className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />Admin Actions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="feature-changes" className="mt-6">
                <FeatureChangesTab />
              </TabsContent>
              <TabsContent value="inquiries" className="mt-6">
                <UpgradeInquiriesTab />
              </TabsContent>
              <TabsContent value="admin-actions" className="mt-6">
                <AdminActionsTab />
              </TabsContent>
            </Tabs>
          </div>
        </TooltipProvider>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
