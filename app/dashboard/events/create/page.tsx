"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Upload } from "lucide-react"
import Link from "next/link"

export default function CreateEventPage() {
  const [eventData, setEventData] = useState({
    title: "",
    category: "Match Screening", // Changed default category
    startTime: "",
    endTime: "",
    bookingStart: "",
    bookingEnd: "",
    eventCode: "",
    timezone: "Asia/Kolkata", // Default to Asia/Kolkata
    hostMobile: "",
    countryCode: "+91", // Default to +91
    country: "India", // Default to India
    description: "",
    venue: "",
    entryCharges: "",
    notes: "",
    enableExpressForm: false,
    collectUserLocation: false,
    membershipEvent: false,
    cashlessEvent: false,
    emailOptional: false,
    singleDayTicket: false,
    enableNophoneCheckin: false,
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setEventData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/events">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Create Event</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Details */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter event title"
                  value={eventData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={eventData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Match Screening">Match Screening</SelectItem>
                    <SelectItem value="Away Day Travel">Away Day Travel</SelectItem>
                    <SelectItem value="Social Gathering">Social Gathering</SelectItem>
                    <SelectItem value="Fundraising Drive">Fundraising Drive</SelectItem>
                    <SelectItem value="Club Meeting">Club Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={eventData.startTime}
                    onChange={(e) => handleInputChange("startTime", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={eventData.endTime}
                    onChange={(e) => handleInputChange("endTime", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bookingStart">Booking Start</Label>
                  <Input
                    id="bookingStart"
                    type="datetime-local"
                    value={eventData.bookingStart}
                    onChange={(e) => handleInputChange("bookingStart", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bookingEnd">Booking End</Label>
                  <Input
                    id="bookingEnd"
                    type="datetime-local"
                    value={eventData.bookingEnd}
                    onChange={(e) => handleInputChange("bookingEnd", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="hostMobile">Event Host Mobile Number</Label>
                <div className="flex">
                  <Select
                    value={eventData.countryCode}
                    onValueChange={(value) => handleInputChange("countryCode", value)}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+91">+91</SelectItem>
                      <SelectItem value="+1">+1</SelectItem>
                      <SelectItem value="+44">+44</SelectItem>
                      <SelectItem value="+61">+61</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="hostMobile"
                    placeholder="Enter phone number"
                    value={eventData.hostMobile}
                    onChange={(e) => handleInputChange("hostMobile", e.target.value)}
                    className="rounded-l-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter event description"
                  value={eventData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="venue">Venue</Label>
                <Textarea
                  id="venue"
                  placeholder="Enter venue details (e.g., 'The Fan Zone, Mumbai' or 'Online via Zoom')"
                  value={eventData.venue}
                  onChange={(e) => handleInputChange("venue", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="entryCharges">Entry Charges</Label>
                <Textarea
                  id="entryCharges"
                  placeholder="Enter entry charges details (e.g., '₹500 per person', 'Free for members')"
                  value={eventData.entryCharges}
                  onChange={(e) => handleInputChange("entryCharges", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes"
                  value={eventData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label>Event Image</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload event image</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Event Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enableExpressForm">Enable Express Form</Label>
                  <Switch
                    id="enableExpressForm"
                    checked={eventData.enableExpressForm}
                    onCheckedChange={(checked) => handleInputChange("enableExpressForm", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="collectUserLocation">Collect User Location</Label>
                  <Switch
                    id="collectUserLocation"
                    checked={eventData.collectUserLocation}
                    onCheckedChange={(checked) => handleInputChange("collectUserLocation", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="membershipEvent">Make this a membership event</Label>
                  <Switch
                    id="membershipEvent"
                    checked={eventData.membershipEvent}
                    onCheckedChange={(checked) => handleInputChange("membershipEvent", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="cashlessEvent">Cashless Event</Label>
                  <Switch
                    id="cashlessEvent"
                    checked={eventData.cashlessEvent}
                    onCheckedChange={(checked) => handleInputChange("cashlessEvent", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="emailOptional">Email Optional</Label>
                  <Switch
                    id="emailOptional"
                    checked={eventData.emailOptional}
                    onCheckedChange={(checked) => handleInputChange("emailOptional", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="singleDayTicket">Single Day & Single Ticket</Label>
                  <Switch
                    id="singleDayTicket"
                    checked={eventData.singleDayTicket}
                    onCheckedChange={(checked) => handleInputChange("singleDayTicket", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="lg:col-span-2 flex justify-end gap-4">
            <Link href="/dashboard/events">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button>
              <Save className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
