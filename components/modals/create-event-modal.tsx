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

interface CreateEventModalProps {
  trigger?: React.ReactNode
}

export function CreateEventModal({ trigger }: CreateEventModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    startTime: "",
    endTime: "",
    venue: "",
    description: "",
    maxAttendees: "",
    ticketPrice: "",
    requiresTicket: false,
    memberOnly: false,
    awayDayEvent: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Creating event:", formData)
    setOpen(false)
    // Reset form
    setFormData({
      title: "",
      category: "",
      startTime: "",
      endTime: "",
      venue: "",
      description: "",
      maxAttendees: "",
      ticketPrice: "",
      requiresTicket: false,
      memberOnly: false,
      awayDayEvent: false,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>Create a new event for your supporter group</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              placeholder="Enter event title (e.g., 'Match Screening vs. XYZ FC')"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                <SelectItem value="match-screening">Match Screening</SelectItem>
                <SelectItem value="away-day">Away Day Travel</SelectItem>
                <SelectItem value="social">Social Event</SelectItem>
                <SelectItem value="fundraising">Fundraising</SelectItem>
                <SelectItem value="meeting">Club Meeting</SelectItem>
                <SelectItem value="community-outreach">Community Outreach</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="venue">Venue</Label>
            <Input
              id="venue"
              placeholder="Enter venue location (e.g., 'The Fan Zone, Mumbai' or 'Online via Zoom')"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Event description (e.g., 'Join us for a thrilling match screening...')"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="maxAttendees">Max Attendees</Label>
              <Input
                id="maxAttendees"
                type="number"
                placeholder="Leave empty for unlimited"
                value={formData.maxAttendees}
                onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ticketPrice">Ticket Price (₹)</Label>
              <Input
                id="ticketPrice"
                type="number"
                placeholder="0 for free (e.g., 250)"
                value={formData.ticketPrice}
                onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requiresTicket">Requires Ticket</Label>
                <p className="text-sm text-muted-foreground">Members need to book tickets</p>
              </div>
              <Switch
                id="requiresTicket"
                checked={formData.requiresTicket}
                onCheckedChange={(checked) => setFormData({ ...formData, requiresTicket: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="memberOnly">Members Only</Label>
                <p className="text-sm text-muted-foreground">Only club members can attend</p>
              </div>
              <Switch
                id="memberOnly"
                checked={formData.memberOnly}
                onCheckedChange={(checked) => setFormData({ ...formData, memberOnly: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="awayDayEvent">Away Day Event</Label>
                <p className="text-sm text-muted-foreground">This is an away day travel event</p>
              </div>
              <Switch
                id="awayDayEvent"
                checked={formData.awayDayEvent}
                onCheckedChange={(checked) => setFormData({ ...formData, awayDayEvent: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Event</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
