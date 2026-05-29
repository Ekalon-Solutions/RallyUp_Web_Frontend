"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, Loader2, Plus, Minus, MapPin, Tag, X, User, Phone, Users } from "lucide-react"
import { toast } from "sonner"
import { apiClient, Event, VenueTierCartItem } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { calculateTransactionFees, PLATFORM_FEE_PERCENT, RAZORPAY_FEE_PERCENT } from "@/lib/transactionFees"
import { useRouter } from "next/navigation"

declare global {
  interface Window { Razorpay: any }
}

interface VenueTierCartModalProps {
  isOpen: boolean
  onClose: () => void
  event: Event | null
  onSuccess: () => void
  onFailure: () => void
}

interface AttendeeSlot {
  venueId: string
  venueName: string
  tierId: string
  tierName: string
  name: string
  phone: string
}

interface CartState {
  [venueId: string]: { [tierId: string]: number }
}

const currencySymbols: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", AUD: "A$", CAD: "CA$",
  JPY: "¥", BRL: "R$", MXN: "$", ZAR: "R",
}

function fmt(amount: number, currency = "INR") {
  const sym = currencySymbols[currency] ?? currency + " "
  return `${sym}${Number(amount).toLocaleString()}`
}

export function VenueTierCartModal({ isOpen, onClose, event, onSuccess, onFailure }: VenueTierCartModalProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [cart, setCart] = useState<CartState>({})
  const [attendeeSlots, setAttendeeSlots] = useState<AttendeeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [razorpayOpen, setRazorpayOpen] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [localCouponCode, setLocalCouponCode] = useState("")
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponName, setCouponName] = useState("")
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [redeemPoints, setRedeemPoints] = useState<number | string>("")
  const [reservationToken, setReservationToken] = useState<string | null>(null)
  const [reservedDiscount, setReservedDiscount] = useState(0)
  const [availablePoints, setAvailablePoints] = useState<number | null>(null)
  const [reserving, setReserving] = useState(false)
  const [attributedClub, setAttributedClub] = useState("")
  const [showClubAlert, setShowClubAlert] = useState(false)

  const jointScreening = event?.jointScreening
  const isJointEvent = Boolean(jointScreening?.enabled && (jointScreening?.partnerClubNames?.length ?? 0) > 0)
  const partnerClubOptions: string[] = jointScreening?.partnerClubNames ?? []

  const userDefaultName: string = (user as any)?.name
    ?? `${(user as any)?.first_name ?? ""} ${(user as any)?.last_name ?? ""}`.trim()
    ?? ""
  const userDefaultPhone: string = (user as any)?.phoneNumber ?? (user as any)?.phone ?? ""

  useEffect(() => {
    if (isOpen) {
      setCart({})
      setAttendeeSlots([])
      setLocalCouponCode("")
      setCouponApplied(false)
      setCouponDiscount(0)
      setCouponName("")
      setRedeemPoints("")
      setReservationToken(null)
      setReservedDiscount(0)
      setAttributedClub("")
      setShowClubAlert(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!event?.venues) return
    setAttendeeSlots(prev => {
      const newSlots: AttendeeSlot[] = []
      for (const venue of event.venues!) {
        for (const tier of venue.tiers) {
          const qty = cart[venue._id]?.[tier._id] ?? 0
          const existing = prev.filter(s => s.venueId === venue._id && s.tierId === tier._id)
          for (let q = 0; q < qty; q++) {
            const slot = existing[q]
            const isVeryFirst = newSlots.length === 0 && q === 0
            newSlots.push(slot ?? {
              venueId: venue._id,
              venueName: venue.name,
              tierId: tier._id,
              tierName: tier.name,
              name: isVeryFirst ? userDefaultName : "",
              phone: isVeryFirst ? userDefaultPhone : "",
            })
          }
        }
      }
      return newSlots
    })
  }, [cart])

  useEffect(() => {
    if (isOpen && !scriptLoaded) {
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.async = true
      script.onload = () => setScriptLoaded(true)
      script.onerror = () => toast.error("Failed to load payment system. Please refresh.")
      document.body.appendChild(script)
      return () => { if (document.body.contains(script)) document.body.removeChild(script) }
    }
  }, [isOpen, scriptLoaded])

  useEffect(() => {
    if (isOpen && user && event?.clubId) {
      apiClient.getMemberPoints((user as any)._id, event.clubId)
        .then((res) => { if (res.success && res.data) setAvailablePoints(res.data.points ?? 0) })
        .catch(() => {})
    }
  }, [isOpen, user, event])

  if (!event?.venues?.length) return null

  const venues = event.venues

  const cartItems: Array<VenueTierCartItem & { venueName: string; tierName: string; price: number }> = []
  for (const venue of venues) {
    for (const tier of venue.tiers) {
      const qty = cart[venue._id]?.[tier._id] ?? 0
      if (qty > 0) {
        cartItems.push({
          venueId: venue._id,
          tierId: tier._id,
          quantity: qty,
          venueName: venue.name,
          tierName: tier.name,
          price: tier.price,
        })
      }
    }
  }

  const getClubRemaining = (tier: { allocation: number; sold: number; clubAllocations?: Array<{ clubName: string; allocation: number; sold: number }> }) => {
    if (attributedClub && tier.clubAllocations?.length) {
      const ca = tier.clubAllocations.find((c) => c.clubName === attributedClub)
      if (!ca) return 0
      return Math.max(0, ca.allocation - ca.sold)
    }
    return Math.max(0, tier.allocation - tier.sold)
  }

  const setQty = (venueId: string, tierId: string, delta: number) => {
    setCart((prev) => {
      const vCart = prev[venueId] ?? {}
      const current = vCart[tierId] ?? 0
      const next = Math.max(0, current + delta)
      const venue = venues.find((v) => v._id === venueId)!
      const tier = venue.tiers.find((t) => t._id === tierId)!
      const available = getClubRemaining(tier)
      if (next > available) {
        const label = attributedClub && tier.clubAllocations?.length
          ? `Only ${available} seats available for ${attributedClub} in ${venue.name} – ${tier.name}`
          : `Only ${available} seats available for ${venue.name} – ${tier.name}`
        toast.error(label)
        return prev
      }
      const updated = { ...prev, [venueId]: { ...vCart, [tierId]: next } }
      if (next === 0) delete updated[venueId][tierId]
      if (Object.keys(updated[venueId]).length === 0) delete updated[venueId]
      return updated
    })
  }

  const updateSlot = (idx: number, field: "name" | "phone", value: string) => {
    setAttendeeSlots(prev => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: value }
      return copy
    })
  }

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const afterCoupon = Math.max(subtotal - couponDiscount, 0)
  const netAmount = Math.max(afterCoupon - (reservedDiscount || 0), 0)
  const feeBreakdown = netAmount > 0 ? calculateTransactionFees(netAmount) : null
  const amountToCharge = feeBreakdown ? feeBreakdown.finalAmount : netAmount

  const reservePoints = async () => {
    if (!redeemPoints || Number(redeemPoints) <= 0) { toast.error("Enter points to redeem"); return }
    if (!event.clubId) { toast.error("Club info missing"); return }
    if (availablePoints !== null && Number(redeemPoints) > availablePoints) {
      toast.error("Not enough points"); return
    }
    setReserving(true)
    try {
      const res = await apiClient.createReservation(Number(redeemPoints), event.clubId, afterCoupon)
      if (res.success) {
        setReservationToken(res.data?.reservationToken ?? null)
        setReservedDiscount(res.data?.discountAmount ?? 0)
        toast.success("Points reserved")
      } else {
        toast.error(res.message ?? "Failed to reserve points")
      }
    } catch { toast.error("Failed to reserve points") }
    finally { setReserving(false) }
  }

  const clearReservation = async () => {
    if (reservationToken) {
      await apiClient.cancelReservation(reservationToken).catch(() => {})
    }
    setReservationToken(null)
    setRedeemPoints("")
    setReservedDiscount(0)
  }

  const validateCoupon = async () => {
    if (!localCouponCode.trim() || !event._id) { toast.error("Enter a coupon code"); return }
    if (subtotal <= 0) { toast.error("Cart is empty or free — coupon not applicable"); return }
    setValidatingCoupon(true)
    try {
      const res = await apiClient.validateCoupon(localCouponCode.toUpperCase(), event._id, subtotal, event.clubId)
      if (res.success && res.data?.coupon) {
        setCouponDiscount(res.data.coupon.discount)
        setCouponName(res.data.coupon.name)
        setCouponApplied(true)
        toast.success("Coupon applied!")
      } else {
        toast.error(res.error ?? "Invalid coupon")
      }
    } catch { toast.error("Failed to validate coupon") }
    finally { setValidatingCoupon(false) }
  }

  const handlePayment = async () => {
    if (cartItems.length === 0) { toast.error("Select at least one ticket"); return }
    if (!user) { toast.error("Please log in to purchase tickets"); return }
    if (!scriptLoaded) { toast.error("Payment system still loading — please wait"); return }

    // Validate joint screening club affiliation
    if (isJointEvent && !attributedClub) {
      setShowClubAlert(true)
      return
    }

    // Validate attendee details
    for (let i = 0; i < attendeeSlots.length; i++) {
      const s = attendeeSlots[i]
      if (!s.name.trim()) {
        toast.error(`Enter name for Ticket ${i + 1} (${s.venueName} – ${s.tierName})`)
        return
      }
      if (!s.phone.trim()) {
        toast.error(`Enter phone for Ticket ${i + 1} (${s.venueName} – ${s.tierName})`)
        return
      }
    }

    const bookingAttendees = attendeeSlots.map(s => ({ name: s.name.trim(), phone: s.phone.trim() }))

    setLoading(true)
    try {
      const fresh = await apiClient.getPublicEventById(event._id)
      const freshEvent = fresh.success ? fresh.data : null
      if (freshEvent?.venues?.length) {
        for (const item of cartItems) {
          const venue = freshEvent.venues.find((v) => v._id === item.venueId)
          const tier = venue?.tiers.find((t) => t._id === item.tierId)
          if (!venue || !tier) {
            toast.error("Ticket matrix changed. Please review your cart and try again.")
            setLoading(false)
            return
          }

          let available = Math.max(0, (tier.allocation ?? 0) - (tier.sold ?? 0))
          if (attributedClub && tier.clubAllocations?.length) {
            const clubAllocation = tier.clubAllocations.find((ca) => ca.clubName === attributedClub)
            available = clubAllocation ? Math.max(0, (clubAllocation.allocation ?? 0) - (clubAllocation.sold ?? 0)) : 0
          }

          if (item.quantity > available) {
            toast.error(
              attributedClub && tier.clubAllocations?.length
                ? `Only ${available} seats left for ${attributedClub} in ${venue.name} - ${tier.name}`
                : `Only ${available} seats left in ${venue.name} - ${tier.name}`
            )
            setLoading(false)
            return
          }
        }
      }

      const apiItems = cartItems.map(({ venueId, tierId, quantity }) => ({ venueId, tierId, quantity }))

      // Free checkout
      if (amountToCharge <= 0) {
        if (reservationToken) {
          await apiClient.confirmReservation(reservationToken).catch(() => {})
        }
        const res = await apiClient.bookVenueTierMatrix(event._id, {
          items: apiItems,
          attendees: bookingAttendees,
          reservationToken: reservationToken ?? undefined,
          couponCode: localCouponCode || undefined,
          couponDiscount: couponDiscount || undefined,
          pointsDiscount: reservedDiscount || undefined,
          amountPaid: 0,
          attributed_club: attributedClub || undefined,
        })
        if (res.success) {
          toast.success("Tickets booked!")
          onSuccess()
          onClose()
          router.push("/purchase/success")
        } else {
          toast.error(res.error ?? "Booking failed")
          onFailure()
        }
        setLoading(false)
        return
      }
      
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(amountToCharge),
          currency: event.currency ?? "INR",
          orderId: `EVT-MTX-${Date.now()}`,
          orderNumber: `EVT-MTX-${Date.now()}`,
        }),
      })
      if (!orderRes.ok) throw new Error("Failed to create payment order")
      const { razorpayOrderId, amount, currency: orderCurrency } = await orderRes.json()

      await apiClient.createPendingVenueTierBooking(event._id, {
        items: apiItems,
        attendees: bookingAttendees,
        razorpayOrderId,
        amountPaid: Math.round(amountToCharge),
        reservationToken: reservationToken ?? undefined,
        couponCode: localCouponCode || undefined,
        couponDiscount: couponDiscount || undefined,
        pointsDiscount: reservedDiscount || undefined,
        attributed_club: attributedClub || undefined,
      }).catch((err) => console.warn("[VenueTierCart] Pending booking failed:", err))

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency: orderCurrency,
        name: "RallyUp",
        description: `${cartItems.length} ticket type(s) for ${event.title}`,
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          const { razorpay_payment_id: paymentId, razorpay_order_id: orderId } = response
          try {
            await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId,
                razorpay_signature: response.razorpay_signature,
                orderId: `event_${event._id}_${Date.now()}`,
              }),
            }).catch(() => {})

            if (reservationToken) {
              await apiClient.confirmReservation(reservationToken, orderId).catch(() => {})
            }

            const res = await apiClient.bookVenueTierMatrix(event._id, {
              items: apiItems,
              attendees: bookingAttendees,
              razorpayOrderId: orderId,
              paymentId,
              amountPaid: Math.round(amountToCharge),
              reservationToken: reservationToken ?? undefined,
              couponCode: localCouponCode || undefined,
              couponDiscount: couponDiscount || undefined,
              pointsDiscount: reservedDiscount || undefined,
              attributed_club: attributedClub || undefined,
            })
            if (res.success) {
              toast.success("Payment successful! Tickets confirmed.")
              setRazorpayOpen(false)
              onSuccess()
              onClose()
              router.push("/purchase/success")
            } else {
              toast.error(`Payment received (ID: ${paymentId}) but booking failed — ${res.error ?? "contact support"}`)
            }
          } catch {
            toast.error(`Something went wrong after payment (ID: ${paymentId}). Contact support.`)
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          name: bookingAttendees[0]?.name ?? userDefaultName,
          email: (user as any)?.email ?? "",
          contact: bookingAttendees[0]?.phone ?? userDefaultPhone,
        },
        theme: { color: "#3b82f6" },
        modal: {
          ondismiss: () => {
            setRazorpayOpen(false)
            setLoading(false)
            toast.error("Payment cancelled")
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on("payment.failed", (r: any) => {
        toast.error(r.error?.description ?? "Payment failed")
        setRazorpayOpen(false)
        setLoading(false)
        onFailure()
        router.push("/purchase/failure")
      })
      setRazorpayOpen(true)
      rzp.open()
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to initiate payment")
      setLoading(false)
    }
  }

  const currency = event.currency ?? "INR"

  return (
    <>
    <AlertDialog open={showClubAlert} onOpenChange={setShowClubAlert}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Select Your Club Affiliation</AlertDialogTitle>
          <AlertDialogDescription>
            This is a joint screening event. Please select which club you are supporting before proceeding to payment.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => setShowClubAlert(false)}>OK, I'll select</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <Dialog
      open={isOpen}
      onOpenChange={() => { if (!razorpayOpen) onClose() }}
      modal={!razorpayOpen}
    >
      <DialogContent
        className="max-w-xl w-[95vw] sm:w-full max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6"
        onInteractOutside={(e) => { if (razorpayOpen) e.preventDefault() }}
        onEscapeKeyDown={(e) => { if (razorpayOpen) e.preventDefault() }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Select Tickets
          </DialogTitle>
          <DialogDescription>{event.title}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 px-1">
          {/* Club affiliation — shown first so remaining counts are correct */}
          {isJointEvent && (
            <Card className={!attributedClub ? "border-destructive/60" : undefined}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  Club Affiliation
                  <Badge variant="destructive" className="text-xs ml-1">Required</Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Select which club you are supporting — {jointScreening?.homeTeam} or {jointScreening?.awayTeam}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={attributedClub}
                  onValueChange={(v) => {
                    setAttributedClub(v)
                    // Reset cart so club-specific remaining counts apply cleanly
                    setCart({})
                  }}
                >
                  <SelectTrigger className={!attributedClub ? "border-destructive/60" : undefined}>
                    <SelectValue placeholder="Select your club…" />
                  </SelectTrigger>
                  <SelectContent>
                    {partnerClubOptions.map((club) => (
                      <SelectItem key={club} value={club}>{club}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!attributedClub && (
                  <p className="text-xs text-destructive mt-1.5">You must select a club before proceeding to payment.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Venue × Tier quantity selector */}
          {venues.map((venue) => {
            const available = venue.tiers.some((t) => t.allocation - t.sold > 0)
            return (
              <Card key={venue._id} className={!available ? "opacity-60" : undefined}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    {venue.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {venue.tiers.map((tier) => {
                    const remaining = getClubRemaining(tier)
                    const hasClubSplit = Boolean(tier.clubAllocations?.length)
                    const clubNotSelected = isJointEvent && hasClubSplit && !attributedClub
                    const qty = cart[venue._id]?.[tier._id] ?? 0
                    return (
                      <div key={tier._id} className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Tag className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm font-medium">{tier.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {fmt(tier.price, currency)}
                            </Badge>
                            {hasClubSplit && (
                              <Badge variant="outline" className="text-xs">club-split</Badge>
                            )}
                          </div>
                          <p className={`text-xs mt-0.5 ${remaining === 0 || clubNotSelected ? "text-muted-foreground" : remaining <= 5 ? "text-amber-600" : "text-muted-foreground"}`}>
                            {clubNotSelected
                              ? "Select your club above to see availability"
                              : remaining === 0
                              ? `Sold out${attributedClub && hasClubSplit ? ` for ${attributedClub}` : ""}`
                              : `${remaining} remaining${attributedClub && hasClubSplit ? ` for ${attributedClub}` : ""}`
                            }
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Button
                            type="button" variant="outline" size="sm" className="h-7 w-7 p-0"
                            onClick={() => setQty(venue._id, tier._id, -1)}
                            disabled={qty === 0}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">{qty}</span>
                          <Button
                            type="button" variant="outline" size="sm" className="h-7 w-7 p-0"
                            onClick={() => setQty(venue._id, tier._id, 1)}
                            disabled={clubNotSelected || remaining === 0 || qty >= remaining}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )
          })}

          {/* Attendee details — one row per ticket slot */}
          {attendeeSlots.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Attendee Details</CardTitle>
                <CardDescription className="text-xs">Enter name and phone for each ticket</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {attendeeSlots.map((slot, i) => (
                  <div key={`${slot.venueId}-${slot.tierId}-${i}`} className="space-y-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-xs">Ticket {i + 1}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{slot.venueName}
                      </span>
                      <span className="text-xs text-muted-foreground">—</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Tag className="w-3 h-3" />{slot.tierName}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Full name"
                          value={slot.name}
                          onChange={e => updateSlot(i, "name", e.target.value)}
                          className="pl-8 h-9 text-sm"
                        />
                      </div>
                      <div className="relative flex-1">
                        <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Phone number"
                          value={slot.phone}
                          onChange={e => updateSlot(i, "phone", e.target.value)}
                          className="pl-8 h-9 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Order summary */}
          {cartItems.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {cartItems.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{item.venueName} — {item.tierName} × {item.quantity}</span>
                    <span>{fmt(item.price * item.quantity, currency)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Subtotal</span>
                  <span>{fmt(subtotal, currency)}</span>
                </div>

                {couponApplied && couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      Coupon ({couponName || localCouponCode})
                    </span>
                    <span>-{fmt(couponDiscount, currency)}</span>
                  </div>
                )}

                {reservedDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Points discount</span>
                    <span>-{fmt(reservedDiscount, currency)}</span>
                  </div>
                )}

                {feeBreakdown && feeBreakdown.totalFees > 0 && (
                  <>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Platform fee ({PLATFORM_FEE_PERCENT}% + GST)</span>
                      <span>{fmt(feeBreakdown.platformFee + feeBreakdown.platformFeeGst, currency)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Payment gateway ({RAZORPAY_FEE_PERCENT}% + GST)</span>
                      <span>{fmt(feeBreakdown.razorpayFee + feeBreakdown.razorpayFeeGst, currency)}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Loyalty points */}
          {user && cartItems.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Redeem Points{availablePoints !== null ? ` (Available: ${availablePoints})` : ""}
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="number"
                  min={0}
                  value={redeemPoints}
                  onChange={(e) => setRedeemPoints(e.target.value === "" ? "" : Number(e.target.value))}
                  className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                  placeholder="Points"
                  disabled={!!reservationToken || reserving}
                />
                <div className="flex gap-2">
                  {reservationToken ? (
                    <Button disabled size="sm" variant="outline" className="flex-1 sm:flex-none border-green-500 text-green-600">Applied</Button>
                  ) : (
                    <Button onClick={reservePoints} disabled={reserving || !redeemPoints || Number(redeemPoints) <= 0} size="sm" className="flex-1 sm:flex-none">
                      {reserving ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Reserving...</> : "Reserve"}
                    </Button>
                  )}
                  {(redeemPoints !== "" || reservationToken) && (
                    <Button variant="ghost" onClick={clearReservation} disabled={reserving} size="sm">Clear</Button>
                  )}
                </div>
              </div>
              {reservationToken && (
                <p className="text-sm text-green-600">Reserved: {fmt(reservedDiscount, currency)}</p>
              )}
            </div>
          )}

          {cartItems.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Tag className="w-4 h-4" />
                Coupon Code
              </label>
              {!couponApplied ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={localCouponCode}
                    onChange={(e) => setLocalCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                    disabled={validatingCoupon}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); validateCoupon() } }}
                  />
                  <Button onClick={validateCoupon} disabled={!localCouponCode.trim() || validatingCoupon} size="sm" variant="outline">
                    {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 bg-green-500/10 border border-green-500 rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">{couponName}</p>
                    <p className="text-muted-foreground text-xs">Code: {localCouponCode}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setCouponApplied(false); setLocalCouponCode(""); setCouponDiscount(0); setCouponName("") }} className="text-destructive hover:text-destructive">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center pb-2">
            By completing payment, you agree to our{" "}
            <a href="/refund" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-500 underline">Refund and Cancellation Policy</a>.
          </p>
        </div>

        <div className="flex-shrink-0 pt-4 border-t bg-background shadow-[0_-15px_15px_-15px_rgba(0,0,0,0.1)] z-10">
          <div className="flex justify-between items-center font-bold text-lg px-1 mb-3">
            <span>Total:</span>
            <span className="text-primary">{fmt(amountToCharge, currency)}</span>
          </div>
          <Button
            onClick={handlePayment}
            disabled={loading || cartItems.length === 0}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-2" />Processing...</>
            ) : cartItems.length === 0 ? (
              "Select tickets to continue"
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                {amountToCharge <= 0 ? "Confirm Booking" : `Pay ${fmt(amountToCharge, currency)}`}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
