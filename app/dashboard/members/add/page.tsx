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
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

export default function AddMemberPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    birthday: { month: "", date: "", year: "" },
    userRole: "",
    notes: "",
    package: "Official Club Member",
    officialClubMember: "",
    streetName: "",
    address2: "",
    hometown: "",
    city: "",
    state: "",
    country: "India", // Default to India
    zip: "",
    memberSince: "",
    referrer: "",
    referrerNumber: "",
    seasonTicketHolder: false,
    chapters: "",
    section: "",
    numberOfSeats: "",
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleBirthdayChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      birthday: { ...prev.birthday, [field]: value },
    }))
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/members">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Members
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Add Member</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Enter full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Birthday</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Select
                    value={formData.birthday.month}
                    onValueChange={(value) => handleBirthdayChange("month", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {new Date(0, i).toLocaleString("default", { month: "long" })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={formData.birthday.date} onValueChange={(value) => handleBirthdayChange("date", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Date" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={formData.birthday.year} onValueChange={(value) => handleBirthdayChange("year", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 50 }, (_, i) => (
                        <SelectItem key={2024 - i} value={(2024 - i).toString()}>
                          {2024 - i}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="userRole">User Role</Label>
                <Select value={formData.userRole} onValueChange={(value) => handleInputChange("userRole", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Enter notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="streetName">Street Name</Label>
                <Input
                  id="streetName"
                  placeholder="Enter street name"
                  value={formData.streetName}
                  onChange={(e) => handleInputChange("streetName", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address2">Address 2</Label>
                <Input
                  id="address2"
                  placeholder="Enter address 2"
                  value={formData.address2}
                  onChange={(e) => handleInputChange("address2", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="hometown">Hometown</Label>
                <Input
                  id="hometown"
                  placeholder="Enter hometown"
                  value={formData.hometown}
                  onChange={(e) => handleInputChange("hometown", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Enter city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state">State/Province/Region</Label>
                  <Input
                    id="state"
                    placeholder="Enter state"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="country">Country</Label>
                  <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="USA">United States</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zip">Zip</Label>
                  <Input
                    id="zip"
                    placeholder="Enter zip code"
                    value={formData.zip}
                    onChange={(e) => handleInputChange("zip", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Membership Details */}
          <Card>
            <CardHeader>
              <CardTitle>Membership Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="package">Package</Label>
                <Select value={formData.package} onValueChange={(value) => handleInputChange("package", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Official Club Member">Official Club Member</SelectItem>
                    <SelectItem value="Premium Member">Premium Member</SelectItem>
                    <SelectItem value="VIP Member">VIP Member</SelectItem>
                    <SelectItem value="Student Member">Student Member</SelectItem>
                    <SelectItem value="Family Member">Family Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="memberSince">Member Since</Label>
                <Input
                  id="memberSince"
                  type="date"
                  value={formData.memberSince}
                  onChange={(e) => handleInputChange("memberSince", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="referrer">Referrer</Label>
                <Input
                  id="referrer"
                  placeholder="Enter referrer name"
                  value={formData.referrer}
                  onChange={(e) => handleInputChange("referrer", e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="seasonTicketHolder"
                  checked={formData.seasonTicketHolder}
                  onCheckedChange={(checked) => handleInputChange("seasonTicketHolder", checked as boolean)}
                />
                <Label htmlFor="seasonTicketHolder">Season Ticket Holder</Label>
              </div>

              {formData.seasonTicketHolder && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="section">Section</Label>
                    <Input
                      id="section"
                      placeholder="Enter section"
                      value={formData.section}
                      onChange={(e) => handleInputChange("section", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="numberOfSeats">No. of seats</Label>
                    <Input
                      id="numberOfSeats"
                      type="number"
                      placeholder="Enter number of seats"
                      value={formData.numberOfSeats}
                      onChange={(e) => handleInputChange("numberOfSeats", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="lg:col-span-2 flex justify-end gap-4">
            <Link href="/dashboard/members">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button>
              <Save className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
