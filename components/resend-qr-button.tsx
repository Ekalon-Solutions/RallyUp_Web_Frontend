"use client"

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { apiClient, type ResendTicketResult } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Check, Clock, MessageCircle, RefreshCw } from 'lucide-react'

/** Rate limit must match the backend (1 resend / 60s per ticket). */
const COOLDOWN_SECONDS = 60
/** How long the "Sent!" confirmation stays visible before reverting. */
const SENT_DISPLAY_MS = 3000

type Phase = 'idle' | 'loading' | 'sent'

interface ResendQrButtonProps {
  registrationId: string
  /** 'admin' hits the club resend endpoint; 'member' hits the self-service endpoint. */
  mode: 'admin' | 'member'
  /** When true the button is disabled and explains the event has ended. */
  eventEnded?: boolean
  /** Optional phone for a client-side pre-check (skips a wasted API call). */
  phone?: string | null
  /** Extra disable condition (e.g. registration not confirmed). */
  disabled?: boolean
  disabledReason?: string
  size?: React.ComponentProps<typeof Button>['size']
  variant?: React.ComponentProps<typeof Button>['variant']
  className?: string
  onSent?: () => void
}

export function ResendQrButton({
  registrationId,
  mode,
  eventEnded = false,
  phone,
  disabled = false,
  disabledReason,
  size = 'sm',
  variant = 'outline',
  className,
  onSent,
}: ResendQrButtonProps) {
  const { toast } = useToast()
  const [phase, setPhase] = useState<Phase>('idle')
  const [cooldown, setCooldown] = useState(0)
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const sentTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = () => {
    if (cooldownTimer.current) clearInterval(cooldownTimer.current)
    if (sentTimer.current) clearTimeout(sentTimer.current)
  }
  useEffect(() => clearTimers, [])

  const startCooldown = useCallback((seconds: number) => {
    setCooldown(seconds)
    if (cooldownTimer.current) clearInterval(cooldownTimer.current)
    cooldownTimer.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownTimer.current) clearInterval(cooldownTimer.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const showNumberMissing = useCallback(() => {
    toast({
      title: 'Number Missing — Update Profile',
      description:
        mode === 'member'
          ? 'Your WhatsApp number is missing or invalid. Update your profile to receive your ticket.'
          : "This member's WhatsApp number is missing or invalid. Update their profile to resend.",
      variant: 'destructive',
    })
  }, [toast, mode])

  const handleClick = async () => {
    if (phase !== 'idle' || cooldown > 0 || eventEnded || disabled) return

    // Client-side pre-check — surface the number-missing alert without a wasted send.
    if (phone !== undefined && !phone?.trim()) {
      showNumberMissing()
      return
    }

    setPhase('loading')
    let res: ResendTicketResult
    try {
      res =
        mode === 'member'
          ? await apiClient.resendMyEventTicketWhatsApp(registrationId)
          : await apiClient.resendEventTicketWhatsApp(registrationId)
    } catch {
      setPhase('idle')
      toast({ title: 'Failed to resend', description: 'Something went wrong. Try again.', variant: 'destructive' })
      return
    }

    const code = res.data?.code
    const retryAfter = res.data?.retryAfter

    if (res.success && code === 'OK') {
      setPhase('sent')
      startCooldown(COOLDOWN_SECONDS)
      toast({ title: 'Ticket sent!', description: res.data?.message || res.message })
      onSent?.()
      sentTimer.current = setTimeout(() => setPhase('idle'), SENT_DISPLAY_MS)
      return
    }

    setPhase('idle')

    switch (code) {
      case 'NUMBER_MISSING':
        showNumberMissing()
        break
      case 'RATE_LIMITED':
        startCooldown(retryAfter && retryAfter > 0 ? retryAfter : COOLDOWN_SECONDS)
        toast({
          title: 'Please slow down',
          description: res.data?.message || res.message || 'You can resend this ticket again shortly.',
        })
        break
      case 'EVENT_ENDED':
        toast({
          title: 'Event has ended',
          description: res.data?.message || 'Entry passes can no longer be resent for this event.',
          variant: 'destructive',
        })
        break
      default:
        toast({
          title: 'Failed to resend',
          description: res.data?.message || res.message || res.error || 'Could not send WhatsApp ticket.',
          variant: 'destructive',
        })
    }
  }

  const isSent = phase === 'sent'
  const isLoading = phase === 'loading'
  const isCoolingDown = cooldown > 0 && !isSent
  const isDisabled = disabled || eventEnded || isLoading || isSent || isCoolingDown

  const title = eventEnded
    ? 'Event has ended — passes can no longer be resent'
    : disabled
      ? disabledReason || 'Resend unavailable'
      : isCoolingDown
        ? `Please wait ${cooldown}s before resending again`
        : 'Send the ticket QR via WhatsApp'

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={cn(isSent && 'border-green-600 text-green-700 hover:text-green-700', className)}
      onClick={handleClick}
      disabled={isDisabled}
      title={title}
      aria-label="Resend QR ticket via WhatsApp"
    >
      {isLoading ? (
        <>
          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
          Sending...
        </>
      ) : isSent ? (
        <>
          <Check className="h-4 w-4 mr-1" />
          Sent!
        </>
      ) : isCoolingDown ? (
        <>
          <Clock className="h-4 w-4 mr-1" />
          Wait {cooldown}s
        </>
      ) : (
        <>
          <MessageCircle className="h-4 w-4 mr-1" />
          Resend QR
        </>
      )}
    </Button>
  )
}

export default ResendQrButton
