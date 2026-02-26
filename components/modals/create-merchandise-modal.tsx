"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  ShoppingBag, 
  Upload, 
  X, 
  Plus,
  Package,
  Tag,
  Star,
  Image as ImageIcon,
  DollarSign,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

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
  weight?: number
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

interface CreateMerchandiseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editMerchandise?: Merchandise | null
  /** Selected club ID for new merchandise (so it appears in the current list) */
  clubId?: string | null
}

export function CreateMerchandiseModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editMerchandise,
  clubId 
}: CreateMerchandiseModalProps) {
  const { user, isAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [imageItems, setImageItems] = useState<{file?: File, preview: string}[]>([])
  const [newTag, setNewTag] = useState("")
  
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [currency, setCurrency] = useState("INR")
  const [category, setCategory] = useState<'apparel' | 'accessories' | 'collectibles' | 'digital' | 'other'>('other')
  const [stockQuantity, setStockQuantity] = useState("")
  const [weight, setWeight] = useState("")
  const [isAvailable, setIsAvailable] = useState(true)
  const [isFeatured, setIsFeatured] = useState(false)
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      if (editMerchandise) {
        setName(editMerchandise.name)
        setDescription(editMerchandise.description)
        setPrice(editMerchandise.price.toString())
        setCurrency(editMerchandise.currency)
        setCategory(editMerchandise.category)
        setStockQuantity(editMerchandise.stockQuantity.toString())
        setWeight(editMerchandise.weight != null ? String(editMerchandise.weight) : "")
        setIsAvailable(editMerchandise.isAvailable)
        setIsFeatured(editMerchandise.isFeatured)
        setTags(editMerchandise.tags)
        setImageItems(editMerchandise.images.map(img => ({ preview: img })))
      } else {
        setName("")
        setDescription("")
        setPrice("")
        setCurrency("INR")
        setCategory("other")
        setStockQuantity("")
        setWeight("")
        setIsAvailable(true)
        setIsFeatured(false)
        setTags([])
        setImageItems([])
      }
    }
  }, [isOpen, editMerchandise])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 10MB`)
        return false
      }
      return true
    })

    if (validFiles.length + imageItems.length > 5) {
      toast.error('Maximum 5 images allowed')
      return
    }

    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImageItems(prev => [...prev, { file, preview: e.target?.result as string }])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImageItems(prev => prev.filter((_, i) => i !== index))
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 10) {
      setTags(prev => [...prev, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAdmin) {
      toast.error('Admin access required to create merchandise')
      onClose()
      return
    }
    
    if (!editMerchandise && !clubId) {
      toast.error('No club selected. Please select a club from the sidebar first, then add a product.')
      return
    }

    if (!name.trim() || !description.trim() || !price.trim() || !stockQuantity.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    if (isNaN(Number(price)) || Number(price) < 0) {
      toast.error('Please enter a valid price')
      return
    }

    if (isNaN(Number(stockQuantity)) || Number(stockQuantity) < 0) {
      toast.error('Please enter a valid stock quantity')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('description', description.trim())
      formData.append('price', price)
      formData.append('currency', currency)
      formData.append('category', category)
      formData.append('stockQuantity', stockQuantity)
      if (weight.trim() !== "" && !isNaN(Number(weight)) && Number(weight) >= 0) {
        formData.append('weight', weight)
      }
      formData.append('isAvailable', isAvailable.toString())
      formData.append('isFeatured', isFeatured.toString())
      formData.append('tags', JSON.stringify(tags))
      if (!editMerchandise && clubId) {
        formData.append('clubId', clubId)
      }

      const existingImagesToKeep = imageItems
        .filter(item => !item.file)
        .map(item => item.preview)
      formData.append('existingImages', JSON.stringify(existingImagesToKeep))

      imageItems.forEach((item, index) => {
        if (item.file) {
          formData.append('images', item.file)
        }
      })

      let response
      if (editMerchandise) {
        response = await apiClient.put(`/merchandise/admin/${editMerchandise._id}`, formData)
        if (!response.success) {
          toast.error(response.message || response.error || 'Failed to update merchandise')
          return
        }
        toast.success('Merchandise updated successfully')
      } else {
        response = await apiClient.post('/merchandise/admin', formData)
        if (!response.success) {
          toast.error(response.message || response.error || 'Failed to create merchandise')
          return
        }
        toast.success('Merchandise created successfully')
      }

      onSuccess()
    } catch (error: any) {
      if (error?.errorDetails?.status === 401) {
        toast.error('Admin access required. Please log in as an admin.')
        onClose()
        window.location.href = '/dashboard'
      } else {
        const msg = error?.data?.message || error?.message || error?.error || 'Failed to save merchandise'
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'apparel': return <Package className="w-4 h-4" />
      case 'accessories': return <Tag className="w-4 h-4" />
      case 'collectibles': return <Star className="w-4 h-4" />
      case 'digital': return <ImageIcon className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            {editMerchandise ? "Edit Product" : "Create New Product"}
          </DialogTitle>
          <DialogDescription>
            {editMerchandise 
              ? "Update the product details and settings" 
              : "Add a new product to your merchandise catalog"
            }
          </DialogDescription>
        </DialogHeader>

        {!editMerchandise && !clubId && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>Select a club from the sidebar first so the new product is linked to the correct club and appears in the list.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your product..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apparel">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon('apparel')}
                        Apparel
                      </div>
                    </SelectItem>
                    <SelectItem value="accessories">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon('accessories')}
                        Accessories
                      </div>
                    </SelectItem>
                    <SelectItem value="collectibles">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon('collectibles')}
                        Collectibles
                      </div>
                    </SelectItem>
                    <SelectItem value="digital">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon('digital')}
                        Digital
                      </div>
                    </SelectItem>
                    <SelectItem value="other">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon('other')}
                        Other
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pricing & Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <div className="relative">
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                      <SelectItem value="BRL">BRL</SelectItem>
                      <SelectItem value="MXN">MXN</SelectItem>
                      <SelectItem value="ZAR">ZAR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  placeholder="Enter available quantity"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (g)</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0"
                  step="1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 200"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Product Images</CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload up to 5 images (max 10MB each)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Click to upload images or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 10MB each
                  </p>
                </label>
              </div>

              {imageItems.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imageItems.map((item, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={item.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tags</CardTitle>
              <p className="text-sm text-muted-foreground">
                Add tags to help customers find this product (max 10 tags)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter a tag"
                  maxLength={50}
                />
                <Button type="button" onClick={addTag} disabled={!newTag.trim() || tags.length >= 10}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Product Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Available for Purchase</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this product visible to customers
                  </p>
                </div>
                <Switch
                  checked={isAvailable}
                  onCheckedChange={setIsAvailable}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Featured Product</Label>
                  <p className="text-sm text-muted-foreground">
                    Highlight this product in featured sections
                  </p>
                </div>
                <Switch
                  checked={isFeatured}
                  onCheckedChange={setIsFeatured}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {editMerchandise ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editMerchandise ? 'Update Product' : 'Create Product'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
