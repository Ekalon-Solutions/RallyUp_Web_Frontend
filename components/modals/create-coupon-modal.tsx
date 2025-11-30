"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Ticket, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import config from "@/lib/config"

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
}

interface CreateCouponModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editCoupon?: Coupon | null
}

export function CreateCouponModal({ isOpen, onClose, onSuccess, editCoupon }: CreateCouponModalProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    code: "",
    discountType: "flat" as "flat" | "percentage",
    discountValue: "",
    maxUsage: "",
    startTime: "",
    endTime: "",
    eligibility: "all" as "all" | "members-only" | "new-users" | "specific-events",
    minPurchaseAmount: "",
  })

  // Reset form when modal opens/closes or when editing
  useEffect(() => {
    if (isOpen) {
      setErrors({})
      if (editCoupon) {
        setFormData({
          name: editCoupon.name,
          description: editCoupon.description,
          code: editCoupon.code,
          discountType: editCoupon.discountType,
          discountValue: editCoupon.discountValue.toString(),
          maxUsage: editCoupon.maxUsage.toString(),
          startTime: editCoupon.startTime.slice(0, 16),
          endTime: editCoupon.endTime.slice(0, 16),
          eligibility: editCoupon.eligibility,
          minPurchaseAmount: editCoupon.minPurchaseAmount?.toString() || "",
        })
      } else {
        // Set default values for new coupon
        const now = new Date()
        const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

        setFormData({
          name: "",
          description: "",
          code: "",
          discountType: "flat",
          discountValue: "",
          maxUsage: "100",
          startTime: now.toISOString().slice(0, 16),
          endTime: endDate.toISOString().slice(0, 16),
          eligibility: "all",
          minPurchaseAmount: "",
        })
      }
    }
  }, [isOpen, editCoupon])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Coupon name is required"
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Coupon name must be at least 3 characters"
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    }

    // Code validation
    if (!formData.code.trim()) {
      newErrors.code = "Coupon code is required"
    } else if (!/^[A-Z0-9-_]+$/.test(formData.code.toUpperCase())) {
      newErrors.code = "Code can only contain letters, numbers, hyphens, and underscores"
    } else if (formData.code.length < 4) {
      newErrors.code = "Code must be at least 4 characters"
    }

    // Discount value validation
    if (!formData.discountValue || parseFloat(formData.discountValue) <= 0) {
      newErrors.discountValue = "Discount value must be greater than 0"
    } else if (formData.discountType === "percentage" && parseFloat(formData.discountValue) > 100) {
      newErrors.discountValue = "Percentage cannot exceed 100%"
    }

    // Max usage validation
    if (!formData.maxUsage || parseInt(formData.maxUsage) < 1) {
      newErrors.maxUsage = "Max usage must be at least 1"
    }

    // Time validation
    if (!formData.startTime) {
      newErrors.startTime = "Start time is required"
    }
    if (!formData.endTime) {
      newErrors.endTime = "End time is required"
    } else if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      newErrors.endTime = "End time must be after start time"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fix the errors in the form")
      return
    }

    setLoading(true)

    try {
      const couponData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        code: formData.code.toUpperCase().trim(),
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        maxUsage: parseInt(formData.maxUsage),
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        eligibility: formData.eligibility,
        minPurchaseAmount: formData.minPurchaseAmount ? parseFloat(formData.minPurchaseAmount) : undefined,
      }

      const token = localStorage.getItem("token")
      const url = editCoupon 
        ? `${config.apiBaseUrl}/coupons/${editCoupon._id}`
        : `${config.apiBaseUrl}/coupons`
      
      const response = await fetch(url, {
        method: editCoupon ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(couponData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(editCoupon ? "Coupon updated successfully!" : "Coupon created successfully!")
        onSuccess()
        onClose()
      } else {
        toast.error(data.message || "Failed to save coupon")
      }
    } catch (error) {
      // console.error("Error saving coupon:", error)
      toast.error("An error occurred while saving the coupon")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setErrors({})
    const now = new Date()
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    setFormData({
      name: "",
      description: "",
      code: "",
      discountType: "flat",
      discountValue: "",
      maxUsage: "100",
      startTime: now.toISOString().slice(0, 16),
      endTime: endDate.toISOString().slice(0, 16),
      eligibility: "all",
      minPurchaseAmount: "",
    })
  }

  const hasErrors = Object.keys(errors).length > 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            {editCoupon ? "Edit Coupon" : "Create Coupon"}
          </DialogTitle>
          <DialogDescription>
            {editCoupon ? "Update coupon details" : "Create a discount coupon for events"}
          </DialogDescription>
        </DialogHeader>

        {/* Error Summary */}
        {hasErrors && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-red-800 font-medium mb-2">Please fix the following errors:</h4>
                <ul className="text-red-700 text-sm space-y-1">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Coupon Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Coupon Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter coupon name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                if (errors.name) {
                  const { name, ...rest } = errors
                  setErrors(rest)
                }
              }}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Enter coupon description"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value })
                if (errors.description) {
                  const { description, ...rest } = errors
                  setErrors(rest)
                }
              }}
              className={errors.description ? "border-red-500" : ""}
              rows={3}
            />
            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
          </div>

          {/* Coupon Code */}
          <div className="space-y-2">
            <Label htmlFor="code">
              Coupon Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="code"
              placeholder="Enter coupon code (e.g., SUMMER2024)"
              value={formData.code}
              onChange={(e) => {
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
                if (errors.code) {
                  const { code, ...rest } = errors
                  setErrors(rest)
                }
              }}
              className={errors.code ? "border-red-500" : ""}
              maxLength={20}
            />
            {errors.code && <p className="text-red-500 text-sm">{errors.code}</p>}
            <p className="text-xs text-muted-foreground">
              Will be auto-converted to uppercase. Only letters, numbers, hyphens, and underscores allowed.
            </p>
          </div>

          {/* Discount Type */}
          <div className="space-y-2">
            <Label>
              Discount Type <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={formData.discountType}
              onValueChange={(value: "flat" | "percentage") => setFormData({ ...formData, discountType: value })}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="flat" id="flat" />
                <Label htmlFor="flat" className="cursor-pointer">Flat</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage" className="cursor-pointer">Percentage</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Discount Value and Usage */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="discountValue">
                Discount {formData.discountType === "percentage" ? "(%)" : "(₹)"} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="discountValue"
                type="number"
                placeholder={formData.discountType === "percentage" ? "Enter percentage" : "Enter amount"}
                value={formData.discountValue}
                onChange={(e) => {
                  setFormData({ ...formData, discountValue: e.target.value })
                  if (errors.discountValue) {
                    const { discountValue, ...rest } = errors
                    setErrors(rest)
                  }
                }}
                className={errors.discountValue ? "border-red-500" : ""}
                min="0"
                max={formData.discountType === "percentage" ? "100" : undefined}
                step={formData.discountType === "percentage" ? "1" : "10"}
              />
              {errors.discountValue && <p className="text-red-500 text-sm">{errors.discountValue}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxUsage">
                Usage <span className="text-red-500">*</span>
              </Label>
              <Input
                id="maxUsage"
                type="number"
                placeholder="Enter maximum usage count"
                value={formData.maxUsage}
                onChange={(e) => {
                  setFormData({ ...formData, maxUsage: e.target.value })
                  if (errors.maxUsage) {
                    const { maxUsage, ...rest } = errors
                    setErrors(rest)
                  }
                }}
                className={errors.maxUsage ? "border-red-500" : ""}
                min="1"
              />
              {errors.maxUsage && <p className="text-red-500 text-sm">{errors.maxUsage}</p>}
              <p className="text-xs text-muted-foreground">Maximum number of times this coupon can be used</p>
            </div>
          </div>

          {/* Start and End Time */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startTime">
                Start Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => {
                  setFormData({ ...formData, startTime: e.target.value })
                  if (errors.startTime) {
                    const { startTime, ...rest } = errors
                    setErrors(rest)
                  }
                }}
                className={errors.startTime ? "border-red-500" : ""}
              />
              {errors.startTime && <p className="text-red-500 text-sm">{errors.startTime}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">
                End Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => {
                  setFormData({ ...formData, endTime: e.target.value })
                  if (errors.endTime) {
                    const { endTime, ...rest } = errors
                    setErrors(rest)
                  }
                }}
                className={errors.endTime ? "border-red-500" : ""}
              />
              {errors.endTime && <p className="text-red-500 text-sm">{errors.endTime}</p>}
            </div>
          </div>

          {/* Coupon Eligibility */}
          <div className="space-y-2">
            <Label htmlFor="eligibility">
              Coupon is valid for <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.eligibility}
              onValueChange={(value: "all" | "members-only" | "new-users" | "specific-events") =>
                setFormData({ ...formData, eligibility: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select coupon eligibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="members-only">Members Only</SelectItem>
                <SelectItem value="new-users">New Users Only</SelectItem>
                <SelectItem value="specific-events">Specific Events</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Minimum Purchase Amount (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="minPurchaseAmount">Minimum Purchase Amount (₹) - Optional</Label>
            <Input
              id="minPurchaseAmount"
              type="number"
              placeholder="Leave empty for no minimum"
              value={formData.minPurchaseAmount}
              onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
              min="0"
              step="10"
            />
            <p className="text-xs text-muted-foreground">
              Coupon will only apply to tickets above this amount
            </p>
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-semibold mb-3">Coupon Preview</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Code:</span>
                <code className="bg-black text-white px-2 py-1 rounded text-xs font-mono">
                  {formData.code || "COUPONCODE"}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Discount:</span>
                <span className="text-green-600 font-semibold">
                  {formData.discountType === "percentage"
                    ? `${formData.discountValue || "0"}% off`
                    : `₹${formData.discountValue || "0"} off`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Valid:</span>
                <span>
                  {formData.startTime ? new Date(formData.startTime).toLocaleDateString() : "—"} to{" "}
                  {formData.endTime ? new Date(formData.endTime).toLocaleDateString() : "—"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Max Uses:</span>
                <span>{formData.maxUsage || "0"} times</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <DialogFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={resetForm}>
              Reset Form
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || hasErrors}>
                {loading ? "Saving..." : editCoupon ? "Update Coupon" : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
