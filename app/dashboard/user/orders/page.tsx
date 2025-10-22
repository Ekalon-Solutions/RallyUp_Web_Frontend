"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { apiClient } from '@/lib/api'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Search,
  RefreshCw,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Download
} from 'lucide-react'

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
  currency: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
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

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-800', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800', icon: XCircle }
}

const paymentStatusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800' }
}

export default function UserOrdersPage() {
  const { user } = useAuth()
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

  useEffect(() => {
    if (user) {
      loadOrders()
    }
  }, [user])

  useEffect(() => {
    if (user) {
      setCurrentPage(1)
      loadOrders()
    }
  }, [searchTerm, statusFilter])

  useEffect(() => {
    if (user && currentPage > 1) {
      loadOrders()
    }
  }, [currentPage])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter })
      })

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
      console.error('Error loading orders:', error)
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
    };

    try {
      const res = await apiClient.downloadMyOrdersReport(params);
      if (!res.success) {
        toast({ title: 'Error', description: res.error || 'Failed to download report', variant: 'destructive' });
      } else {
        toast({ title: 'Report downloaded', description: 'Your orders report downloaded successfully.' });
      }
    } catch (error) {
      console.error('Error downloading my orders report:', error);
      toast({ title: 'Error', description: 'Failed to download report', variant: 'destructive' });
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
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
        return 'Credit Card'
    }
  }

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
              View and track your past orders
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
                          <p className="font-medium text-foreground">{formatCurrency(order.total, order.currency)}</p>
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
                    <div className="flex justify-between">
                      <span className="text-foreground">Subtotal:</span>
                      <span className="text-foreground">{formatCurrency(selectedOrder.subtotal, selectedOrder.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground">Shipping:</span>
                      <span className="text-foreground">{formatCurrency(selectedOrder.shippingCost, selectedOrder.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground">Tax:</span>
                      <span className="text-foreground">{formatCurrency(selectedOrder.tax, selectedOrder.currency)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span className="text-foreground">Total:</span>
                      <span className="text-foreground">{formatCurrency(selectedOrder.total, selectedOrder.currency)}</span>
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
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowOrderModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
