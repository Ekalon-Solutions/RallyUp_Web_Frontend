"use client"

import type React from "react"

import { useState } from "react"
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
import { Plus } from "lucide-react"

interface AddMemberModalProps {
  trigger?: React.ReactNode
}

export function AddMemberModal({ trigger }: AddMemberModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    hometown: "",
    membershipType: "",
    seasonTicketHolder: false,
    section: "",
    numberOfSeats: "",
    sendWelcomeEmail: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Adding member:", formData)
    setOpen(false)
    // Reset form
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      hometown: "",
      membershipType: "",
      seasonTicketHolder: false,
      section: "",
      numberOfSeats: "",
      sendWelcomeEmail: true,
    })
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogDescription>Add a new member to your supporter group</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              placeholder="Enter full name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter phone number (e.g., 9876543210)"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="hometown">Hometown</Label>
            <Input
              id="hometown"
              placeholder="Enter hometown (e.g., Mumbai, Delhi)"
              value={formData.hometown}
              onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="membershipType">Membership Type</Label>
            <Select
              value={formData.membershipType}
              onValueChange={(value) => setFormData({ ...formData, membershipType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select membership type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="season-ticket-holder">Season Ticket Holder</SelectItem>
                <SelectItem value="away-day-regular">Away Day Regular</SelectItem>
                <SelectItem value="local-member">Local Member</SelectItem>
                <SelectItem value="international-member">International Member</SelectItem>
                <SelectItem value="student-member">Student Member</SelectItem>
                <SelectItem value="family-member">Family Member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="seasonTicketHolder"
              checked={formData.seasonTicketHolder}
              onCheckedChange={(checked) => setFormData({ ...formData, seasonTicketHolder: checked as boolean })}
            />
            <Label htmlFor="seasonTicketHolder">Season Ticket Holder</Label>
          </div>

          {formData.seasonTicketHolder && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  placeholder="e.g. East Stand, Block C"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="numberOfSeats">No. of seats</Label>
                <Input
                  id="numberOfSeats"
                  type="number"
                  placeholder="1"
                  value={formData.numberOfSeats}
                  onChange={(e) => setFormData({ ...formData, numberOfSeats: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendWelcomeEmail"
              checked={formData.sendWelcomeEmail}
              onCheckedChange={(checked) => setFormData({ ...formData, sendWelcomeEmail: checked as boolean })}
            />
            <Label htmlFor="sendWelcomeEmail">Send welcome email</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Member</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
