"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

interface AddProductModalProps {
  trigger?: React.ReactNode
}

export function AddProductModal({ trigger }: AddProductModalProps) {
  const { activeClubId } = useAuth()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    weight: "",
    stock: "",
    status: "Live",
    memberOnly: false,
    preOrder: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeClubId) {
      toast.error("Select a club before adding a product")
      return
    }
    setSubmitting(true)
    const payload = new FormData()
    payload.set("name", formData.name)
    payload.set("description", formData.description)
    payload.set("price", formData.price)
    payload.set("currency", "INR")
    payload.set("category", formData.category || "other")
    payload.set("stockQuantity", formData.stock)
    payload.set("weight", formData.weight ? String(Number(formData.weight) / 1000) : "")
    payload.set("isAvailable", String(formData.status === "Live"))
    payload.set("memberOnly", String(formData.memberOnly))
    payload.set("isPreorder", String(formData.preOrder))
    try {
      const response = await apiClient.createMerchandise(payload, activeClubId)
      if (!response.success) throw new Error(response.error || response.message || "Failed to add product")
      toast.success("Product added")
      setOpen(false)
      setFormData({
        name: "",
        category: "",
        description: "",
        price: "",
        weight: "",
        stock: "",
        status: "Live",
        memberOnly: false,
        preOrder: false,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add product")
    } finally {
      setSubmitting(false)
    }
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
                <SelectItem value="apparel">Apparel</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
                <SelectItem value="collectibles">Collectibles</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
                <SelectItem value="other">Other</SelectItem>
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

          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Adding…" : "Add Product"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
