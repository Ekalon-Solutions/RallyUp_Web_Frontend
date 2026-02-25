"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Plus, UserPlus, CreditCard, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { getApiUrl } from "@/lib/config"
import { apiClient } from "@/lib/api"

interface MembershipPlan {
  _id: string
  name: string
  description: string
  price: number
  currency: string
  duration?: number
  planStartDate?: string
  planEndDate?: string
  features: {
    maxEvents: number
    maxNews: number
    maxMembers: number
    customBranding: boolean
    advancedAnalytics: boolean
    prioritySupport: boolean
    apiAccess: boolean
    customIntegrations: boolean
  }
  isActive: boolean
}

export type AddMemberResultStatus = 'added' | 'updated' | 'already_member'

interface AddMemberModalProps {
  trigger?: React.ReactNode
  onMemberAdded?: (result?: { name: string; email: string; status: AddMemberResultStatus }) => void
  clubId?: string | null
}

export function AddMemberModal({ trigger, onMemberAdded, clubId: clubIdProp }: AddMemberModalProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"user-info" | "membership-selection" | "success">("user-info")
  const [isLoading, setIsLoading] = useState(false)
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([])
  const { user } = useAuth()

  const [userData, setUserData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "male" as "male" | "female" | "non-binary",
    phoneNumber: "",
    countryCode: "+91",
    address_line1: "",
    address_line2: "",
    city: "",
    state_province: "",
    zip_code: "",
    country: "",
    id_proof_type: "Aadhar" as "Aadhar" | "Voter ID" | "Passport" | "Driver License" | "PAN",
    id_proof_number: "",
  })

  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null)
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true)
  const [lastAddStatus, setLastAddStatus] = useState<AddMemberResultStatus>('added')

  const resolvedClubId = clubIdProp ?? (user as any)?.club?._id ?? (user as any)?.clubs?.[0]?._id ?? (user as any)?.clubs?.[0]

  useEffect(() => {
    if (open && resolvedClubId) {
      fetchMembershipPlans()
    }
  }, [open, resolvedClubId])

  const fetchMembershipPlans = async () => {
    try {
      const clubId = resolvedClubId
      if (!clubId) {
        return
      }

      const response = await fetch(getApiUrl(`/membership-plans?clubId=${clubId}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setMembershipPlans(data.data.filter((plan: MembershipPlan) => plan.isActive) || [])
      }
    } catch (error) {
    }
  }

  const handleUserDataChange = (field: string, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }))
  }

  const validateUserData = () => {
    const requiredFields = [
      'username', 'email', 'first_name', 'last_name', 'date_of_birth',
      'gender', 'phoneNumber', 'address_line1', 'city', 'state_province',
      'zip_code', 'country', 'id_proof_type', 'id_proof_number'
    ]
    for (const field of requiredFields) {
      if (!userData[field as keyof typeof userData]) {
        toast.error(`Please fill in ${field.replace('_', ' ')}`)
        return false
      }
    }
    if (!/^[a-zA-Z0-9_.'-]+$/.test(userData.username)) {
      toast.error("Username can only contain letters, numbers, underscores, periods, apostrophes, and hyphens")
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(userData.email)) {
      toast.error("Please enter a valid email address")
      return false
    }
    if (!/^\d{9,15}$/.test(userData.phoneNumber)) {
      toast.error("Please enter a valid phone number (9-15 digits)")
      return false
    }
    return true
  }

  const handleNextStep = () => {
    if (step === "user-info") {
      if (validateUserData()) {
        setStep("membership-selection")
      }
    } else if (step === "membership-selection") {
      if (selectedPlan) {
        setStep("success")
      } else if (membershipPlans.length === 0) {
        setStep("success")
      } else {
        toast.error("Please select a membership plan")
      }
    }
  }

  const handlePreviousStep = () => {
    if (step === "membership-selection") {
      setStep("user-info")
    } else if (step === "success") {
      setStep("membership-selection")
    }
  }

  const handleSubmit = async () => {
    if (isLoading) return
    setIsLoading(true)

    const clubId = resolvedClubId
    if (!clubId) {
      toast.error('Please select a club first')
      setIsLoading(false)
      return
    }

    const name = `${userData.first_name} ${userData.last_name}`.trim() || userData.username || 'Member'
    try {
      const response = await apiClient.adminAddMember({
        name,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        countryCode: userData.countryCode,
        club_id: clubId,
        membership_plan_id: selectedPlan?._id,
        username: userData.username || undefined,
        first_name: userData.first_name || undefined,
        last_name: userData.last_name || undefined,
        date_of_birth: userData.date_of_birth || undefined,
        gender: userData.gender || undefined,
        address_line1: userData.address_line1 || undefined,
        address_line2: userData.address_line2 || undefined,
        city: userData.city || undefined,
        state_province: userData.state_province || undefined,
        zip_code: userData.zip_code || undefined,
        country: userData.country || undefined,
        id_proof_type: userData.id_proof_type || undefined,
        id_proof_number: userData.id_proof_number || undefined,
      })

      if (!response.success) {
        throw new Error((response as any).error || response.error || 'Failed to add member')
      }

      const data = response.data as { existingUser?: boolean; alreadyMember?: boolean }
      let status: AddMemberResultStatus = 'added'
      if (data?.alreadyMember) status = 'already_member'
      else if (data?.existingUser) status = 'updated'
      setLastAddStatus(status)

      toast.success(
        status === 'already_member'
          ? 'User is already a member'
          : status === 'updated'
          ? 'Membership added for existing user'
          : 'Member created successfully!'
      )
      setStep("success")

      const result = { name, email: userData.email, status }
      onMemberAdded?.(result)

      setTimeout(() => {
        resetForm()
        setOpen(false)
      }, 2000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create member')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setUserData({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      date_of_birth: "",
      gender: "male",
      phoneNumber: "",
      countryCode: "+91",
      address_line1: "",
      address_line2: "",
      city: "",
      state_province: "",
      zip_code: "",
      country: "",
      id_proof_type: "Aadhar",
      id_proof_number: "",
    })
    setSelectedPlan(null)
    setSendWelcomeEmail(true)
    setStep("user-info")
  }

  const handleClose = () => {
    if (step !== "success") {
      resetForm()
    }
    setOpen(false)
  }

  const renderUserInfoStep = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="username">Username *</Label>
          <Input
            id="username"
            placeholder="Enter username"
            value={userData.username}
            onChange={(e) => handleUserDataChange("username", e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter email"
            value={userData.email}
            onChange={(e) => handleUserDataChange("email", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            placeholder="Enter first name"
            value={userData.first_name}
            onChange={(e) => handleUserDataChange("first_name", e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            placeholder="Enter last name"
            value={userData.last_name}
            onChange={(e) => handleUserDataChange("last_name", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="date_of_birth">Date of Birth *</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={userData.date_of_birth}
            onChange={(e) => handleUserDataChange("date_of_birth", e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="gender">Gender *</Label>
          <Select
            value={userData.gender}
            onValueChange={(value) => handleUserDataChange("gender", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="non-binary">Non-binary</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="phoneNumber">Phone Number *</Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="Enter phone number"
            value={userData.phoneNumber}
            onChange={(e) => handleUserDataChange("phoneNumber", e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="countryCode">Country Code</Label>
          <Select
            value={userData.countryCode}
            onValueChange={(value) => handleUserDataChange("countryCode", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="+91">+91 (India)</SelectItem>
              <SelectItem value="+1">+1 (USA/Canada)</SelectItem>
              <SelectItem value="+44">+44 (UK)</SelectItem>
              <SelectItem value="+61">+61 (Australia)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="address_line1">Address Line 1 *</Label>
        <Input
          id="address_line1"
          placeholder="Enter address"
          value={userData.address_line1}
          onChange={(e) => handleUserDataChange("address_line1", e.target.value)}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="address_line2">Address Line 2</Label>
        <Input
          id="address_line2"
          placeholder="Enter address (optional)"
          value={userData.address_line2}
          onChange={(e) => handleUserDataChange("address_line2", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            placeholder="Enter city"
            value={userData.city}
            onChange={(e) => handleUserDataChange("city", e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="state_province">State/Province *</Label>
          <Input
            id="state_province"
            placeholder="Enter state"
            value={userData.state_province}
            onChange={(e) => handleUserDataChange("state_province", e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="zip_code">ZIP Code *</Label>
          <Input
            id="zip_code"
            placeholder="Enter ZIP code"
            value={userData.zip_code}
            onChange={(e) => handleUserDataChange("zip_code", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="country">Country *</Label>
          <Input
            id="country"
            placeholder="Enter country"
            value={userData.country}
            onChange={(e) => handleUserDataChange("country", e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="id_proof_type">ID Proof Type *</Label>
          <Select
            value={userData.id_proof_type}
            onValueChange={(value) => handleUserDataChange("id_proof_type", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Aadhar">Aadhar</SelectItem>
              <SelectItem value="Voter ID">Voter ID</SelectItem>
              <SelectItem value="Passport">Passport</SelectItem>
              <SelectItem value="Driver License">Driver License</SelectItem>
              <SelectItem value="PAN">PAN Card</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="id_proof_number">ID Proof Number *</Label>
        <Input
          id="id_proof_number"
          placeholder="Enter ID proof number"
          value={userData.id_proof_number}
          onChange={(e) => handleUserDataChange("id_proof_number", e.target.value)}
          required
        />
      </div>
    </div>
  )

  const renderMembershipSelectionStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Select Membership Plan</h3>
        <p className="text-sm text-muted-foreground">Choose the right plan for your new member</p>
      </div>

      <div className="grid gap-4 max-h-[60vh] overflow-y-auto">
        {membershipPlans.map((plan) => (
          <div
            key={plan._id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedPlan?._id === plan._id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setSelectedPlan(plan)}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">{plan.name}</h4>
              <div className="text-right">
                <div className="text-lg font-bold">
                  {plan.price === 0 ? 'Free' : `${plan.currency} ${plan.price}`}
                </div>
                <div className="text-sm text-muted-foreground">
                  {plan.planStartDate && plan.planEndDate
                    ? `${new Date(plan.planStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(plan.planEndDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : plan.duration === 0
                    ? 'Lifetime'
                    : `${plan.duration ?? 0} months`}
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Events: {plan.features.maxEvents}</div>
              <div>News: {plan.features.maxNews}</div>
              <div>Members: {plan.features.maxMembers}</div>
              <div>Support: {plan.features.prioritySupport ? 'Priority' : 'Standard'}</div>
            </div>
          </div>
        ))}
      </div>

      {membershipPlans.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No membership plans available for this club.</p>
          <p className="text-sm">Please contact the club administrator.</p>
        </div>
      )}

      {/* <div className="flex items-center space-x-2 pt-4 border-t">
        <Checkbox
          id="sendWelcomeEmail"
          checked={sendWelcomeEmail}
          onCheckedChange={(checked) => setSendWelcomeEmail(checked as boolean)}
        />
        <Label htmlFor="sendWelcomeEmail">Send welcome email to new member</Label>
      </div> */}
    </div>
  )



  const renderSuccessStep = () => (
    <div className="text-center space-y-4 py-8">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
      <h3 className="text-xl font-semibold">
        {lastAddStatus === 'already_member' ? 'Already a Member' : lastAddStatus === 'updated' ? 'Membership Added' : 'Member Created Successfully!'}
      </h3>
      <p className="text-muted-foreground">
        {userData.first_name} {userData.last_name} has been {lastAddStatus === 'already_member' ? 'confirmed as' : 'added to'} the club.
        {selectedPlan && lastAddStatus !== 'already_member' && ` They are now on the ${selectedPlan.name} plan.`}
      </p>
    </div>
  )

  const renderStepContent = () => {
    switch (step) {
      case "user-info":
        return renderUserInfoStep()
      case "membership-selection":
        return renderMembershipSelectionStep()
      case "success":
        return renderSuccessStep()
      default:
        return renderUserInfoStep()
    }
  }

  const renderStepIndicator = () => {
    const steps = [
      { key: "user-info", label: "User Info", icon: UserPlus },
      { key: "membership-selection", label: "Plan", icon: CreditCard },
      { key: "success", label: "Done", icon: CheckCircle },
    ]

    return (
      <div className="flex items-center justify-center space-x-2 mb-6">
        {steps.map((stepItem, index) => {
          const Icon = stepItem.icon
          const isActive = step === stepItem.key
          const isCompleted = steps.findIndex(s => s.key === step) > index

          return (
            <div key={stepItem.key} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 h-1 mx-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderFooter = () => {
    if (step === "success") {
      return (
        <DialogFooter>
          <Button onClick={handleClose} className="w-full">
            Close
          </Button>
        </DialogFooter>
      )
    }

    return (
      <DialogFooter className="flex justify-between">
        {step !== "user-info" && (
          <Button type="button" variant="outline" onClick={handlePreviousStep}>
            Previous
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {step === "membership-selection" ? (
            <Button onClick={handleSubmit} disabled={isLoading || !selectedPlan}>
              {isLoading ? "Creating..." : "Create Member"}
            </Button>
          ) : (
            <Button onClick={handleNextStep}>
              Next
            </Button>
          )}
        </div>
      </DialogFooter>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogDescription>
            Create a new member and assign them to a membership plan
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}
        {renderStepContent()}
        {renderFooter()}
      </DialogContent>
    </Dialog>
  )
}
