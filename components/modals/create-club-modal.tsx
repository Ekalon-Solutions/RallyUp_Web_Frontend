"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import { Building2, Mail, Phone, Globe, MapPin, User, Shield } from "lucide-react"

interface CreateClubModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateClubModal({ isOpen, onClose, onSuccess }: CreateClubModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo: "",
    website: "",
    contactEmail: "",
    contactPhone: "",
    countryCode: "+1",
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      zipCode: ""
    },
    settings: {
      allowPublicRegistration: true,
      requireApproval: false,
      maxMembers: 1000
    },
    superAdminEmail: "",
    superAdminPhone: "",
    superAdminCountryCode: "+1"
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await apiClient.createClub(formData)
      
      if (response.success) {
        toast.success("Club created successfully!")
        onSuccess()
        onClose()
        // Reset form
        setFormData({
          name: "",
          description: "",
          logo: "",
          website: "",
          contactEmail: "",
          contactPhone: "",
          countryCode: "+1",
          address: {
            street: "",
            city: "",
            state: "",
            country: "",
            zipCode: ""
          },
          settings: {
            allowPublicRegistration: true,
            requireApproval: false,
            maxMembers: 1000
          },
          superAdminEmail: "",
          superAdminPhone: "",
          superAdminCountryCode: "+1"
        })
      } else {
        toast.error(response.error || "Failed to create club")
      }
    } catch (error) {
      console.error("Create club error:", error)
      toast.error("An error occurred while creating the club")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Create New Club
          </DialogTitle>
          <DialogDescription>
            Create a new club and assign a super admin to manage it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Club Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Club Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Club Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter club name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    placeholder="https://example.com"
                    type="url"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter club description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                value={formData.logo}
                onChange={(e) => handleInputChange("logo", e.target.value)}
                placeholder="https://example.com/logo.png"
                type="url"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="contactEmail"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                    placeholder="contact@club.com"
                    type="email"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone *</Label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div className="flex gap-2">
                    <Input
                      value={formData.countryCode}
                      onChange={(e) => handleInputChange("countryCode", e.target.value)}
                      className="w-20"
                      placeholder="+1"
                    />
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                      placeholder="1234567890"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Address
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={formData.address.street}
                onChange={(e) => handleInputChange("address.street", e.target.value)}
                placeholder="123 Main Street"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange("address.city", e.target.value)}
                  placeholder="New York"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange("address.state", e.target.value)}
                  placeholder="NY"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.address.country}
                  onChange={(e) => handleInputChange("address.country", e.target.value)}
                  placeholder="United States"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                <Input
                  id="zipCode"
                  value={formData.address.zipCode}
                  onChange={(e) => handleInputChange("address.zipCode", e.target.value)}
                  placeholder="10001"
                />
              </div>
            </div>
          </div>

          {/* Club Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Club Settings
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Public Registration</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to join this club without approval
                  </p>
                </div>
                <Switch
                  checked={formData.settings.allowPublicRegistration}
                  onCheckedChange={(checked) => handleInputChange("settings.allowPublicRegistration", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    Require admin approval for new members
                  </p>
                </div>
                <Switch
                  checked={formData.settings.requireApproval}
                  onCheckedChange={(checked) => handleInputChange("settings.requireApproval", checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxMembers">Maximum Members</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  value={formData.settings.maxMembers}
                  onChange={(e) => handleInputChange("settings.maxMembers", parseInt(e.target.value) || 1000)}
                  placeholder="1000"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Super Admin Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Super Admin Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="superAdminEmail">Super Admin Email *</Label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="superAdminEmail"
                    value={formData.superAdminEmail}
                    onChange={(e) => handleInputChange("superAdminEmail", e.target.value)}
                    placeholder="admin@club.com"
                    type="email"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="superAdminPhone">Super Admin Phone *</Label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div className="flex gap-2">
                    <Input
                      value={formData.superAdminCountryCode}
                      onChange={(e) => handleInputChange("superAdminCountryCode", e.target.value)}
                      className="w-20"
                      placeholder="+1"
                    />
                    <Input
                      id="superAdminPhone"
                      value={formData.superAdminPhone}
                      onChange={(e) => handleInputChange("superAdminPhone", e.target.value)}
                      placeholder="1234567890"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating Club..." : "Create Club"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

