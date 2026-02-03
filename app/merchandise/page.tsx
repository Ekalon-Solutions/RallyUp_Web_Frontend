"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProductViewModal } from "@/components/modals/product-view-modal"
import { CartModal } from "@/components/modals/cart-modal"
import { CheckoutModal } from "@/components/modals/checkout-modal"
import { CartIcon } from "@/components/cart-icon"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import { useCart } from "@/contexts/cart-context"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { 
  ShoppingBag, 
  Search, 
  Tag, 
  Star, 
  Package,
  Grid3X3,
  List,
  ShoppingCart,
  Image as ImageIcon,
  Eye,
  CreditCard
} from "lucide-react"

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
    logo?: string
  }
  createdAt: string
  updatedAt: string
}

export default function MerchandisePage() {
  const { addToCart } = useCart()
  const selectedClubId = useRequiredClubId()
  const [clubId, setClubId] = useState<string | null>(null)
  const [merchandise, setMerchandise] = useState<Merchandise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
     const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Merchandise | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isCartModalOpen, setIsCartModalOpen] = useState(false)
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false)
  const [directCheckoutItems, setDirectCheckoutItems] = useState<any[] | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const fromQuery = new URLSearchParams(window.location.search).get("clubId") || ""
    setClubId(selectedClubId || (fromQuery ? fromQuery : null))
  }, [selectedClubId])

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
    if (clubId === null) return
    fetchMerchandise()
  }, [page, searchTerm, categoryFilter, sortBy, showFeaturedOnly, clubId])

  useEffect(() => {
    if (clubId !== null) return
    setMerchandise([])
    setLoading(false)
  }, [clubId])

  const fetchMerchandise = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      })

             if (searchTerm) params.append('search', searchTerm)
       if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter)
       if (showFeaturedOnly) params.append('featured', 'true')
       if (clubId) params.append('clubId', clubId)

      const response = await apiClient.get(`/merchandise/public?${params}`)
      
      if (response.data) {
        let items = response.data.merchandise || []
        
        if (items.length > 0) {
        }
        
        switch (sortBy) {
          case 'price-low':
            items.sort((a: Merchandise, b: Merchandise) => a.price - b.price)
            break
          case 'price-high':
            items.sort((a: Merchandise, b: Merchandise) => b.price - a.price)
            break
          case 'name':
            items.sort((a: Merchandise, b: Merchandise) => a.name.localeCompare(b.name))
            break
          case 'newest':
          default:
            items.sort((a: Merchandise, b: Merchandise) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            break
        }
        
        setMerchandise(items)
        setTotalPages(response.data.pagination?.pages || 1)
      }
    } catch (error) {
      toast.error('Failed to load merchandise')
    } finally {
      setLoading(false)
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
    if (stockQuantity === 0) return { label: 'Out of Stock', color: 'text-red-600' }
    if (stockQuantity <= 5) return { label: 'Low Stock', color: 'text-yellow-600' }
    return { label: 'In Stock', color: 'text-green-600' }
  }

  const handleAddToCart = (item: Merchandise) => {
    addToCart({
      _id: item._id,
      name: item.name,
      price: item.price,
      currency: item.currency,
      featuredImage: item.featuredImage,
      stockQuantity: item.stockQuantity,
      tags: item.tags,
      club: item.club
    })
    toast.success(`${item.name} added to cart`)
  }

  const handleViewProduct = (item: Merchandise) => {
    setSelectedProduct(item)
    setIsProductModalOpen(true)
  }

  const handleBuyNow = (item: Merchandise, quantity: number = 1) => {
    setDirectCheckoutItems([{
      _id: item._id,
      name: item.name,
      price: item.price,
      currency: item.currency,
      quantity: quantity,
      featuredImage: item.featuredImage,
      stockQuantity: item.stockQuantity,
      tags: item.tags,
      club: item.club
    }])
    setIsProductModalOpen(false)
    setIsCheckoutModalOpen(true)
  }

  if (!clubId) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Card>
            <CardContent className="py-10 text-center space-y-3">
              <h2 className="text-xl font-semibold">No club selected</h2>
              <p className="text-muted-foreground">
                Please select a club to browse merchandise.
              </p>
              <Button onClick={() => (window.location.href = "/splash")}>
                Go to Club Selection
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-center space-y-4 flex-1">
            <h1 className="text-4xl font-bold">Club Merchandise</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Support your club with official merchandise. From apparel to collectibles, 
              find everything you need to show your team spirit.
            </p>
          </div>
          <div className="ml-4">
            <CartIcon onClick={() => setIsCartModalOpen(true)} />
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
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

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full lg:w-[180px]">
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

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>

              {/* Featured Toggle */}
              <Button
                variant={showFeaturedOnly ? "default" : "outline"}
                onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
                className="w-full lg:w-auto"
              >
                <Star className="w-4 h-4 mr-2" />
                Featured Only
              </Button>

              {/* View Mode Toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Merchandise Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Loading merchandise...</span>
            </div>
          </div>
        ) : merchandise.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {merchandise.map((item) => {
                  const stockStatus = getStockStatus(item.stockQuantity)
                  return (
                    <Card key={item._id} className="group hover:shadow-lg transition-shadow">
                      <CardHeader className="p-0">
                        <div className="relative">
                          {item.featuredImage ? (
                            <img
                              src={item.featuredImage}
                              alt={item.name}
                              className="w-full h-48 object-cover rounded-t-lg"
                            />
                          ) : (
                            <div className="w-full h-48 bg-gray-100 rounded-t-lg flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          
                          {/* Featured Badge */}
                          {item.isFeatured && (
                            <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}

                          {/* Stock Status */}
                          <Badge 
                            className={`absolute top-2 right-2 ${
                              stockStatus.color === 'text-red-600' ? 'bg-red-100 text-red-800' :
                              stockStatus.color === 'text-yellow-600' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}
                          >
                            {stockStatus.label}
                          </Badge>

                          {/* Quick Actions */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-t-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleViewProduct(item)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                             <Button
                                size="sm"
                                onClick={() => handleAddToCart(item)}
                                disabled={item.stockQuantity === 0}
                              >
                                <ShoppingCart className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleBuyNow(item)}
                                disabled={item.stockQuantity === 0}
                              >
                                <CreditCard className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge className={getCategoryColor(item.category)}>
                              {getCategoryIcon(item.category)}
                              <span className="ml-1 capitalize">{item.category}</span>
                            </Badge>
                            <div className="flex items-center text-lg font-bold">
                              {formatCurrency(item.price, item.currency)}
                            </div>
                          </div>
                          
                          <h3 
                            className="font-semibold text-lg line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleViewProduct(item)}
                          >
                            {item.name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                          
                            {item.tags && Array.isArray(item.tags) && item.tags.length > 0 && (
                             <div className="flex flex-wrap gap-1">
                               {(() => {
                                 // Handle case where tags might be stored as JSON string
                                 let parsedTags = item.tags;
                                 if (item.tags.length === 1 && typeof item.tags[0] === 'string' && item.tags[0].startsWith('[')) {
                                   try {
                                     parsedTags = JSON.parse(item.tags[0]);
                                   } catch (e) {
                                     parsedTags = item.tags;
                                   }
                                 }
                                 return parsedTags.slice(0, 3).map((tag, index) => (
                                   <Badge key={index} variant="outline" className="text-xs">
                                     {tag}
                                   </Badge>
                                 ));
                               })()}
                               {(() => {
                                 let parsedTags = item.tags;
                                 if (item.tags.length === 1 && typeof item.tags[0] === 'string' && item.tags[0].startsWith('[')) {
                                   try {
                                     parsedTags = JSON.parse(item.tags[0]);
                                   } catch (e) {
                                     parsedTags = item.tags;
                                   }
                                 }
                                 return parsedTags.length > 3 && (
                                   <Badge variant="outline" className="text-xs">
                                     +{parsedTags.length - 3} more
                                   </Badge>
                                 );
                               })()}
                             </div>
                           )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {merchandise.map((item) => {
                  const stockStatus = getStockStatus(item.stockQuantity)
                  return (
                    <Card key={item._id} className="group hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          {/* Product Image */}
                          <div className="relative w-24 h-24 flex-shrink-0">
                            {item.featuredImage ? (
                              <img
                                src={item.featuredImage}
                                alt={item.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            
                            {item.isFeatured && (
                              <Badge className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs">
                                <Star className="w-2 h-2 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                                              <div className="flex-1 min-w-0">
                                <h3 
                                  className="font-semibold text-lg mb-1 cursor-pointer hover:text-primary transition-colors"
                                  onClick={() => handleViewProduct(item)}
                                >
                                  {item.name}
                                </h3>
                                <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                                  {item.description}
                                </p>
                                
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className={getCategoryColor(item.category)}>
                                    {getCategoryIcon(item.category)}
                                    <span className="ml-1 capitalize">{item.category}</span>
                                  </Badge>
                                  <Badge 
                                    variant="outline"
                                    className={
                                      stockStatus.color === 'text-red-600' ? 'border-red-200 text-red-600' :
                                      stockStatus.color === 'text-yellow-600' ? 'border-yellow-200 text-yellow-600' :
                                      'border-green-200 text-green-600'
                                    }
                                  >
                                    {stockStatus.label}
                                  </Badge>
                                </div>

                   {item.tags && Array.isArray(item.tags) && item.tags.length > 0 && (
                                   <div className="flex flex-wrap gap-1">
                                     {(() => {
                                       // Handle case where tags might be stored as JSON string
                                       let parsedTags = item.tags;
                                       if (item.tags.length === 1 && typeof item.tags[0] === 'string' && item.tags[0].startsWith('[')) {
                                         try {
                                           parsedTags = JSON.parse(item.tags[0]);
                                         } catch (e) {
                                           parsedTags = item.tags;
                                         }
                                       }
                                       return parsedTags.slice(0, 5).map((tag, index) => (
                                         <Badge key={index} variant="outline" className="text-xs">
                                           {tag}
                                         </Badge>
                                       ));
                                     })()}
                                     {(() => {
                                       let parsedTags = item.tags;
                                       if (item.tags.length === 1 && typeof item.tags[0] === 'string' && item.tags[0].startsWith('[')) {
                                         try {
                                           parsedTags = JSON.parse(item.tags[0]);
                                         } catch (e) {
                                           parsedTags = item.tags;
                                         }
                                       }
                                       return parsedTags.length > 5 && (
                                         <Badge variant="outline" className="text-xs">
                                           +{parsedTags.length - 5} more
                                         </Badge>
                                       );
                                     })()}
                                   </div>
                                 )}
                              </div>

                              {/* Price and Actions */}
                              <div className="flex flex-col items-end space-y-2 ml-4">
                                <div className="flex items-center text-xl font-bold">
                                  {formatCurrency(item.price, item.currency)}
                                </div>
                                
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewProduct(item)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                 <Button
                                    size="sm"
                                    onClick={() => handleAddToCart(item)}
                                    disabled={item.stockQuantity === 0}
                                  >
                                    <ShoppingCart className="w-4 h-4 mr-1" />
                                    Add to Cart
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleBuyNow(item)}
                                    disabled={item.stockQuantity === 0}
                                  >
                                    <CreditCard className="w-4 h-4 mr-1" />
                                    Buy Now
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* Product View Modal */}
        <ProductViewModal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false)
            setSelectedProduct(null)
          }}
          product={selectedProduct}
          onBuyNow={handleBuyNow}
        />

        {/* Cart Modal */}
        <CartModal
          isOpen={isCartModalOpen}
          onClose={() => setIsCartModalOpen(false)}
          onCheckout={() => setIsCheckoutModalOpen(true)}
        />

        {/* Checkout Modal */}
        <CheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => {
            setIsCheckoutModalOpen(false)
            setDirectCheckoutItems(null)
          }}
          onSuccess={() => {
            toast.success('Order placed successfully!')
            setIsCheckoutModalOpen(false)
            setDirectCheckoutItems(null)
          }}
          directCheckoutItems={directCheckoutItems || undefined}
        />
      </div>
    </DashboardLayout>
  )
}
