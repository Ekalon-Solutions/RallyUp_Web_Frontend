"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { AddProductModal } from "@/components/modals/add-product-modal"

const productCategories = [
  "All Categories",
  "Apparel",
  "Accessories",
  "Match Day Essentials",
  "Away Day Gear",
  "Scarves & Banners",
  "Vintage Collection",
]

const sampleProducts = [
  {
    id: 1,
    name: "Club Jersey 2025",
    category: "Apparel",
    price: "₹1,299",
    weight: "280 g",
    stock: 45,
    status: "Active",
    sales: 23,
    preOrder: true,
    memberOnly: false,
    customizable: true,
  },
  {
    id: 2,
    name: "Club Scarf",
    category: "Scarves & Banners",
    price: "₹599",
    weight: "150 g",
    stock: 12,
    status: "Low Stock",
    sales: 67,
    preOrder: false,
    memberOnly: true,
    customizable: false,
  },
  {
    id: 3,
    name: "Club Away Day T-Shirt",
    category: "Away Day Gear",
    price: "₹799",
    weight: "200 g",
    stock: 100,
    status: "Active",
    sales: 42,
    preOrder: false,
    memberOnly: false,
    customizable: true,
  },
]

export default function StorePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Your Club Store</h1>
          <AddProductModal />
        </div>

        {/* Store Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">22</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹89,450</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">3</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Merchandise</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input placeholder="Search products..." className="pl-10 w-64" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {productCategories.map((category) => (
                      <SelectItem key={category} value={category.toLowerCase().replace(/ /g, "-")}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pre-Order</TableHead>
                  <TableHead>Member Only</TableHead>
                  <TableHead>Customizable</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.price}</TableCell>
                    <TableCell>{product.weight}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{product.sales}</TableCell>
                    <TableCell>
                      <Badge variant={product.status === "Low Stock" ? "destructive" : "secondary"}>
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{product.preOrder ? "Yes" : "No"}</TableCell>
                    <TableCell>{product.memberOnly ? "Yes" : "No"}</TableCell>
                    <TableCell>{product.customizable ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Bulk order options available for away day groups. Contact us for details.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
