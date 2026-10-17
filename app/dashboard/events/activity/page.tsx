"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Calendar, Clock, MapPin, Ticket, Users } from "lucide-react"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api"
import { ACTIVITY_CATEGORIES } from "@/lib/listings"
import { validateEventSchedule } from "@/lib/event-pricing-validation"
import { useSelectedClubId, useAccessibleClubs } from "@/hooks/useSelectedClubId"
import { getAccessibleClub } from "@/lib/clubContext"
import { useCanManageFees } from "@/hooks/useCanManageFees"
import { useListingSave } from "@/hooks/useListingSave"
import { PublishingTo, StepPills, WizardFooter, WizardHeader } from "@/components/listings/listing-wizard-chrome"
import { EventSettingsSection, PosterSection, SectionCard, toDatetimeLocal } from "@/components/listings/listing-form-sections"
import { ListingPreview, PreviewRow, formatPreviewDate, formatPreviewTime, money } from "@/components/listings/listing-preview"
import { ActivityPricingStep, ActivityPricingState, activityFieldsFor } from "@/components/listings/activity-pricing-step"


const STEPS = ["Plan Details", "Pricing"] as const
const RETURN_TO = "/dashboard/events?tab=listings"

function ActivityForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const editId = searchParams.get("edit")
  const clubId = useSelectedClubId() ?? ""
  const club = getAccessibleClub(clubId, useAccessibleClubs())
  const canManageFees = useCanManageFees()

  const [step, setStep] = useState(0)
  const [loaded, setLoaded] = useState(!editId)
  const [original, setOriginal] = useState<{ status: string; hasEntries: boolean; core: string } | null>(null)
  const [image400, setImage400] = useState<File | null>(null)
  const [image1080, setImage1080] = useState<File | null>(null)
  const [existingImage, setExistingImage] = useState<string | null>(null)
  const [basics, setBasics] = useState({
    title: "", category: "contests", description: "", currency: "INR",
    bookingStartTime: "", bookingEndTime: "", startTime: "", endTime: "",
    memberOnly: false, attendancePoints: "0", waitlist: false,
  })
  const [pricing, setPricing] = useState<ActivityPricingState>({
    maxAttendees: "", fee: "", mode: "offline", onlineUrl: "", location: "", inclusions: [""], addOns: [],
    feeHandlingType: "pass_to_buyer", isRefundAllowed: true, refundCutoffHours: "24", refundTiers: [],
  })
  const setB = (patch: Partial<typeof basics>) => setBasics((p) => ({ ...p, ...patch }))
  const setP = (patch: Partial<ActivityPricingState>) => setPricing((p) => ({ ...p, ...patch }))

  // ponytail: fee drives free/paid — no separate Free/Paid switch (matches the mockup)
  const isPaid = Number(pricing.fee) > 0
  const isTrip = activityFieldsFor(basics.category).isTrip
  const mode = isTrip ? "offline" : pricing.mode
  const venue = mode === "online" ? "Online" : pricing.location.trim()
  const coreKey = (b = basics, p = pricing) => JSON.stringify([b.startTime, b.endTime, b.bookingStartTime, b.bookingEndTime, p.fee, p.location, p.onlineUrl])

  useEffect(() => {
    if (!editId) return
    apiClient.getEventById(editId).then((res) => {
      const ev = res.data
      if (!res.success || !ev) {
        toast.error("Could not load listing")
        return router.push(RETURN_TO)
      }
      const nextBasics = {
        title: ev.title, category: ev.category, description: ev.description, currency: ev.currency ?? "INR",
        bookingStartTime: toDatetimeLocal(ev.bookingStartTime), bookingEndTime: toDatetimeLocal(ev.bookingEndTime),
        startTime: toDatetimeLocal(ev.startTime), endTime: toDatetimeLocal(ev.endTime),
        memberOnly: ev.memberOnly, attendancePoints: String(ev.attendancePoints ?? 0), waitlist: Boolean(ev.waitlist?.enabled),
      }
      const nextPricing: ActivityPricingState = {
        maxAttendees: ev.maxAttendees ? String(ev.maxAttendees) : "",
        fee: ev.ticketPrice ? String(ev.ticketPrice) : "",
        mode: ev.activity?.mode ?? "offline",
        onlineUrl: ev.activity?.onlineUrl ?? "",
        location: ev.activity?.mode === "online" ? "" : ev.venue ?? "",
        inclusions: ev.activity?.inclusions?.length ? ev.activity.inclusions : [""],
        addOns: (ev.activity?.addOns ?? []).map((a) => ({ name: a.name, price: String(a.price) })),
        feeHandlingType: ev.feeHandlingType ?? "pass_to_buyer",
        isRefundAllowed: ev.isRefundAllowed !== false,
        refundCutoffHours: String(ev.refundCutoffHours ?? 24),
        refundTiers: (ev.refundTiers ?? []) as any,
      }
      setBasics(nextBasics)
      setPricing(nextPricing)
      setExistingImage(ev.eventImage ?? null)
      const confirmed = (ev.registrations ?? []).filter((r) => r.status === "confirmed").length
      setOriginal({ status: ev.publishStatus ?? "published", hasEntries: confirmed > 0 || (ev.currentAttendees ?? 0) > 0, core: coreKey(nextBasics, nextPricing) })
      setLoaded(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId])

  const wasDraft = original?.status === "draft"
  const { loading, save, impactDialog } = useListingSave({ editId, wasDraft: !editId || wasDraft, returnTo: RETURN_TO })

  const validate = (s: number): string | null => {
    if (s === 0) {
      if (!basics.title.trim()) return "Activity title is required"
      if (!basics.description.trim()) return "Description is required"
      if (!basics.startTime || !basics.endTime) return "Event start and end are required"
      if (new Date(basics.endTime) <= new Date(basics.startTime)) return "Event end must be after event start"
      const schedule = validateEventSchedule(basics)
      if (!schedule.ok) return schedule.message
      return null
    }
    if (!isTrip && mode === "online" && !/^https?:\/\/\S+$/i.test(pricing.onlineUrl.trim())) return "Enter a valid web link (https://…)"
    if (mode === "offline" && !venue) return "Location is required"
    if (pricing.maxAttendees && !(Number.isInteger(Number(pricing.maxAttendees)) && Number(pricing.maxAttendees) > 0)) return "Capacity must be a whole number"
    if (pricing.addOns.some((a) => a.name.trim() && !(Number(a.price) >= 0 && a.price !== ""))) return "Every add-on needs a price"
    if (isPaid && pricing.isRefundAllowed && !/^\d+$/.test(pricing.refundCutoffHours.trim())) return "Refund cut-off must be whole hours"
    return null
  }

  const next = () => {
    const err = validate(step)
    if (err) return void toast.error(err)
    setStep((s) => s + 1)
  }

  const submit = (saveMode: "draft" | "publish") => {
    for (let s = 0; s < STEPS.length; s++) {
      const err = validate(s)
      if (err) {
        setStep(s)
        return void toast.error(err)
      }
    }
    const paid = isPaid
    const payload = {
      listingType: "activity",
      clubId,
      title: basics.title.trim(),
      category: basics.category,
      description: basics.description.trim(),
      currency: basics.currency,
      startTime: new Date(basics.startTime).toISOString(),
      endTime: new Date(basics.endTime).toISOString(),
      bookingStartTime: new Date(basics.bookingStartTime).toISOString(),
      bookingEndTime: new Date(basics.bookingEndTime).toISOString(),
      venue,
      maxAttendees: pricing.maxAttendees ? Number(pricing.maxAttendees) : undefined,
      ticketPrice: paid ? Number(pricing.fee) : 0,
      memberOnly: basics.memberOnly,
      attendancePoints: Number(basics.attendancePoints) || 0,
      waitlist: { enabled: basics.waitlist, percentage: 25, purchaseWindowHours: 12 },
      activity: {
        mode,
        onlineUrl: mode === "online" ? pricing.onlineUrl.trim() : undefined,
        inclusions: activityFieldsFor(basics.category).showInclusions ? pricing.inclusions.map((s) => s.trim()).filter(Boolean) : [],
        addOns: activityFieldsFor(basics.category).showAddOns
          ? pricing.addOns.filter((a) => a.name.trim()).map((a) => ({ name: a.name.trim(), price: Number(a.price) }))
          : [],
      },
      feeHandlingType: paid ? pricing.feeHandlingType : undefined,
      isRefundAllowed: paid ? pricing.isRefundAllowed : true,
      refund_cutoff_hours: paid && pricing.isRefundAllowed ? Number(pricing.refundCutoffHours) : 24,
      refundTiers: paid && pricing.isRefundAllowed && pricing.refundTiers.length ? pricing.refundTiers : undefined,
    }
    const impactsEntries = Boolean(original && original.status === "published" && original.hasEntries && original.core !== coreKey())
    save(payload, { mode: saveMode, images: { list400: image400, full1080: image1080 }, impactsEntries })
  }

  const categoryLabel = ACTIVITY_CATEGORIES.find((c) => c.value === basics.category)?.label
  if (!loaded) return <DashboardLayout><div className="p-8 text-muted-foreground">Loading…</div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="grid w-full max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0 space-y-5">
          <WizardHeader title={editId ? "Edit Activity" : "Create Activity"} backHref={RETURN_TO} />
          <PublishingTo clubName={club?.name} />
          <StepPills steps={STEPS} current={step} onSelect={setStep} />

          {step === 0 && (
            <>
              <SectionCard title="Basic details">
                <div className="space-y-2">
                  <Label htmlFor="title">Activity title *</Label>
                  <Input id="title" placeholder="Enter activity title" value={basics.title} onChange={(e) => setB({ title: e.target.value })} />
                </div>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={basics.category} onValueChange={(category) => setB({ category })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ACTIVITY_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea id="description" rows={4} placeholder="Describe the event" value={basics.description} onChange={(e) => setB({ description: e.target.value })} />
                </div>
              </SectionCard>

              <PosterSection list400={image400} full1080={image1080} existingUrl={existingImage} onList400={setImage400} onFull1080={setImage1080} disabled={loading} />

              <SectionCard title="Schedule">
                <div className="grid gap-4 sm:grid-cols-2">
                  {([["bookingStartTime", "Booking start"], ["bookingEndTime", "Booking end"], ["startTime", "Event start"], ["endTime", "Event end"]] as const).map(([key, label]) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key}>{label} *</Label>
                      <Input id={key} type="datetime-local" value={basics[key]} onChange={(e) => setB({ [key]: e.target.value })} />
                    </div>
                  ))}
                </div>
              </SectionCard>

              <EventSettingsSection
                memberOnly={basics.memberOnly}
                onMemberOnly={(memberOnly) => setB({ memberOnly })}
                attendancePoints={basics.attendancePoints}
                onAttendancePoints={(attendancePoints) => setB({ attendancePoints })}
                waitlist={basics.waitlist}
                onWaitlist={(waitlist) => setB({ waitlist })}
              />
            </>
          )}

          {step === 1 && (
            <ActivityPricingStep
              category={basics.category}
              currency={basics.currency}
              state={pricing}
              onChange={setP}
              canManageFees={canManageFees}
              feeLocked={Boolean(original?.hasEntries)}
              clubId={clubId}
              isEdit={Boolean(editId)}
            />
          )}

          <WizardFooter
            cancelHref={RETURN_TO}
            isFirstStep={step === 0}
            isLastStep={step === STEPS.length - 1}
            loading={loading}
            isEdit={Boolean(editId)}
            isPublished={Boolean(editId) && !wasDraft}
            onBack={() => setStep((s) => s - 1)}
            onNext={next}
            onSave={submit}
          />
        </div>

        <aside className="lg:sticky lg:top-6">
          <ListingPreview
            clubName={club?.name}
            title={basics.title}
            chips={[categoryLabel, isPaid ? money(Number(pricing.fee) || 0, basics.currency) : "Free", basics.memberOnly && "Member's Only", isPaid && pricing.isRefundAllowed && "Refundable"]}
          >
            <PreviewRow icon={Calendar} label="Date" value={formatPreviewDate(basics.startTime)} />
            <PreviewRow icon={Clock} label="Time" value={formatPreviewTime(basics.startTime, basics.endTime)} />
            {step === 1 && mode !== "online" && <PreviewRow icon={MapPin} label="Venue" value={venue} />}
            {step === 1 && <PreviewRow icon={Users} label={isTrip ? "Seats" : "Max participants"} value={pricing.maxAttendees || "Unlimited"} />}
            <PreviewRow icon={Ticket} label="Tickets" value={`General · ${isPaid ? money(Number(pricing.fee) || 0, basics.currency) : "Free"}`} />
          </ListingPreview>
        </aside>
      </div>
      {impactDialog}
    </DashboardLayout>
  )
}

export default function ActivityPage() {
  return (
    <ProtectedRoute requireAdmin>
      <Suspense fallback={null}>
        <ActivityForm />
      </Suspense>
    </ProtectedRoute>
  )
}
