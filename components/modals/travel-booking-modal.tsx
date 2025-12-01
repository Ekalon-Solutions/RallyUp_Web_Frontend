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

interface TravelBookingModalProps {
  trigger?: React.ReactNode
}

export function TravelBookingModal({ trigger }: TravelBookingModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    destination: "",
    match: "",
    date: "",
    departureTime: "",
    returnTime: "",
    meetingPoint: "",
    transport: "coach",
    capacity: "",
    price: "",
    includesTicket: false,
    description: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // console.log("Creating travel booking:", formData)
    setOpen(false)
    // Reset form
    setFormData({
      destination: "",
      match: "",
      date: "",
      departureTime: "",
      returnTime: "",
      meetingPoint: "",
      transport: "coach",
      capacity: "",
      price: "",
      includesTicket: false,
      description: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Travel Booking
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Travel Booking</DialogTitle>
          <DialogDescription>Organize group travel for away matches</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="destination">Destination *</Label>
            <Input
              id="destination"
              placeholder="e.g. Liverpool"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="match">Match *</Label>
            <Input
              id="match"
              placeholder="e.g. Liverpool vs Arsenal"
              value={formData.match}
              onChange={(e) => setFormData({ ...formData, match: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">Match Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="departureTime">Departure Time *</Label>
              <Input
                id="departureTime"
                type="time"
                value={formData.departureTime}
                onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="returnTime">Return Time</Label>
              <Input
                id="returnTime"
                type="time"
                value={formData.returnTime}
                onChange={(e) => setFormData({ ...formData, returnTime: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="meetingPoint">Meeting Point *</Label>
            <Input
              id="meetingPoint"
              placeholder="e.g. Emirates Stadium Car Park"
              value={formData.meetingPoint}
              onChange={(e) => setFormData({ ...formData, meetingPoint: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="transport">Transport Type</Label>
            <Select
              value={formData.transport}
              onValueChange={(value) => setFormData({ ...formData, transport: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coach">Coach</SelectItem>
                <SelectItem value="minibus">Minibus</SelectItem>
                <SelectItem value="train">Train</SelectItem>
                <SelectItem value="flight">Flight</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                placeholder="50"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Price per Person (₹) *</Label>
              <Input
                id="price"
                type="number"
                placeholder="35"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Additional details about the travel arrangement"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="includesTicket">Includes Match Ticket</Label>
              <p className="text-sm text-muted-foreground">Travel package includes match ticket</p>
            </div>
            <Switch
              id="includesTicket"
              checked={formData.includesTicket}
              onCheckedChange={(checked) => setFormData({ ...formData, includesTicket: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Travel Booking</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
