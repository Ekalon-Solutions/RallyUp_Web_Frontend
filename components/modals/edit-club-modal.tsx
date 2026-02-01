"use client"

import { useState, useEffect } from 'react'
import { apiClient, Club, Admin } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Building2, 
  Save, 
  X,
  Mail,
  Phone,
  Globe,
  MapPin
} from 'lucide-react'

interface ClubWithDetails extends Club {
  superAdmin?: Admin
  createdBy?: {
    _id: string
    name: string
    email: string
  }
  stats?: any
}

interface EditClubModalProps {
  club: ClubWithDetails
  trigger?: React.ReactNode
  onClubUpdated?: () => void
}

interface ClubFormData {
  name: string
  slug?: string
  description: string
  contactEmail: string
  contactPhone: string
  website: string
  status: 'active' | 'inactive' | 'suspended'
  address: {
    street: string
    city: string
    state: string
    country: string
    zipCode: string
  }
}

export function EditClubModal({ club, trigger, onClubUpdated }: EditClubModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ClubFormData>({
    name: '',
    slug: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    status: 'active',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    }
  })

  useEffect(() => {
    if (club && open) {
      setFormData({
        name: club.name || '',
        slug: (club as any).slug || '',
        description: club.description || '',
        contactEmail: club.contactEmail || '',
        contactPhone: club.contactPhone || '',
        website: club.website || '',
        status: club.status || 'active',
        address: {
          street: club.address?.street || '',
          city: club.address?.city || '',
          state: club.address?.state || '',
          country: club.address?.country || '',
          zipCode: club.address?.zipCode || ''
        }
      })
    }
  }, [club, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Club name is required')
      return
    }

    if (!formData.contactEmail.trim()) {
      toast.error('Contact email is required')
      return
    }

    if (!formData.contactPhone.trim()) {
      toast.error('Contact phone is required')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.contactEmail)) {
      toast.error('Please enter a valid email address')
      return
    }

    // Validate slug if provided: URL-safe
    if (formData.slug) {
      const slugValue = formData.slug.trim()
      const slugRegex = /^[a-z0-9-]+$/
      if (!slugRegex.test(slugValue)) {
        toast.error('Slug must contain only lowercase letters, numbers, and hyphens')
        return
      }
      formData.slug = slugValue
    }

    // Validate phone number format (9-15 digits)
    const phoneRegex = /^\d{9,15}$/
    if (!phoneRegex.test(formData.contactPhone.replace(/\D/g, ''))) {
      toast.error('Phone number must be 9-15 digits')
      return
    }

    try {
      setLoading(true)
      
      const response = await apiClient.updateClub(club._id, formData)
      
      if (response.success) {
        toast.success('Club updated successfully!')
        setOpen(false)
        onClubUpdated?.()
      } else {
        toast.error(response.error || 'Failed to update club')
      }
    } catch (error) {
      // console.error('Error updating club:', error)
      toast.error('Failed to update club')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }))
  }

  const handlePhoneChange = (value: string) => {
    // Remove any non-digit characters and limit to 15 digits
    const phoneNumber = value.replace(/\D/g, '').slice(0, 15)
    setFormData(prev => ({
      ...prev,
      contactPhone: phoneNumber
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Building2 className="w-4 h-4 mr-2" />
            Edit Club
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Edit Club - {club.name}
          </DialogTitle>
          <DialogDescription>
            Update club information and settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Club Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter club name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="custom-club-slug"
                />
                <p className="text-xs text-muted-foreground">Only lowercase letters, numbers and hyphens allowed. Leave blank to keep current slug.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive' | 'suspended') => 
                    handleInputChange('status', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter club description"
                rows={3}
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
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="contact@club.com"
                  required
                />
                <p className={`text-xs ${formData.contactEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail) ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {formData.contactEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail) 
                    ? '✓ Valid email format' 
                    : 'Enter a valid email address'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone *</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="1234567890"
                  maxLength={15}
                  required
                />
                <p className={`text-xs ${formData.contactPhone.length >= 9 && formData.contactPhone.length <= 15 ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {formData.contactPhone.length >= 9 && formData.contactPhone.length <= 15 
                    ? '✓ Valid phone number format' 
                    : 'Enter phone number without country code (9-15 digits)'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://www.club.com"
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Address Information
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={formData.address.street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  placeholder="New York"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={formData.address.state}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
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
                  onChange={(e) => handleAddressChange('country', e.target.value)}
                  placeholder="United States"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                <Input
                  id="zipCode"
                  value={formData.address.zipCode}
                  onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                  placeholder="10001"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
