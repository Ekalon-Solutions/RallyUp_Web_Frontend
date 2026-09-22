"use client"

import React, { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Camera, Clock, CreditCard, Gift, GripVertical, Loader2, Plus, Tag, X } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { useClubFeatures } from "@/hooks/useClubFeatures"
import { isFeatureEnabled } from "@/lib/clubFeatures"
import { LockedFeaturePage } from "@/components/feature-gate"
import { cn } from "@/lib/utils"
import {
  CUSTOM_FIELD_TYPES,
  ID_PROOF_FORMATS,
  MAX_BROCHURE_FILES,
  MAX_CUSTOM_FIELDS,
  PLAN_ATTRIBUTE_FIELDS,
  PLAN_FEATURES,
  defaultPlanAttributes,
  defaultPlanFeatures,
  hydratePlanAttributes,
  hydratePlanFeatures,
  reorderList,
  type CustomFieldType,
  type IdProofFormat,
  type PlanAttributes,
  type PlanBrochureFile,
} from "@/lib/membershipPlanConfig"

const CURRENCIES = [
  "INR", "USD", "EUR", "GBP", "AUD", "CAD", "CHF", "CNY", "HKD", "JPY", "NZD",
  "NOK", "SEK", "SGD", "ZAR", "BRL", "MXN", "TRY", "DKK", "ILS", "PLN",
]

const STEPS = ["Plan Details", "Feature Selection", "Attributes Setup"] as const

type BasicDetails = {
  name: string
  description: string
  price: string
  currency: string
  planStartDate: string
  planEndDate: string
  bookingStartDate: string
  bookingEndDate: string
  referralRewardEnabled: boolean
  referralRewardPoints: number
}

const EMPTY_DETAILS: BasicDetails = {
  name: "",
  description: "",
  price: "",
  currency: "INR",
  planStartDate: "",
  planEndDate: "",
  bookingStartDate: "",
  bookingEndDate: "",
  referralRewardEnabled: false,
  referralRewardPoints: 0,
}

function toDateInputValue(d: string | undefined): string {
  if (!d) return ""
  const date = new Date(d)
  return isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10)
}

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(price)
  } catch {
    return `${currency} ${price.toFixed(2)}`
  }
}

/** "Sep, 2026" — matches the plan preview card. */
function formatMonthYear(value: string): string {
  const date = new Date(value)
  if (isNaN(date.getTime())) return ""
  return `${date.toLocaleDateString(undefined, { month: "short" })}, ${date.getFullYear()}`
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

/**
 * Returns the first validation error for step 1, or null.
 * Kept pure so the same rules guard "Next" and the final submit.
 */
function validateBasicDetails(d: BasicDetails): string | null {
  if (!d.name.trim()) return "Plan name is required."
  if (!d.description.trim()) return "Description is required."
  const price = Number(d.price)
  if (d.price === "" || isNaN(price) || price < 0) return "Enter a valid price (0 or greater)."
  if (!d.planStartDate || !d.planEndDate) return "Plan start date and plan end date are required."
  if (!d.bookingEndDate) return "Booking end date is required."

  const start = new Date(d.planStartDate)
  const end = new Date(d.planEndDate)
  const bookingStart = d.bookingStartDate ? new Date(d.bookingStartDate) : null
  const bookingEnd = new Date(d.bookingEndDate)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "Please enter valid plan dates."
  if (bookingStart && isNaN(bookingStart.getTime())) return "Please enter a valid booking start date."
  if (isNaN(bookingEnd.getTime())) return "Please enter a valid booking end date."
  if (end <= start) return "Plan end date must be after plan start date."
  if (bookingStart && bookingEnd <= bookingStart) return "Booking end date must be after booking start date."
  if (bookingEnd > end) return "Booking end date cannot be after plan end date."
  return null
}

// ---------------------------------------------------------------------------
// Small presentational pieces
// ---------------------------------------------------------------------------

function Stepper({ step, onSelect }: { step: number; onSelect: (n: number) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {STEPS.map((label, i) => {
        const active = i === step
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(i)}
            disabled={i > step}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
              active
                ? "border-foreground bg-background font-semibold text-foreground shadow-sm"
                : "border-border bg-muted/40 text-muted-foreground",
              i > step ? "cursor-not-allowed" : "cursor-pointer"
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                active ? "bg-foreground text-background" : "bg-muted-foreground/30 text-foreground"
              )}
            >
              {i + 1}
            </span>
            {label}
          </button>
        )
      })}
    </div>
  )
}

function SectionHeading({
  title,
  subtitle,
  badge,
}: {
  title: string
  subtitle?: string
  badge?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {badge && (
        <Badge variant="secondary" className="shrink-0 rounded-full font-normal">
          {badge}
        </Badge>
      )}
    </div>
  )
}

function PlanPreview({
  details,
  planFeatures,
  customFeatures,
  step,
}: {
  details: BasicDetails
  planFeatures: Record<string, boolean>
  customFeatures: string[]
  step: number
}) {
  const benefits = [
    ...PLAN_FEATURES.filter((f) => planFeatures[f.key]).map((f) => f.label),
    ...customFeatures.filter((c) => c.trim()),
  ]
  const validity =
    details.planStartDate && details.planEndDate
      ? `${formatMonthYear(details.planStartDate)} - ${formatMonthYear(details.planEndDate)}`
      : "—"
  const price = details.price === "" ? "—" : formatPrice(Number(details.price) || 0, details.currency)

  return (
    <Card className="lg:sticky lg:top-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Membership Plan Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{details.name.trim() || "Plan Name"}</h2>
          <p className="text-sm text-muted-foreground">
            {details.description.trim() || "Short Description"}
          </p>
        </div>
        <Separator />
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Price</p>
            <p className="text-sm text-muted-foreground">{price}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Validity</p>
            <p className="text-sm text-muted-foreground">{validity}</p>
          </div>
        </div>
        {step > 0 && benefits.length > 0 && (
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Tag className="h-4 w-4 text-muted-foreground" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">Membership Benefits</p>
              <ul className="mt-1 space-y-1">
                {benefits.map((b, i) => (
                  <li key={`${b}-${i}`} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DropdownOptionsEditor({
  options,
  onChange,
}: {
  options: string[]
  onChange: (options: string[]) => void
}) {
  const [draft, setDraft] = useState("")
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)

  const handleAdd = () => {
    const raw = draft.trim()
    if (!raw) return
    const newItems = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    let updated = [...options]
    for (const item of newItems) {
      if (updated.some((o) => o.toLowerCase() === item.toLowerCase())) {
        toast.error(`"${item}" is already in the options list.`)
        continue
      }
      if (updated.length >= MAX_DROPDOWN_OPTIONS) {
        toast.error(`Maximum of ${MAX_DROPDOWN_OPTIONS} options allowed.`)
        break
      }
      updated.push(item)
    }
    onChange(updated)
    setDraft("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAdd()
    }
  }

  const moveOption = (from: number, to: number) => {
    if (from === to || to < 0 || to >= options.length) return
    const next = reorderList(options, from, to)
    onChange(next)
  }

  const removeOption = (idx: number) => {
    onChange(options.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-2 pt-1">
      <div className="flex gap-2">
        <Input
          placeholder="Enter option name and press Enter"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-9 text-sm"
        />
        <Button type="button" size="sm" onClick={handleAdd}>
          Add
        </Button>
      </div>
      {options.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {options.map((opt, idx) => (
            <span
              key={`${opt}-${idx}`}
              draggable
              tabIndex={0}
              role="button"
              aria-label={`${opt}, position ${idx + 1} of ${options.length}. Use arrow keys to reorder.`}
              onDragStart={(e) => {
                e.stopPropagation()
                setDraggedIdx(idx)
              }}
              onDragEnd={(e) => {
                e.stopPropagation()
                setDraggedIdx(null)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (draggedIdx !== null) moveOption(draggedIdx, idx)
                setDraggedIdx(null)
              }}
              onKeyDown={(e) => {
                if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
                e.preventDefault()
                moveOption(idx, e.key === "ArrowLeft" ? idx - 1 : idx + 1)
                e.currentTarget.focus()
              }}
              className={cn(
                "flex cursor-grab items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-sm text-foreground transition-opacity active:cursor-grabbing",
                draggedIdx === idx && "opacity-40"
              )}
            >
              <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {opt}
              <button
                type="button"
                aria-label={`Remove ${opt}`}
                onClick={(e) => {
                  e.stopPropagation()
                  removeOption(idx)
                }}
              >
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function MembershipPlanWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get("planId")
  const isEdit = Boolean(planId)

  const { activeClubId } = useAuth()
  const { config: clubFeatureConfig } = useClubFeatures(activeClubId ?? null)

  const [step, setStep] = useState(0)
  const [details, setDetails] = useState<BasicDetails>(EMPTY_DETAILS)
  const [planFeatures, setPlanFeatures] = useState<Record<string, boolean>>(defaultPlanFeatures)
  const [customFeatures, setCustomFeatures] = useState<string[]>(["", ""])
  const [brochure, setBrochure] = useState<PlanBrochureFile[]>([])
  const [attributes, setAttributes] = useState<PlanAttributes>(defaultPlanAttributes)
  const [idProofDraft, setIdProofDraft] = useState<{ label: string; format: IdProofFormat; maxLength: string }>({
    label: "",
    format: "alphanumeric",
    maxLength: "",
  })
  const [draggedIdProof, setDraggedIdProof] = useState<number | null>(null)
  const [draggedCustom, setDraggedCustom] = useState<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(isEdit)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!planId) return
    let cancelled = false
    setIsLoading(true)
    apiClient
      .getMembershipPlanById(planId)
      .then((res) => {
        if (cancelled) return
        const plan: any = (res as any)?.data?.data ?? res.data
        if (!res.success || !plan?._id) {
          toast.error(res.error || "Could not load this membership plan.")
          return
        }
        setDetails({
          name: plan.name ?? "",
          description: plan.description ?? "",
          price: String(plan.price ?? ""),
          currency: plan.currency || "INR",
          planStartDate: toDateInputValue(plan.planStartDate),
          planEndDate: toDateInputValue(plan.planEndDate),
          bookingStartDate: toDateInputValue(plan.bookingStartDate),
          bookingEndDate: toDateInputValue(plan.bookingEndDate),
          referralRewardEnabled: plan.referralReward?.enabled ?? false,
          referralRewardPoints: plan.referralReward?.points ?? 0,
        })
        setPlanFeatures(hydratePlanFeatures(plan.planFeatures))
        setCustomFeatures(plan.customFeatures?.length ? plan.customFeatures : ["", ""])
        setBrochure(plan.brochure ?? [])
        setAttributes(hydratePlanAttributes(plan.attributes))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [planId])

  const enabledFeatureCount = PLAN_FEATURES.filter((f) => planFeatures[f.key]).length
  const enabledAttributeCount = attributes.fields.filter((f) => f.enabled).length
  const idProofOn = attributes.fields.find((f) => f.key === "id_proof")?.enabled ?? false

  const setField = (key: string, patch: Partial<{ enabled: boolean; mandatory: boolean }>) =>
    setAttributes((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => {
        if (f.key !== key) return f
        const next = { ...f, ...patch }
        // Turning a field off drops its mandatory flag — it can't be required
        // and uncollected at the same time.
        return next.enabled ? next : { ...next, mandatory: false }
      }),
    }))

  const handleBrochureFiles = async (files: FileList | null) => {
    if (!files?.length) return
    const room = MAX_BROCHURE_FILES - brochure.length
    if (room <= 0) {
      toast.error(`You can upload at most ${MAX_BROCHURE_FILES} brochure files.`)
      return
    }
    setIsUploading(true)
    try {
      for (const file of Array.from(files).slice(0, room)) {
        const res = await apiClient.uploadBrochure(file)
        if (res.success && res.data?.url) {
          const uploaded = res.data
          setBrochure((prev) => [...prev, { url: uploaded.url, name: uploaded.name, size: uploaded.size }])
        } else {
          toast.error(`Could not upload ${file.name}: ${res.error || "upload failed"}`)
        }
      }
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const addIdProofType = () => {
    const label = idProofDraft.label.trim()
    if (!label) {
      toast.error("Enter an ID proof type name first.")
      return
    }
    if (attributes.idProofTypes.some((t) => t.label.toLowerCase() === label.toLowerCase())) {
      toast.error(`"${label}" is already in the list.`)
      return
    }
    const maxLength = Math.min(64, Math.max(1, Math.floor(Number(idProofDraft.maxLength) || 20)))
    setAttributes((prev) => ({
      ...prev,
      idProofTypes: [...prev.idProofTypes, { label, format: idProofDraft.format, maxLength }],
    }))
    setIdProofDraft({ label: "", format: "alphanumeric", maxLength: "" })
  }

  /** Chip order is the order members see in the checkout dropdown. */
  const moveIdProofType = (from: number, to: number) =>
    setAttributes((prev) => {
      if (from === to || to < 0 || to >= prev.idProofTypes.length) return prev
      const next = [...prev.idProofTypes]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return { ...prev, idProofTypes: next }
    })

  const goNext = () => {
    if (step === 0) {
      const error = validateBasicDetails(details)
      if (error) {
        toast.error(error)
        return
      }
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }

  const handleSubmit = async () => {
    const error = validateBasicDetails(details)
    if (error) {
      toast.error(error)
      setStep(0)
      return
    }
    if (idProofOn && attributes.idProofTypes.length === 0) {
      toast.error("Add at least one ID proof type, or turn the ID Proof field off.")
      return
    }
    const emptyDropdownField = attributes.customFields.find(
      (f) => f.label.trim() && f.type === "dropdown" && (!f.options || f.options.length === 0)
    )
    if (emptyDropdownField) {
      toast.error(`Please add at least one option for dropdown field "${emptyDropdownField.label}".`)
      return
    }
    if (!isEdit && !activeClubId) {
      toast.error("Select a club before creating a plan.")
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        name: details.name.trim(),
        description: details.description.trim(),
        price: Number(details.price) || 0,
        currency: details.currency,
        planStartDate: details.planStartDate,
        planEndDate: details.planEndDate,
        bookingStartDate: details.bookingStartDate || undefined,
        bookingEndDate: details.bookingEndDate,
        referralReward: {
          enabled: details.referralRewardEnabled,
          points: details.referralRewardEnabled
            ? Math.max(0, Math.floor(details.referralRewardPoints))
            : 0,
        },
        planFeatures,
        customFeatures: customFeatures.map((c) => c.trim()).filter(Boolean),
        brochure,
        attributes: {
          ...attributes,
          customFields: attributes.customFields.filter((f) => f.label.trim()),
        },
        clubId: activeClubId ?? undefined,
      }

      const res = isEdit
        ? await apiClient.updateMembershipPlan(planId!, payload)
        : await apiClient.createMembershipPlan(payload as any)

      if (res.success) {
        toast.success(`Membership plan "${payload.name}" ${isEdit ? "updated" : "created"} successfully.`)
        router.push("/dashboard/membership-plans")
      } else {
        toast.error(res.error || `Could not ${isEdit ? "update" : "create"} the membership plan.`)
      }
    } catch (err: any) {
      toast.error(err?.message || "Network error — please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (!isFeatureEnabled(clubFeatureConfig, "membership")) {
    return (
      <LockedFeaturePage
        featureKey="membership"
        featureLabel="Membership Plans"
        clubId={activeClubId ?? ""}
        currentTier={clubFeatureConfig?.billing_tier}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const cancelButton = (
    <Button type="button" variant="outline" onClick={() => router.push("/dashboard/membership-plans")}>
      Cancel
    </Button>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
        {isEdit ? "Edit Membership Plan" : "Create New Membership Plan"}
      </h1>

      <Stepper step={step} onSelect={setStep} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardContent className="space-y-6 p-6">
            {step === 0 && (
              <>
                <h2 className="text-lg font-bold text-foreground">Basic Details</h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Plan Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter Plan Name"
                      value={details.name}
                      onChange={(e) => setDetails({ ...details, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      min={0}
                      placeholder="Enter Plan Price"
                      value={details.price}
                      onChange={(e) => setDetails({ ...details, price: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    placeholder="Describe the plan"
                    value={details.description}
                    onChange={(e) => setDetails({ ...details, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={details.currency}
                    onValueChange={(v) => setDetails({ ...details, currency: v })}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="planStartDate">Plan Start Date</Label>
                    <Input
                      id="planStartDate"
                      type="date"
                      value={details.planStartDate}
                      disabled={isEdit}
                      onChange={(e) => setDetails({ ...details, planStartDate: e.target.value })}
                    />
                    {isEdit && (
                      <p className="text-xs text-muted-foreground">
                        Start date cannot be changed after the plan is created.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="planEndDate">Plan End Date</Label>
                    <Input
                      id="planEndDate"
                      type="date"
                      value={details.planEndDate}
                      onChange={(e) => setDetails({ ...details, planEndDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bookingStartDate">Booking Start Date</Label>
                    <Input
                      id="bookingStartDate"
                      type="date"
                      value={details.bookingStartDate}
                      onChange={(e) => setDetails({ ...details, bookingStartDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bookingEndDate">Booking End Date</Label>
                    <Input
                      id="bookingEndDate"
                      type="date"
                      value={details.bookingEndDate}
                      onChange={(e) => setDetails({ ...details, bookingEndDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Gift className="h-4 w-4" />
                      Referral Rewards
                    </h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Award points to members who refer new sign-ups on this plan
                    </p>
                  </div>
                  <Switch
                    checked={details.referralRewardEnabled}
                    onCheckedChange={(v) => setDetails({ ...details, referralRewardEnabled: v })}
                  />
                </div>
                {details.referralRewardEnabled && (
                  <div className="space-y-2 border-l-2 border-muted pl-4">
                    <Label htmlFor="referralPoints">Points per successful referral</Label>
                    <Input
                      id="referralPoints"
                      type="number"
                      min={0}
                      step={1}
                      placeholder="e.g. 100"
                      value={details.referralRewardPoints}
                      onChange={(e) =>
                        setDetails({
                          ...details,
                          referralRewardPoints: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                        })
                      }
                    />
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-2">
                  {cancelButton}
                  <Button type="button" onClick={goNext}>
                    Next
                  </Button>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="text-lg font-bold text-foreground">Feature Selection</h2>

                <div className="space-y-4">
                  <SectionHeading
                    title="Default features"
                    subtitle="Switch off anything you don't want users to see."
                    badge={`${enabledFeatureCount} of ${PLAN_FEATURES.length} on`}
                  />
                  <div className="divide-y">
                    {PLAN_FEATURES.map((feature) => (
                      <div key={feature.key} className="flex items-center justify-between gap-4 py-4">
                        <div>
                          <p className="font-medium text-foreground">{feature.label}</p>
                          {feature.description && (
                            <p className="text-xs text-muted-foreground">{feature.description}</p>
                          )}
                        </div>
                        <Switch
                          checked={Boolean(planFeatures[feature.key])}
                          onCheckedChange={(v) =>
                            setPlanFeatures((prev) => ({ ...prev, [feature.key]: v }))
                          }
                          aria-label={feature.label}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <SectionHeading
                    title="Custom features"
                    subtitle="Add a feature of your own by naming it below."
                  />
                  {customFeatures.map((value, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/40 p-2">
                      <Input
                        placeholder="Field name"
                        value={value}
                        onChange={(e) =>
                          setCustomFeatures((prev) =>
                            prev.map((c, idx) => (idx === i ? e.target.value : c))
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Remove custom feature"
                        onClick={() => setCustomFeatures((prev) => prev.filter((_, idx) => idx !== i))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() => setCustomFeatures((prev) => [...prev, ""])}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add custom field
                  </Button>
                </div>

                <div className="space-y-3">
                  <SectionHeading
                    title="Brochure"
                    subtitle={`Upload upto ${MAX_BROCHURE_FILES} documents/images of the plan brochure.`}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,image/png,image/jpeg"
                    multiple
                    className="hidden"
                    onChange={(e) => handleBrochureFiles(e.target.files)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || brochure.length >= MAX_BROCHURE_FILES}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 py-12 text-center transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <Camera className="h-6 w-6 text-muted-foreground" />
                    )}
                    <span className="text-sm text-foreground">
                      <span className="font-semibold">Click to upload</span> or drag an image here
                    </span>
                    <span className="text-xs text-muted-foreground">PDF, PNG or JPG</span>
                  </button>
                  {brochure.map((file, i) => (
                    <div key={`${file.url}-${i}`} className="flex items-center gap-3 rounded-lg border p-3">
                      <span className="h-10 w-10 shrink-0 rounded bg-muted" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setBrochure((prev) => prev.filter((_, idx) => idx !== i))}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <div className="flex gap-2">
                    {cancelButton}
                    <Button type="button" variant="outline" onClick={() => setStep(0)}>
                      Back
                    </Button>
                  </div>
                  <Button type="button" onClick={goNext}>
                    Next
                  </Button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-lg font-bold text-foreground">Attributes Setup</h2>

                <div className="space-y-2">
                  <SectionHeading
                    title="Required Information"
                    subtitle="First Name, Last Name, Email Address, Mobile Number are mandatory fields to create user logins and cannot be turned off."
                    badge="Always required"
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <SectionHeading
                    title="Additional Information"
                    subtitle="Turn a field on to collect it during purchase. Name and contact cannot be removed. If two admins save at once, the last save wins."
                    badge={`${enabledAttributeCount} of ${attributes.fields.length} on`}
                  />
                  <div className="grid grid-cols-[minmax(0,1fr)_96px_96px] items-center gap-2 border-b pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <span>Field</span>
                    <span className="text-center">Turn on/off</span>
                    <span className="text-center">Mandatory</span>
                  </div>
                  {attributes.fields.map((state) => {
                    const field = PLAN_ATTRIBUTE_FIELDS.find((f) => f.key === state.key)
                    if (!field) return null
                    const isSensitive = "sensitive" in field && field.sensitive
                    return (
                      <div
                        key={state.key}
                        className="grid grid-cols-[minmax(0,1fr)_96px_96px] items-center gap-2 border-b py-3"
                      >
                        <span className="flex items-center gap-2 text-sm text-foreground">
                          {field.label}
                          {isSensitive && (
                            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              Sensitive ID
                            </span>
                          )}
                        </span>
                        <div className="flex justify-center">
                          <Switch
                            checked={Boolean(state.enabled)}
                            onCheckedChange={(v) => setField(state.key, { enabled: v })}
                            aria-label={`Collect ${field.label}`}
                          />
                        </div>
                        <div className="flex justify-center">
                          <Checkbox
                            checked={Boolean(state.mandatory)}
                            disabled={!state.enabled}
                            onCheckedChange={(v) => setField(state.key, { mandatory: v === true })}
                            aria-label={`${field.label} is mandatory`}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {idProofOn && (
                  <div className="space-y-3">
                    <SectionHeading
                      title="ID Proof Configuration"
                      subtitle="Choose which ID proof types members can select from during purchase."
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        placeholder="Enter ID proof type"
                        value={idProofDraft.label}
                        onChange={(e) => setIdProofDraft({ ...idProofDraft, label: e.target.value })}
                      />
                      <Select
                        value={idProofDraft.format}
                        onValueChange={(v) => setIdProofDraft({ ...idProofDraft, format: v as IdProofFormat })}
                      >
                        <SelectTrigger className="sm:w-48">
                          <SelectValue placeholder="Input format" />
                        </SelectTrigger>
                        <SelectContent>
                          {ID_PROOF_FORMATS.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={1}
                        max={64}
                        placeholder="Character Limit"
                        className="sm:w-40"
                        value={idProofDraft.maxLength}
                        onChange={(e) => setIdProofDraft({ ...idProofDraft, maxLength: e.target.value })}
                      />
                      <Button type="button" onClick={addIdProofType}>
                        Add
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Drag to reorder — this is the order members see in the dropdown.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {attributes.idProofTypes.map((type, i) => (
                        <span
                          key={type.label}
                          draggable
                          tabIndex={0}
                          role="button"
                          aria-label={`${type.label}, position ${i + 1} of ${attributes.idProofTypes.length}. Use arrow keys to reorder.`}
                          onDragStart={() => setDraggedIdProof(i)}
                          onDragEnd={() => setDraggedIdProof(null)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault()
                            if (draggedIdProof !== null) moveIdProofType(draggedIdProof, i)
                            setDraggedIdProof(null)
                          }}
                          // Arrow keys give the same reordering without a mouse.
                          onKeyDown={(e) => {
                            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
                            e.preventDefault()
                            moveIdProofType(i, e.key === "ArrowLeft" ? i - 1 : i + 1)
                            e.currentTarget.focus()
                          }}
                          className={cn(
                            "flex cursor-grab items-center gap-1.5 rounded-full border px-3 py-1 text-sm text-foreground transition-opacity active:cursor-grabbing",
                            draggedIdProof === i && "opacity-40"
                          )}
                          title={`${type.format}, max ${type.maxLength} characters`}
                        >
                          <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          {type.label}
                          <button
                            type="button"
                            aria-label={`Remove ${type.label}`}
                            onClick={() =>
                              setAttributes((prev) => ({
                                ...prev,
                                idProofTypes: prev.idProofTypes.filter((t) => t.label !== type.label),
                              }))
                            }
                          >
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <SectionHeading
                    title="Custom Fields"
                    subtitle="Add a field of your own by naming it below. It can be collected the same way as the fields above."
                    badge={`${attributes.customFields.length} of ${MAX_CUSTOM_FIELDS} added`}
                  />
                  {attributes.customFields.map((field, i) => (
                    <div
                      key={i}
                      draggable
                      onDragStart={() => setDraggedCustom(i)}
                      onDragEnd={() => setDraggedCustom(null)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        if (draggedCustom !== null) {
                          setAttributes((prev) => ({
                            ...prev,
                            customFields: reorderList(prev.customFields, draggedCustom, i),
                          }))
                        }
                        setDraggedCustom(null)
                      }}
                      className={cn("space-y-2 rounded-lg bg-muted/40 p-2", draggedCustom === i && "opacity-40")}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
                        <Input
                          className="min-w-0 flex-1"
                          placeholder="Field name"
                          value={field.label}
                          onChange={(e) =>
                            setAttributes((prev) => ({
                              ...prev,
                              customFields: prev.customFields.map((f, idx) =>
                                idx === i ? { ...f, label: e.target.value } : f
                              ),
                            }))
                          }
                        />
                        <Select
                          value={field.type}
                          onValueChange={(v) =>
                            setAttributes((prev) => ({
                              ...prev,
                              customFields: prev.customFields.map((f, idx) =>
                                idx === i
                                  ? {
                                      ...f,
                                      type: v as CustomFieldType,
                                      options: v === "dropdown" ? f.options ?? [] : undefined,
                                    }
                                  : f
                              ),
                            }))
                          }
                        >
                          <SelectTrigger className="w-32 shrink-0">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {CUSTOM_FIELD_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <label className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm text-muted-foreground">
                          <Checkbox
                            checked={field.mandatory}
                            onCheckedChange={(v) =>
                              setAttributes((prev) => ({
                                ...prev,
                                customFields: prev.customFields.map((f, idx) =>
                                  idx === i ? { ...f, mandatory: v === true } : f
                                ),
                              }))
                            }
                          />
                          Mandatory
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          aria-label="Remove custom field"
                          onClick={() =>
                            setAttributes((prev) => ({
                              ...prev,
                              customFields: prev.customFields.filter((_, idx) => idx !== i),
                            }))
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {field.type === "dropdown" && (
                        <DropdownOptionsEditor
                          options={field.options ?? []}
                          onChange={(newOptions) =>
                            setAttributes((prev) => ({
                              ...prev,
                              customFields: prev.customFields.map((f, idx) =>
                                idx === i ? { ...f, options: newOptions } : f
                              ),
                            }))
                          }
                        />
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    disabled={attributes.customFields.length >= MAX_CUSTOM_FIELDS}
                    onClick={() =>
                      setAttributes((prev) =>
                        prev.customFields.length >= MAX_CUSTOM_FIELDS
                          ? prev
                          : {
                              ...prev,
                              customFields: [
                                ...prev.customFields,
                                { label: "", type: "text", mandatory: false },
                              ],
                            }
                      )
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add custom field
                  </Button>
                  {attributes.customFields.length >= MAX_CUSTOM_FIELDS && (
                    <p className="text-xs text-muted-foreground">
                      Maximum of {MAX_CUSTOM_FIELDS} custom fields reached. Remove one to add another.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <div className="flex gap-2">
                    {cancelButton}
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                  </div>
                  <Button type="button" onClick={handleSubmit} disabled={isSaving}>
                    {isSaving
                      ? isEdit
                        ? "Saving..."
                        : "Creating..."
                      : isEdit
                        ? "Save Changes"
                        : "Create Membership Plan"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <PlanPreview
          details={details}
          planFeatures={planFeatures}
          customFeatures={customFeatures}
          step={step}
        />
      </div>
    </div>
  )
}

export default function MembershipPlanWizardPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <MembershipPlanWizard />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
