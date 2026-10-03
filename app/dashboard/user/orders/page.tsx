"use client"

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useSocket } from '@/contexts/socket-context'
import { apiClient } from '@/lib/api'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { formatLocalDate } from '@/lib/timezone'
import { RefundButton } from '@/components/refund-button'
import { PaymentSimulationModal } from '@/components/modals/payment-simulation-modal'
import { calculateTransactionFees, PLATFORM_FEE_PERCENT, RAZORPAY_FEE_PERCENT } from '@/lib/transactionFees'
import { OrderTrackingProgress, TrackableOrder, TrackingEvent } from '@/components/order-tracking-progress'
import { OrderAddressDisplay } from '@/components/order-address-display'
import { TicketOrderHistory, type MemberTicketOrder } from '@/components/member/ticket-order-history'
import {
  Search,
  RefreshCw,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Tag,
  X,
  Loader2,
  CreditCard,
  Wallet,
  Bell
} from 'lucide-react'
import { useRequiredClubId } from '@/hooks/useRequiredClubId'

interface OrderItem {
  productId: string
  productName: string
  productImage?: string
  quantity: number
  price: number
  currency: string
}

interface Order {
  _id: string
  orderNumber: string
  customer: {
    userId: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  shippingAddress: {
    firstName: string
    lastName: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  billingAddress?: {
    firstName: string
    lastName: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  items: OrderItem[]
  subtotal: number
  couponCode?: string
  couponDiscount?: number
  redeemedDiscount?: number
  pointsDiscount?: number
  redeemedPoints?: number
  reservationToken?: string
  shippingCost: number
  tax: number
  total: number
  finalAmount?: number
  platformFee?: number
  platformFeeGst?: number
  razorpayFee?: number
  razorpayFeeGst?: number
  currency: string
  club?: string
  status: 'pending' | 'cancelled' | 'completed'
  paymentMethod: 'card' | 'paypal' | 'bank_transfer'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  notes?: string
  trackingNumber?: string
  shippedAt?: string
  deliveredAt?: string
  cancelledAt?: string
  cancelledReason?: string
  createdAt: string
  updatedAt: string
  deliveryStatus?: 'in_transit' | 'out_for_delivery' | 'delivered' | 'rto_initiated' | 'rto_delivered' | 'damaged' | 'lost'
  estimatedDeliveryDate?: string
  actualDeliveryAt?: string
  isRTO?: boolean
  isDamaged?: boolean
  isLost?: boolean
  awbCode?: string
  courierName?: string
  courierId?: string
  shiprocketStatus?: 'pending' | 'pushed' | 'failed'
  trackingEvents?: TrackingEvent[]
  lastTrackingSync?: string
  customerConfirmedDeliveryAt?: string
  rating?: number
  ratingFeedback?: string
  ratedAt?: string
  deliveryMethod?: 'standard' | 'pickup'
  pickupEventId?: string
  pickupEventTitle?: string
  pickupEventDate?: string
}

interface AppliedCoupon {
  code: string
  name: string
  discountType: 'flat' | 'percentage'
  discountValue: number
  discount: number
  originalPrice: number
  finalPrice: number
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
}

const paymentStatusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800' }
}

export default function UserOrdersPage() {
  const { user } = useAuth()
  const clubId = useRequiredClubId()
  const { socket } = useSocket()
  const [orders, setOrders] = useState<Order[]>([])
  const [orderType, setOrderType] = useState<'tickets' | 'merchandise'>('tickets')
  const [ticketOrders, setTicketOrders] = useState<MemberTicketOrder[]>([])
  const [ticketSearchTerm, setTicketSearchTerm] = useState('')
  const [ticketLoading, setTicketLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)

  // ── Shipping notification opt-in ────────────────────────────────────────────
  const [shippingAlertsEnabled, setShippingAlertsEnabled] = useState<boolean | null>(null)
  const [savingShippingAlerts, setSavingShippingAlerts] = useState(false)
  // ────────────────────────────────────────────────────────────────────────────

  // ── Continue Payment state ──────────────────────────────────────────────────
  const [showContinuePayment, setShowContinuePayment] = useState(false)
  const [cpOrder, setCpOrder] = useState<Order | null>(null)
  const [cpCouponCode, setCpCouponCode] = useState('')
  const [cpAppliedCoupon, setCpAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [cpValidatingCoupon, setCpValidatingCoupon] = useState(false)
  const [cpRedeemPoints, setCpRedeemPoints] = useState(0)
  const [cpReservationToken, setCpReservationToken] = useState<string | null>(null)
  const [cpReservedDiscount, setCpReservedDiscount] = useState(0)
  const [cpReserving, setCpReserving] = useState(false)
  const [cpAvailablePoints, setCpAvailablePoints] = useState<number | null>(null)
  const [cpLoading, setCpLoading] = useState(false)
  const [showCpPayment, setShowCpPayment] = useState(false)
  const [cpUpdatedOrder, setCpUpdatedOrder] = useState<any>(null)
  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (user) {
      loadTicketOrders()
    }
  }, [user, clubId])

  useEffect(() => {
    if (!user) return
    apiClient.getUserProfile().then((res) => {
      if (res.success && res.data) {
        setShippingAlertsEnabled(res.data.notificationPreferences?.orders ?? true)
      }
    })
  }, [user])

  const handleToggleShippingAlerts = async (checked: boolean) => {
    setSavingShippingAlerts(true)
    try {
      const res = await apiClient.updateUserProfile({ notificationPreferences: { orders: checked } })
      if (res.success) {
        setShippingAlertsEnabled(checked)
        toast.success(checked ? 'Shipping alerts enabled' : 'Shipping alerts disabled', {
          description: checked
            ? "You'll be notified the moment your order ships or is out for delivery."
            : "You won't receive shipping update notifications.",
        })
      } else {
        toast.error(res.error || 'Failed to update preference')
      }
    } finally {
      setSavingShippingAlerts(false)
    }
  }

  useEffect(() => {
    if (user) {
      setCurrentPage(1)
      loadOrders()
    }
  }, [user, searchTerm, statusFilter, clubId])

  useEffect(() => {
    if (user && currentPage > 1) {
      loadOrders()
    }
  }, [currentPage, clubId])

  // Real-time tracking updates pushed by the backend as Shiprocket events arrive
  useEffect(() => {
    if (!socket) return

    const handleTrackingUpdate = (data: any) => {
      setOrders((prev) =>
        prev.map((order) =>
          order._id === data.orderId
            ? {
                ...order,
                deliveryStatus: data.deliveryStatus ?? order.deliveryStatus,
                estimatedDeliveryDate: data.estimatedDeliveryDate ?? order.estimatedDeliveryDate,
                actualDeliveryAt: data.actualDeliveryAt ?? order.actualDeliveryAt,
                awbCode: data.awbCode ?? order.awbCode,
                courierName: data.courierName ?? order.courierName,
                isRTO: data.isRTO ?? order.isRTO,
                isDamaged: data.isDamaged ?? order.isDamaged,
                isLost: data.isLost ?? order.isLost,
                trackingEvents:
                  data.lastEventActivity && data.lastEventTimestamp
                    ? [
                        ...(order.trackingEvents || []),
                        {
                          timestamp: data.lastEventTimestamp,
                          status: data.deliveryStatus ?? '',
                          activity: data.lastEventActivity,
                          location: data.lastKnownLocation ?? '',
                        },
                      ]
                    : order.trackingEvents,
              }
            : order
        )
      )
    }

    socket.on('order:tracking-update', handleTrackingUpdate)
    return () => {
      socket.off('order:tracking-update', handleTrackingUpdate)
    }
  }, [socket])

  const handleOrderTrackingUpdate = (updated: TrackableOrder) => {
    setOrders((prev) =>
      prev.map((order) =>
        order._id === updated._id
          ? {
              ...order,
              customerConfirmedDeliveryAt: updated.customerConfirmedDeliveryAt ?? order.customerConfirmedDeliveryAt,
              rating: updated.rating ?? order.rating,
              ratingFeedback: updated.ratingFeedback ?? order.ratingFeedback,
            }
          : order
      )
    )
  }

  const loadOrders = async () => {
    try {
      setLoading(true)
      if (!clubId) {
        setOrders([])
        setTotalPages(1)
        setLoading(false)
        return
      }
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter })
      })
      params.append('clubId', clubId)

      const response = await apiClient.get(`/orders/my-orders?${params}`)
      if (response.success && response.data) {
        setOrders(response.data.data?.orders || [])
        setTotalPages(response.data.data?.pagination?.totalPages || 1)
      } else {
        toast.error(response.message || "Failed to fetch orders")
        setOrders([])
        setTotalPages(1)
      }
    } catch (error) {
      toast.error("Failed to fetch orders")
      setOrders([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const loadTicketOrders = async () => {
    try {
      setTicketLoading(true)
      if (!clubId) {
        setTicketOrders([])
        return
      }

      const response = await apiClient.getUserEventRegistrations(clubId)
      if (response.success && Array.isArray(response.data)) {
        setTicketOrders(response.data as MemberTicketOrder[])
      } else {
        setTicketOrders([])
        toast.error(response.error || 'Failed to fetch ticket orders')
      }
    } catch {
      setTicketOrders([])
      toast.error('Failed to fetch ticket orders')
    } finally {
      setTicketLoading(false)
    }
  }

  const filteredTicketOrders = useMemo(() => {
    const query = ticketSearchTerm.trim().toLowerCase()
    if (!query) return ticketOrders

    return ticketOrders.filter((row) =>
      [
        row.eventTitle,
        row.eventVenue,
        row.eventCategory,
        row.registration?.registrationId,
        row.registration?._id,
      ].some((value) => String(value || '').toLowerCase().includes(query))
    )
  }, [ticketOrders, ticketSearchTerm])

  const refreshOrders = async () => {
    setRefreshing(true)
    if (orderType === 'tickets') {
      await loadTicketOrders()
    } else {
      await loadOrders()
    }
    setRefreshing(false)
  }

  const handleDownloadReport = async () => {
    if (orderType === 'tickets') {
      const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
      const rows = filteredTicketOrders.map((row) => {
        const registration = row.registration || {}
        const attendees = Array.isArray(registration.attendees) ? registration.attendees : []
        const activeTickets = attendees.length
          ? attendees.filter((attendee) => attendee.status !== 'cancelled' && attendee.status !== 'refunded').length
          : 1
        return [
          row.eventTitle,
          row.eventVenue,
          row.eventStartTime || '',
          registration.registrationDate || '',
          registration.status || 'confirmed',
          activeTickets,
          registration.amountPaid ?? '',
          registration.currency || 'INR',
        ]
      })
      const csv = [
        ['Event', 'Venue', 'Event Date', 'Registration Date', 'Status', 'Tickets', 'Amount Paid', 'Currency'],
        ...rows,
      ].map((row) => row.map(escapeCsv).join(',')).join('\n')
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `ticket-orders-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success('Report downloaded', { description: 'Your ticket orders report downloaded successfully.' })
      return
    }

    const params = {
      ...(searchTerm ? { search: searchTerm } : {}),
      ...(statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {}),
      ...(clubId ? { clubId } : {}),
    };

    try {
      const res = await apiClient.downloadMyOrdersReport(params);
      if (!res.success) {
        toast.error(res.error || 'Failed to download report');
      } else {
        toast.success('Report downloaded', { description: 'Your orders report downloaded successfully.' });
      }
    } catch (error) {
      toast.error('Failed to download report');
    }
  }

  const formatDate = (dateString: string) => {
    return formatLocalDate(dateString, 'long')
  }

  const formatCurrency = (amount: number, _currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'card':
        return 'Credit Card'
      case 'paypal':
        return 'PayPal'
      case 'bank_transfer':
        return 'Bank Transfer'
      default:
        return 'Razorpay'
    }
  }

  // ── Continue Payment helpers ────────────────────────────────────────────────
  const openContinuePayment = async (order: Order) => {
    setCpOrder(order)
    // Always start fresh – user must re-enter coupon and points each time
    setCpCouponCode('')
    setCpAppliedCoupon(null)
    // Points: don't pre-fill — reservation may have expired; let user re-reserve
    setCpRedeemPoints(0)
    setCpReservationToken(null)
    setCpReservedDiscount(0)
    setCpAvailablePoints(null)
    setCpUpdatedOrder(null)
    setShowContinuePayment(true)

    // Fetch available points
    try {
      const userAny = user as any
      const orderClubId = order.club
      if (userAny?._id && orderClubId) {
        const resp = await apiClient.getMemberPoints(userAny._id, orderClubId)
        if (resp.success && resp.data) {
          setCpAvailablePoints(resp.data.points ?? 0)
        }
      }
    } catch {
      // non-blocking
    }
  }

  const closeContinuePayment = () => {
    // Cancel any pending reservation made in this flow
    if (cpReservationToken) {
      apiClient.cancelReservation(cpReservationToken).catch(() => {})
    }
    setShowContinuePayment(false)
    setCpOrder(null)
    setCpCouponCode('')
    setCpAppliedCoupon(null)
    setCpRedeemPoints(0)
    setCpReservationToken(null)
    setCpReservedDiscount(0)
    setCpAvailablePoints(null)
    setCpUpdatedOrder(null)
    setShowCpPayment(false)
  }

  const cpHandleValidateCoupon = async () => {
    if (!cpOrder || !cpCouponCode.trim()) {
      toast.error('Please enter a coupon code')
      return
    }
    const orderClubId = cpOrder.club
    if (!orderClubId) {
      toast.error('Unable to validate coupon for this order')
      return
    }
    setCpValidatingCoupon(true)
    try {
      const response = await apiClient.validateCoupon(
        cpCouponCode.trim().toUpperCase(),
        undefined,
        cpOrder.subtotal,
        orderClubId
      )
      if (response.success && response.data?.coupon) {
        setCpAppliedCoupon(response.data.coupon)
        toast.success('Coupon applied!')
      } else {
        setCpAppliedCoupon(null)
        toast.error(response.error || 'Invalid coupon code')
      }
    } catch {
      setCpAppliedCoupon(null)
      toast.error('Failed to validate coupon')
    } finally {
      setCpValidatingCoupon(false)
    }
  }

  const cpHandleRemoveCoupon = () => {
    setCpAppliedCoupon(null)
    setCpCouponCode('')
  }

  const cpHandleReservePoints = async () => {
    if (!cpOrder || !user) return
    if (!cpRedeemPoints || cpRedeemPoints <= 0) {
      toast.error('Enter points to redeem')
      return
    }
    if ((cpOrder.subtotal - cpCouponDiscount) <= 0) {
      toast.error('Subtotal is already zero — no need to redeem points')
      return
    }
    if (cpAvailablePoints !== null && cpRedeemPoints > cpAvailablePoints) {
      toast.error('You do not have enough points')
      return
    }
    const orderClubId = cpOrder.club
    if (!orderClubId) {
      toast.error('Club information missing')
      return
    }
    setCpReserving(true)
    try {
      const cpCouponDiscount = cpAppliedCoupon?.discount ?? 0
      const orderTotalForReservation = Math.max(
        cpOrder.subtotal - cpCouponDiscount + cpOrder.shippingCost + cpOrder.tax + (cpFeeBreakdown?.totalFees ?? 0),
        0
      )
      const resp = await apiClient.createReservation(cpRedeemPoints, orderClubId, orderTotalForReservation)
      if (resp && resp.success) {
        setCpReservationToken(resp.data?.reservationToken || null)
        setCpReservedDiscount(resp.data?.discountAmount || 0)
        toast.success('Points reserved!')
      } else {
        toast.error(resp?.message || 'Failed to reserve points')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reserve points')
    } finally {
      setCpReserving(false)
    }
  }

  const cpHandleClearPoints = async () => {
    if (cpReservationToken) {
      try {
        await apiClient.cancelReservation(cpReservationToken)
      } catch { }
    }
    setCpRedeemPoints(0)
    setCpReservationToken(null)
    setCpReservedDiscount(0)
  }

  // Recover the club rate from the server-stored fee for pending-order recalculation.
  const cpCouponDiscount = cpAppliedCoupon?.discount ?? 0
  const cpNetSubtotal = cpOrder ? Math.max(cpOrder.subtotal - cpCouponDiscount - cpReservedDiscount, 0) : 0
  const cpOriginalFeeBase = cpOrder
    ? Math.max(cpOrder.subtotal - (cpOrder.couponDiscount ?? 0) - (cpOrder.redeemedDiscount ?? cpOrder.pointsDiscount ?? 0), 0)
    : 0
  const cpPlatformFeePercent = cpOrder?.platformFee != null && cpOriginalFeeBase > 0
    ? (cpOrder.platformFee / cpOriginalFeeBase) * 100
    : undefined
  const cpFeeBreakdown = cpNetSubtotal > 0
    ? calculateTransactionFees(cpNetSubtotal, cpPlatformFeePercent)
    : null
  const cpFinalAmount = cpOrder
    ? cpNetSubtotal + cpOrder.shippingCost + cpOrder.tax + (cpFeeBreakdown?.totalFees ?? 0)
    : 0

  const cpHandlePayNow = async () => {
    if (!cpOrder) return
    setCpLoading(true)
    try {
      const updatePayload: any = {
        finalAmount: cpFinalAmount,
      }

      if (cpAppliedCoupon) {
        updatePayload.couponCode = cpAppliedCoupon.code
      } else {
        updatePayload.clearCoupon = true
      }

      if (cpReservationToken) {
        updatePayload.reservationToken = cpReservationToken
        updatePayload.redeemedPoints = cpRedeemPoints
        updatePayload.redeemedDiscount = cpReservedDiscount
      } else {
        // Clear any old reservation from order
        updatePayload.reservationToken = null
        updatePayload.redeemedPoints = 0
        updatePayload.redeemedDiscount = 0
      }

      if (cpFeeBreakdown) {
        updatePayload.platformFee = cpFeeBreakdown.platformFee
        updatePayload.platformFeeGst = cpFeeBreakdown.platformFeeGst
        updatePayload.razorpayFee = cpFeeBreakdown.razorpayFee
        updatePayload.razorpayFeeGst = cpFeeBreakdown.razorpayFeeGst
      } else {
        updatePayload.platformFee = 0
        updatePayload.platformFeeGst = 0
        updatePayload.razorpayFee = 0
        updatePayload.razorpayFeeGst = 0
      }

      const resp = await apiClient.updatePendingOrderPayment(cpOrder._id, updatePayload)
      if (!resp.success) {
        toast.error(resp.message || 'Failed to update order')
        return
      }
      setCpUpdatedOrder(resp.data?.data ?? cpOrder)
      setShowCpPayment(true)
    } catch {
      toast.error('Failed to update order')
    } finally {
      setCpLoading(false)
    }
  }

  const cpHandlePaymentSuccess = async (orderId: string, paymentId: string, razorpayOrderId: string, razorpaySignature: string) => {
    try {
      if (cpReservationToken) {
        try {
          await apiClient.confirmReservation(cpReservationToken, orderId)
        } catch { }
        setCpReservationToken(null)
      }
      await apiClient.patch(`/orders/admin/${orderId}/payment-status`, {
        paymentStatus: 'paid', paymentId, razorpayOrderId, razorpaySignature
      })
      toast.success('Payment successful! Order confirmed.')
      setShowCpPayment(false)
      closeContinuePayment()
      loadOrders()
    } catch {
      toast.error('Payment successful but failed to update order status.')
    }
  }

  const cpHandlePaymentFailure = async (orderId: string, paymentId: string, razorpayOrderId: string, razorpaySignature: string, _error?: any) => {
    try {
      if (cpReservationToken) {
        try {
          await apiClient.cancelReservation(cpReservationToken)
        } catch { }
        setCpReservationToken(null)
        setCpReservedDiscount(0)
        setCpRedeemPoints(0)
      }
      await apiClient.patch(`/orders/admin/${orderId}/payment-status`, {
        paymentStatus: 'failed', paymentId, razorpayOrderId, razorpaySignature
      })
      toast.error('Payment failed. Please try again.')
      setShowCpPayment(false)
    } catch {
      toast.error('Failed to update payment status.')
    }
  }
  // ────────────────────────────────────────────────────────────────────────────

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">Please log in</h2>
            <p className="text-muted-foreground">You need to be logged in to view your orders.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">My Orders</h1>
            <p className="text-muted-foreground">Track your purchase history and order status</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={handleDownloadReport} className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
            <Button onClick={refreshOrders} disabled={refreshing} className="flex-1 sm:flex-none">
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Card className="rounded-xl shadow-none">
          <CardContent className="p-6">
            {orderType === 'tickets' ? (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search Ticket by Event or Venue Name"
                  value={ticketSearchTerm}
                  onChange={(event) => setTicketSearchTerm(event.target.value)}
                  className="h-12 pl-11"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-12 w-full sm:w-60">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search orders by number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-12 pl-11"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center gap-2" role="tablist" aria-label="Order type">
          <Button
            type="button"
            role="tab"
            aria-selected={orderType === 'tickets'}
            variant={orderType === 'tickets' ? 'default' : 'outline'}
            className="h-10 rounded-full px-6"
            onClick={() => setOrderType('tickets')}
          >
            Tickets
          </Button>
          <Button
            type="button"
            role="tab"
            aria-selected={orderType === 'merchandise'}
            variant={orderType === 'merchandise' ? 'default' : 'outline'}
            className="h-10 rounded-full px-6"
            onClick={() => setOrderType('merchandise')}
          >
            Merchandise
          </Button>
        </div>

        <Card className="min-h-[420px] rounded-xl shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl">Order History</CardTitle>
            <CardDescription>
              View and track your past {orderType === 'tickets' ? 'tickets' : 'orders'}. For refund-related inquiries, see our{" "}
              <a href="/refund" target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-2">
                Refund and Cancellation Policy
              </a>
              .
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orderType === 'tickets' ? (
              <TicketOrderHistory
                rows={filteredTicketOrders}
                loading={ticketLoading}
                hasSearch={Boolean(ticketSearchTerm.trim())}
              />
            ) : (
              <>
                {shippingAlertsEnabled !== null && (
                  <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border bg-muted/50 px-5 py-4">
                    <div className="flex items-start gap-3">
                      <Bell className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="font-semibold text-foreground">Order History</p>
                        <p className="text-sm text-muted-foreground">
                          Get notified the moment your order ships, is out for delivery, or is delivered.
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={shippingAlertsEnabled}
                      disabled={savingShippingAlerts}
                      onCheckedChange={handleToggleShippingAlerts}
                      aria-label="Shipping update alerts"
                    />
                  </div>
                )}

                {loading ? (
                  <div className="flex min-h-64 items-center justify-center">
                    <RefreshCw className="h-7 w-7 animate-spin" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="flex min-h-64 flex-col items-center justify-center px-4 py-10 text-center">
                    <Package className="mb-5 h-12 w-12 text-muted-foreground" strokeWidth={1.8} />
                    <h3 className="text-xl font-semibold text-foreground">No orders found</h3>
                    <p className="mt-1 text-muted-foreground">
                      {searchTerm || statusFilter !== 'all'
                        ? "No orders match your current filters."
                        : "You haven't placed any orders yet."}
                    </p>
                    {!searchTerm && statusFilter === 'all' && (
                      <Button className="mt-5" onClick={() => window.location.href = '/merchandise'}>
                        Browse Merchandise
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const sc = statusConfig[order.status] ?? statusConfig.pending
                      const StatusIcon = sc.icon
                      const canContinuePayment = order.status === 'pending' && order.paymentStatus === 'pending'
                      return (
                        <div key={order._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div>
                                <h3 className="font-semibold text-lg text-foreground">{order.orderNumber}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(order.createdAt)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={sc.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {sc.label}
                              </Badge>
                              <Badge className={(paymentStatusConfig[order.paymentStatus] ?? paymentStatusConfig.pending).color}>
                                {(paymentStatusConfig[order.paymentStatus] ?? paymentStatusConfig.pending).label}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Items</p>
                              <p className="font-medium text-foreground">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total</p>
                              <p className="font-medium text-foreground">
                                {formatCurrency(order.finalAmount ?? order.total, order.currency)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Payment Method</p>
                              <p className="font-medium text-foreground">{getPaymentMethodName(order.paymentMethod)}</p>
                            </div>
                          </div>

                          {order.trackingNumber && (
                            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Tracking Number</p>
                              <p className="font-mono text-blue-800 dark:text-blue-200">{order.trackingNumber}</p>
                            </div>
                          )}

                          {order.paymentStatus === 'paid' && order.status !== 'cancelled' && (
                            <div className="mb-3">
                              <OrderTrackingProgress order={order} onOrderUpdate={handleOrderTrackingUpdate} />
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order)
                                  setShowOrderModal(true)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                              {canContinuePayment && (
                                <Button size="sm" onClick={() => openContinuePayment(order)}>
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  Continue Payment
                                </Button>
                              )}
                            </div>
                            <div className="hidden text-sm text-muted-foreground sm:block">
                              Order #{order.orderNumber}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Order Details Modal */}
        <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details - {selectedOrder?.orderNumber}</DialogTitle>
              <DialogDescription>
                Complete order information and tracking details
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3 text-foreground">Order Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order Number:</span>
                        <span className="font-medium text-foreground">{selectedOrder.orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge className={(statusConfig[selectedOrder.status] ?? statusConfig.pending).color}>
                          {(statusConfig[selectedOrder.status] ?? statusConfig.pending).label}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Method:</span>
                        <span className="capitalize text-foreground">{getPaymentMethodName(selectedOrder.paymentMethod)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Status:</span>
                        <Badge className={(paymentStatusConfig[selectedOrder.paymentStatus] ?? paymentStatusConfig.pending).color}>
                          {(paymentStatusConfig[selectedOrder.paymentStatus] ?? paymentStatusConfig.pending).label}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order Date:</span>
                        <span className="text-foreground">{formatDate(selectedOrder.createdAt)}</span>
                      </div>
                      {selectedOrder.trackingNumber && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tracking Number:</span>
                          <span className="font-mono text-foreground">{selectedOrder.trackingNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 text-foreground">
                      {selectedOrder.deliveryMethod === 'pickup' ? 'Pickup' : 'Shipping Address'}
                    </h3>
                    <div className="bg-muted p-4 rounded-lg">
                      {selectedOrder.deliveryMethod === 'pickup' ? (
                        <div className="text-sm space-y-1">
                          <div className="font-medium text-foreground">
                            {selectedOrder.pickupEventTitle || 'Event venue pickup'}
                          </div>
                          {selectedOrder.pickupEventDate && (
                            <div className="text-muted-foreground">{formatDate(selectedOrder.pickupEventDate)}</div>
                          )}
                          <p className="text-muted-foreground">
                            Collect this order at the event. Shipping is not required.
                          </p>
                        </div>
                      ) : (
                        <OrderAddressDisplay address={selectedOrder.shippingAddress} />
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 text-foreground">Billing Address</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      {selectedOrder.billingAddress?.address &&
                      selectedOrder.billingAddress.address !== selectedOrder.shippingAddress?.address ? (
                        <OrderAddressDisplay address={selectedOrder.billingAddress} />
                      ) : (
                        <p className="text-sm text-muted-foreground">Same as shipping address</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-3 text-foreground">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg bg-card">
                        {item.productImage && (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{item.productName}</div>
                          <div className="text-sm text-muted-foreground">
                            Quantity: {item.quantity}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-foreground">
                            {formatCurrency(item.price * item.quantity, item.currency)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(item.price, item.currency)} each
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t pt-4">
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const pts = selectedOrder.redeemedDiscount ?? selectedOrder.pointsDiscount ?? 0
                      const cpn = selectedOrder.couponDiscount ?? 0
                      const hasDiscount = cpn > 0 || pts > 0
                      return (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-foreground">Subtotal:</span>
                            <span className="flex items-center gap-2">
                              {hasDiscount ? (
                                <>
                                  <span className="line-through text-muted-foreground">{formatCurrency(selectedOrder.subtotal, selectedOrder.currency)}</span>
                                  <span className="text-foreground">{formatCurrency(Math.max(selectedOrder.subtotal - cpn - pts, 0), selectedOrder.currency)}</span>
                                </>
                              ) : (
                                <span className="text-foreground">{formatCurrency(selectedOrder.subtotal, selectedOrder.currency)}</span>
                              )}
                            </span>
                          </div>
                          {cpn > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Coupon {selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : 'discount'}:</span>
                              <span>-{formatCurrency(cpn, selectedOrder.currency)}</span>
                            </div>
                          )}
                          {pts > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>- Points discount:</span>
                              <span>-{formatCurrency(pts, selectedOrder.currency)}</span>
                            </div>
                          )}
                        </>
                      )
                    })()}
                    <div className="flex justify-between">
                      <span className="text-foreground">Shipping:</span>
                      <span className={selectedOrder.deliveryMethod === 'pickup' ? 'text-green-600' : 'text-foreground'}>
                        {selectedOrder.deliveryMethod === 'pickup'
                          ? 'FREE (Pickup)'
                          : formatCurrency(selectedOrder.shippingCost, selectedOrder.currency)}
                      </span>
                    </div>
                    {(() => {
                      const hasFees = ((selectedOrder.platformFee ?? 0) + (selectedOrder.platformFeeGst ?? 0) + (selectedOrder.razorpayFee ?? 0) + (selectedOrder.razorpayFeeGst ?? 0)) > 0;
                      if (hasFees) {
                        return (
                          <>
                            {((selectedOrder.platformFee ?? 0) + (selectedOrder.platformFeeGst ?? 0)) > 0 && (
                              <div className="flex justify-between text-muted-foreground">
                                <span>Platform fee (+ GST):</span>
                                <span>{formatCurrency((selectedOrder.platformFee ?? 0) + (selectedOrder.platformFeeGst ?? 0), selectedOrder.currency)}</span>
                              </div>
                            )}
                            {((selectedOrder.razorpayFee ?? 0) + (selectedOrder.razorpayFeeGst ?? 0)) > 0 && (
                              <div className="flex justify-between text-muted-foreground">
                                <span>Payment gateway fee (+ GST):</span>
                                <span>{formatCurrency((selectedOrder.razorpayFee ?? 0) + (selectedOrder.razorpayFeeGst ?? 0), selectedOrder.currency)}</span>
                              </div>
                            )}
                          </>
                        );
                      }
                      return (
                        <div className="flex justify-between">
                          <span className="text-foreground">Tax:</span>
                          <span className="text-foreground">{formatCurrency(selectedOrder.tax, selectedOrder.currency)}</span>
                        </div>
                      );
                    })()}
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span className="text-foreground">Total:</span>
                      <span className="text-foreground">
                        {formatCurrency(
                          selectedOrder.paymentStatus === 'pending'
                            ? (() => {
                                return selectedOrder.finalAmount ?? selectedOrder.total
                              })()
                            : (selectedOrder.finalAmount ?? selectedOrder.total),
                          selectedOrder.currency
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <h3 className="font-semibold mb-3 text-foreground">Notes</h3>
                    <div className="bg-muted p-4 rounded-lg text-sm text-foreground">
                      {selectedOrder.notes}
                    </div>
                  </div>
                )}

                {selectedOrder.paymentStatus === 'paid' &&
                 !['delivered', 'cancelled', 'refunded'].includes(selectedOrder.status) && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">Request Refund</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cancel your order and request a refund
                        </p>
                      </div>
                      <RefundButton
                        sourceType="store_order"
                        orderId={selectedOrder._id}
                        onRefundRequested={() => {
                          setShowOrderModal(false)
                          loadOrders()
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowOrderModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Continue Payment Modal ────────────────────────────────────────── */}
        <Dialog open={showContinuePayment} onOpenChange={(open) => { if (!open) closeContinuePayment() }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Continue Payment — {cpOrder?.orderNumber}
              </DialogTitle>
              <DialogDescription>
                Update your coupon or points and complete payment for this pending order.
              </DialogDescription>
            </DialogHeader>

            {cpOrder && (
              <div className="space-y-5">
                {/* Order Items (read-only) */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Package className="w-4 h-4" />
                      Order Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {cpOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        {item.productImage && (
                          <img src={item.productImage} alt={item.productName} className="w-10 h-10 object-cover rounded" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(item.price * item.quantity, item.currency)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Coupon */}
                <Card className="border-2 border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Tag className="w-4 h-4" />
                      Coupon Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!cpAppliedCoupon ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter Coupon Code"
                          value={cpCouponCode}
                          onChange={(e) => setCpCouponCode(e.target.value.toUpperCase())}
                          disabled={cpValidatingCoupon}
                          className="font-mono flex-1"
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); cpHandleValidateCoupon() } }}
                        />
                        <Button
                          type="button"
                          onClick={cpHandleValidateCoupon}
                          disabled={!cpCouponCode.trim() || cpValidatingCoupon}
                          variant="outline"
                        >
                          {cpValidatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div>
                            <div className="font-medium text-green-900">{cpAppliedCoupon.name}</div>
                            <div className="text-sm text-green-700">
                              Code: <code className="font-mono font-semibold">{cpAppliedCoupon.code}</code>
                            </div>
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={cpHandleRemoveCoupon} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Points Redemption */}
                <Card>
                  <CardContent className="pt-4">
                    <Label>
                      Redeem Points
                      {cpAvailablePoints !== null && (
                        <span className="text-muted-foreground font-normal ml-1">(Available: {cpAvailablePoints} pts)</span>
                      )}
                    </Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="number"
                        min={0}
                        value={cpRedeemPoints}
                        onChange={(e) => setCpRedeemPoints(Number(e.target.value || 0))}
                        className="w-32 h-9"
                        placeholder="Enter Points"
                        disabled={!!cpReservationToken}
                      />
                      {!cpReservationToken ? (
                        <Button type="button" size="sm" onClick={cpHandleReservePoints} disabled={cpReserving || !cpRedeemPoints}>
                          {cpReserving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reserve'}
                        </Button>
                      ) : (
                        <Button type="button" size="sm" variant="ghost" onClick={cpHandleClearPoints}>
                          Clear
                        </Button>
                      )}
                    </div>
                    {cpReservedDiscount > 0 && (
                      <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                        <Wallet className="w-4 h-4" />
                        Points discount: {formatCurrency(cpReservedDiscount, cpOrder.currency)}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Order Total */}
                <Card>
                  <CardContent className="pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground">Subtotal:</span>
                      <span className="flex items-center gap-2">
                        {cpCouponDiscount > 0 ? (
                          <>
                            <span className="line-through text-muted-foreground">{formatCurrency(cpOrder.subtotal, cpOrder.currency)}</span>
                            <span>{formatCurrency(Math.max(cpOrder.subtotal - cpCouponDiscount, 0), cpOrder.currency)}</span>
                          </>
                        ) : (
                          <span>{formatCurrency(cpOrder.subtotal, cpOrder.currency)}</span>
                        )}
                      </span>
                    </div>
                    {cpCouponDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Coupon ({cpAppliedCoupon?.code}):</span>
                        <span>-{formatCurrency(cpCouponDiscount, cpOrder.currency)}</span>
                      </div>
                    )}
                    {cpReservedDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Points discount:</span>
                        <span>-{formatCurrency(cpReservedDiscount, cpOrder.currency)}</span>
                      </div>
                    )}
                    {cpOrder.shippingCost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-foreground">Shipping:</span>
                        <span>{formatCurrency(cpOrder.shippingCost, cpOrder.currency)}</span>
                      </div>
                    )}
                    {cpOrder.tax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-foreground">Tax:</span>
                        <span>{formatCurrency(cpOrder.tax, cpOrder.currency)}</span>
                      </div>
                    )}
                    {cpFeeBreakdown && cpFeeBreakdown.totalFees > 0 && (
                      <>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Platform fee ({cpPlatformFeePercent ?? PLATFORM_FEE_PERCENT}% + GST):</span>
                          <span>{formatCurrency(cpFeeBreakdown.platformFee + cpFeeBreakdown.platformFeeGst, cpOrder.currency)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Payment gateway fee ({RAZORPAY_FEE_PERCENT}% + GST):</span>
                          <span>{formatCurrency(cpFeeBreakdown.razorpayFee + cpFeeBreakdown.razorpayFeeGst, cpOrder.currency)}</span>
                        </div>
                      </>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>{formatCurrency(cpFinalAmount, cpOrder.currency)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={closeContinuePayment}>
                Cancel
              </Button>
              <Button onClick={cpHandlePayNow} disabled={cpLoading || !cpOrder}>
                {cpLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay Now
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment modal for continue payment flow */}
        {cpUpdatedOrder && (
          <PaymentSimulationModal
            isOpen={showCpPayment}
            onClose={() => {
              setShowCpPayment(false)
              setCpUpdatedOrder(null)
            }}
            onPaymentSuccess={cpHandlePaymentSuccess}
            onPaymentFailure={cpHandlePaymentFailure}
            orderId={cpUpdatedOrder._id ?? cpOrder?._id ?? ''}
            orderNumber={cpUpdatedOrder.orderNumber ?? cpOrder?.orderNumber ?? ''}
            total={cpFinalAmount}
            subtotal={cpOrder?.subtotal}
            shippingCost={cpOrder?.shippingCost}
            tax={cpOrder?.tax}
            currency={cpOrder?.currency ?? 'INR'}
            paymentMethod={cpOrder?.paymentMethod ?? 'all'}
            platformFeeTotal={cpFeeBreakdown ? cpFeeBreakdown.platformFee + cpFeeBreakdown.platformFeeGst : undefined}
            platformFeePercent={cpPlatformFeePercent}
            razorpayFeeTotal={cpFeeBreakdown ? cpFeeBreakdown.razorpayFee + cpFeeBreakdown.razorpayFeeGst : undefined}
            couponDiscount={cpCouponDiscount > 0 ? cpCouponDiscount : undefined}
            couponCode={cpAppliedCoupon?.code}
            pointsDiscount={cpReservedDiscount > 0 ? cpReservedDiscount : undefined}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
