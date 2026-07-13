"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
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
import { ArrowLeft, Loader2, Plus, X, ChevronRight, ChevronLeft, Check } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { cn } from "@/lib/utils"
import { clubActionButtonClassName, clubActionButtonStyle } from "@/lib/clubThemeButton"
import { useDesignSettings } from "@/hooks/useDesignSettings"
import { useAuth } from "@/contexts/auth-context"
import { useSelectedClubId, useAccessibleClubs } from "@/hooks/useSelectedClubId"
import { getAccessibleClub, isClubAccessible } from "@/lib/clubContext"
import { VenueTierMatrixBuilder, VenueDraft, TierDraft, createEmptyVenueDraft } from "@/components/admin/venue-tier-matrix-builder"
import { getJointScreeningClubNames } from "@/lib/joint-screening-clubs"
import {
  validateJointScreeningPartners,
  validatePricingLogisticsStep,
} from "@/lib/event-pricing-validation"
import { EventRefundToggleSection, RefundTier } from "@/components/admin/event-refund-toggle-section"
import { EventRefundPolicyImpactDialog } from "@/components/admin/event-refund-policy-impact-dialog"
import { EventCreatePreview } from "@/components/admin/event-create-preview"
import { EventFeeManagementSection } from "@/components/admin/event-fee-management-section"
import { EventImageUploader } from "@/components/events/event-image-uploader"
import { useCanManageFees } from "@/hooks/useCanManageFees"
import type { FeeHandlingType } from "@/lib/transactionFees"

const WIZARD_STEPS = [
  { id: "details", label: "Event Details" },
  { id: "pricing", label: "Pricing & Logistics" },
  { id: "schedule", label: "Schedule & Publish" },
] as const

function isEventCompletedClient(ev: { startTime?: string; endTime?: string }): boolean {
  const now = Date.now()
  const end = ev.endTime ? new Date(ev.endTime).getTime() : null
  const start = ev.startTime ? new Date(ev.startTime).getTime() : null
  if (end != null && !Number.isNaN(end) && end < now) return true
  if (start != null && !Number.isNaN(start) && start < now && (end == null || Number.isNaN(end))) return true
  return false
}

function isPaidEvent(
  form: { multiTicketEnabled: boolean; ticketPrice: string },
  venues: VenueDraft[]
): boolean {
  if (form.multiTicketEnabled) {
    return venues.some((v) => v.tiers.some((t) => t.price > 0))
  }
  return Number(form.ticketPrice) > 0
}

function getLowestTicketPrice(
  form: { multiTicketEnabled: boolean; ticketPrice: string },
  venues: VenueDraft[]
): number {
  if (form.multiTicketEnabled) {
    const prices = venues.flatMap((v) => v.tiers.map((t) => t.price)).filter((p) => p > 0)
    return prices.length > 0 ? Math.min(...prices) : 0
  }
  return Number(form.ticketPrice) || 0
}

function isRefundCutoffValid(refundCutoffHours: string, isRefundAllowed: boolean, isFreeEvent: boolean): boolean {
  if (isFreeEvent || !isRefundAllowed) return true
  if (refundCutoffHours.trim() === "") return false
  const h = Number(refundCutoffHours)
  return Number.isFinite(h) && h >= 0 && Number.isInteger(h)
}

function isRefundPolicyReady(
  isRefundAllowed: boolean,
  refundCutoffHours: string,
  isFreeEvent: boolean
): boolean {
  if (isFreeEvent) return true
  if (typeof isRefundAllowed !== "boolean") return false
  return isRefundCutoffValid(refundCutoffHours, isRefundAllowed, isFreeEvent)
}

const CATEGORIES = [
  { value: "screenings", label: "Screenings" },
  { value: "footy-meets", label: "Footy Meets" },
  { value: "tournaments", label: "Tournaments" },
  { value: "auctions", label: "Auctions" },
  { value: "club-events", label: "Club Events" },
  { value: "social-events", label: "Social Events" },
  { value: "csr-events", label: "CSR Events" },
  { value: "watch-parties", label: "Watch Parties" },
  { value: "travel-days", label: "Travel Days" },
  { value: "workshops", label: "Workshops" },
  { value: "general-meeting", label: "General Meeting" },
  { value: "matchday", label: "Matchday" },
  { value: "others", label: "Others" },
]

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AUD", "JPY","IDR", "SGD", "THB", "AED"]

function toDatetimeLocal(iso?: string): string {
  if (!iso) return ""
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return ""
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch {
    return ""
  }
}

function CreateEventForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  const isEditMode = Boolean(editId)
  const duplicateId = searchParams.get("duplicate")
  const isDuplicateMode = Boolean(duplicateId)
  const sourceId = editId ?? duplicateId

  const { user } = useAuth()
  const selectedClubId = useSelectedClubId()
  const accessibleClubs = useAccessibleClubs()
  const [loading, setLoading] = useState(false)
  const [fetchingEvent, setFetchingEvent] = useState(isEditMode || isDuplicateMode)
  const [venues, setVenues] = useState<VenueDraft[]>([])
  // Event poster (hero images). Admin uploads a 400px (list) and a 1080px (detail)
  // image; either can be left blank. Uploaded after the event is created/updated,
  // since the upload endpoint needs an event id.
  const [imageFile400, setImageFile400] = useState<File | null>(null)
  const [imageFile1080, setImageFile1080] = useState<File | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: "",
    category: "club-events",
    startTime: "",
    endTime: "",
    venue: "",
    description: "",
    maxAttendees: "",
    ticketPrice: "0",
    currency: "INR",
    requiresTicket: false,
    memberOnly: false,
    bookingStartTime: "",
    bookingEndTime: "",
    attendancePoints: "0",
    waitlistEnabled: false,
    waitlistPercentage: "25",
    waitlistPurchaseWindowHours: "12",
    jointScreeningEnabled: false,
    earlyBirdEnabled: false,
    earlyBirdType: "percentage",
    earlyBirdValue: "",
    earlyBirdStartTime: "",
    earlyBirdEndTime: "",
    earlyBirdMembersOnly: false,
    multiTicketEnabled: false,
    isRefundAllowed: true,
    refundCutoffHours: "24",
    refundPolicyChangeReason: "",
    feeHandlingType: "pass_to_buyer" as FeeHandlingType,
  })
  const canManageFees = useCanManageFees()
  const [feeReminder, setFeeReminder] = useState<FeeHandlingType | null>(null)
  const [refundTiers, setRefundTiers] = useState<RefundTier[]>([])
  const initialRefundAllowedRef = useRef<boolean | null>(null)
  const [wizardStep, setWizardStep] = useState(0)
  const [partnerClubNames, setPartnerClubNames] = useState<string[]>([])
  const [newPartnerClub, setNewPartnerClub] = useState("")
  const [partnerClubToRemove, setPartnerClubToRemove] = useState<string | null>(null)
  const [eventEditMeta, setEventEditMeta] = useState({ liveWithHolders: false, completed: false, ticketsSold: false })
  const [showPolicyImpactDialog, setShowPolicyImpactDialog] = useState(false)

  const set = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const clubId = selectedClubId ?? ""
  const targetClub = getAccessibleClub(clubId, accessibleClubs)

  const homeClubName = targetClub?.name ?? ""

  useEffect(() => {
    setVenues((prev) => {
      if (prev.length === 0) return prev

      if (!form.jointScreeningEnabled) {
        return prev.map((v) => ({
          ...v,
          tiers: v.tiers.map((t) => ({ ...t, clubAllocations: undefined })),
        }))
      }

      if (partnerClubNames.length === 0) return prev

      const allocationClubNames = getJointScreeningClubNames({
        homeClubName,
        partnerClubNames,
      })
      if (allocationClubNames.length === 0) return prev

      return prev.map((v) => ({
        ...v,
        tiers: v.tiers.map((t) => {
          const existingMap = new Map((t.clubAllocations ?? []).map((ca) => [ca.clubName, ca.allocation]))
          const basePerClub =
            t.allocation <= 0 ? 0 : Math.floor(t.allocation / allocationClubNames.length)
          const synced = allocationClubNames.map((name) => ({
            clubName: name,
            allocation: existingMap.has(name) ? existingMap.get(name)! : basePerClub,
          }))
          let total = synced.reduce((s, ca) => s + ca.allocation, 0)
          if (total === 0 && t.allocation > 0) {
            const perClub = Math.floor(t.allocation / allocationClubNames.length)
            synced.forEach((ca, i) => {
              ca.allocation =
                i === synced.length - 1
                  ? t.allocation - perClub * (synced.length - 1)
                  : perClub
            })
            total = t.allocation
          }
          return { ...t, clubAllocations: synced, allocation: total }
        }),
      }))
    })
  }, [form.jointScreeningEnabled, partnerClubNames, homeClubName])

  const { primaryColor } = useDesignSettings(clubId)
  const clubBtnClass = clubActionButtonClassName()
  const clubBtnStyle = clubActionButtonStyle(primaryColor)

  const paidEvent = isPaidEvent(form, venues)
  const refundCutoffInvalid =
    paidEvent && form.isRefundAllowed && !isRefundCutoffValid(form.refundCutoffHours, form.isRefundAllowed, !paidEvent)
  const canPublish =
    isRefundPolicyReady(form.isRefundAllowed, form.refundCutoffHours, !paidEvent) && !loading

  const primaryVenueName = form.multiTicketEnabled
    ? (venues[0]?.name ?? form.venue)
    : form.venue

  const validateStep = (step: number): boolean => {
    if (step === 0) {
      if (!form.title.trim()) { toast.error("Event title is required"); return false }
      if (!form.startTime) { toast.error("Start time is required"); return false }
      if (!form.description.trim()) { toast.error("Description is required"); return false }
      const partnerCheck = validateJointScreeningPartners(
        form.jointScreeningEnabled,
        partnerClubNames,
        homeClubName
      )
      if (!partnerCheck.ok) {
        toast.error(partnerCheck.message)
        return false
      }
      return true
    }
    if (step === 1) {
      const pricingCheck = validatePricingLogisticsStep({
        multiTicketEnabled: form.multiTicketEnabled,
        venue: form.venue,
        ticketPrice: form.ticketPrice,
        maxAttendees: form.maxAttendees,
        venues,
        jointScreeningEnabled: form.jointScreeningEnabled,
        partnerClubNames,
        homeClubName,
        primaryVenueName,
        primaryTicketPrice: form.ticketPrice,
        primaryMaxAttendees: form.maxAttendees,
      })
      if (!pricingCheck.ok) {
        toast.error(pricingCheck.message)
        return false
      }
      if (paidEvent && !isRefundPolicyReady(form.isRefundAllowed, form.refundCutoffHours, false)) {
        toast.error("Set a valid refund cut-off (non-negative whole hours) or fix the refund toggle")
        return false
      }
      return true
    }
    if (step === 2) {
      if (!form.bookingStartTime) { toast.error("Booking start time is required"); return false }
      if (!form.bookingEndTime) { toast.error("Booking end time is required"); return false }
      const bookingStart = new Date(form.bookingStartTime)
      const bookingEnd = new Date(form.bookingEndTime)
      if (bookingEnd <= bookingStart) {
        toast.error("Booking close time must be after booking open time")
        return false
      }
      if (form.earlyBirdEnabled) {
        const ebVal = Number(form.earlyBirdValue)
        if (!form.earlyBirdValue || ebVal <= 0) { toast.error("Early bird discount value must be greater than 0"); return false }
        if (form.earlyBirdType === "percentage" && ebVal > 100) { toast.error("Percentage discount cannot exceed 100%"); return false }
        if (form.earlyBirdType === "fixed" && ebVal > getLowestTicketPrice(form, venues)) { toast.error("Fixed discount cannot exceed the ticket price"); return false }
        if (!form.earlyBirdStartTime) { toast.error("Early bird start time is required"); return false }
        if (!form.earlyBirdEndTime) { toast.error("Early bird end time is required"); return false }
        const ebStart = new Date(form.earlyBirdStartTime)
        const ebEnd = new Date(form.earlyBirdEndTime)
        const eventStart = form.startTime ? new Date(form.startTime) : null
        if (eventStart && ebStart >= eventStart) { toast.error("Early bird start time must be before event start time"); return false }
        if (ebEnd <= ebStart) { toast.error("Early bird end time must be after early bird start time"); return false }
      }
      if (!isRefundPolicyReady(form.isRefundAllowed, form.refundCutoffHours, !paidEvent)) {
        toast.error("Refund policy is incomplete — go back to Pricing & Logistics to fix it")
        return false
      }
      return true
    }
    return true
  }

  const goNext = () => {
    if (!validateStep(wizardStep)) return
    setWizardStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1))
  }

  const goBack = () => setWizardStep((s) => Math.max(s - 1, 0))

  const jointScreeningConfig = form.jointScreeningEnabled
    ? { enabled: true as const, partnerClubNames, homeClubName }
    : undefined

  const ensureVenuesForMulti = (): VenueDraft[] => {
    if (venues.length > 0) return venues
    const draft = createEmptyVenueDraft(jointScreeningConfig)
    draft.name = form.venue
    return [draft]
  }

  const enableMultiTicketMatrix = () => {
    set("multiTicketEnabled", true)
    setVenues((prev) => {
      if (prev.length > 0) return prev
      return ensureVenuesForMulti()
    })
  }

  const updatePrimaryVenueName = (value: string) => {
    setVenues((prev) => {
      const list = prev.length > 0 ? [...prev] : ensureVenuesForMulti()
      list[0] = { ...list[0], name: value }
      return list
    })
  }

  useEffect(() => {
    if (!sourceId) return
    const fetchEvent = async () => {
      setFetchingEvent(true)
      try {
        const res = await apiClient.getEventById(sourceId)
        if (!res.success || !res.data) {
          toast.error("Failed to load event")
          router.push("/dashboard/events")
          return
        }
        const ev = res.data
        // Show the current poster as a preview when editing (a duplicate starts blank).
        if (isEditMode) setExistingImageUrl(ev.eventImage ?? null)
        setForm({
          title: isDuplicateMode ? `Copy of ${ev.title ?? ""}`.trim() : (ev.title ?? ""),
          category: ev.category ?? "club-events",
          startTime: toDatetimeLocal(ev.startTime),
          endTime: toDatetimeLocal(ev.endTime),
          venue: ev.venues?.length ? "" : (ev.venue ?? ""),
          description: ev.description ?? "",
          maxAttendees: ev.maxAttendees ? String(ev.maxAttendees) : "",
          ticketPrice: String(ev.ticketPrice ?? 0),
          currency: ev.currency ?? "INR",
          requiresTicket: ev.requiresTicket ?? false,
          memberOnly: ev.memberOnly ?? false,
          bookingStartTime: toDatetimeLocal(ev.bookingStartTime),
          bookingEndTime: toDatetimeLocal(ev.bookingEndTime),
          attendancePoints: String(ev.attendancePoints ?? 0),
          waitlistEnabled: ev.waitlist?.enabled ?? false,
          waitlistPercentage: String(ev.waitlist?.percentage ?? 25),
          waitlistPurchaseWindowHours: String(ev.waitlist?.purchaseWindowHours ?? 12),
          jointScreeningEnabled: ev.jointScreening?.enabled ?? false,
          earlyBirdEnabled: ev.earlyBirdDiscount?.enabled ?? false,
          earlyBirdType: ev.earlyBirdDiscount?.type ?? "percentage",
          earlyBirdValue: ev.earlyBirdDiscount?.value ? String(ev.earlyBirdDiscount.value) : "",
          earlyBirdStartTime: toDatetimeLocal(ev.earlyBirdDiscount?.startTime),
          earlyBirdEndTime: toDatetimeLocal(ev.earlyBirdDiscount?.endTime),
          earlyBirdMembersOnly:
            (ev.memberOnly ?? false) || (ev.earlyBirdDiscount?.membersOnly ?? false),
          multiTicketEnabled: Boolean(ev.venues?.length),
          isRefundAllowed: ev.isRefundAllowed !== false && ev.is_refund_allowed !== false,
          refundCutoffHours: String(ev.refundCutoffHours ?? ev.refund_cutoff_hours ?? 24),
          refundPolicyChangeReason: "",
          feeHandlingType: (ev.feeHandlingType ?? "pass_to_buyer") as FeeHandlingType,
        })
        if (!isDuplicateMode) {
          initialRefundAllowedRef.current = ev.isRefundAllowed !== false && ev.is_refund_allowed !== false
        }
        if (Array.isArray(ev.refundTiers) && ev.refundTiers.length > 0) {
          setRefundTiers(ev.refundTiers.map((t: any) => {
            const hoursBefore = t.hoursBefore != null ? Number(t.hoursBefore) : Number(t.daysBefore || 0) * 24
            const unit: 'days' | 'hours' = t.unit === 'hours' ? 'hours' : t.unit === 'days' ? 'days' : (hoursBefore % 24 === 0 ? 'days' : 'hours')
            return { hoursBefore, unit, daysBefore: Math.floor(hoursBefore / 24), refundPercentage: Number(t.refundPercentage) }
          }))
        }
        // Live-policy guards only apply when editing the original event, not a fresh copy.
        if (!isDuplicateMode) {
          const completed = isEventCompletedClient(ev)
          const confirmedRegs = (ev.registrations || []).filter((r: { status?: string }) => r.status === "confirmed").length
          const liveWithHolders = ev.isActive !== false && !completed && confirmedRegs > 0
          const venueTiersSold = (ev.venues || []).some((v) =>
            (v.tiers || []).some((t) => ((t as { sold?: number }).sold ?? 0) > 0)
          )
          const ticketsSold = confirmedRegs > 0 || (ev.currentAttendees ?? 0) > 0 || venueTiersSold
          setEventEditMeta({ liveWithHolders, completed, ticketsSold })
        }
        setPartnerClubNames(ev.jointScreening?.partnerClubNames ?? [])
        if (ev.venues?.length) {
          setVenues(
            ev.venues.map((v) => ({
              id: v._id,
              name: v.name,
              tiers: v.tiers.map((t): TierDraft => ({
                id: t._id,
                name: t.name,
                price: t.price,
                allocation: t.allocation,
                clubAllocations: t.clubAllocations?.map((ca) => ({
                  clubName: ca.clubName,
                  allocation: ca.allocation,
                })),
              })),
            }))
          )
        }
      } catch {
        toast.error("Error loading event")
        router.push("/dashboard/events")
      } finally {
        setFetchingEvent(false)
      }
    }
    fetchEvent()
  }, [sourceId, isDuplicateMode, router])

  const performSubmit = async (acknowledgeLivePolicyImpact = false) => {
    if (
      isEditMode &&
      initialRefundAllowedRef.current !== null &&
      form.isRefundAllowed !== initialRefundAllowedRef.current &&
      !form.refundPolicyChangeReason.trim()
    ) {
      toast.error("Please provide a reason when changing the refund allowed setting")
      return
    }

    const toggleChanging =
      isEditMode &&
      initialRefundAllowedRef.current !== null &&
      form.isRefundAllowed !== initialRefundAllowedRef.current

    if (
      isEditMode &&
      eventEditMeta.liveWithHolders &&
      toggleChanging &&
      !acknowledgeLivePolicyImpact
    ) {
      setShowPolicyImpactDialog(true)
      return
    }

    setLoading(true)
    try {
      const cutoffHours = paidEvent && form.isRefundAllowed
        ? Number(form.refundCutoffHours)
        : 24
      const payload = {
        title: form.title.trim(),
        category: form.category,
        startTime: new Date(form.startTime).toISOString(),
        endTime: form.endTime ? new Date(form.endTime).toISOString() : undefined,
        venue: form.venue.trim() || (venues[0]?.name ?? "Multiple Venues"),
        description: form.description.trim(),
        maxAttendees: form.maxAttendees ? Number(form.maxAttendees) : undefined,
        ticketPrice: form.multiTicketEnabled
          ? getLowestTicketPrice(form, venues)
          : Number(form.ticketPrice) || 0,
        currency: form.currency,
        requiresTicket: form.requiresTicket,
        memberOnly: form.memberOnly,
        bookingStartTime: new Date(form.bookingStartTime).toISOString(),
        bookingEndTime: new Date(form.bookingEndTime).toISOString(),
        attendancePoints: Number(form.attendancePoints) || 0,
        clubId: clubId || undefined,
        waitlist: form.waitlistEnabled
          ? {
              enabled: true,
              percentage: Number(form.waitlistPercentage) || 25,
              purchaseWindowHours: Number(form.waitlistPurchaseWindowHours) || 12,
            }
          : undefined,
        earlyBirdDiscount: form.earlyBirdEnabled ? {
          enabled: true,
          type: form.earlyBirdType as "percentage" | "fixed",
          value: Number(form.earlyBirdValue),
          startTime: new Date(form.earlyBirdStartTime).toISOString(),
          endTime: new Date(form.earlyBirdEndTime).toISOString(),
          membersOnly: form.memberOnly ? true : form.earlyBirdMembersOnly,
        } : { enabled: false, type: "percentage" as const, value: 0 },
        jointScreening: {
          enabled: form.jointScreeningEnabled,
          homeTeam: form.jointScreeningEnabled && homeClubName ? homeClubName : undefined,
          partnerClubNames: form.jointScreeningEnabled ? partnerClubNames.filter(Boolean) : [],
        },
        venues: form.multiTicketEnabled && venues.length > 0
          ? venues.map((v, i) => ({
              name: (i === 0 ? v.name.trim() || form.venue.trim() : v.name.trim()) || v.name,
              tiers: v.tiers.map((t) => ({
                name: t.name,
                price: t.price,
                allocation: t.allocation,
                ...(t.clubAllocations?.length ? { clubAllocations: t.clubAllocations } : {}),
              })),
            }))
          : undefined,
        isRefundAllowed: paidEvent ? form.isRefundAllowed : true,
        feeHandlingType: paidEvent ? form.feeHandlingType : undefined,
        refund_cutoff_hours: cutoffHours,
        refundTiers: paidEvent && form.isRefundAllowed && refundTiers.length > 0 ? refundTiers : undefined,
        ...(isEditMode && form.refundPolicyChangeReason.trim()
          ? { refund_policy_change_reason: form.refundPolicyChangeReason.trim() }
          : {}),
        ...(acknowledgeLivePolicyImpact ? { acknowledgeLivePolicyImpact: true } : {}),
      }

      let targetEventId: string | null = null
      if (isEditMode && editId) {
        const res = await apiClient.updateEvent(editId, payload)
        if (!res.success) {
          const msg = (res as any).message ?? res.error ?? "Failed to update event"
          if (String(msg).includes("Cannot Modify Historical Policies")) {
            toast.error("Cannot Modify Historical Policies")
          } else if ((res as any).code === "LIVE_POLICY_CHANGE_REQUIRES_ACK") {
            setShowPolicyImpactDialog(true)
          } else {
            toast.error(msg)
          }
          return
        }
        targetEventId = editId
        toast.success("Event updated successfully!")
      } else {
        const res = await apiClient.createEvent(payload)
        if (!res.success) {
          toast.error((res as any).message ?? res.error ?? "Failed to create event")
          return
        }
        targetEventId = res.data?.event?._id ?? null
        toast.success("Event created successfully!")
      }

      // Upload the poster(s) now that the event exists. Best-effort: a failure here
      // shouldn't lose the saved event, just warn the admin.
      if ((imageFile400 || imageFile1080) && targetEventId) {
        const imgRes = await apiClient.uploadEventImage(targetEventId, {
          list400: imageFile400,
          full1080: imageFile1080,
        })
        if (!imgRes.success) {
          toast.error((imgRes as any).message ?? imgRes.error ?? "Event saved, but the poster failed to upload — try saving again")
          return
        }
      }

      router.push("/dashboard/events")
    } catch (err: any) {
      toast.error(err?.message ?? "Error saving event")
    } finally {
      setLoading(false)
      setShowPolicyImpactDialog(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!clubId || !isClubAccessible(clubId, accessibleClubs)) {
      toast.error("Please select a valid club from the sidebar before publishing.")
      return
    }

    for (let s = 0; s < WIZARD_STEPS.length; s++) {
      if (!validateStep(s)) {
        setWizardStep(s)
        return
      }
    }

    await performSubmit(false)
  }

  if (fetchingEvent) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  const sectionBorder = "border-border"
  const nestedBorder = "border-l-2 border-border"

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full max-w-7xl pb-10 -mx-2 md:-mx-4 lg:-mx-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/events">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{isEditMode ? "Edit Event" : isDuplicateMode ? "Duplicate Event" : "Create Event"}</h1>
        </div>

        {isDuplicateMode && (
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Duplicating an event.</span>{" "}
            Review and edit the pre-filled details below — nothing is saved until you publish, which creates a brand-new event.
          </div>
        )}

        {!isEditMode && (
          <div
            className={
              targetClub
                ? "rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm"
                : "rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
            }
          >
            {targetClub ? (
              <p>
                <span className="font-semibold">Publishing to:</span> {targetClub.name}
              </p>
            ) : (
              <p>Select a valid club from the sidebar before publishing this event.</p>
            )}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] lg:items-start">
          <div className="min-w-0 space-y-6">
        <nav aria-label="Event creation steps" className="flex flex-wrap gap-2">
          {WIZARD_STEPS.map((step, index) => {
            const done = index < wizardStep
            const current = index === wizardStep
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (index < wizardStep) setWizardStep(index)
                }}
                disabled={index > wizardStep}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border transition-colors",
                  current && "border-secondary bg-[hsl(var(--success)/0.12)] text-secondary",
                  done && "border-border bg-muted/50 text-foreground cursor-pointer hover:bg-muted",
                  !current && !done && "border-border text-muted-foreground opacity-60 cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                    current && "bg-secondary text-secondary-foreground",
                    done && "bg-muted-foreground/20",
                    !current && !done && "bg-muted"
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                {step.label}
              </button>
            )
          })}
        </nav>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              wizardStep < WIZARD_STEPS.length - 1 &&
              (e.target as HTMLElement).tagName !== "TEXTAREA"
            ) {
              e.preventDefault()
              goNext()
            }
          }}
          className="space-y-6 dark:[color-scheme:dark] [&_input]:border-border [&_input]:bg-background [&_input]:text-foreground [&_textarea]:border-border [&_textarea]:bg-background [&_textarea]:text-foreground [&_[role=combobox]]:border-border [&_[role=combobox]]:bg-background [&_[role=combobox]]:text-foreground"
        >
          {wizardStep === 0 && (
          <>
          <Card className={sectionBorder}>
            <CardHeader>
              <CardTitle>Basic Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter event title"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => set("category", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Currency</Label>
                  <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Event Start *</Label>
                  <Input id="startTime" type="datetime-local" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">Event End</Label>
                  <Input id="endTime" type="datetime-local" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the event"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card className={sectionBorder}>
            <CardHeader>
              <CardTitle>Event Poster</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Optional. Upload a 400px-wide image for the events feed and a 1080px-wide image for
                the event detail page. If you upload only one, it's used for both. Saved after the event.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <div className="flex-1 min-w-0 space-y-2">
                  <Label>List image — 400px wide</Label>
                  <EventImageUploader
                    value={imageFile400}
                    onChange={setImageFile400}
                    existingImageUrl={existingImageUrl}
                    title="Upload 400px list image"
                    hint="Shown on the events feed — up to 10MB"
                    disabled={loading}
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <Label>Detail image — 1080px wide</Label>
                  <EventImageUploader
                    value={imageFile1080}
                    onChange={setImageFile1080}
                    existingImageUrl={existingImageUrl}
                    title="Upload 1080px detail image"
                    hint="Shown on the event detail page — up to 10MB"
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={sectionBorder}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Joint Screening</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Joint Screening</Label>
                  <p className="text-xs text-muted-foreground">Partner with another club — fans select their affiliation at checkout</p>
                </div>
                <Switch
                  checked={form.jointScreeningEnabled}
                  onCheckedChange={(v) => set("jointScreeningEnabled", v)}
                />
              </div>

              {form.jointScreeningEnabled && (
                <div className={cn("space-y-4 pl-4", nestedBorder)}>
                  <div className="grid gap-2">
                    <Label>Partner Club Name</Label>
                    <p className="text-xs text-muted-foreground">
                      {homeClubName
                        ? `${homeClubName} (your club) is included automatically. Add partner clubs for shared seat allocation.`
                        : "Each club gets its own seat allocation in the ticket matrix below"}
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter club name and press Enter"
                        value={newPartnerClub}
                        onChange={(e) => setNewPartnerClub(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            const name = newPartnerClub.trim()
                            if (name && name === homeClubName) {
                              toast.error("Partner club must be different from your club")
                              return
                            }
                            if (name && !partnerClubNames.includes(name)) {
                              setPartnerClubNames([...partnerClubNames, name])
                              setNewPartnerClub("")
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn("shrink-0", clubBtnClass)}
                        style={clubBtnStyle}
                        onClick={() => {
                          const name = newPartnerClub.trim()
                          if (name && name === homeClubName) {
                            toast.error("Partner club must be different from your club")
                            return
                          }
                          if (name && !partnerClubNames.includes(name)) {
                            setPartnerClubNames([...partnerClubNames, name])
                            setNewPartnerClub("")
                          }
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {partnerClubNames.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {partnerClubNames.map((club) => (
                          <span
                            key={club}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                          >
                            {club}
                            <button
                              type="button"
                              onClick={() => setPartnerClubToRemove(club)}
                              className="hover:text-destructive transition-colors ml-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    {partnerClubNames.length === 0 && (
                      <p className="text-xs text-amber-600">Add at least one partner club to enable club-wise seat allocation.</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          </>
          )}

          {wizardStep === 1 && (
          <>
          <Card className={sectionBorder}>
            <CardHeader>
              <CardTitle>Pricing & Logistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm font-medium">Venue & Tickets</p>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Multi-ticket event</Label>
                  <p className="text-xs text-muted-foreground">
                    {isEditMode
                      ? "Locked after creation — switching between single-venue and multi-ticket isn't allowed once an event exists. You can still edit the venue location."
                      : "Enable venue x ticket-tier matrix allocation (works for single or multiple venues) and multi-combo checkout."}
                  </p>
                </div>
                <Switch
                  disabled={isEditMode}
                  checked={form.multiTicketEnabled}
                  onCheckedChange={(v) => {
                    set("multiTicketEnabled", v)
                    if (!v) {
                      const first = venues[0]
                      if (first) {
                        const firstTier = first.tiers[0]
                        setForm((prev) => ({
                          ...prev,
                          venue: first.name || prev.venue,
                          ticketPrice: firstTier ? String(firstTier.price ?? 0) : prev.ticketPrice,
                          maxAttendees:
                            firstTier?.allocation
                              ? String(firstTier.allocation)
                              : prev.maxAttendees,
                        }))
                      }
                      setVenues([])
                    } else {
                      enableMultiTicketMatrix()
                    }
                  }}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="venue">Venue *</Label>
                <Input
                  id="venue"
                  placeholder="Enter venue name / address"
                  value={primaryVenueName}
                  onChange={(e) => {
                    const value = e.target.value
                    if (form.multiTicketEnabled) {
                      updatePrimaryVenueName(value)
                    } else {
                      set("venue", value)
                    }
                  }}
                />
              </div>

              {!form.multiTicketEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ticketPrice">Ticket Price</Label>
                  <Input
                    id="ticketPrice"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={form.ticketPrice === "0" ? "" : form.ticketPrice}
                    onChange={(e) => set("ticketPrice", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxAttendees">Max Attendees</Label>
                  <Input
                    id="maxAttendees"
                    type="number"
                    min={1}
                    placeholder="Leave blank for unlimited"
                    value={form.maxAttendees}
                    onChange={(e) => set("maxAttendees", e.target.value)}
                  />
                </div>
              </div>
              )}

              {!form.multiTicketEnabled && (
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-dashed border-border px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">
                    Need multiple venues or ticket types (VIP, General, etc.)?
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn("shrink-0", clubBtnClass)}
                    style={clubBtnStyle}
                    onClick={enableMultiTicketMatrix}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add venue or ticket tier
                  </Button>
                </div>
              )}

              {form.multiTicketEnabled && venues.length > 0 && (
                <VenueTierMatrixBuilder
                  venues={venues}
                  onChange={setVenues}
                  currency={form.currency}
                  primaryColor={primaryColor}
                  cardClassName={sectionBorder}
                  externalFirstVenueFields
                  jointScreening={
                    form.jointScreeningEnabled
                      ? { enabled: true, partnerClubNames, homeClubName }
                      : undefined
                  }
                />
              )}

              </div>

              {paidEvent && (
                <EventFeeManagementSection
                  value={form.feeHandlingType}
                  onChange={(v) => {
                    set("feeHandlingType", v)
                    setFeeReminder(v)
                  }}
                  ticketPrice={getLowestTicketPrice(form, venues)}
                  currency={form.currency}
                  canManage={canManageFees}
                  locked={isEditMode && eventEditMeta.ticketsSold}
                  clubId={clubId}
                />
              )}

              <EventRefundToggleSection
                isRefundAllowed={form.isRefundAllowed}
                onRefundAllowedChange={(v) => set("isRefundAllowed", v)}
                refundCutoffHours={form.refundCutoffHours}
                onRefundCutoffHoursChange={(v) => set("refundCutoffHours", v)}
                refundTiers={refundTiers}
                onRefundTiersChange={setRefundTiers}
                isFreeEvent={!paidEvent}
                isCompleted={eventEditMeta.completed}
                isEditMode={isEditMode}
                refundPolicyChangeReason={form.refundPolicyChangeReason}
                onRefundPolicyChangeReasonChange={(v) => set("refundPolicyChangeReason", v)}
                cutoffInvalid={refundCutoffInvalid}
              />
            </CardContent>
          </Card>
          </>
          )}

          {wizardStep === 2 && (
          <>
          <Card className={sectionBorder}>
            <CardHeader>
              <CardTitle>Booking Window</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bookingStartTime">Booking Start *</Label>
                  <Input id="bookingStartTime" type="datetime-local" value={form.bookingStartTime} onChange={(e) => set("bookingStartTime", e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bookingEndTime">Booking End *</Label>
                  <Input id="bookingEndTime" type="datetime-local" value={form.bookingEndTime} onChange={(e) => set("bookingEndTime", e.target.value)} required />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={sectionBorder}>
            <CardHeader>
              <CardTitle>Event Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Members Only</Label>
                  <p className="text-xs text-muted-foreground">Only club members can register</p>
                </div>
                <Switch
                  checked={form.memberOnly}
                  onCheckedChange={(v) =>
                    setForm((prev) => ({
                      ...prev,
                      memberOnly: v,
                      ...(v ? { earlyBirdMembersOnly: true } : {}),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="attendancePoints">Attendance Points</Label>
                <Input
                  id="attendancePoints"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.attendancePoints === "0" ? "" : form.attendancePoints}
                  onChange={(e) => set("attendancePoints", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Points awarded to members upon QR attendance scan</p>
                <p className="text-xs text-muted-foreground">For multi-ticket purchases, loyalty awarding is capped at 1x member value per transaction.</p>
              </div>

              <Separator className="bg-gray-300 dark:bg-gray-600" />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Waitlist</Label>
                  <p className="text-xs text-muted-foreground">Allow members to join a waitlist when event is full</p>
                </div>
                <Switch checked={form.waitlistEnabled} onCheckedChange={(v) => set("waitlistEnabled", v)} />
              </div>

              {form.waitlistEnabled && (
                <div className={cn("grid grid-cols-2 gap-4 pl-4", nestedBorder)}>
                  <div className="grid gap-2">
                    <Label>Waitlist Size (% of capacity)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={form.waitlistPercentage}
                      onChange={(e) => set("waitlistPercentage", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Purchase Window (hours)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={168}
                      value={form.waitlistPurchaseWindowHours}
                      onChange={(e) => set("waitlistPurchaseWindowHours", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={sectionBorder}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Early Bird Discount
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Early Bird Discount</Label>
                  <p className="text-xs text-muted-foreground">Offer a time-limited discount before a cutoff date</p>
                </div>
                <Switch
                  checked={form.earlyBirdEnabled}
                  onCheckedChange={(v) =>
                    setForm((prev) => ({
                      ...prev,
                      earlyBirdEnabled: v,
                      ...(v && prev.memberOnly ? { earlyBirdMembersOnly: true } : {}),
                    }))
                  }
                />
              </div>

              {form.earlyBirdEnabled && (
                <div className={cn("space-y-4 pl-4", nestedBorder)}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Discount Type</Label>
                      <Select value={form.earlyBirdType} onValueChange={(v) => set("earlyBirdType", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="earlyBirdValue">
                        Discount Value {form.earlyBirdType === "percentage" ? "(%)" : `(${form.currency})`}
                      </Label>
                      <Input
                        id="earlyBirdValue"
                        type="number"
                        min={0}
                        placeholder={form.earlyBirdType === "percentage" ? "e.g. 10" : "e.g. 100"}
                        value={form.earlyBirdValue}
                        onChange={(e) => set("earlyBirdValue", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="earlyBirdStartTime">Discount Starts</Label>
                      <Input
                        id="earlyBirdStartTime"
                        type="datetime-local"
                        value={form.earlyBirdStartTime}
                        onChange={(e) => set("earlyBirdStartTime", e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="earlyBirdEndTime">Discount Ends</Label>
                      <Input
                        id="earlyBirdEndTime"
                        type="datetime-local"
                        value={form.earlyBirdEndTime}
                        onChange={(e) => set("earlyBirdEndTime", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Members Only</Label>
                      <p className="text-xs text-muted-foreground">
                        {form.memberOnly
                          ? "Early bird follows event setting — members-only event"
                          : "Restrict this discount to club members"}
                      </p>
                    </div>
                    <Switch
                      checked={form.memberOnly || form.earlyBirdMembersOnly}
                      disabled={form.memberOnly}
                      onCheckedChange={(v) => set("earlyBirdMembersOnly", v)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          </>
          )}

          <div className="flex justify-between gap-4 pt-2">
            <div className="flex gap-2">
              <Link href="/dashboard/events">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              {wizardStep > 0 && (
                <Button type="button" variant="outline" onClick={goBack}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {wizardStep < WIZARD_STEPS.length - 1 ? (
                <Button
                  key="nav-next"
                  type="button"
                  variant="ghost"
                  className={clubBtnClass}
                  style={clubBtnStyle}
                  onClick={goNext}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  key="nav-submit"
                  type="submit"
                  variant="ghost"
                  disabled={loading || !canPublish}
                  className={clubBtnClass}
                  style={clubBtnStyle}
                  title={!canPublish ? "Fix refund policy settings before publishing" : undefined}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isEditMode ? "Saving..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      {isEditMode ? "Save Changes" : "Publish Event"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
          </div>

          <aside className="lg:sticky lg:top-6 space-y-4">
            <EventCreatePreview
              title={form.title}
              category={form.category}
              categoryLabel={CATEGORIES.find((c) => c.value === form.category)?.label}
              startTime={form.startTime}
              endTime={form.endTime}
              description={form.description}
              venue={form.venue}
              ticketPrice={form.ticketPrice}
              maxAttendees={form.maxAttendees}
              currency={form.currency}
              multiTicketEnabled={form.multiTicketEnabled}
              venues={venues}
              memberOnly={form.memberOnly}
              isPaid={paidEvent}
              isRefundAllowed={form.isRefundAllowed}
              primaryColor={primaryColor}
              clubName={targetClub?.name}
              jointScreeningEnabled={form.jointScreeningEnabled}
              partnerClubNames={partnerClubNames}
              homeClubName={homeClubName}
              bookingStartTime={form.bookingStartTime}
              bookingEndTime={form.bookingEndTime}
              attendancePoints={form.attendancePoints}
              waitlistEnabled={form.waitlistEnabled}
              waitlistPurchaseWindowHours={form.waitlistPurchaseWindowHours}
              wizardStep={wizardStep}
            />
          </aside>
        </div>

        <AlertDialog
          open={partnerClubToRemove !== null}
          onOpenChange={(open) => !open && setPartnerClubToRemove(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove partner club?</AlertDialogTitle>
              <AlertDialogDescription>
                {partnerClubToRemove && (
                  <>
                    Remove &quot;{partnerClubToRemove}&quot; from this joint screening? Club-specific seat
                    splits for this partner will be cleared from ticket tiers.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (partnerClubToRemove) {
                    setPartnerClubNames(partnerClubNames.filter((c) => c !== partnerClubToRemove))
                  }
                  setPartnerClubToRemove(null)
                }}
              >
                Remove
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <EventRefundPolicyImpactDialog
          open={showPolicyImpactDialog}
          onOpenChange={setShowPolicyImpactDialog}
          changingToNonRefundable={!form.isRefundAllowed}
          loading={loading}
          onConfirm={() => performSubmit(true)}
        />

        <AlertDialog
          open={feeReminder !== null}
          onOpenChange={(open) => !open && setFeeReminder(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Review your ticket price</AlertDialogTitle>
              <AlertDialogDescription>
                {feeReminder === "absorb" ? (
                  <>
                    Your club will now <span className="font-semibold">absorb</span> the
                    Payment Gateway and Platform fees. Your net per ticket will be lower
                    than the listed price — consider increasing the ticket price to protect
                    your margin.
                  </>
                ) : (
                  <>
                    Fees will now be <span className="font-semibold">passed to the buyer</span>{" "}
                    and added on top of the ticket price at checkout. Review the ticket
                    price so the final amount stays reasonable for members.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setFeeReminder(null)}>
                Got it
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}

function CreateEventFormRoute() {
  const searchParams = useSearchParams()
  // Remount the whole form (and reset all its state, incl. picked poster
  // images) whenever the target event changes — otherwise leftover state
  // from a previous create/edit/duplicate leaks into the next one.
  const formKey = searchParams.get("edit") ?? searchParams.get("duplicate") ?? "new"
  return <CreateEventForm key={formKey} />
}

export default function CreateEventPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    }>
      <CreateEventFormRoute />
    </Suspense>
  )
}
