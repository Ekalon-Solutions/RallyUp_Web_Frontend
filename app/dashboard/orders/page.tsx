"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { apiClient } from '@/lib/api'
import { triggerBlobDownload } from '@/lib/utils'
import { calculateTransactionFees } from '@/lib/transactionFees'
import { formatLocalDate } from '@/lib/timezone'
import { DashboardLayout } from '@/components/dashboard-layout'
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
  Download
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
  shippingCost: number
  tax: number
  total: number
  platformFee?: number
  platformFeeGst?: number
  razorpayFee?: number
  razorpayFeeGst?: number
  finalAmount?: number
  currency: string
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

interface OrderStats {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  completedOrders: number
  cancelledOrders: number
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
}

const eventStatusConfig = {
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
}

const paymentStatusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800' }
}

export default function OrdersPage() {
  const { user } = useAuth()
  const clubId = useRequiredClubId()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [eventStats, setEventStats] = useState<OrderStats | null>(null)
  const [loading, setLoading] = useState(false)
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
  const [allEventRegistrations, setAllEventRegistrations] = useState<any[]>([])
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

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      loadStats()
      loadEventRegistrations() // Load event stats on mount
    }
  }, [user?.role, clubId])

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      setCurrentPage(1)
      setEventCurrentPage(1)
      loadOrders()
      if (typeFilter === 'events') {
        loadEventRegistrations()
      }
    }
  }, [searchTerm, statusFilter, typeFilter, earlyBirdFilter, couponFilter, paymentDateFilter, amountFilter, amountMin, amountMax, clubId])

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'super_admin') return
    loadOrders()
  }, [currentPage, clubId])

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      applyEventPagination()
    }
  }, [eventCurrentPage, allEventRegistrations])

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
        // console.error('API Response:', response)
        toast({
          title: "Error",
          description: response.message || "Failed to fetch orders",
          variant: "destructive",
        })
        setOrders([])
        setTotalPages(1)
      }
    } catch (error) {
      // console.error('Error loading orders:', error)
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

  const loadEventRegistrations = async () => {
    try {
      if (!clubId) {
        setAllEventRegistrations([])
        setEventRegistrations([])
        setEventStats(null)
        return
      }
      const response = await apiClient.getEventsByClub(clubId)
      if (response.success && response.data) {
        const data: any = response.data
        const events = Array.isArray(data) ? data : (data?.events || [])
        // Flatten event registrations into a list
        const registrations: any[] = []
        events.forEach((event: any) => {
          if (event.registrations && Array.isArray(event.registrations)) {
            event.registrations.forEach((reg: any) => {
              registrations.push({
                ...reg,
                eventId: event._id,
                eventTitle: event.title,
                eventStartTime: event.startTime,
                eventVenue: event.venue,
                eventCategory: event.category,
                ticketPrice: event.ticketPrice,
                currency: event.currency || 'USD',
                type: 'event'
              })
            })
          }
        })
        
        // Calculate stats
        const totalRegistrations = registrations.length
        const confirmedRegistrations = registrations.filter(reg => reg.status === 'confirmed').length
        const pendingRegistrations = registrations.filter(reg => reg.status === 'pending').length
        const cancelledRegistrations = registrations.filter(reg => reg.status === 'cancelled').length
        const totalRevenue = registrations
          .filter(reg => reg.status === 'confirmed' && reg.amountPaid && reg.paymentId)
          .reduce((sum, reg) => sum + (reg.amountPaid || 0), 0)
        
        setEventStats({
          totalOrders: totalRegistrations,
          totalRevenue: totalRevenue,
          pendingOrders: pendingRegistrations,
          completedOrders: confirmedRegistrations,
          cancelledOrders: cancelledRegistrations
        })
        
        // Store all registrations
        setAllEventRegistrations(registrations)
      }
    } catch (error) {
      console.error('Error loading event registrations:', error)
      setAllEventRegistrations([])
      setEventRegistrations([])
      setEventStats(null)
    }
  }

  const applyEventPagination = () => {
    // Apply filters
    let filtered = allEventRegistrations
    if (searchTerm) {
      filtered = filtered.filter((reg: any) => 
        reg.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.eventTitle?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter((reg: any) => reg.status === statusFilter)
    }
    if (earlyBirdFilter !== 'all') {
      if (earlyBirdFilter === 'used') {
        filtered = filtered.filter((reg: any) => (reg.earlyBirdDiscountAmt || 0) > 0)
      } else {
        filtered = filtered.filter((reg: any) => !(reg.earlyBirdDiscountAmt || 0) > 0)
      }
    }
    if (couponFilter !== 'all') {
      if (couponFilter === 'used') {
        filtered = filtered.filter((reg: any) => (reg.couponDiscount || 0) > 0)
      } else {
        filtered = filtered.filter((reg: any) => !(reg.couponDiscount || 0) > 0)
      }
    }
    if (paymentDateFilter) {
      const filterDate = new Date(paymentDateFilter).toDateString()
      filtered = filtered.filter((reg: any) => {
        const regDate = new Date(reg.registrationDate || reg.createdAt).toDateString()
        return regDate === filterDate
      })
    }
    if (amountFilter !== 'all') {
      if (amountFilter === 'free') {
        filtered = filtered.filter((reg: any) => (reg.amountPaid || reg.ticketPrice || 0) === 0)
      } else if (amountFilter === 'paid') {
        filtered = filtered.filter((reg: any) => (reg.amountPaid || reg.ticketPrice || 0) > 0)
      } else if (amountFilter === 'range') {
        const min = parseFloat(amountMin) || 0
        const max = parseFloat(amountMax) || Infinity
        filtered = filtered.filter((reg: any) => {
          const amount = reg.amountPaid || reg.ticketPrice || 0
          return amount >= min && amount <= max
        })
      }
    }
    
    // Apply pagination
    const pageSize = 10
    const totalPages = Math.ceil(filtered.length / pageSize)
    setEventTotalPages(totalPages)
    
    const startIndex = (eventCurrentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedRegistrations = filtered.slice(startIndex, endIndex)
    
    setEventRegistrations(paginatedRegistrations)
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
          // Calculate total revenue only for completed orders with paid status
          const allOrdersResponse = await apiClient.get(`/orders/admin/all?clubId=${clubId}&limit=1000`)
          if (allOrdersResponse.success && allOrdersResponse.data) {
            const allOrders = allOrdersResponse.data.data?.orders || []
            const completedPaidRevenue = allOrders
              .filter(order => order.status === 'completed' && order.paymentStatus === 'paid')
              .reduce((sum, order) => sum + (order.finalAmount || order.total || 0), 0)

            setStats({
              ...apiStats,
              totalRevenue: completedPaidRevenue
            })
          } else {
            setStats(apiStats)
          }
        } else {
          setStats(null)
        }
      }
    } catch (error) {
      // console.error('Error loading stats:', error)
    }
  }

  const refreshOrders = async () => {
    setRefreshing(true)
    await loadOrders()
    if (typeFilter === 'events') {
      await loadEventRegistrations()
    }
    await loadStats()
    setRefreshing(false)
  }

  const handleDownloadReport = async () => {
    if (typeFilter === 'events') {
      try {
        // Apply the same filters as applyEventPagination but export all (no pagination)
        let filtered = allEventRegistrations
        if (searchTerm) {
          filtered = filtered.filter((reg: any) =>
            reg.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reg.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reg.eventTitle?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }
        if (statusFilter !== 'all') {
          filtered = filtered.filter((reg: any) => reg.status === statusFilter)
        }
        if (earlyBirdFilter !== 'all') {
          if (earlyBirdFilter === 'used') {
            filtered = filtered.filter((reg: any) => (reg.earlyBirdDiscountAmt || 0) > 0)
          } else {
            filtered = filtered.filter((reg: any) => !(reg.earlyBirdDiscountAmt || 0) > 0)
          }
        }
        if (couponFilter !== 'all') {
          if (couponFilter === 'used') {
            filtered = filtered.filter((reg: any) => (reg.couponDiscount || 0) > 0)
          } else {
            filtered = filtered.filter((reg: any) => !(reg.couponDiscount || 0) > 0)
          }
        }
        if (paymentDateFilter) {
          const filterDate = new Date(paymentDateFilter).toDateString()
          filtered = filtered.filter((reg: any) => {
            const regDate = new Date(reg.registrationDate || reg.createdAt).toDateString()
            return regDate === filterDate
          })
        }
        if (amountFilter !== 'all') {
          if (amountFilter === 'free') {
            filtered = filtered.filter((reg: any) => (reg.amountPaid || reg.ticketPrice || 0) === 0)
          } else if (amountFilter === 'paid') {
            filtered = filtered.filter((reg: any) => (reg.amountPaid || reg.ticketPrice || 0) > 0)
          } else if (amountFilter === 'range') {
            const min = parseFloat(amountMin) || 0
            const max = parseFloat(amountMax) || Infinity
            filtered = filtered.filter((reg: any) => {
              const amount = reg.amountPaid || reg.ticketPrice || 0
              return amount >= min && amount <= max
            })
          }
        }

        const headers = [
          'Name', 'Email', 'Event', 'Status', 'Amount Paid',
          'Currency', 'Early Bird Discount', 'Coupon Code', 'Coupon Discount',
          'Points Discount', 'Payment ID', 'Order ID', 'Registration Date'
        ]
        const rows = filtered.map((reg: any) => [
          reg.userName || '',
          reg.userEmail || '',
          reg.eventTitle || '',
          reg.status || '',
          reg.amountPaid ?? reg.ticketPrice ?? 0,
          reg.currency || 'USD',
          reg.earlyBirdDiscountAmt ?? 0,
          reg.couponCode || '',
          reg.couponDiscount ?? 0,
          reg.pointsDiscount ?? 0,
          reg.paymentId || '',
          reg.orderId || '',
          reg.registrationDate ? new Date(reg.registrationDate).toLocaleString() : ''
        ])

        const csvContent = [headers, ...rows]
          .map(row => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
          .join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        triggerBlobDownload(blob, `event_registrations_report_${Date.now()}.csv`)
        toast({ title: 'Report downloaded', description: 'Event registrations report downloaded successfully.' })
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
      // console.error('Error updating order status:', error)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
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
      // console.error('Error cancelling order:', error)
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
      // console.error('Error updating payment status:', error)
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      })
    }
  }

  const handleViewRegistrationDetails = async (reg: any) => {
    setSelectedRegistrationMeta(reg)
    setSelectedRegistration(null)
    setShowRegistrationModal(true)
    const registrationId = reg.registrationId || reg._id
    if (registrationId) {
      setRegistrationLoading(true)
      try {
        const res = await apiClient.getRegistrationById(String(registrationId))
        if (res.success && res.data?.registration) {
          setSelectedRegistration(res.data.registration)
        }
      } catch {
        // leave null, modal will show meta only
      } finally {
        setRegistrationLoading(false)
      }
    }
  }

  const formatDate = (dateString: string) => formatLocalDate(dateString, 'long')

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Order Management</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Manage customer orders and fulfillment</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button variant="secondary" onClick={handleDownloadReport} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
            <Button onClick={refreshOrders} disabled={refreshing} className="w-full sm:w-auto">
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {((typeFilter === 'products' && stats) || (typeFilter === 'events' && eventStats)) && (
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
                  {typeFilter === 'events' ? eventStats?.totalOrders : stats?.totalOrders}
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
                  {typeFilter === 'events' ? eventStats?.pendingOrders : stats?.pendingOrders}
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
                  {typeFilter === 'events' ? eventStats?.completedOrders : stats?.completedOrders}
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
                  {typeFilter === 'events' ? (eventStats?.totalRevenue ? formatCurrency(eventStats.totalRevenue, 'INR') : '₹0') : (stats?.totalRevenue ? formatCurrency(stats.totalRevenue, 'INR') : '₹0')}
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
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            ) : (typeFilter === 'events' ? eventRegistrations.length === 0 : orders.length === 0) ? (
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
                      const StatusIcon = statusConfig[order.status].icon
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
                            <Badge className={statusConfig[order.status].color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[order.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={paymentStatusConfig[order.paymentStatus].color}>
                              {paymentStatusConfig[order.paymentStatus].label}
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
                                  {order.status !== 'cancelled' && order.status !== 'delivered' && (
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
                      const regStatus = reg.status || 'confirmed'
                      const StatusIcon = regStatus === 'confirmed' ? CheckCircle : (regStatus === 'cancelled' ? XCircle : Clock)
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
                                ? (reg.amountPaid > 0 ? formatCurrency(reg.amountPaid, reg.currency || 'USD') : 'Free')
                                : (reg.ticketPrice ? formatCurrency(reg.ticketPrice, reg.currency || 'USD') : 'Free')}
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
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-muted-foreground hover:text-foreground"
                              onClick={() => handleViewRegistrationDetails(reg)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
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
                        <Badge className={statusConfig[selectedOrder.status].color}>
                          {statusConfig[selectedOrder.status].label}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Method:</span>
                        <span className="capitalize">{selectedOrder.paymentMethod.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Status:</span>
                        <Badge className={paymentStatusConfig[selectedOrder.paymentStatus].color}>
                          {paymentStatusConfig[selectedOrder.paymentStatus].label}
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

                {/* Shipping Address */}
                <div>
                  <h3 className="font-semibold mb-3">Shipping Address</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium">
                        {selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}
                      </div>
                      <div>{selectedOrder.shippingAddress.address}</div>
                      <div>
                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                      </div>
                      <div>{selectedOrder.shippingAddress.country}</div>
                    </div>
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
                    <div className="bg-gray-50 p-4 rounded-lg text-sm">
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
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{selectedRegistrationMeta?.userEmail || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Event:</span>
                      <span>{selectedRegistrationMeta?.eventTitle || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={
                        selectedRegistrationMeta?.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        selectedRegistrationMeta?.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {selectedRegistrationMeta?.status
                          ? selectedRegistrationMeta.status.charAt(0).toUpperCase() + selectedRegistrationMeta.status.slice(1)
                          : 'Confirmed'}
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
                  const currency = meta?.currency || 'USD'
                  const ticketPrice = meta?.ticketPrice ?? 0
                  const numAttendees = selectedRegistration?.attendees?.length ?? 1
                  const originalTotal = ticketPrice * numAttendees
                  const amountPaid = meta?.amountPaid
                  const couponCode = meta?.couponCode
                  const couponDiscount = meta?.couponDiscount ?? 0
                  const earlyBirdAmt = meta?.earlyBirdDiscountAmt ?? 0
                  const pointsDiscount = meta?.pointsDiscount ?? 0
                  const base = Math.max(originalTotal - earlyBirdAmt - couponDiscount - pointsDiscount, 0)
                  const fees = base > 0 ? calculateTransactionFees(base) : null

                  return (
                    <div>
                      <h3 className="font-semibold mb-3">Payment Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {numAttendees > 1
                              ? `Ticket Price (${numAttendees} × ${formatCurrency(ticketPrice, currency)}):`
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
                    <h3 className="font-semibold mb-3">Attendees ({selectedRegistration.attendees.length})</h3>
                    <div className="space-y-2">
                      {selectedRegistration.attendees.map((att: any, idx: number) => (
                        <div key={att._id || idx} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                          <div>
                            <div className="font-medium">{att.name || `Attendee ${idx + 1}`}</div>
                            {att.phone && <div className="text-muted-foreground text-xs">{att.phone}</div>}
                            {att.email && <div className="text-muted-foreground text-xs">{att.email}</div>}
                          </div>
                          <Badge variant={att.attended ? 'default' : 'secondary'}>
                            {att.attended ? 'Attended' : 'Not Attended'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRegistrationModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
