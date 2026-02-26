"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Upload } from "lucide-react"

interface AddProductModalProps {
  trigger?: React.ReactNode
}

export function AddProductModal({ trigger }: AddProductModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    weight: "",
    stock: "",
    status: "Live",
    displayOn: {
      web: false,
      registration: false,
    },
    memberOnly: false,
    preOrder: false,
    customizable: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // console.log("Adding product:", formData)
    setOpen(false)
    // Reset form
    setFormData({
      name: "",
      category: "",
      description: "",
      price: "",
      weight: "",
      stock: "",
      status: "Live",
      displayOn: {
        web: false,
        registration: false,
      },
      memberOnly: false,
      preOrder: false,
      customizable: false,
    })
  }

  const handleDisplayOnChange = (platform: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      displayOn: { ...prev.displayOn, [platform]: checked },
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>Add a new product to your club store</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              placeholder="Enter product name (e.g., 'Official Club Jersey')"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Jerseys">Jerseys</SelectItem>
                <SelectItem value="Scarves">Scarves</SelectItem>
                <SelectItem value="T-Shirts">T-Shirts</SelectItem>
                <SelectItem value="Accessories">Accessories</SelectItem>
                <SelectItem value="Memorabilia">Memorabilia</SelectItem>
                <SelectItem value="Tickets">Tickets</SelectItem>
                <SelectItem value="Fan Kits">Fan Kits</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Product description (e.g., 'High-quality replica jersey...')"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                placeholder="1299"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stock">Stock Quantity *</Label>
              <Input
                id="stock"
                type="number"
                placeholder="50"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="weight">Weight (g)</Label>
            <Input
              id="weight"
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 200"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Live">Live</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Display On</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="web"
                  checked={formData.displayOn.web}
                  onCheckedChange={(checked) => handleDisplayOnChange("web", checked as boolean)}
                />
                <Label htmlFor="web">Web</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="registration"
                  checked={formData.displayOn.registration}
                  onCheckedChange={(checked) => handleDisplayOnChange("registration", checked as boolean)}
                />
                <Label htmlFor="registration">Registration</Label>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Product Image</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to upload product image</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="memberOnly">Members Only</Label>
                <p className="text-sm text-muted-foreground">Only club members can purchase</p>
              </div>
              <Switch
                id="memberOnly"
                checked={formData.memberOnly}
                onCheckedChange={(checked) => setFormData({ ...formData, memberOnly: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="preOrder">Pre-Order</Label>
                <p className="text-sm text-muted-foreground">Allow pre-orders for this product</p>
              </div>
              <Switch
                id="preOrder"
                checked={formData.preOrder}
                onCheckedChange={(checked) => setFormData({ ...formData, preOrder: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="customizable">Customizable</Label>
                <p className="text-sm text-muted-foreground">Allow name/number customization</p>
              </div>
              <Switch
                id="customizable"
                checked={formData.customizable}
                onCheckedChange={(checked) => setFormData({ ...formData, customizable: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Product</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
