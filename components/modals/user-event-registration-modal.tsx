"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Minus, ChevronDown, ChevronRight } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

interface Attendee {
  phoneFull?: string
  name: string
  phone: string
  phoneCode?: string
  open?: boolean
}

interface UserEventRegistrationModalProps {
  eventId: string | null
  isOpen: boolean
  onClose: () => void
  onRegister?: (payload: { eventId: string; attendees: Attendee[] }) => void
}

export default function UserEventRegistrationModal({ eventId, isOpen, onClose, onRegister }: UserEventRegistrationModalProps) {
  const { user } = useAuth()
  const [ticketCount, setTicketCount] = useState<number>(1)
  const [attendees, setAttendees] = useState<Attendee[]>([{ name: '', phone: '', phoneCode: '', open: true }])

  useEffect(() => {
    // keep attendees in sync with ticketCount and prefill primary attendee when available
    setAttendees(prev => {
      const copy = [...prev]
      if (ticketCount > copy.length) {
        for (let i = copy.length; i < ticketCount; i++) copy.push({ name: '', phone: '', phoneCode: '', open: false })
      } else if (ticketCount < copy.length) {
        copy.length = ticketCount
      }
      if (copy[0]) copy[0].open = true

      // Prefill primary attendee from signed-in user when modal is opening
      if (isOpen && user && copy[0]) {
        try {
          const userName = (user as any).name || `${(user as any).first_name || ''} ${(user as any).last_name || ''}`.trim()
          const userPhone = (user as any).phoneNumber || (user as any).phone_number || (user as any).phone || ''
          const userCode = (user as any).phone_country_code || ''
          if (!copy[0].name && userName) copy[0].name = userName
          if (!copy[0].phone && userPhone) copy[0].phone = userPhone
          if (!copy[0].phoneCode && userCode) copy[0].phoneCode = userCode
        } catch (e) {
          // ignore
        }
      }

      return copy
    })
  }, [ticketCount, isOpen, user])

  const updateAttendee = (index: number, field: 'name' | 'phone' | 'phoneCode', value: string) => {
    setAttendees(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const toggleOpen = (index: number) => {
    setAttendees(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], open: !copy[index].open }
      return copy
    })
  }

  const handleRegister = () => {
    if (!eventId) return

    const phoneCodeRegex = /^\+?\d{1,4}$/
    const digitsOnly = (s: string) => (s || '').replace(/[^0-9]/g, '')

    for (let i = 0; i < attendees.length; i++) {
      const a = attendees[i]
      if (!a.name || !a.name.trim()) {
        toast.error(`Please enter a name for attendee ${i + 1}`)
        return
      }
      if (!a.phoneCode || !a.phoneCode.trim()) {
        toast.error(`Please enter a country code for attendee ${i + 1}`)
        return
      }
      if (!phoneCodeRegex.test(a.phoneCode.trim())) {
        toast.error(`Invalid country code for attendee ${i + 1}`)
        return
      }
      if (!a.phone || !a.phone.trim()) {
        toast.error(`Please enter a phone number for attendee ${i + 1}`)
        return
      }
      const p = digitsOnly(a.phone)
      if (p.length < 6 || p.length > 15) {
        toast.error(`Phone number for attendee ${i + 1} must be 6-15 digits`)
        return
      }
      const code = a.phoneCode.trim().startsWith('+') ? a.phoneCode.trim() : `+${a.phoneCode.trim()}`
      a.phoneFull = `${code}${p}`
    }

    onRegister && onRegister({ eventId, attendees: attendees.map(a => ({ name: a.name.trim(), phone: a.phoneFull || a.phone })) })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Register for Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline" onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}>
                <Minus className="w-4 h-4" />
              </Button>
              <div className="text-lg font-medium">{ticketCount}</div>
              <Button size="sm" variant="outline" onClick={() => setTicketCount(ticketCount + 1)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">Number of tickets</div>
          </div>

          <div className="space-y-2">
            {attendees.map((att, i) => (
              <div key={i} className="border rounded p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleOpen(i)} className="p-1">
                      {att.open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div className="font-medium">Attendee {i + 1}</div>
                    {i === 0 && <Badge variant="outline" className="ml-2">Primary</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground">{att.name || 'No name yet'}</div>
                </div>
                {att.open && (
                  <div className="mt-3 space-y-2">
                    <Input placeholder={`Name for attendee ${i + 1}`} value={att.name} onChange={(e) => updateAttendee(i, 'name', e.target.value)} />
                    <div className="flex gap-2">
                      <Input placeholder="Code (e.g. +1)" value={att.phoneCode || ''} onChange={(e) => updateAttendee(i, 'phoneCode', e.target.value)} className="w-28" />
                      <Input placeholder={`Phone for attendee ${i + 1}`} value={att.phone} onChange={(e) => updateAttendee(i, 'phone', e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" className="mr-2" onClick={onClose}>Cancel</Button>
            <Button onClick={handleRegister}>Register</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}