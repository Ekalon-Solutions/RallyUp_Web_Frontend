"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { apiClient } from '@/lib/api'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { formatLocalDate } from '@/lib/timezone'
import { RefundButton } from '@/components/refund-button'
import { PaymentSimulationModal } from '@/components/modals/payment-simulation-modal'
import { calculateTransactionFees, PLATFORM_FEE_PERCENT, RAZORPAY_FEE_PERCENT } from '@/lib/transactionFees'
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
  Wallet
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
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)

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
      loadOrders()
    }
  }, [user, clubId])

  useEffect(() => {
    if (user) {
      setCurrentPage(1)
      loadOrders()
    }
  }, [searchTerm, statusFilter, clubId])

  useEffect(() => {
    if (user && currentPage > 1) {
      loadOrders()
    }
  }, [currentPage, clubId])

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

  const refreshOrders = async () => {
    setRefreshing(true)
    await loadOrders()
    setRefreshing(false)
  }

  const handleDownloadReport = async () => {
    const params = {
      ...(searchTerm ? { search: searchTerm } : {}),
      ...(statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {}),
      ...(clubId ? { clubId } : {}),
    };

    try {
      const res = await apiClient.downloadMyOrdersReport(params);
      if (!res.success) {
        toast({ title: 'Error', description: res.error || 'Failed to download report', variant: 'destructive' });
      } else {
        toast({ title: 'Report downloaded', description: 'Your orders report downloaded successfully.' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to download report', variant: 'destructive' });
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
      toast({ title: 'Error', description: 'Please enter a coupon code', variant: 'destructive' })
      return
    }
    const orderClubId = cpOrder.club
    if (!orderClubId) {
      toast({ title: 'Error', description: 'Unable to validate coupon for this order', variant: 'destructive' })
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
        toast({ title: 'Success', description: 'Coupon applied!' })
      } else {
        setCpAppliedCoupon(null)
        toast({ title: 'Error', description: response.error || 'Invalid coupon code', variant: 'destructive' })
      }
    } catch {
      setCpAppliedCoupon(null)
      toast({ title: 'Error', description: 'Failed to validate coupon', variant: 'destructive' })
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
      toast({ title: 'Error', description: 'Enter points to redeem', variant: 'destructive' })
      return
    }
    if ((cpOrder.subtotal - cpCouponDiscount) <= 0) {
      toast({ title: 'Error', description: 'Subtotal is already zero — no need to redeem points', variant: 'destructive' })
      return
    }
    if (cpAvailablePoints !== null && cpRedeemPoints > cpAvailablePoints) {
      toast({ title: 'Error', description: 'You do not have enough points', variant: 'destructive' })
      return
    }
    const orderClubId = cpOrder.club
    if (!orderClubId) {
      toast({ title: 'Error', description: 'Club information missing', variant: 'destructive' })
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
        toast({ title: 'Success', description: 'Points reserved!' })
      } else {
        toast({ title: 'Error', description: resp?.message || 'Failed to reserve points', variant: 'destructive' })
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to reserve points', variant: 'destructive' })
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

  // Compute derived totals for Continue Payment
  // Fees are fixed on the original order subtotal (before coupon and redeem points)
  const cpCouponDiscount = cpAppliedCoupon?.discount ?? 0
  const cpNetSubtotal = cpOrder ? Math.max(cpOrder.subtotal - cpCouponDiscount - cpReservedDiscount, 0) : 0
  const cpFeeBreakdown = cpOrder && cpOrder.subtotal > 0 ? calculateTransactionFees(cpOrder.subtotal) : null
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
        toast({ title: 'Error', description: resp.message || 'Failed to update order', variant: 'destructive' })
        return
      }
      setCpUpdatedOrder(resp.data?.data ?? cpOrder)
      setShowCpPayment(true)
    } catch {
      toast({ title: 'Error', description: 'Failed to update order', variant: 'destructive' })
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
      toast({ title: 'Success', description: 'Payment successful! Order confirmed.' })
      setShowCpPayment(false)
      closeContinuePayment()
      loadOrders()
    } catch {
      toast({ title: 'Error', description: 'Payment successful but failed to update order status.', variant: 'destructive' })
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
      toast({ title: 'Error', description: 'Payment failed. Please try again.', variant: 'destructive' })
      setShowCpPayment(false)
    } catch {
      toast({ title: 'Error', description: 'Failed to update payment status.', variant: 'destructive' })
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Orders</h1>
            <p className="text-muted-foreground">Track your purchase history and order status</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="secondary" onClick={handleDownloadReport}>
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
            <Button onClick={refreshOrders} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search orders by number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
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
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
            <CardDescription>
              View and track your past orders. For refund-related inquiries, see our{" "}
              <a href="/refund" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-500 underline">
                Refund and Cancellation Policy
              </a>
              .
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground">No orders found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all'
                    ? "No orders match your current filters."
                    : "You haven't placed any orders yet."}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button className="mt-4" onClick={() => window.location.href = '/merchandise'}>
                    Browse Merchandise
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const StatusIcon = statusConfig[order.status].icon
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
                          <Badge className={statusConfig[order.status].color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig[order.status].label}
                          </Badge>
                          <Badge className={paymentStatusConfig[order.paymentStatus].color}>
                            {paymentStatusConfig[order.paymentStatus].label}
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
                            {formatCurrency(
                              order.paymentStatus === 'pending'
                                ? (() => {
                                    const net = Math.max(order.subtotal - (order.couponDiscount ?? 0) - (order.redeemedDiscount ?? order.pointsDiscount ?? 0), 0)
                                    const fees = order.subtotal > 0 ? calculateTransactionFees(order.subtotal) : null
                                    return net + (order.shippingCost ?? 0) + (order.tax ?? 0) + (fees?.totalFees ?? 0)
                                  })()
                                : (order.finalAmount ?? order.total),
                              order.currency
                            )}
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

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
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
                            <Button
                              size="sm"
                              onClick={() => openContinuePayment(order)}
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Continue Payment
                            </Button>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Order #{order.orderNumber}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
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
                        <Badge className={statusConfig[selectedOrder.status].color}>
                          {statusConfig[selectedOrder.status].label}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Method:</span>
                        <span className="capitalize text-foreground">{getPaymentMethodName(selectedOrder.paymentMethod)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Status:</span>
                        <Badge className={paymentStatusConfig[selectedOrder.paymentStatus].color}>
                          {paymentStatusConfig[selectedOrder.paymentStatus].label}
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
                    <h3 className="font-semibold mb-3 text-foreground">Shipping Address</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="text-sm">
                        <div className="font-medium text-foreground">
                          {selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}
                        </div>
                        <div className="text-foreground">{selectedOrder.shippingAddress.address}</div>
                        <div className="text-foreground">
                          {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                        </div>
                        <div className="text-foreground">{selectedOrder.shippingAddress.country}</div>
                      </div>
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
                      <span className="text-foreground">{formatCurrency(selectedOrder.shippingCost, selectedOrder.currency)}</span>
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
                                const net = Math.max(selectedOrder.subtotal - (selectedOrder.couponDiscount ?? 0) - (selectedOrder.redeemedDiscount ?? selectedOrder.pointsDiscount ?? 0), 0)
                                const fees = selectedOrder.subtotal > 0 ? calculateTransactionFees(selectedOrder.subtotal) : null
                                return net + (selectedOrder.shippingCost ?? 0) + (selectedOrder.tax ?? 0) + (fees?.totalFees ?? 0)
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
                          placeholder="Enter coupon code"
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
                      <input
                        type="number"
                        min={0}
                        value={cpRedeemPoints}
                        onChange={(e) => setCpRedeemPoints(Number(e.target.value || 0))}
                        className="border rounded px-2 py-1 w-32"
                        placeholder="Points"
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
                          <span>Platform fee ({PLATFORM_FEE_PERCENT}% + GST):</span>
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
