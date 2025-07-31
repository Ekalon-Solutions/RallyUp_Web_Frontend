"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Save, Upload, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

interface ProductVariant {
  id: string
  size: string
  color: string
  price: number
  quantity: number
  sold: number
}

export default function AddProductPage() {
  const [productData, setProductData] = useState({
    status: "Live",
    name: "",
    displayOn: {
      web: false,
      registration: false,
    },
    description: "",
    category: "",
    tags: "",
  })

  const [variants, setVariants] = useState<ProductVariant[]>([
    { id: "1", size: "One Size", color: "No Color", price: 0, quantity: 0, sold: 0 },
  ])

  const handleInputChange = (field: string, value: string | boolean | object) => {
    setProductData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDisplayOnChange = (platform: string, checked: boolean) => {
    setProductData((prev) => ({
      ...prev,
      displayOn: { ...prev.displayOn, [platform]: checked },
    }))
  }

  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: Date.now().toString(),
      size: "One Size",
      color: "No Color",
      price: 0,
      quantity: 0,
      sold: 0,
    }
    setVariants((prev) => [...prev, newVariant])
  }

  const removeVariant = (id: string) => {
    setVariants((prev) => prev.filter((variant) => variant.id !== id))
  }

  const updateVariant = (id: string, field: keyof ProductVariant, value: string | number) => {
    setVariants((prev) => prev.map((variant) => (variant.id === id ? { ...variant, [field]: value } : variant)))
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/store">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Store
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Add Product</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* General Information */}
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <p className="text-sm text-muted-foreground">
                Products can be set to show across your website, a standalone web page, the app and with registration
                packages.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={productData.status} onValueChange={(value) => handleInputChange("status", value)}>
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
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter product name"
                  value={productData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Display On *</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="web"
                      checked={productData.displayOn.web}
                      onCheckedChange={(checked) => handleDisplayOnChange("web", checked as boolean)}
                    />
                    <Label htmlFor="web">Web</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="registration"
                      checked={productData.displayOn.registration}
                      onCheckedChange={(checked) => handleDisplayOnChange("registration", checked as boolean)}
                    />
                    <Label htmlFor="registration">Registration</Label>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter product description"
                  value={productData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={productData.category} onValueChange={(value) => handleInputChange("category", value)}>
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
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Product Image */}
          <Card>
            <CardHeader>
              <CardTitle>Product Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">Click to upload product image</p>
                <p className="text-xs text-muted-foreground">Recommended: 800x800px, JPG or PNG</p>
                <Button variant="outline" className="mt-4 bg-transparent">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quantity/Price */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Quantity/Price</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Set quantity and price by size or size/color combination
                  </p>
                </div>
                <Button onClick={addVariant} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Variant
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Size</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Sale Price (₹)</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Sold</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((variant) => (
                    <TableRow key={variant.id}>
                      <TableCell>
                        <Select
                          value={variant.size}
                          onValueChange={(value) => updateVariant(variant.id, "size", value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="One Size">One Size</SelectItem>
                            <SelectItem value="XS">XS</SelectItem>
                            <SelectItem value="S">S</SelectItem>
                            <SelectItem value="M">M</SelectItem>
                            <SelectItem value="L">L</SelectItem>
                            <SelectItem value="XL">XL</SelectItem>
                            <SelectItem value="XXL">XXL</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={variant.color}
                          onValueChange={(value) => updateVariant(variant.id, "color", value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Select color" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="No Color">No Color</SelectItem>
                            <SelectItem value="Red">Red</SelectItem>
                            <SelectItem value="Blue">Blue</SelectItem>
                            <SelectItem value="Green">Green</SelectItem>
                            <SelectItem value="Black">Black</SelectItem>
                            <SelectItem value="White">White</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={variant.price}
                          onChange={(e) => updateVariant(variant.id, "price", Number.parseInt(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={variant.quantity}
                          onChange={(e) => updateVariant(variant.id, "quantity", Number.parseInt(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>{variant.sold}</TableCell>
                      <TableCell>{variant.quantity - variant.sold}</TableCell>
                      <TableCell>
                        {variants.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => removeVariant(variant.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="lg:col-span-2 flex justify-end gap-4">
            <Link href="/dashboard/store">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button>
              <Save className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
