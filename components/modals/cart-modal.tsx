"use client"

import React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  DollarSign,
  Package,
  Image as ImageIcon,
  ShoppingBag
} from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { toast } from "sonner"

interface CartModalProps {
  isOpen: boolean
  onClose: () => void
  onCheckout: () => void
}

export function CartModal({ isOpen, onClose, onCheckout }: CartModalProps) {
  const { 
    items, 
    totalItems, 
    totalPrice, 
    updateQuantity, 
    removeFromCart, 
    clearCart 
  } = useCart()

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
      toast.success("Item removed from cart")
    } else {
      updateQuantity(itemId, newQuantity)
    }
  }

  const handleRemoveItem = (itemId: string, itemName: string) => {
    removeFromCart(itemId)
    toast.success(`${itemName} removed from cart`)
  }

  const handleClearCart = () => {
    clearCart()
    toast.success("Cart cleared")
  }

  const handleCheckout = () => {
    onCheckout()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Shopping Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </DialogTitle>
          <DialogDescription>
            Review your items before checkout
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingBag className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-4">
                Add some products to get started
              </p>
              <Button onClick={onClose}>
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item._id} className="flex gap-4 p-4 border rounded-lg">
                  {/* Product Image */}
                  <div className="w-16 h-16 flex-shrink-0">
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
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                      {item.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Sold by {item.club.name}
                    </p>
                    
                    {/* Tags */}
                    {item.tags && Array.isArray(item.tags) && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
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
                    
                    {/* Price */}
                    <div className="flex items-center text-lg font-bold mb-3">
                      ₹ {item.price.toFixed(2)}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border rounded-md">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="px-3 py-1 min-w-[2rem] text-center text-sm">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                          disabled={item.quantity >= item.stockQuantity}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Stock Warning */}
                      {item.quantity >= item.stockQuantity && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          Max stock
                        </Badge>
                      )}

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item._id, item.name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      ₹ {(item.price * item.quantity).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.quantity} × {item.price.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <>
            <Separator />
            
            {/* Cart Summary */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total ({totalItems} items):</span>
                <span className="text-2xl font-bold">
                  ₹ {totalPrice.toFixed(2)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClearCart}
                  className="flex-1"
                >
                  Clear Cart
                </Button>
                <Button
                  onClick={handleCheckout}
                  className="flex-1"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Checkout
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
