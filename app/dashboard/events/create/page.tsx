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
import { TimeInput } from "@/components/ui/time-input"
import { TimePickerCompact } from "@/components/ui/time-picker-compact"
import { ArrowLeft, Save, Upload } from "lucide-react"
import Link from "next/link"

export default function CreateEventPage() {
  const [eventData, setEventData] = useState({
    title: "",
    category: "general",
    date: "",
    time: "12:00 PM",
    location: "",
    description: "",
    maxAttendees: 100,
    isPublished: false,
    organizer: "",
    notes: "",
  })

  const [useCompactTimePicker, setUseCompactTimePicker] = useState(false)

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setEventData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!eventData.title || !eventData.date || !eventData.time || !eventData.location) {
      alert('Please fill in all required fields')
      return
    }

    try {
      // Here you would typically call your API to create the event
      console.log('Event data to submit:', eventData)
      alert('Event created successfully! (This is a demo - implement API call)')
      
      // Reset form
      setEventData({
        title: "",
        category: "general",
        date: "",
        time: "12:00 PM",
        location: "",
        description: "",
        maxAttendees: 100,
        isPublished: false,
        organizer: "",
        notes: "",
      })
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Error creating event')
    }
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

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
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
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="music">Music</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="charity">Charity</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Event Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={eventData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Time Input Style:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {useCompactTimePicker ? 'Dropdown' : 'Manual'}
                      </span>
                      <Switch
                        checked={useCompactTimePicker}
                        onCheckedChange={setUseCompactTimePicker}
                      />
                    </div>
                  </div>
                  
                  {useCompactTimePicker ? (
                    <TimePickerCompact
                      value={eventData.time}
                      onChange={(value) => handleInputChange("time", value)}
                      label="Event Time *"
                      required
                    />
                  ) : (
                    <TimeInput
                      value={eventData.time}
                      onChange={(value) => handleInputChange("time", value)}
                      label="Event Time *"
                      required
                    />
                  )}
                </div>
              </div>

              

              <div className="grid gap-2">
                <Label htmlFor="location">Event Location *</Label>
                <Input
                  id="location"
                  placeholder="Enter event location"
                  value={eventData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  required
                />
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
                <Label htmlFor="maxAttendees">Maximum Attendees</Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  placeholder="Enter maximum number of attendees"
                  value={eventData.maxAttendees}
                  onChange={(e) => handleInputChange("maxAttendees", parseInt(e.target.value))}
                  min="1"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information about the event"
                  value={eventData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Event Settings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Event Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="isPublished">Publish Event Immediately</Label>
                <Switch
                  id="isPublished"
                  checked={eventData.isPublished}
                  onCheckedChange={(checked) => handleInputChange("isPublished", checked)}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Published events will be visible to all members. Unpublished events are saved as drafts.
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="lg:col-span-2 flex justify-end gap-4">
            <Link href="/dashboard/events">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
