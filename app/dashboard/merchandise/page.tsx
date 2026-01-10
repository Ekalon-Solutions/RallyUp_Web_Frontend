"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { CreateMerchandiseModal } from "@/components/modals/create-merchandise-modal"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { 
  ShoppingBag, 
  Search, 
  Tag, 
  Eye, 
  Plus, 
  Image as ImageIcon,
  Edit,
  Trash2,
  EyeOff,
  Filter,
  RefreshCw,
  Package,
  Star,
  AlertTriangle,
  Settings,
  Truck,
  Percent
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface Merchandise {
  _id: string
  name: string
  description: string
  price: number
  currency: string
  category: 'apparel' | 'accessories' | 'collectibles' | 'digital' | 'other'
  images: string[]
  featuredImage?: string
  stockQuantity: number
  isAvailable: boolean
  isFeatured: boolean
  tags: string[]
  club: {
    _id: string
    name: string
  }
  createdBy: {
    _id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

interface MerchandiseStats {
  totalMerchandise: number
  availableMerchandise: number
  featuredMerchandise: number
  lowStockMerchandise: number
  outOfStockMerchandise: number
  categoryStats: Array<{
    _id: string
    count: number
  }>
}

interface MerchandiseSettings {
  shippingCost: number
  freeShippingThreshold: number
  taxRate: number
  enableTax: boolean
  enableShipping: boolean
}

export default function MerchandiseManagementPage() {
  const { user, isAdmin } = useAuth()
  const [merchandise, setMerchandise] = useState<Merchandise[]>([])
  const [stats, setStats] = useState<MerchandiseStats | null>(null)
  const [settings, setSettings] = useState<MerchandiseSettings>({
    shippingCost: 0,
    freeShippingThreshold: 0,
    taxRate: 0,
    enableTax: false,
    enableShipping: false
  })
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
     const [categoryFilter, setCategoryFilter] = useState("all")
   const [availabilityFilter, setAvailabilityFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingMerchandise, setEditingMerchandise] = useState<Merchandise | null>(null)

  const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
    const localeMap: Record<string, string> = {
      'USD': 'en-US',
      'INR': 'en-IN',
      'EUR': 'en-EU',
      'GBP': 'en-GB',
      'CAD': 'en-CA',
      'AUD': 'en-AU',
      'JPY': 'ja-JP',
      'BRL': 'pt-BR',
      'MXN': 'es-MX',
      'ZAR': 'en-ZA'
    }
    const locale = localeMap[currencyCode] || 'en-US'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode
    }).format(amount)
  }

  useEffect(() => {
    if (isAdmin) {
      fetchMerchandise()
      fetchStats()
      fetchSettings()
    }
  }, [page, searchTerm, categoryFilter, availabilityFilter, isAdmin])

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
            <p className="text-sm text-gray-500">Current user role: {user?.role || 'Unknown'}</p>
            <p className="text-sm text-gray-500 mt-2">
              Please log in as an admin to manage merchandise.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => window.location.href = '/dashboard'}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const fetchMerchandise = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })

             if (searchTerm) params.append('search', searchTerm)
       if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter)
       if (availabilityFilter && availabilityFilter !== 'all') params.append('isAvailable', availabilityFilter)

      const response = await apiClient.get(`/merchandise/admin?${params}`)
      
      if (response.data) {
        setMerchandise(response.data.merchandise || [])
        setTotalPages(response.data.pagination?.pages || 1)
      }
    } catch (error: any) {
      // console.error('Error fetching merchandise:', error)
      if (error?.errorDetails?.status === 401) {
        toast.error('Admin access required. Please log in as an admin.')
        // Redirect to login or dashboard
        window.location.href = '/dashboard'
      } else {
        toast.error('Failed to fetch merchandise')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/merchandise/admin/stats')
      if (response.data) {
        setStats(response.data)
      }
    } catch (error: any) {
      // console.error('Error fetching stats:', error)
      if (error?.errorDetails?.status === 401) {
        toast.error('Admin access required. Please log in as an admin.')
        window.location.href = '/dashboard'
      }
    }
  }

  const fetchSettings = async () => {
    try {
      // console.log('📦 [Frontend] Fetching settings...')
      const response = await apiClient.getMerchandiseSettings()
      // console.log('📦 [Frontend] Fetched settings response:', response)
      // The response structure is: { success: true, data: { success: true, data: { clubId, clubName, settings } } }
      // OR: { success: true, data: { clubId, clubName, settings } }
      const settingsData = response.data?.data?.settings || response.data?.settings
      if (response.success && settingsData) {
        // console.log('📦 [Frontend] Setting state with:', settingsData)
        setSettings(settingsData)
      }
    } catch (error: any) {
      // console.error('Error fetching settings:', error)
    }
  }

  const saveSettings = async () => {
    try {
      setSettingsLoading(true)
      // console.log('📦 [Frontend] Saving settings:', settings)
      const response = await apiClient.updateMerchandiseSettings(settings)
      // console.log('📦 [Frontend] Save response:', response)
      if (response.success) {
        toast.success('Settings saved successfully')
        setShowSettings(false)
      } else {
        // console.error('📦 [Frontend] Save failed:', response.error, response.errorDetails)
        toast.error(response.error || 'Failed to save settings')
      }
    } catch (error: any) {
      // console.error('📦 [Frontend] Save exception:', error)
      toast.error('Failed to save settings')
    } finally {
      setSettingsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this merchandise item?')) {
      return
    }

    try {
      await apiClient.delete(`/merchandise/admin/${id}`)
      toast.success('Merchandise deleted successfully')
      fetchMerchandise()
      fetchStats()
    } catch (error) {
      // console.error('Error deleting merchandise:', error)
      toast.error('Failed to delete merchandise')
    }
  }

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      await apiClient.patch(`/merchandise/admin/${id}/toggle-availability`)
      toast.success(`Merchandise ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      fetchMerchandise()
      fetchStats()
    } catch (error) {
      // console.error('Error toggling availability:', error)
      toast.error('Failed to update merchandise availability')
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'apparel': return <Package className="w-4 h-4" />
      case 'accessories': return <Tag className="w-4 h-4" />
      case 'collectibles': return <Star className="w-4 h-4" />
      case 'digital': return <ImageIcon className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'apparel': return 'bg-blue-100 text-blue-800'
      case 'accessories': return 'bg-green-100 text-green-800'
      case 'collectibles': return 'bg-purple-100 text-purple-800'
      case 'digital': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStockStatus = (stockQuantity: number) => {
    if (stockQuantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' }
    if (stockQuantity <= 5) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' }
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Merchandise Management</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Manage your club's merchandise and products</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => setShowSettings(!showSettings)} className="w-full sm:w-auto">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>

          {/* Shipping & Tax Settings */}
          {showSettings && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Shipping & Tax Settings
                </CardTitle>
                <CardDescription>
                  Configure shipping and tax rates for your merchandise orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Shipping Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <Label htmlFor="enableShipping">Enable Shipping Charges</Label>
                      </div>
                      <Switch
                        id="enableShipping"
                        checked={settings.enableShipping}
                        onCheckedChange={(checked) => setSettings({ ...settings, enableShipping: checked })}
                      />
                    </div>
                    
                    {settings.enableShipping && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="shippingCost">Shipping Cost (₹)</Label>
                          <Input
                            id="shippingCost"
                            type="number"
                            min="0"
                            step="0.01"
                            value={settings.shippingCost}
                            onChange={(e) => setSettings({ ...settings, shippingCost: parseFloat(e.target.value) || 0 })}
                            placeholder="Enter shipping cost"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="freeShippingThreshold">Free Shipping Threshold (₹)</Label>
                          <Input
                            id="freeShippingThreshold"
                            type="number"
                            min="0"
                            step="0.01"
                            value={settings.freeShippingThreshold}
                            onChange={(e) => setSettings({ ...settings, freeShippingThreshold: parseFloat(e.target.value) || 0 })}
                            placeholder="Order amount for free shipping (0 to disable)"
                          />
                          <p className="text-xs text-muted-foreground">
                            Orders above this amount will have free shipping. Set to 0 to always charge shipping.
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Tax Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-muted-foreground" />
                        <Label htmlFor="enableTax">Enable Tax</Label>
                      </div>
                      <Switch
                        id="enableTax"
                        checked={settings.enableTax}
                        onCheckedChange={(checked) => setSettings({ ...settings, enableTax: checked })}
                      />
                    </div>
                    
                    {settings.enableTax && (
                      <div className="space-y-2">
                        <Label htmlFor="taxRate">Tax Rate (%)</Label>
                        <Input
                          id="taxRate"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={settings.taxRate}
                          onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                          placeholder="Enter tax percentage"
                        />
                        <p className="text-xs text-muted-foreground">
                          Tax will be calculated as a percentage of the subtotal.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setShowSettings(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveSettings} disabled={settingsLoading}>
                    {settingsLoading ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Create/Edit Merchandise Modal */}
          <CreateMerchandiseModal
            isOpen={isAddDialogOpen}
            onClose={() => {
              setIsAddDialogOpen(false)
              setEditingMerchandise(null)
            }}
            onSuccess={() => {
              fetchMerchandise()
              fetchStats()
              setIsAddDialogOpen(false)
              setEditingMerchandise(null)
            }}
            editMerchandise={editingMerchandise}
          />

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalMerchandise}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.availableMerchandise}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Featured</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.featuredMerchandise}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.lowStockMerchandise}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>Manage your merchandise inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                                   <SelectContent>
                   <SelectItem value="all">All Categories</SelectItem>
                   <SelectItem value="apparel">Apparel</SelectItem>
                   <SelectItem value="accessories">Accessories</SelectItem>
                   <SelectItem value="collectibles">Collectibles</SelectItem>
                   <SelectItem value="digital">Digital</SelectItem>
                   <SelectItem value="other">Other</SelectItem>
                 </SelectContent>
                </Select>
                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                                   <SelectContent>
                   <SelectItem value="all">All Status</SelectItem>
                   <SelectItem value="true">Available</SelectItem>
                   <SelectItem value="false">Unavailable</SelectItem>
                 </SelectContent>
                </Select>
                <Button variant="outline" onClick={fetchMerchandise}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {/* Merchandise Table */}
              <div className="rounded-md border overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Product</TableHead>
                        <TableHead className="min-w-[120px]">Category</TableHead>
                        <TableHead className="min-w-[100px]">Price</TableHead>
                        <TableHead className="min-w-[100px]">Stock</TableHead>
                        <TableHead className="min-w-[120px]">Status</TableHead>
                        <TableHead className="min-w-[120px]">Created</TableHead>
                        <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Loading merchandise...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : merchandise.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center">
                            <ShoppingBag className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-gray-500">No merchandise found</p>
                            <Button 
                              variant="outline" 
                              className="mt-2"
                              onClick={() => setIsAddDialogOpen(true)}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add First Product
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      merchandise.map((item) => {
                        const stockStatus = getStockStatus(item.stockQuantity)
                        return (
                          <TableRow key={item._id}>
                            <TableCell>
                              <div className="flex items-center space-x-3 min-w-[200px]">
                                {item.featuredImage ? (
                                  <img
                                    src={item.featuredImage}
                                    alt={item.name}
                                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <ImageIcon className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium break-words">{item.name}</div>
                                  <div className="text-sm text-gray-500 truncate">
                                    {item.description}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getCategoryColor(item.category)}>
                                {getCategoryIcon(item.category)}
                                <span className="ml-1 capitalize">{item.category}</span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {formatCurrency(item.price, item.currency)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={stockStatus.color}>
                                {item.stockQuantity} units
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Badge variant={item.isAvailable ? "default" : "secondary"}>
                                  {item.isAvailable ? "Available" : "Unavailable"}
                                </Badge>
                                {item.isFeatured && (
                                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                    <Star className="w-3 h-3 mr-1" />
                                    Featured
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-500">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <Filter className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingMerchandise(item)
                                      setIsAddDialogOpen(true)
                                    }}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleToggleAvailability(item._id, item.isAvailable)}
                                  >
                                    {item.isAvailable ? (
                                      <>
                                        <EyeOff className="mr-2 h-4 w-4" />
                                        Make Unavailable
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Make Available
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(item._id)}
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
                      })
                    )}
                  </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
