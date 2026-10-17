"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Calendar, Package, Star, Truck } from "lucide-react"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient, ClubPickupAddress } from "@/lib/api"
import { DONATION_CATEGORIES } from "@/lib/listings"
import { calculateAbsorbedTransactionFees, calculateTransactionFees, PLATFORM_FEE_PERCENT } from "@/lib/transactionFees"
import { useSelectedClubId, useAccessibleClubs } from "@/hooks/useSelectedClubId"
import { getAccessibleClub } from "@/lib/clubContext"
import { useListingSave } from "@/hooks/useListingSave"
import { PublishingTo, StepPills, WizardFooter, WizardHeader } from "@/components/listings/listing-wizard-chrome"
import { EventSettingsSection, PosterSection, SectionCard } from "@/components/listings/listing-form-sections"
import { ListingPreview, PreviewRow, formatPreviewDate, money } from "@/components/listings/listing-preview"
import { ItemsDetails, ItemsState, MonetaryDetails, MonetaryState, defaultSlots } from "@/components/listings/donation-details-step"

const STEPS = ["Basic Details", "Donation Details"] as const
const RETURN_TO = "/dashboard/events?tab=listings"
const toDateInput = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-CA") : "")

function DonationForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const editId = searchParams.get("edit")
  const clubId = useSelectedClubId() ?? ""
  const club = getAccessibleClub(clubId, useAccessibleClubs())

  const [step, setStep] = useState(0)
  const [loaded, setLoaded] = useState(!editId)
  const [original, setOriginal] = useState<{ status: string; hasEntries: boolean; core: string } | null>(null)
  const [platformFeePercent, setPlatformFeePercent] = useState(PLATFORM_FEE_PERCENT)
  const [pickupAddresses, setPickupAddresses] = useState<ClubPickupAddress[]>([])
  const [image400, setImage400] = useState<File | null>(null)
  const [image1080, setImage1080] = useState<File | null>(null)
  const [existingImage, setExistingImage] = useState<string | null>(null)
  const [basics, setBasics] = useState({ title: "", description: "", category: "donations", startDate: "", endDate: "", memberOnly: false, attendancePoints: "0" })
  const [money_, setMoney] = useState<MonetaryState>({ amountMode: "preset", presets: ["100", "500", "1000"], minAmount: "100", waiverOn: false, waiverCode: "", waiver: null, feeHandlingType: "pass_to_buyer" })
  const [items, setItems] = useState<ItemsState>({
    items: [{ name: "", targetCount: "" }], atLocation: false, locationAddress: "", atNextEvent: false,
    clubPickup: false, pickupArrangedBy: "club", pickupAddressId: "", slots: defaultSlots(),
  })
  const setB = (patch: Partial<typeof basics>) => setBasics((p) => ({ ...p, ...patch }))
  const isItems = basics.category === "csr-events"
  const currency = "INR"

  useEffect(() => {
    if (!clubId) return
    apiClient.getMyClubFeatures(clubId).then((res) => {
      const fee = ((res.data as any)?.data ?? res.data)?.platformFeePercent
      if (typeof fee === "number") setPlatformFeePercent(fee)
    })
    apiClient.getClubPickupAddresses(clubId).then((res) => setPickupAddresses(res.data?.pickupAddresses ?? []))
  }, [clubId])

  useEffect(() => {
    if (!editId) return
    apiClient.getEventById(editId).then((res) => {
      const ev = res.data
      if (!res.success || !ev) {
        toast.error("Could not load donation drive")
        return router.push(RETURN_TO)
      }
      const d = ev.donation ?? {}
      setBasics({ title: ev.title, description: ev.description, category: ev.category, startDate: toDateInput(ev.startTime), endDate: toDateInput(ev.endTime), memberOnly: ev.memberOnly, attendancePoints: String(ev.attendancePoints ?? 0) })
      setMoney((m) => ({
        ...m,
        amountMode: d.amountMode ?? "preset",
        presets: d.presetAmounts?.length ? d.presetAmounts.map(String) : m.presets,
        minAmount: String(d.minAmount ?? 1),
        feeHandlingType: ev.feeHandlingType ?? "absorb",
        waiver: d.waiverCode ? { code: d.waiverCode, percentOff: d.waiverPercent ?? 0 } : null,
      }))
      setItems((s) => ({
        items: d.items?.length ? d.items.map((i) => ({ name: i.name, targetCount: i.targetCount ? String(i.targetCount) : "" })) : s.items,
        atLocation: Boolean(d.dropOff?.atLocation), locationAddress: d.dropOff?.locationAddress ?? "",
        atNextEvent: Boolean(d.dropOff?.atNextEvent), clubPickup: Boolean(d.dropOff?.clubPickup),
        pickupArrangedBy: d.dropOff?.pickupArrangedBy ?? "club", pickupAddressId: d.dropOff?.pickupAddressId ?? "",
        slots: defaultSlots().map((def) => {
          const saved = d.deliverySlots?.find((x) => x.day === def.day)
          return saved ? { day: def.day, enabled: saved.enabled, time: saved.time ?? "" } : def
        }),
      }))
      setExistingImage(ev.eventImage ?? null)
      setOriginal({ status: ev.publishStatus ?? "published", hasEntries: (d.donationCount ?? 0) > 0, core: JSON.stringify([toDateInput(ev.startTime), toDateInput(ev.endTime)]) })
      setLoaded(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId])

  const wasDraft = original?.status === "draft"
  const { loading, save, impactDialog } = useListingSave({ editId, wasDraft: !editId || wasDraft, returnTo: RETURN_TO })

  const presetNumbers = money_.presets.map(Number).filter((n) => n > 0)

  const validate = (s: number): string | null => {
    if (s === 0) {
      if (!basics.title.trim()) return "Title is required"
      if (!basics.description.trim()) return "Description is required"
      if (basics.startDate && basics.endDate && basics.endDate < basics.startDate) return "End date must be on or after the start date"
      return null
    }
    if (!isItems) {
      if (money_.amountMode === "preset" && presetNumbers.length === 0) return "Add at least one amount greater than 0"
      if (money_.amountMode === "preset" && money_.presets.some((p) => p.trim() && !(Number(p) > 0))) return "Amounts must be greater than 0"
      if (money_.amountMode === "custom" && !(Number(money_.minAmount) >= 1)) return "Minimum amount must be at least 1"
      return null
    }
    if (!items.items.some((i) => i.name.trim())) return "Add at least one donation item"
    if (items.items.some((i) => i.targetCount && !(Number.isInteger(Number(i.targetCount)) && Number(i.targetCount) > 0))) return "Counts must be whole numbers"
    if (!items.atLocation && !items.atNextEvent && !items.clubPickup) return "Choose at least one pickup / drop option"
    if (items.atLocation && !items.locationAddress.trim()) return "Enter the drop-off address"
    if (items.clubPickup && items.pickupArrangedBy === "wingman" && !items.pickupAddressId) return "Select the address for Wingman pickups"
    if (items.slots.some((s) => s.enabled && !s.time)) return "Set a time for every delivery day that is on"
    return null
  }

  const submit = (saveMode: "draft" | "publish") => {
    for (let s = 0; s < STEPS.length; s++) {
      const err = validate(s)
      if (err) {
        setStep(s)
        return void toast.error(err)
      }
    }
    const payload = {
      listingType: "donation",
      clubId,
      title: basics.title.trim(),
      description: basics.description.trim(),
      category: basics.category,
      currency,
      // Dates are optional: an open-ended drive stays open until closed.
      startTime: basics.startDate ? new Date(`${basics.startDate}T00:00:00`).toISOString() : null,
      endTime: basics.endDate ? new Date(`${basics.endDate}T23:59:59`).toISOString() : null,
      memberOnly: basics.memberOnly,
      attendancePoints: Number(basics.attendancePoints) || 0,
      waiverCode: money_.waiver?.code,
      ...(isItems ? {} : { feeHandlingType: money_.feeHandlingType }),
      donation: isItems
        ? {
            items: items.items.filter((i) => i.name.trim()).map((i) => ({ name: i.name.trim(), targetCount: i.targetCount ? Number(i.targetCount) : undefined })),
            dropOff: {
              atLocation: items.atLocation, locationAddress: items.locationAddress.trim(),
              atNextEvent: items.atNextEvent, clubPickup: items.clubPickup,
              pickupArrangedBy: items.pickupArrangedBy, pickupAddressId: items.pickupAddressId,
            },
            deliverySlots: items.slots,
          }
        : { amountMode: money_.amountMode, presetAmounts: presetNumbers, minAmount: Number(money_.minAmount) },
    }
    const impactsEntries = Boolean(original && original.status === "published" && original.hasEntries && original.core !== JSON.stringify([basics.startDate, basics.endDate]))
    save(payload, { mode: saveMode, images: { list400: image400, full1080: image1080 }, impactsEntries })
  }

  if (!loaded) return <DashboardLayout><div className="p-8 text-muted-foreground">Loading…</div></DashboardLayout>

  const waiverPercent = money_.waiver?.percentOff ?? 0
  const example = presetNumbers[0] ?? (Number(money_.minAmount) || 100)
  const donorPays = money_.feeHandlingType === "pass_to_buyer"
  const effectivePercent = platformFeePercent * (1 - waiverPercent / 100)
  const fees = donorPays ? calculateTransactionFees(example, effectivePercent) : calculateAbsorbedTransactionFees(example, effectivePercent)
  const platformCut = fees.platformFee + fees.platformFeeGst
  const gatewayCut = fees.razorpayFee + fees.razorpayFeeGst

  return (
    <DashboardLayout>
      <div className="grid w-full max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0 space-y-5">
          <WizardHeader title={editId ? "Edit Donation Drive" : "Create Donation Drive"} backHref={RETURN_TO} />
          <PublishingTo clubName={club?.name} />
          <StepPills steps={STEPS} current={step} onSelect={setStep} />

          {step === 0 && (
            <>
              <SectionCard title="Basic details">
                <div className="space-y-2">
                  <Label htmlFor="title">Activity title *</Label>
                  <Input id="title" placeholder="Enter activity title" value={basics.title} onChange={(e) => setB({ title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea id="description" rows={5} placeholder="Describe the event" value={basics.description} onChange={(e) => setB({ description: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  {/* Money vs items is fixed once a drive exists — their entries aren't interchangeable. */}
                  <Select value={basics.category} onValueChange={(category) => setB({ category })} disabled={Boolean(editId)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DONATION_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </SectionCard>

              <SectionCard title="Dates">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start date <span className="font-normal text-muted-foreground">(optional)</span></Label>
                    <Input id="startDate" type="date" value={basics.startDate} onChange={(e) => setB({ startDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End date <span className="font-normal text-muted-foreground">(optional)</span></Label>
                    <Input id="endDate" type="date" value={basics.endDate} onChange={(e) => setB({ endDate: e.target.value })} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Leave the end date empty for an open-ended drive. It stays open until you close it.</p>
              </SectionCard>

              <PosterSection list400={image400} full1080={image1080} existingUrl={existingImage} onList400={setImage400} onFull1080={setImage1080} disabled={loading} />

              <EventSettingsSection
                memberOnly={basics.memberOnly}
                onMemberOnly={(memberOnly) => setB({ memberOnly })}
                attendancePoints={basics.attendancePoints}
                onAttendancePoints={(attendancePoints) => setB({ attendancePoints })}
              />
            </>
          )}

          {step === 1 && (isItems
            ? <ItemsDetails state={items} onChange={(p) => setItems((s) => ({ ...s, ...p }))} pickupAddresses={pickupAddresses} />
            : <MonetaryDetails state={money_} onChange={(p) => setMoney((s) => ({ ...s, ...p }))} currency={currency} clubId={clubId} />)}

          <WizardFooter
            cancelHref={RETURN_TO}
            isFirstStep={step === 0}
            isLastStep={step === STEPS.length - 1}
            loading={loading}
            isEdit={Boolean(editId)}
            isPublished={Boolean(editId) && !wasDraft}
            onBack={() => setStep((s) => s - 1)}
            onNext={() => {
              const err = validate(step)
              if (err) return void toast.error(err)
              setStep((s) => s + 1)
            }}
            onSave={submit}
          />
        </div>

        <aside className="lg:sticky lg:top-6">
          <ListingPreview
            clubName={club?.name}
            title={basics.title}
            chips={[isItems ? "CSR" : "Donation", step === 0 && basics.memberOnly && "Member's Only"]}
          >
            {step === 0 && (
              <>
                <PreviewRow icon={Calendar} label="Date" value={basics.startDate || basics.endDate ? `${formatPreviewDate(basics.startDate) } – ${basics.endDate ? formatPreviewDate(basics.endDate) : "Ongoing"}` : "Ongoing"} />
                <PreviewRow icon={Star} label="Attendance points" value={basics.attendancePoints || "0"} />
              </>
            )}
            {step === 1 && !isItems && (
              <>
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</p>
                  <div className="flex flex-wrap gap-1.5">
                    {money_.amountMode === "preset"
                      ? presetNumbers.map((n) => <Badge key={n} variant="outline" className="rounded-full">{money(n, currency)}</Badge>)
                      : <Badge variant="outline" className="rounded-full">Any amount from {money(Number(money_.minAmount) || 1, currency)}</Badge>}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Platform fee</p>
                  <p className="text-sm font-medium">{donorPays ? "Paid by donor" : "Absorbed by club"}{waiverPercent ? ` · ${waiverPercent}% waived` : ""}</p>
                </div>
                <div className="space-y-1.5 rounded-lg bg-muted/60 p-3 text-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Example for {money(example, currency)}</p>
                  {donorPays ? (
                    <>
                      <Row label="Donation" value={money(example, currency)} />
                      <Row label="Transaction fee" value={money(gatewayCut, currency)} muted />
                      <Row label="Platform fee" value={money(platformCut, currency)} muted />
                      <div className="border-t pt-1.5"><Row label="Donor pays" value={money(fees.finalAmount, currency)} bold /></div>
                    </>
                  ) : (
                    <>
                      <Row label="Donor pays" value={money(example, currency)} />
                      <Row label="Transaction fee" value={`− ${money(gatewayCut, currency)}`} muted />
                      <Row label="Platform fee" value={`− ${money(platformCut, currency)}`} muted />
                      <div className="border-t pt-1.5"><Row label="Club receives" value={money(example - gatewayCut - platformCut, currency)} bold /></div>
                    </>
                  )}
                </div>
              </>
            )}
            {step === 1 && isItems && (
              <>
                <PreviewRow icon={Package} label="Items" value={items.items.filter((i) => i.name.trim()).map((i) => `${i.name}${i.targetCount ? ` (${i.targetCount})` : ""}`).join(", ")} />
                <PreviewRow icon={Truck} label="Hand-over" value={[items.atLocation && "Drop-off", items.atNextEvent && "Next event", items.clubPickup && "Pickup"].filter(Boolean).join(" · ")} />
              </>
            )}
          </ListingPreview>
        </aside>
      </div>
      {impactDialog}
    </DashboardLayout>
  )
}

function Row({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-muted-foreground" : ""} ${bold ? "font-semibold" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

export default function DonationDrivePage() {
  return (
    <ProtectedRoute requireAdmin>
      <Suspense fallback={null}>
        <DonationForm />
      </Suspense>
    </ProtectedRoute>
  )
}
