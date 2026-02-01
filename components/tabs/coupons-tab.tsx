"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Ticket, Search, MoreHorizontal, Edit, Trash2, Plus, Filter, TrendingUp, Users, Calendar, BarChart3, CheckCircle, XCircle, Eye, ToggleLeft, ToggleRight } from "lucide-react"
import { CreateCouponModal } from "@/components/modals/create-coupon-modal"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import { formatLocalDate } from "@/lib/timezone"

interface Coupon {
  _id: string
  name: string
  description: string
  code: string
  discountType: 'flat' | 'percentage'
  discountValue: number
  maxUsage: number
  currentUsage: number
  startTime: string
  endTime: string
  eligibility: 'all' | 'members-only' | 'new-users' | 'specific-events'
  applicableEvents?: string[]
  minPurchaseAmount?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: {
    first_name: string
    last_name: string
    email: string
  }
}

interface CouponStats {
  totalUsage: number
  remainingUsage: number
  usagePercentage: number
  totalDiscountGiven: number
  recentUsage: Array<{
    userId: {
      first_name: string
      last_name: string
      email: string
    }
    usedAt: string
    eventId?: {
      title: string
      startTime: string
    }
    discountApplied: number
  }>
}

export function CouponsTab() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [eligibilityFilter, setEligibilityFilter] = useState<string>("all")

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null)
  const [viewingStats, setViewingStats] = useState<{ coupon: Coupon; stats: CouponStats } | null>(null)

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getCoupons()
      if (response.success && response.data?.coupons) {
        setCoupons(response.data.coupons)
      } else {
        toast.error(response.error || "Failed to fetch coupons")
      }
    } catch (error) {
      // console.error("Error fetching coupons:", error)
      toast.error("An error occurred while fetching coupons")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCoupon = () => {
    setEditingCoupon(null)
    setIsCreateModalOpen(true)
  }

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setIsCreateModalOpen(true)
  }

  const handleDeleteCoupon = async () => {
    if (!deletingCoupon) return

    try {
      const response = await apiClient.deleteCoupon(deletingCoupon._id)
      if (response.success) {
        toast.success(response.data?.message || "Coupon deleted successfully")
        fetchCoupons()
      } else {
        toast.error(response.error || "Failed to delete coupon")
      }
    } catch (error) {
      // console.error("Error deleting coupon:", error)
      toast.error("An error occurred while deleting the coupon")
    } finally {
      setDeletingCoupon(null)
    }
  }

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      const response = await apiClient.toggleCouponStatus(coupon._id, !coupon.isActive)
      if (response.success) {
        toast.success(response.data?.message || `Coupon ${!coupon.isActive ? 'activated' : 'deactivated'} successfully`)
        fetchCoupons()
      } else {
        toast.error(response.error || "Failed to toggle coupon status")
      }
    } catch (error) {
      // console.error("Error toggling coupon status:", error)
      toast.error("An error occurred while updating the coupon")
    }
  }

  const handleViewStats = async (coupon: Coupon) => {
    try {
      const response = await apiClient.getCouponStats(coupon._id)
      if (response.success && response.data) {
        setViewingStats({ coupon, stats: response.data.stats })
      } else {
        toast.error(response.error || "Failed to fetch coupon statistics")
      }
    } catch (error) {
      // console.error("Error fetching coupon stats:", error)
      toast.error("An error occurred while fetching statistics")
    }
  }

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = searchTerm === "" || 
      coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && coupon.isActive) ||
      (statusFilter === "inactive" && !coupon.isActive) ||
      (statusFilter === "expired" && new Date(coupon.endTime) < new Date()) ||
      (statusFilter === "upcoming" && new Date(coupon.startTime) > new Date())

    const matchesEligibility = eligibilityFilter === "all" || coupon.eligibility === eligibilityFilter

    return matchesSearch && matchesStatus && matchesEligibility
  })

  const formatDate = (dateString: string) => {
    return formatLocalDate(dateString, 'long')
  }

  const getCouponStatus = (coupon: Coupon) => {
    const now = new Date()
    const start = new Date(coupon.startTime)
    const end = new Date(coupon.endTime)

    if (!coupon.isActive) return { label: "Inactive", color: "bg-gray-100 text-gray-800" }
    if (now < start) return { label: "Upcoming", color: "bg-blue-100 text-blue-800" }
    if (now > end) return { label: "Expired", color: "bg-red-100 text-red-800" }
    if (coupon.currentUsage >= coupon.maxUsage) return { label: "Used Up", color: "bg-orange-100 text-orange-800" }
    return { label: "Active", color: "bg-green-100 text-green-800" }
  }

  const getEligibilityBadge = (eligibility: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      'all': { label: 'All Users', color: 'bg-purple-100 text-purple-800' },
      'members-only': { label: 'Members Only', color: 'bg-blue-100 text-blue-800' },
      'new-users': { label: 'New Users', color: 'bg-green-100 text-green-800' },
      'specific-events': { label: 'Specific Events', color: 'bg-orange-100 text-orange-800' }
    }
    return badges[eligibility] || badges['all']
  }

  const stats = {
    totalCoupons: coupons.length,
    activeCoupons: coupons.filter(c => {
      const now = new Date()
      return c.isActive && new Date(c.startTime) <= now && new Date(c.endTime) >= now && c.currentUsage < c.maxUsage
    }).length,
    totalUsage: coupons.reduce((sum, c) => sum + c.currentUsage, 0),
    totalDiscountGiven: coupons.reduce((sum, c) => {
      return sum + c.currentUsage * (c.discountType === 'flat' ? c.discountValue : 100)
    }, 0)
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCoupons}</div>
            <p className="text-xs text-muted-foreground">All coupon codes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCoupons}</div>
            <p className="text-xs text-muted-foreground">Currently valid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsage}</div>
            <p className="text-xs text-muted-foreground">Times used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalDiscountGiven.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Discounts given</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manage Coupons</CardTitle>
              <CardDescription>Create and manage discount coupons for events</CardDescription>
            </div>
            <Button onClick={handleCreateCoupon}>
              <Plus className="w-4 h-4 mr-2" />
              Create Coupon
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search coupons by name, code, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={eligibilityFilter} onValueChange={setEligibilityFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Users className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by eligibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="members-only">Members Only</SelectItem>
                <SelectItem value="new-users">New Users</SelectItem>
                <SelectItem value="specific-events">Specific Events</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">Loading coupons...</p>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/50">
              <Ticket className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-semibold">No coupons found</h3>
              <p className="text-muted-foreground mt-2">
                {searchTerm || statusFilter !== "all" || eligibilityFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by creating your first coupon"}
              </p>
              {!searchTerm && statusFilter === "all" && eligibilityFilter === "all" && (
                <Button onClick={handleCreateCoupon} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Coupon
                </Button>
              )}
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Eligibility</TableHead>
                    <TableHead>Valid Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoupons.map((coupon) => {
                    const status = getCouponStatus(coupon)
                    const eligibility = getEligibilityBadge(coupon.eligibility)
                    const usagePercentage = (coupon.currentUsage / coupon.maxUsage) * 100

                    return (
                      <TableRow key={coupon._id}>
                        <TableCell>
                          <code className="bg-black text-white px-2 py-1 rounded text-xs font-mono">
                            {coupon.code}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{coupon.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {coupon.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-600">
                            {coupon.discountType === 'percentage'
                              ? `${coupon.discountValue}%`
                              : `₹${coupon.discountValue}`}
                          </span>
                          {coupon.minPurchaseAmount && (
                            <div className="text-xs text-muted-foreground">
                              Min: ₹{coupon.minPurchaseAmount}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <div className="text-sm font-medium">
                                {coupon.currentUsage} / {coupon.maxUsage}
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    usagePercentage >= 100 ? 'bg-red-500' :
                                    usagePercentage >= 75 ? 'bg-orange-500' :
                                    'bg-blue-500'
                                  }`}
                                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={eligibility.color}>
                            {eligibility.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <div>{formatDate(coupon.startTime)}</div>
                            <div className="text-muted-foreground">to</div>
                            <div>{formatDate(coupon.endTime)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewStats(coupon)}>
                                <BarChart3 className="mr-2 h-4 w-4" />
                                View Statistics
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditCoupon(coupon)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(coupon)}>
                                {coupon.isActive ? (
                                  <>
                                    <ToggleLeft className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <ToggleRight className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingCoupon(coupon)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <CreateCouponModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setEditingCoupon(null)
        }}
        onSuccess={() => {
          fetchCoupons()
          setIsCreateModalOpen(false)
          setEditingCoupon(null)
        }}
        editCoupon={editingCoupon}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingCoupon} onOpenChange={() => setDeletingCoupon(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the coupon <strong>{deletingCoupon?.code}</strong>?
              {deletingCoupon && deletingCoupon.currentUsage > 0 && (
                <span className="block mt-2 text-orange-600">
                  Note: This coupon has been used {deletingCoupon.currentUsage} times and will be deactivated instead of deleted.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCoupon(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCoupon}>
              {deletingCoupon && deletingCoupon.currentUsage > 0 ? 'Deactivate' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Modal */}
      <Dialog open={!!viewingStats} onOpenChange={() => setViewingStats(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Coupon Statistics: {viewingStats?.coupon.code}
            </DialogTitle>
            <DialogDescription>
              Detailed usage statistics and recent activity
            </DialogDescription>
          </DialogHeader>
          {viewingStats && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{viewingStats.stats.totalUsage}</div>
                    <p className="text-xs text-muted-foreground">
                      {viewingStats.stats.remainingUsage} remaining
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${viewingStats.stats.usagePercentage}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Discount Given</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{viewingStats.stats.totalDiscountGiven.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      Total savings
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Usage Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {viewingStats.stats.usagePercentage.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Of maximum capacity
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Usage */}
              {viewingStats.stats.recentUsage.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Recent Usage</h4>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Event</TableHead>
                          <TableHead>Discount Applied</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewingStats.stats.recentUsage.map((usage, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="font-medium">
                                {usage.userId.first_name} {usage.userId.last_name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {usage.userId.email}
                              </div>
                            </TableCell>
                            <TableCell>
                              {usage.eventId ? (
                                <>
                                  <div className="font-medium">{usage.eventId.title}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatDate(usage.eventId.startTime)}
                                  </div>
                                </>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-green-600">
                                ₹{usage.discountApplied}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{formatDate(usage.usedAt)}</div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}