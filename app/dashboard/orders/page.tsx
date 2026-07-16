"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { apiClient } from '@/lib/api'
import { calculateTransactionFees } from '@/lib/transactionFees'
import { formatLocalDate } from '@/lib/timezone'
import { DashboardLayout } from '@/components/dashboard-layout'
import { ResendQrButton } from '@/components/resend-qr-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import Link from 'next/link'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useRequiredClubId } from '@/hooks/useRequiredClubId'
import { 
  Search,
  RefreshCw, 
  Eye, 
  Package, 
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  MoreHorizontal,
  Edit,
  Download,
  MessageCircle,
  Truck,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useClubFeatures } from '@/hooks/useClubFeatures'
import { isFeatureEnabled } from '@/lib/clubFeatures'
import { LockedFeaturePage, FeatureUnavailableOverlay, LockedInline } from '@/components/feature-gate'
import { ReadyToShipModal } from '@/components/admin/ready-to-ship-modal'
import { LogisticsTimeline } from '@/components/admin/logistics-timeline'
import { OrderAddressDisplay } from '@/components/order-address-display'
import { AttendeeTicketSelectModal, CancellableAttendee } from '@/components/modals/attendee-ticket-select-modal'
import {
  getActiveAttendees,
  getCancellableAttendees,
  getRegistrationDisplayStatus,
  extractCancellableAttendeesFromApiResponse,
} from '@/lib/event-registration'

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
  shippingCost: number
  tax: number
  total: number
  platformFee?: number
  platformFeeGst?: number
  razorpayFee?: number
  razorpayFeeGst?: number
  finalAmount?: number
  currency: string
  status: 'pending' | 'cancelled' | 'completed' | 'refunded' | 'ready_to_ship' | 'fulfillment_in_progress' | 'shipped'
  paymentMethod: 'card' | 'paypal' | 'bank_transfer' | 'all' | 'cod'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  notes?: string
  trackingNumber?: string
  shippedAt?: string
  deliveredAt?: string
  cancelledAt?: string
  cancelledReason?: string
  createdAt: string
  updatedAt: string
  shiprocketStatus?: 'pending' | 'pushed' | 'failed'
  shiprocketCustomOrderId?: string
  shiprocketOrderId?: number
  shiprocketShipmentId?: number
  shiprocketPushedAt?: string
  shiprocketError?: string
  awbCode?: string
  courierName?: string
  courierId?: number
  manifestId?: string
  labelUrl?: string
  pickupScheduledAt?: string
  pickupToken?: string
  fulfillmentError?: string
  deliveryStatus?: 'in_transit' | 'out_for_delivery' | 'delivered' | 'rto_initiated' | 'rto_delivered' | 'damaged' | 'lost'
  estimatedDeliveryDate?: string
  actualDeliveryAt?: string
  isRTO?: boolean
  isDamaged?: boolean
  isLost?: boolean
  trackingEvents?: Array<{
    timestamp: string
    status: string
    activity: string
    location: string
    srStatusCode?: string
  }>
  lastTrackingSync?: string
}

interface OrderStats {
  totalOrders: number
  totalRevenue: number
  completedPaidRevenue?: number
  pendingOrders: number
  completedOrders: number
  cancelledOrders: number
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  ready_to_ship: { label: 'Ready to Ship', color: 'bg-blue-100 text-blue-800', icon: Truck },
  fulfillment_in_progress: { label: 'Fulfillment in Progress', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  shipped: { label: 'Shipped', color: 'bg-green-100 text-green-800', icon: Truck },
}

function getOrderStatusDisplay(status: string) {
  return (
    statusConfig[status] ?? {
      label: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      color: 'bg-gray-100 text-gray-800',
      icon: Clock,
    }
  )
}

const deliveryStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  in_transit: { label: 'In Transit', color: 'bg-blue-100 text-blue-800', icon: Truck },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-orange-100 text-orange-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rto_initiated: { label: 'RTO Initiated', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  rto_delivered: { label: 'RTO Delivered', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  damaged: { label: 'Damaged', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
}

const eventStatusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  partially_cancelled: { label: 'Partially Cancelled', color: 'bg-orange-100 text-orange-800', icon: Clock },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
}

const paymentStatusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800' }
}

function getPaymentStatusDisplay(status: string) {
  return (
    paymentStatusConfig[status as keyof typeof paymentStatusConfig] ?? {
      label: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      color: 'bg-gray-100 text-gray-800',
    }
  )
}

export default function OrdersPage() {
  const { user } = useAuth()
  const clubId = useRequiredClubId()
  const { config: clubFeatureConfig } = useClubFeatures(clubId ?? null)
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [eventStats, setEventStats] = useState<OrderStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsLoaded, setEventsLoaded] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState<'products' | 'events'>('events')
  const [earlyBirdFilter, setEarlyBirdFilter] = useState<'all' | 'used' | 'not_used'>('all')
  const [couponFilter, setCouponFilter] = useState<'all' | 'used' | 'not_used'>('all')
  const [paymentDateFilter, setPaymentDateFilter] = useState('')
  const [amountFilter, setAmountFilter] = useState<'all' | 'free' | 'paid' | 'range'>('all')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [eventCurrentPage, setEventCurrentPage] = useState(1)
  const [eventTotalPages, setEventTotalPages] = useState(1)
  const [eventRegistrations, setEventRegistrations] = useState<any[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [statusNotes, setStatusNotes] = useState('')
  const [showRefundConfirmDialog, setShowRefundConfirmDialog] = useState(false)
  const [orderToRefund, setOrderToRefund] = useState<string | null>(null)
  const [selectedRegistration, setSelectedRegistration] = useState<any | null>(null)
  const [selectedRegistrationMeta, setSelectedRegistrationMeta] = useState<any | null>(null)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [registrationLoading, setRegistrationLoading] = useState(false)
  const [cancellingTicketId, setCancellingTicketId] = useState<string | null>(null)
  const [editingEmail, setEditingEmail] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [sendingQrFromModal, setSendingQrFromModal] = useState(false)
  const [pushingToShiprocket, setPushingToShiprocket] = useState(false)
  const [showReadyToShipModal, setShowReadyToShipModal] = useState(false)
  const [attendeeSelectOpen, setAttendeeSelectOpen] = useState(false)
  const [attendeeSelectList, setAttendeeSelectList] = useState<CancellableAttendee[]>([])
  const [pendingCancelReg, setPendingCancelReg] = useState<any | null>(null)
  const [cancellingAttendeeId, setCancellingAttendeeId] = useState<string | null>(null)

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  // Load only the active tab's current page. Runs on mount and whenever the
  // club, tab, page, or a filter changes — so a first load fires a single
  // request instead of fetching both tabs (and duplicate calls) at once.
  useEffect(() => {
    if (!isAdmin) return
    if (typeFilter === 'events') {
      loadEventRegistrations(eventCurrentPage)
    } else {
      loadOrders()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, clubId, typeFilter, currentPage, eventCurrentPage, searchTerm, statusFilter, earlyBirdFilter, couponFilter, paymentDateFilter, amountFilter, amountMin, amountMax])

  // Product order stat cards are club-wide (filter-independent). Event stat
  // cards come from the registrations endpoint, so only fetch stats for products.
  useEffect(() => {
    if (isAdmin && typeFilter === 'products') {
      loadStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, clubId, typeFilter])

  // Reset to page 1 when the tab or any filter changes.
  useEffect(() => {
    setCurrentPage(1)
    setEventCurrentPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, searchTerm, statusFilter, earlyBirdFilter, couponFilter, paymentDateFilter, amountFilter, amountMin, amountMax])

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
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
      })
      params.append('clubId', clubId)

      const response = await apiClient.get(`/orders/admin/all?${params}`)
      if (response.success && response.data) {
        setOrders(response.data.data?.orders || [])
        setTotalPages(response.data.data?.pagination?.totalPages || 1)
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch orders",
          variant: "destructive",
        })
        setOrders([])
        setTotalPages(1)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      })
      setOrders([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const loadEventRegistrations = async (page = eventCurrentPage) => {
    setEventsLoading(true)
    try {
      if (!clubId) {
        setEventRegistrations([])
        setEventTotalPages(1)
        setEventStats(null)
        return
      }
      const response = await apiClient.getClubEventRegistrations({
        clubId,
        page,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
        earlyBird: earlyBirdFilter,
        coupon: couponFilter,
        paymentDate: paymentDateFilter,
        amountFilter,
        amountMin,
        amountMax,
      })
      if (response.success && response.data) {
        setEventRegistrations(response.data.registrations || [])
        setEventTotalPages(response.data.pagination?.totalPages || 1)
        setEventStats(response.data.stats || null)
      } else {
        setEventRegistrations([])
        setEventTotalPages(1)
        setEventStats(null)
      }
    } catch (error) {
      console.error('Error loading event registrations:', error)
      setEventRegistrations([])
      setEventTotalPages(1)
      setEventStats(null)
    } finally {
      setEventsLoading(false)
      setEventsLoaded(true)
    }
  }

  const loadStats = async () => {
    try {
      if (!clubId) {
        setStats(null)
        return
      }
      const params = new URLSearchParams({ clubId })

      const response = await apiClient.get(`/orders/admin/stats${params.toString() ? `?${params}` : ''}`)
      if (response.success && response.data) {
        const apiStats = response.data.data?.overview || null
        if (apiStats) {
          // Revenue card shows completed + paid orders only. The stats
          // aggregation now returns this directly, avoiding a second
          // fetch of up to 1000 full order documents.
          setStats({
            ...apiStats,
            totalRevenue: apiStats.completedPaidRevenue ?? apiStats.totalRevenue ?? 0,
          })
        } else {
          setStats(null)
        }
      }
    } catch (error) {
    }
  }

  const refreshOrders = async () => {
    setRefreshing(true)
    try {
      if (typeFilter === 'events') {
        await loadEventRegistrations()
      } else {
        await loadOrders()
      }
      await loadStats()
    } finally {
      setRefreshing(false)
    }
  }

  const handleDownloadReport = async () => {
    if (typeFilter === 'events') {
      try {
        const eventParams: Record<string, any> = {
          ...(clubId ? { clubId } : {}),
          ...(searchTerm ? { search: searchTerm } : {}),
          ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
          ...(earlyBirdFilter !== 'all' ? { earlyBird: earlyBirdFilter } : {}),
          ...(couponFilter !== 'all' ? { coupon: couponFilter } : {}),
          ...(paymentDateFilter ? { paymentDate: paymentDateFilter } : {}),
          ...(amountFilter !== 'all' ? { amountFilter } : {}),
          ...(amountFilter === 'range' ? { amountMin, amountMax } : {}),
        }
        const res = await apiClient.downloadEventRegistrationsReport(eventParams)
        if (!res.success) {
          toast({ title: 'Error', description: res.error || 'Failed to download event report', variant: 'destructive' })
        } else {
          toast({ title: 'Report downloaded', description: 'Event registrations report downloaded successfully.' })
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to download event report', variant: 'destructive' })
      }
      return
    }

    const params = {
      ...(searchTerm ? { search: searchTerm } : {}),
      ...(statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {}),
      ...(clubId ? { clubId } : {}),
    };

    try {
      const res = await apiClient.downloadOrdersReport(params);
      if (!res.success) {
        toast({ title: 'Error', description: res.error || 'Failed to download report', variant: 'destructive' });
      } else {
        toast({ title: 'Report downloaded', description: 'Orders report downloaded successfully.' });
        await loadStats();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to download report', variant: 'destructive' });
    }
  }

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return

    try {
      const response = await apiClient.patch(`/orders/admin/${selectedOrder._id}/status`, {
        status: newStatus,
        trackingNumber: trackingNumber || undefined,
        notes: statusNotes || undefined
      })

      if (response.success) {
        toast({
          title: "Success",
          description: "Order status updated successfully",
        })
        setShowStatusModal(false)
        setNewStatus('')
        setTrackingNumber('')
        setStatusNotes('')
        await loadOrders()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update order status",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    }
  }

  const handleManualPushToShiprocket = async (orderId: string) => {
    setPushingToShiprocket(true)
    try {
      const response = await apiClient.pushOrderToShiprocket(orderId)
      if (response.success) {
        toast({
          title: 'Pushed to Shiprocket',
          description: response.message || 'Order exported to logistics successfully',
        })
        // Refresh the selected order so badge updates immediately
        if (response.data) {
          setSelectedOrder(response.data as Order)
        }
        await loadOrders()
      } else {
        toast({
          title: 'Push Failed',
          description: response.message || 'Failed to export order to Shiprocket',
          variant: 'destructive',
        })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to push order to Shiprocket', variant: 'destructive' })
    } finally {
      setPushingToShiprocket(false)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    try {
      const response = await apiClient.patch(`/orders/admin/${orderId}/cancel`, {
        reason: 'Cancelled by admin'
      })

      if (response.success) {
        toast({
          title: "Success",
          description: "Order cancelled successfully",
        })
        await loadOrders()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to cancel order",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel order",
        variant: "destructive",
      })
    }
  }

  const handlePaymentStatusUpdate = async (orderId: string, paymentStatus: string) => {
    try {
      const response = await apiClient.patch(`/orders/admin/${orderId}/payment-status`, {
        paymentStatus
      })

      if (response.success) {
        toast({
          title: "Success",
          description: `Payment status updated to ${paymentStatus}`,
        })
        await loadOrders()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update payment status",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      })
    }
  }

  const refreshRegistrationInModal = async (registrationId: string, regMeta?: any) => {
    try {
      const res = await apiClient.getAdminRegistrationById(String(registrationId), clubId ?? undefined)
      const registration =
        res.data?.registration ??
        (res.data as { registration?: unknown })?.registration
      if (res.success && registration) {
        setSelectedRegistration(registration)
        const displayStatus = getRegistrationDisplayStatus(regMeta, (registration as any).attendees)
        if (regMeta) {
          setSelectedRegistrationMeta({
            ...regMeta,
            displayStatus,
            activeAttendeeCount: getActiveAttendees((registration as any).attendees).length,
          })
        }
      }
    } catch {
      // non-fatal
    }
  }

  const loadCancellableAttendeesForReg = async (reg: any): Promise<CancellableAttendee[]> => {
    const registrationId = reg.registrationId || reg._id
    if (!registrationId) return []

    if (String(selectedRegistrationMeta?.registrationId) === String(registrationId) && selectedRegistration) {
      return getCancellableAttendees(selectedRegistration)
    }

    try {
      const res = await apiClient.getAdminRegistrationById(String(registrationId), clubId ?? undefined)
      const registration =
        res.data?.registration ?? (res.data as any)?.registration
      return getCancellableAttendees(registration)
    } catch {
      return []
    }
  }

  const openAttendeeCancelPicker = (reg: any, attendees: CancellableAttendee[]) => {
    if (attendees.length === 0) {
      toast({
        title: 'Cannot cancel',
        description: 'No active tickets are available to cancel.',
        variant: 'destructive',
      })
      return
    }
    if (attendees.length === 1) {
      void handleCancelEventRegistration(reg, attendees[0].attendeeId)
      return
    }
    setAttendeeSelectList(attendees)
    setPendingCancelReg(reg)
    setAttendeeSelectOpen(true)
  }

  const handleCancelEventRegistration = async (reg: any, attendeeId?: string) => {
    const registrationId = reg.registrationId || reg._id
    if (!registrationId) {
      toast({
        title: 'Cannot cancel',
        description: 'Registration ID is missing for this ticket.',
        variant: 'destructive',
      })
      return
    }

    const displayStatus = reg.displayStatus || reg.status || 'confirmed'
    if (displayStatus === 'cancelled') {
      toast({
        title: 'Cannot cancel',
        description: 'This registration is already fully cancelled.',
        variant: 'destructive',
      })
      return
    }

    const executeCancel = async (resolvedAttendeeId?: string) => {
      const attendeeLabel = resolvedAttendeeId
        ? attendeeSelectList.find((a) => a.attendeeId === resolvedAttendeeId)?.name ||
          selectedRegistration?.attendees?.find((a: any) => String(a._id) === String(resolvedAttendeeId))?.name
        : null
      const label = attendeeLabel || reg.userName || reg.userEmail || 'this registration'
      if (
        !window.confirm(
          resolvedAttendeeId
            ? `Cancel ticket for ${label}? This frees one seat and invalidates that attendee's QR check-in.`
            : `Cancel ticket for ${label}? This frees their seat(s) and invalidates QR check-in.`
        )
      ) {
        return
      }

      try {
        setCancellingTicketId(String(registrationId))
        if (resolvedAttendeeId) setCancellingAttendeeId(resolvedAttendeeId)
        const response = await apiClient.cancelClubEventRegistration(
          String(registrationId),
          'Cancelled by club admin',
          resolvedAttendeeId,
          clubId ?? undefined
        )
        if (response.success) {
          toast({
            title: 'Ticket cancelled',
            description: response.message || response.data?.message || 'Ticket cancelled successfully',
          })
          await loadEventRegistrations()
          const cancelPayload = response.data as any
          const allCancelled =
            cancelPayload?.data?.status === 'cancelled' ||
            cancelPayload?.status === 'cancelled' ||
            response.message?.toLowerCase().includes('registration cancelled')
          if (showRegistrationModal && String(selectedRegistrationMeta?.registrationId) === String(registrationId)) {
            if (allCancelled) {
              setShowRegistrationModal(false)
              setSelectedRegistrationMeta(null)
              setSelectedRegistration(null)
            } else {
              await refreshRegistrationInModal(String(registrationId), {
                ...selectedRegistrationMeta,
                ...reg,
              })
            }
          }
        } else {
          const data = response as any
          if (data?.requiresAttendeeSelection || data?.data?.requiresAttendeeSelection) {
            const fromApi = extractCancellableAttendeesFromApiResponse(data)
            if (fromApi.length > 0) {
              openAttendeeCancelPicker(reg, fromApi)
              return
            }
            const cancellable = await loadCancellableAttendeesForReg(reg)
            if (cancellable.length > 0) {
              openAttendeeCancelPicker(reg, cancellable)
              return
            }
          }
          toast({
            title: 'Failed to cancel',
            description: response.message || response.error || 'Could not cancel registration',
            variant: 'destructive',
          })
        }
      } catch {
        toast({
          title: 'Failed to cancel',
          description: 'Could not cancel registration. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setCancellingTicketId(null)
        setCancellingAttendeeId(null)
      }
    }

    if (attendeeId) {
      await executeCancel(attendeeId)
      return
    }

    const cancellable = await loadCancellableAttendeesForReg(reg)
    openAttendeeCancelPicker(reg, cancellable)
  }

  const handleAttendeeSelectCancel = async (attendeeId: string) => {
    if (!pendingCancelReg) return
    setAttendeeSelectOpen(false)
    const reg = pendingCancelReg
    setPendingCancelReg(null)
    await handleCancelEventRegistration(reg, attendeeId)
  }

  const handleViewRegistrationDetails = async (reg: any) => {
    setSelectedRegistrationMeta(reg)
    setSelectedRegistration(null)
    setShowRegistrationModal(true)
    setEditingEmail(false)
    setEmailInput(reg.userEmail || '')
    const registrationId = reg.registrationId || reg._id
    if (registrationId) {
      setRegistrationLoading(true)
      try {
        const res = await apiClient.getAdminRegistrationById(String(registrationId), clubId ?? undefined)
        const registration =
          res.data?.registration ??
          (res.data as { registration?: unknown })?.registration
        if (res.success && registration) {
          setSelectedRegistration(registration)
          setSelectedRegistrationMeta({
            ...reg,
            displayStatus: getRegistrationDisplayStatus(reg, (registration as any).attendees),
            activeAttendeeCount: getActiveAttendees((registration as any).attendees).length,
          })
        }
      } catch {
      } finally {
        setRegistrationLoading(false)
      }
    }
  }

  const handleSendQrFromModal = async () => {
    const registrationId = selectedRegistrationMeta?.registrationId || selectedRegistrationMeta?._id
    if (!registrationId) return
    const phone =
      selectedRegistrationMeta?.primaryPhone ||
      selectedRegistration?.attendees?.[0]?.phone ||
      ''
    setSendingQrFromModal(true)
    try {
      const res = await apiClient.resendEventTicketWhatsApp(String(registrationId))
      if (res.success) {
        const sent = res.data?.whatsapp?.sentCount
        setShowRegistrationModal(false)
        toast({
          title: sent && sent > 1 ? `${sent} WhatsApp tickets sent` : 'QR Sent',
          description: res.message || `Ticket sent via WhatsApp${phone ? ` to ${phone}` : ''}`,
        })
        loadEventRegistrations()
      } else {
        toast({ title: 'Failed to Send QR', description: res.error || res.message || 'Unknown error', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to send WhatsApp ticket', variant: 'destructive' })
    } finally {
      setSendingQrFromModal(false)
    }
  }

  const formatDate = (dateString: string) => formatLocalDate(dateString, 'long')

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    const code = currency && /^[A-Z]{3}$/i.test(currency) ? currency.toUpperCase() : 'INR'
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: code,
      }).format(amount)
    } catch {
      return `₹${amount.toLocaleString('en-IN')}`
    }
  }

  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to view this page.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!isFeatureEnabled(clubFeatureConfig, 'merchandise')) {
    return (
      <DashboardLayout>
        <LockedFeaturePage
          featureKey="merchandise"
          featureLabel="Orders"
          clubId={clubId ?? ""}
          currentTier={clubFeatureConfig?.billing_tier}
        />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="relative space-y-6">
        {clubId && (
          <FeatureUnavailableOverlay featureKey="merchandise" featureLabel="Merchandise Store" clubId={clubId} />
        )}
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Order Management</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Manage customer orders and fulfillment</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {isFeatureEnabled(clubFeatureConfig, 'reporting') ? (
              <Link href="/dashboard/orders/logistics-report" className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full sm:w-auto">
                  <Truck className="w-4 h-4 mr-2" />
                  Logistics Report
                </Button>
              </Link>
            ) : (
              <LockedInline label="Logistics Report" reason="Upgrade to the Reporting add-on to access shipping and RTO analytics. Contact RallyUp to unlock." />
            )}
            {isFeatureEnabled(clubFeatureConfig, 'reporting') ? (
              <Button variant="secondary" onClick={handleDownloadReport} className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            ) : (
              <LockedInline label="Download Report" reason="Upgrade to the Reporting add-on to export order data. Contact RallyUp to unlock." />
            )}
            <Button onClick={refreshOrders} disabled={refreshing} className="w-full sm:w-auto">
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {((typeFilter === 'products' && stats) || (typeFilter === 'events' && (eventStats || eventsLoading))) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {typeFilter === 'events' ? 'Total Registrations' : 'Total Orders'}
                </CardTitle>
                {typeFilter === 'events' ? (
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Package className="h-4 w-4 text-muted-foreground" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {typeFilter === 'events' && eventsLoading ? '—' : typeFilter === 'events' ? eventStats?.totalOrders : stats?.totalOrders}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {typeFilter === 'events' ? 'Pending' : 'Pending Orders'}
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {typeFilter === 'events' && eventsLoading ? '—' : typeFilter === 'events' ? eventStats?.pendingOrders : stats?.pendingOrders}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {typeFilter === 'events' ? 'Confirmed' : 'Completed Orders'}
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {typeFilter === 'events' && eventsLoading ? '—' : typeFilter === 'events' ? eventStats?.completedOrders : stats?.completedOrders}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <span className="text-sm font-medium text-muted-foreground">INR</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {typeFilter === 'events' && eventsLoading
                    ? '—'
                    : typeFilter === 'events'
                      ? (eventStats?.totalRevenue ? formatCurrency(eventStats.totalRevenue, 'INR') : '₹0')
                      : (stats?.totalRevenue ? formatCurrency(stats.totalRevenue, 'INR') : '₹0')}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs and Filters */}
        <Card>
          <CardContent className="p-6">
            <Tabs value={typeFilter} onValueChange={(value) => setTypeFilter(value as 'products' | 'events')} className="w-full">
              {/* Search and Tabs in same row */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder={typeFilter === 'events' ? "Search event registrations by name, email, or event..." : "Search orders by number, customer name, or email..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <TabsList>
                  <TabsTrigger value="events" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Event Tickets
                  </TabsTrigger>
                  <TabsTrigger value="products" className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Merchandise
                  </TabsTrigger>
                </TabsList>
              </div>
              
              {/* Filters in row below */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(typeFilter === 'events' ? eventStatusConfig : statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {typeFilter === 'events' && (
                  <>
                    <Select value={earlyBirdFilter} onValueChange={(value) => setEarlyBirdFilter(value as 'all' | 'used' | 'not_used')}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Early Bird" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tickets</SelectItem>
                        <SelectItem value="used">Early Bird Used</SelectItem>
                        <SelectItem value="not_used">Early Bird Not Used</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={couponFilter} onValueChange={(value) => setCouponFilter(value as 'all' | 'used' | 'not_used')}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Coupon" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tickets</SelectItem>
                        <SelectItem value="used">Coupon Used</SelectItem>
                        <SelectItem value="not_used">Coupon Not Used</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="w-full">
                      <Input
                        type="date"
                        placeholder="Payment Date"
                        value={paymentDateFilter}
                        onChange={(e) => setPaymentDateFilter(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Select value={amountFilter} onValueChange={(value) => setAmountFilter(value as 'all' | 'free' | 'paid' | 'range')}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Amount" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Amounts</SelectItem>
                        <SelectItem value="free">Free Tickets</SelectItem>
                        <SelectItem value="paid">Paid Tickets</SelectItem>
                        <SelectItem value="range">Amount Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
              {amountFilter === 'range' && typeFilter === 'events' && (
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="amount-min" className="text-sm whitespace-nowrap">Min Amount:</Label>
                    <Input
                      id="amount-min"
                      type="number"
                      placeholder="0"
                      value={amountMin}
                      onChange={(e) => setAmountMin(e.target.value)}
                      className="w-24"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="amount-max" className="text-sm whitespace-nowrap">Max Amount:</Label>
                    <Input
                      id="amount-max"
                      type="number"
                      placeholder="1000"
                      value={amountMax}
                      onChange={(e) => setAmountMax(e.target.value)}
                      className="w-24"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              )}
            </Tabs>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>
              Manage and track customer orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(typeFilter === 'events' ? eventsLoading : loading) ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {typeFilter === 'events' ? 'Loading event registrations…' : 'Loading orders…'}
                </p>
              </div>
            ) : (typeFilter === 'events' ? eventsLoaded && eventRegistrations.length === 0 : orders.length === 0) ? (
              <div className="text-center py-8">
                {typeFilter === 'events' ? (
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                ) : (
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                )}
                <h3 className="text-lg font-medium text-gray-900">No {typeFilter === 'events' ? 'event registrations' : 'orders'} found</h3>
                <p className="text-gray-500">No {typeFilter === 'events' ? 'event registrations' : 'orders'} match your current filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">{typeFilter === 'events' ? 'Type' : 'Order #'}</TableHead>
                        <TableHead className="min-w-[180px]">Customer</TableHead>
                        <TableHead className="min-w-[100px]">{typeFilter === 'events' ? 'Event' : 'Items'}</TableHead>
                        <TableHead className="min-w-[100px]">Total</TableHead>
                        <TableHead className="min-w-[120px]">Status</TableHead>
                        <TableHead className="min-w-[120px]">Payment</TableHead>
                        <TableHead className="min-w-[150px]">Date</TableHead>
                        <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {typeFilter === 'products' && orders.map((order) => {
                      const orderStatus = getOrderStatusDisplay(order.status)
                      const StatusIcon = orderStatus.icon
                      return (
                        <TableRow key={order._id}>
                          <TableCell className="font-medium">
                            {order.orderNumber}
                          </TableCell>
                          <TableCell>
                            <div className="min-w-[180px]">
                              <div className="font-medium break-words">
                                {order.customer.firstName} {order.customer.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground break-words">
                                {order.customer.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {formatCurrency(order.total, order.currency)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge className={orderStatus.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {orderStatus.label}
                              </Badge>
                              {order.deliveryStatus && deliveryStatusConfig[order.deliveryStatus] && (
                                <Badge className={`text-xs ${deliveryStatusConfig[order.deliveryStatus].color}`}>
                                  {deliveryStatusConfig[order.deliveryStatus].label}
                                </Badge>
                              )}
                              {(order.isRTO || order.isDamaged || order.isLost) && (
                                <Badge className="text-xs bg-red-600 text-white border-red-700">
                                  <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                                  {order.isRTO ? 'RTO' : order.isDamaged ? 'Damaged' : 'Lost'}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPaymentStatusDisplay(order.paymentStatus).color}>
                              {getPaymentStatusDisplay(order.paymentStatus).label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatDate(order.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  setSelectedOrder(order)
                                  setShowOrderModal(true)
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedOrder(order)
                                      setNewStatus(order.status)
                                      setShowStatusModal(true)
                                    }}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Update Status
                                  </DropdownMenuItem>
                                  {order.paymentStatus === 'pending' && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => handlePaymentStatusUpdate(order._id, 'paid')}
                                        className="text-green-600"
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Mark as Paid
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handlePaymentStatusUpdate(order._id, 'failed')}
                                        className="text-red-600"
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Mark as Failed
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {order.paymentStatus === 'paid' && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setOrderToRefund(order._id)
                                        setShowRefundConfirmDialog(true)
                                      }}
                                      className="text-orange-600"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Mark as Refunded
                                    </DropdownMenuItem>
                                  )}
                                  {order.status !== 'cancelled' && order.status !== 'completed' && (
                                    <DropdownMenuItem
                                      onClick={() => handleCancelOrder(order._id)}
                                      className="text-red-600"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Cancel Order
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {typeFilter === 'events' && eventRegistrations.map((reg) => {
                      const regStatus = reg.displayStatus || reg.status || 'confirmed'
                      const StatusIcon = eventStatusConfig[regStatus]?.icon || CheckCircle
                      const registrationId = String(reg.registrationId || reg._id || '')
                      const activeCount = reg.activeAttendeeCount ?? (regStatus === 'cancelled' ? 0 : 1)
                      const totalCount = reg.numAttendees ?? 1
                      const eventEnded = (() => {
                        const cutoffRaw = reg.eventEndTime || reg.eventStartTime
                        if (!cutoffRaw) return false
                        const cutoff = new Date(cutoffRaw)
                        return !isNaN(cutoff.getTime()) && Date.now() > cutoff.getTime()
                      })()
                      const isCancelling = cancellingTicketId === registrationId
                      const canCancel =
                        (regStatus === 'confirmed' || regStatus === 'partially_cancelled') &&
                        Boolean(registrationId) &&
                        activeCount > 0
                      return (
                        <TableRow key={`${reg.eventId}-${reg.userId}-${reg.registrationDate}`}>
                          <TableCell className="font-medium">
                            Event Registration
                          </TableCell>
                          <TableCell>
                            <div className="min-w-[180px]">
                              <div className="font-medium break-words">
                                {reg.userName || 'N/A'}
                              </div>
                              <div className="text-sm text-muted-foreground break-words">
                                {reg.userEmail || 'N/A'}
                              </div>
                              {totalCount > 1 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {activeCount}/{totalCount} active tickets
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {reg.eventTitle || 'Event'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {reg.amountPaid != null
                                ? (reg.amountPaid > 0 ? formatCurrency(reg.amountPaid, reg.currency || 'INR') : 'Free')
                                : (reg.ticketPrice ? formatCurrency(reg.ticketPrice, reg.currency || 'INR') : 'Free')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={eventStatusConfig[regStatus]?.color || 'bg-gray-100 text-gray-800'}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {eventStatusConfig[regStatus]?.label || regStatus.charAt(0).toUpperCase() + regStatus.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              reg.amountPaid && reg.paymentId ? 'bg-green-100 text-green-800' : 
                              (reg.amountPaid > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800')
                            }>
                              {reg.amountPaid && reg.paymentId ? 'Paid' : (reg.amountPaid > 0 ? 'Pending' : 'Free')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {reg.registrationDate ? formatDate(typeof reg.registrationDate === 'string' ? reg.registrationDate : new Date(reg.registrationDate).toISOString()) : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 flex-wrap">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                                onClick={() => handleViewRegistrationDetails(reg)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <ResendQrButton
                                mode="admin"
                                registrationId={registrationId}
                                phone={reg.primaryPhone}
                                eventEnded={eventEnded}
                                disabled={activeCount === 0 || !registrationId}
                                disabledReason="Only active tickets can be resent"
                                variant="ghost"
                                className="h-8 px-2"
                              />
                              {canCancel && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleCancelEventRegistration(reg)}
                                  disabled={cancellingTicketId !== null && !isCancelling}
                                >
                                  {isCancelling ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                      Cancelling...
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-4 w-4 mr-1" />
                                      {totalCount > 1 ? 'Cancel ticket' : 'Cancel'}
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Pagination */}
            {typeFilter === 'products' && totalPages > 1 && (
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

            {/* Event Pagination */}
            {typeFilter === 'events' && eventTotalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setEventCurrentPage(eventCurrentPage - 1)}
                  disabled={eventCurrentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {eventCurrentPage} of {eventTotalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setEventCurrentPage(eventCurrentPage + 1)}
                  disabled={eventCurrentPage === eventTotalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details Modal */}
        <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>Order Details - {selectedOrder?.orderNumber}</DialogTitle>
              <DialogDescription>
                Complete order information and customer details
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Order Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order Number:</span>
                        <span className="font-medium">{selectedOrder.orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge className={getOrderStatusDisplay(selectedOrder.status).color}>
                          {getOrderStatusDisplay(selectedOrder.status).label}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Method:</span>
                        <span className="capitalize">{selectedOrder.paymentMethod.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Status:</span>
                        <Badge className={getPaymentStatusDisplay(selectedOrder.paymentStatus).color}>
                          {getPaymentStatusDisplay(selectedOrder.paymentStatus).label}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order Date:</span>
                        <span>{formatDate(selectedOrder.createdAt)}</span>
                      </div>
                      {selectedOrder.trackingNumber && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tracking Number:</span>
                          <span className="font-mono">{selectedOrder.trackingNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Customer Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span>{selectedOrder.customer.firstName} {selectedOrder.customer.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{selectedOrder.customer.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{selectedOrder.customer.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logistics / Shiprocket status */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Logistics Export
                    </h3>
                    {selectedOrder.shiprocketStatus === 'pushed' && (
                      <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Exported to Logistics
                      </Badge>
                    )}
                    {selectedOrder.shiprocketStatus === 'failed' && (
                      <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Push Failed
                      </Badge>
                    )}
                    {(!selectedOrder.shiprocketStatus || selectedOrder.shiprocketStatus === 'pending') && (
                      <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                        Not Pushed
                      </Badge>
                    )}
                  </div>

                  {selectedOrder.shiprocketStatus === 'pushed' && (
                    <div className="text-sm space-y-1">
                      {selectedOrder.shiprocketCustomOrderId && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">SR Order ID:</span>
                          <span className="font-mono">{selectedOrder.shiprocketCustomOrderId}</span>
                        </div>
                      )}
                      {selectedOrder.shiprocketOrderId && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Shiprocket #:</span>
                          <span className="font-mono">{selectedOrder.shiprocketOrderId}</span>
                        </div>
                      )}
                      {selectedOrder.shiprocketShipmentId && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Shipment #:</span>
                          <span className="font-mono">{selectedOrder.shiprocketShipmentId}</span>
                        </div>
                      )}
                      {selectedOrder.shiprocketPushedAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pushed at:</span>
                          <span>{new Date(selectedOrder.shiprocketPushedAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedOrder.shiprocketStatus === 'failed' && selectedOrder.shiprocketError && (
                    <p className="text-sm text-red-600 bg-red-50 rounded p-2">
                      {selectedOrder.shiprocketError}
                    </p>
                  )}

                  {/* Fulfillment details after pickup is scheduled */}
                  {(selectedOrder.awbCode || selectedOrder.courierName || selectedOrder.labelUrl) && (
                    <div className="text-sm space-y-1 pt-1 border-t">
                      {selectedOrder.courierName && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Courier:</span>
                          <span className="font-medium">{selectedOrder.courierName}</span>
                        </div>
                      )}
                      {selectedOrder.awbCode && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">AWB:</span>
                          <span className="font-mono">{selectedOrder.awbCode}</span>
                        </div>
                      )}
                      {selectedOrder.pickupScheduledAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pickup:</span>
                          <span>{new Date(selectedOrder.pickupScheduledAt).toLocaleString()}</span>
                        </div>
                      )}
                      {selectedOrder.estimatedDeliveryDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Est. Delivery:</span>
                          <span className="font-medium">
                            {new Date(selectedOrder.estimatedDeliveryDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      )}
                      {selectedOrder.actualDeliveryAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Delivered:</span>
                          <span className="font-medium text-green-700">
                            {new Date(selectedOrder.actualDeliveryAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {selectedOrder.deliveryStatus && deliveryStatusConfig[selectedOrder.deliveryStatus] && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Delivery Status:</span>
                          <Badge className={`text-xs ${deliveryStatusConfig[selectedOrder.deliveryStatus].color}`}>
                            {deliveryStatusConfig[selectedOrder.deliveryStatus].label}
                          </Badge>
                        </div>
                      )}
                      {selectedOrder.labelUrl && (
                        <a
                          href={selectedOrder.labelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary underline mt-1"
                        >
                          Download Shipping Label
                        </a>
                      )}
                    </div>
                  )}

                  {selectedOrder.fulfillmentError && (
                    <p className="text-sm text-red-600 bg-red-50 rounded p-2">
                      {selectedOrder.fulfillmentError}
                    </p>
                  )}

                  {/* Logistics Timeline */}
                  {selectedOrder.awbCode && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        Tracking Timeline
                      </p>
                      <LogisticsTimeline orderId={selectedOrder._id} />
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    {selectedOrder.paymentStatus === 'paid' && (
                      <Button
                        variant={selectedOrder.shiprocketStatus === 'pushed' ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleManualPushToShiprocket(selectedOrder._id)}
                        disabled={pushingToShiprocket}
                        className="w-full"
                      >
                        {pushingToShiprocket ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Pushing…
                          </>
                        ) : selectedOrder.shiprocketStatus === 'pushed' ? (
                          <>
                            <Truck className="h-4 w-4 mr-2" />
                            Re-push to Shiprocket
                          </>
                        ) : (
                          <>
                            <Truck className="h-4 w-4 mr-2" />
                            Push to Shiprocket
                          </>
                        )}
                      </Button>
                    )}

                    {/* Ready to Ship — only when pushed and not yet in fulfillment */}
                    {selectedOrder.shiprocketStatus === 'pushed' &&
                      selectedOrder.paymentStatus === 'paid' &&
                      selectedOrder.status !== 'fulfillment_in_progress' &&
                      selectedOrder.status !== 'shipped' && (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => setShowReadyToShipModal(true)}
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Ready to Ship
                        </Button>
                      )}
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="font-semibold mb-3">Shipping Address</h3>
                  <div className="border p-4 rounded-lg">
                    <OrderAddressDisplay address={selectedOrder.shippingAddress} />
                  </div>
                </div>

                {/* Billing Address */}
                <div>
                  <h3 className="font-semibold mb-3">Billing Address</h3>
                  <div className="border p-4 rounded-lg">
                    {selectedOrder.billingAddress?.address &&
                    selectedOrder.billingAddress.address !== selectedOrder.shippingAddress?.address ? (
                      <OrderAddressDisplay address={selectedOrder.billingAddress} />
                    ) : (
                      <p className="text-sm text-muted-foreground">Same as shipping address</p>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                        {item.productImage && (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-sm text-muted-foreground">
                            Quantity: {item.quantity}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
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
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedOrder.subtotal, selectedOrder.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>{formatCurrency(selectedOrder.shippingCost, selectedOrder.currency)}</span>
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
                          <span>Tax:</span>
                          <span>{formatCurrency(selectedOrder.tax, selectedOrder.currency)}</span>
                        </div>
                      );
                    })()}
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(selectedOrder.total, selectedOrder.currency)}</span>
                    </div>
                    {selectedOrder.finalAmount != null && selectedOrder.finalAmount !== selectedOrder.total && (
                      <div className="flex justify-between font-semibold text-muted-foreground">
                        <span>Amount charged:</span>
                        <span>{formatCurrency(selectedOrder.finalAmount, selectedOrder.currency)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <h3 className="font-semibold mb-3">Notes</h3>
                    <div className="p-4 rounded-lg text-sm">
                      {selectedOrder.notes}
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

        {/* Update Status Modal */}
        <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Order Status</DialogTitle>
              <DialogDescription>
                Change the status of order {selectedOrder?.orderNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newStatus === 'shipped' && (
                <div>
                  <Label htmlFor="tracking">Tracking Number</Label>
                  <Input
                    id="tracking"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Add any notes about this status change"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStatusModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate}>
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Event Registration Details Modal */}
        <Dialog open={showRegistrationModal} onOpenChange={setShowRegistrationModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>Registration Details</DialogTitle>
              <DialogDescription>
                {selectedRegistrationMeta?.eventTitle || 'Event'} — {selectedRegistrationMeta?.userName || ''}
              </DialogDescription>
            </DialogHeader>
            {registrationLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Registration Info */}
                <div>
                  <h3 className="font-semibold mb-3">Registration Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{selectedRegistrationMeta?.userName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Email:</span>
                      {editingEmail ? (
                        <div className="flex items-center gap-1">
                          <Input
                            className="h-7 text-xs w-48"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            type="email"
                            placeholder="Enter email"
                          />
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingEmail(false)}>
                            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-sm">{emailInput || selectedRegistrationMeta?.userEmail || 'N/A'}</span>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEmailInput(selectedRegistrationMeta?.userEmail || ''); setEditingEmail(true) }}>
                            <Edit className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Event:</span>
                      <span>{selectedRegistrationMeta?.eventTitle || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={
                        (selectedRegistrationMeta?.displayStatus || selectedRegistrationMeta?.status) === 'confirmed' ? 'bg-green-100 text-green-800' :
                        (selectedRegistrationMeta?.displayStatus || selectedRegistrationMeta?.status) === 'cancelled' ? 'bg-red-100 text-red-800' :
                        (selectedRegistrationMeta?.displayStatus || selectedRegistrationMeta?.status) === 'partially_cancelled' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {(() => {
                          const status = selectedRegistrationMeta?.displayStatus || selectedRegistrationMeta?.status || 'confirmed'
                          return status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
                        })()}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Registered At:</span>
                      <span>
                        {selectedRegistrationMeta?.registrationDate
                          ? formatDate(typeof selectedRegistrationMeta.registrationDate === 'string'
                              ? selectedRegistrationMeta.registrationDate
                              : new Date(selectedRegistrationMeta.registrationDate).toISOString())
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                {(() => {
                  const meta = selectedRegistrationMeta
                  const currency = meta?.currency || meta?.currencyAtPurchase || 'INR'
                  const ticketPrice = meta?.ticketPrice ?? 0
                  const numAttendees = selectedRegistration?.attendees?.length ?? 1
                  const activeAttendeeCount = getActiveAttendees(selectedRegistration?.attendees).length
                  const originalTotal = ticketPrice * numAttendees
                  const amountPaid = meta?.amountPaid
                  const couponCode = meta?.couponCode
                  const couponDiscount = meta?.couponDiscount ?? 0
                  const earlyBirdAmt = meta?.earlyBirdDiscountAmt ?? 0
                  const pointsDiscount = meta?.pointsDiscount ?? 0
                  const hasStoredFees = meta?.platformFee != null
                  const fees = hasStoredFees
                    ? {
                        platformFee: meta.platformFee,
                        platformFeeGst: meta.platformFeeGst,
                        razorpayFee: meta.razorpayFee,
                        razorpayFeeGst: meta.razorpayFeeGst,
                      }
                    : (() => {
                        const base = Math.max(originalTotal - earlyBirdAmt - couponDiscount - pointsDiscount, 0)
                        return base > 0 ? calculateTransactionFees(base) : null
                      })()

                  return (
                    <div>
                      <h3 className="font-semibold mb-3">Payment Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {activeAttendeeCount > 1 || numAttendees > 1
                              ? `Ticket Price (${activeAttendeeCount > 0 ? activeAttendeeCount : numAttendees} × ${formatCurrency(ticketPrice, currency)}):`
                              : 'Ticket Price:'}
                          </span>
                          <span className="font-medium">
                            {originalTotal > 0 ? formatCurrency(originalTotal, currency) : 'Free'}
                          </span>
                        </div>

                        {fees && (fees.platformFee + fees.platformFeeGst) > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Platform Fee (+ GST):</span>
                            <span>{formatCurrency(fees.platformFee + fees.platformFeeGst, currency)}</span>
                          </div>
                        )}
                        {fees && (fees.razorpayFee + fees.razorpayFeeGst) > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Payment Gateway Fee (+ GST):</span>
                            <span>{formatCurrency(fees.razorpayFee + fees.razorpayFeeGst, currency)}</span>
                          </div>
                        )}

                        {earlyBirdAmt > 0 && (
                          <div className="flex justify-between text-green-700">
                            <span>Early Bird Discount:</span>
                            <span>-{formatCurrency(earlyBirdAmt, currency)}</span>
                          </div>
                        )}

                        {couponDiscount > 0 && (
                          <div className="flex justify-between text-green-700">
                            <span>{couponCode ? `Coupon (${couponCode}):` : 'Coupon Discount:'}</span>
                            <span>-{formatCurrency(couponDiscount, currency)}</span>
                          </div>
                        )}

                        {pointsDiscount > 0 && (
                          <div className="flex justify-between text-green-700">
                            <span>Points Redeemed:</span>
                            <span>-{formatCurrency(pointsDiscount, currency)}</span>
                          </div>
                        )}

                        {amountPaid != null ? (
                          <div className="flex justify-between font-semibold border-t pt-2">
                            <span>Amount Paid:</span>
                            <span>{amountPaid > 0 ? formatCurrency(amountPaid, currency) : 'Free'}</span>
                          </div>
                        ) : (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Payment Status:</span>
                            <Badge className={
                              meta?.amountPaid && meta?.paymentId ? 'bg-green-100 text-green-800' : 
                              (meta?.amountPaid > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800')
                            }>
                              {meta?.amountPaid && meta?.paymentId ? 'Paid' : (meta?.amountPaid > 0 ? 'Pending' : 'Free')}
                            </Badge>
                          </div>
                        )}

                        {meta?.paymentId && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Payment ID:</span>
                            <span className="font-mono text-xs break-all">{meta.paymentId}</span>
                          </div>
                        )}
                        {meta?.orderId && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Order ID:</span>
                            <span className="font-mono text-xs break-all">{meta.orderId}</span>
                          </div>
                        )}
                        {meta?.registrationDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Payment Time:</span>
                            <span>
                              {formatDate(typeof meta.registrationDate === 'string'
                                ? meta.registrationDate
                                : new Date(meta.registrationDate).toISOString())}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* Attendees */}
                {selectedRegistration?.attendees && selectedRegistration.attendees.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">
                      Attendees ({getActiveAttendees(selectedRegistration.attendees).length}/{selectedRegistration.attendees.length} active)
                    </h3>
                    <div className="space-y-2">
                      {selectedRegistration.attendees.map((att: any, idx: number) => {
                        const isCancelled = att.status === 'cancelled'
                        const isCancellingAttendee = cancellingAttendeeId === String(att._id)
                        const canCancelAttendee =
                          !isCancelled &&
                          !att.attended &&
                          att.refundStatus !== 'requested' &&
                          att.refundStatus !== 'processed'
                        return (
                          <div key={att._id || idx} className="flex items-center justify-between gap-3 p-3 border rounded-lg text-sm">
                            <div className="min-w-0">
                              <div className="font-medium">{att.name || `Attendee ${idx + 1}`}</div>
                              {att.phone && <div className="text-muted-foreground text-xs">{att.phone}</div>}
                              {(att.venueName || att.tierName) && (
                                <div className="text-muted-foreground text-xs">
                                  {[att.venueName, att.tierName].filter(Boolean).join(' · ')}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge
                                variant={isCancelled ? 'destructive' : att.attended ? 'default' : 'secondary'}
                              >
                                {isCancelled
                                  ? 'Cancelled'
                                  : att.refundStatus === 'requested'
                                    ? 'Refund requested'
                                    : att.refundStatus === 'processed'
                                      ? 'Refunded'
                                      : att.attended
                                        ? 'Attended'
                                        : 'Active'}
                              </Badge>
                              {canCancelAttendee && selectedRegistrationMeta && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  disabled={cancellingTicketId !== null}
                                  onClick={() => handleCancelEventRegistration(selectedRegistrationMeta, String(att._id))}
                                >
                                  {isCancellingAttendee ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                      Cancelling...
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Cancel ticket
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              {(['confirmed', 'partially_cancelled'] as string[]).includes(
                selectedRegistrationMeta?.displayStatus || selectedRegistrationMeta?.status || ''
              ) && getActiveAttendees(selectedRegistration?.attendees).length > 0 && (
                <>
                  <Button
                    variant="destructive"
                    className="w-full sm:w-auto"
                    disabled={cancellingTicketId !== null}
                    onClick={() => {
                      if (selectedRegistrationMeta) {
                        void handleCancelEventRegistration(selectedRegistrationMeta)
                      }
                    }}
                  >
                    {cancellingTicketId ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        {getActiveAttendees(selectedRegistration?.attendees).length > 1
                          ? 'Cancel one ticket'
                          : 'Cancel ticket'}
                      </>
                    )}
                  </Button>
                  <Button onClick={handleSendQrFromModal} disabled={sendingQrFromModal} className="w-full sm:w-auto">
                    {sendingQrFromModal ? (
                      <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Sending...</>
                    ) : (
                      <><MessageCircle className="h-4 w-4 mr-2" />Send QR (WhatsApp)</>
                    )}
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setShowRegistrationModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AttendeeTicketSelectModal
          open={attendeeSelectOpen}
          attendees={attendeeSelectList}
          loading={cancellingTicketId !== null}
          title="Select ticket to cancel"
          description="Choose which attendee ticket to cancel. Other tickets in this registration will stay active."
          confirmLabel="Cancel ticket"
          onSelect={handleAttendeeSelectCancel}
          onCancel={() => {
            setAttendeeSelectOpen(false)
            setPendingCancelReg(null)
          }}
        />

        {/* Ready to Ship Modal */}
        {selectedOrder && (
          <ReadyToShipModal
            open={showReadyToShipModal}
            onClose={() => setShowReadyToShipModal(false)}
            orderId={selectedOrder._id}
            orderNumber={selectedOrder.orderNumber}
            shiprocketShipmentId={selectedOrder.shiprocketShipmentId}
            deliveryPincode={selectedOrder.shippingAddress?.zipCode}
            clubId={clubId}
            onSuccess={(updatedOrder) => {
              setShowReadyToShipModal(false)
              if (updatedOrder) setSelectedOrder((prev) => prev ? { ...prev, ...updatedOrder } : prev)
              loadOrders()
            }}
          />
        )}

        {/* Refund Confirmation Dialog */}
        <Dialog open={showRefundConfirmDialog} onOpenChange={(open) => {
          setShowRefundConfirmDialog(open)
          if (!open) setOrderToRefund(null)
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Refund</DialogTitle>
              <DialogDescription>
                Are you sure you want to mark this order as refunded? This action will update the payment status.
                Please ensure the refund has been processed per our{' '}
                <Link href="/refund" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-500 underline font-medium">
                  Refund and Cancellation Policy
                </Link>.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRefundConfirmDialog(false)
                  setOrderToRefund(null)
                }}
              >
                Cancel
              </Button>
              <Button
                className="text-orange-600"
                onClick={async () => {
                  if (orderToRefund) {
                    await handlePaymentStatusUpdate(orderToRefund, 'refunded')
                    setShowRefundConfirmDialog(false)
                    setOrderToRefund(null)
                  }
                }}
              >
                Mark as Refunded
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
