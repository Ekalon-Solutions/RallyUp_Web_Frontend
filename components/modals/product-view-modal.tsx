"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Star, 
  Package, 
  Tag, 
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CreditCard
} from "lucide-react"
import { toast } from "sonner"
import { useCart } from "@/contexts/cart-context"

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

interface ProductViewModalProps {
  isOpen: boolean
  onClose: () => void
  product: Merchandise | null
  onBuyNow?: (item: Merchandise, quantity: number) => void
}

export function ProductViewModal({ isOpen, onClose, product, onBuyNow }: ProductViewModalProps) {
  const { addToCart, isInCart, getItemQuantity } = useCart()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)

  if (!product) return null

  const formatCurrency = (amount: number, currencyCode: string = product.currency || 'USD') => {
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

  const handleBuyNow = () => {
    if (onBuyNow) {
      onBuyNow(product, quantity)
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
    if (stockQuantity === 0) return { label: 'Out of Stock', color: 'text-red-600', bgColor: 'bg-red-100' }
    if (stockQuantity <= 5) return { label: 'Low Stock', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    return { label: 'In Stock', color: 'text-green-600', bgColor: 'bg-green-100' }
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart({
        _id: product._id,
        name: product.name,
        price: product.price,
        currency: product.currency,
        featuredImage: product.featuredImage,
        stockQuantity: product.stockQuantity,
        tags: product.tags,
        club: product.club
      })
    }
    toast.success(`${product.name} (${quantity}) added to cart`)
  }

  const handleAddToWishlist = () => {
    toast.success(`${product.name} added to wishlist`)
    // TODO: Implement wishlist functionality
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        })
      } catch (error) {
        // console.log('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Product link copied to clipboard')
    }
  }

  const nextImage = () => {
    if (product.images.length > 1) {
      setSelectedImageIndex((prev) => (prev + 1) % product.images.length)
    }
  }

  const prevImage = () => {
    if (product.images.length > 1) {
      setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
    }
  }

  const stockStatus = getStockStatus(product.stockQuantity)
  const currentImage = product.images[selectedImageIndex] || product.featuredImage

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Product Details
          </DialogTitle>
          <DialogDescription>
            View detailed information about this product
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-gray-400" />
                </div>
              )}

              {/* Image Navigation */}
              {product.images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={nextImage}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}

              {/* Featured Badge */}
              {product.isFeatured && (
                <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}

              {/* Stock Status */}
              <Badge className={`absolute top-2 right-2 ${stockStatus.bgColor} ${stockStatus.color}`}>
                {stockStatus.label}
              </Badge>
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                      selectedImageIndex === index ? 'border-primary' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Product Info */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={getCategoryColor(product.category)}>
                      {getCategoryIcon(product.category)}
                      <span className="ml-1 capitalize">{product.category}</span>
                    </Badge>
                    {product.isFeatured && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Price */}
              <div className="flex items-center text-3xl font-bold">
                {formatCurrency(product.price, product.currency)}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                {product.stockQuantity > 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                <span className={stockStatus.color}>
                  {product.stockQuantity > 0 
                    ? `${product.stockQuantity} units available`
                    : 'Out of stock'
                  }
                </span>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Description</h3>
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

                         {/* Tags */}
             {product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
               <div className="space-y-2">
                 <h3 className="text-lg font-semibold">Tags</h3>
                 <div className="flex flex-wrap gap-2">
                   {(() => {
                     // Handle case where tags might be stored as JSON string
                     let parsedTags = product.tags;
                     if (product.tags.length === 1 && typeof product.tags[0] === 'string' && product.tags[0].startsWith('[')) {
                       try {
                         parsedTags = JSON.parse(product.tags[0]);
                       } catch (e) {
                         parsedTags = product.tags;
                       }
                     }
                     return parsedTags.map((tag, index) => (
                       <Badge key={index} variant="outline">
                         {tag}
                       </Badge>
                     ));
                   })()}
                 </div>
               </div>
             )}

            <Separator />

            {/* Club Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {product.club.logo ? (
                    <img
                      src={product.club.logo}
                      alt={product.club.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Sold by</p>
                    <p className="font-semibold">{product.club.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quantity and Actions */}
            <div className="space-y-4">
              {/* Quantity Selector */}
              {product.stockQuantity > 0 && (
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Quantity:</label>
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                      disabled={quantity >= product.stockQuantity}
                    >
                      +
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleAddToWishlist}
                  className="flex-1"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Add to Wishlist
                </Button>
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stockQuantity === 0}
                  variant="outline"
                  className="flex-1"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  onClick={handleBuyNow}
                  disabled={product.stockQuantity === 0}
                  className="flex-1"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Buy Now
                </Button>
              </div>

              {product.stockQuantity === 0 && (
                <p className="text-sm text-red-600 text-center">
                  This product is currently out of stock
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
