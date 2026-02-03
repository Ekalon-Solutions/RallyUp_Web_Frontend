"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"

interface AdjustPointsModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: string | null
  clubId?: string | null
  onSuccess?: () => void
}

export default function AdjustPointsModal({ isOpen, onClose, memberId, clubId, onSuccess }: AdjustPointsModalProps) {
  const [points, setPoints] = useState<number | ''>('')
  const [reason, setReason] = useState('')
  const [mode, setMode] = useState<'add' | 'subtract'>('add')
  const [loading, setLoading] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<number | null>(null)

  const reset = () => {
    setPoints('')
    setReason('')
    setMode('add')
    setCurrentPoints(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = async () => {
    if (!memberId) {
      toast.error('Member not selected')
      return
    }
    const pts = Number(points)
    if (!Number.isFinite(pts) || pts <= 0) {
      toast.error('Please enter a positive points value')
      return
    }

    setLoading(true)
    try {
      const resp = await apiClient.adjustMemberPoints(memberId, {
        points: pts,
        reason: reason || undefined,
        mode,
        clubId: clubId || undefined
      })

      if (resp.success) {
        toast.success('Points updated')
        onSuccess && onSuccess()
        handleClose()
      } else {
        toast.error(resp.error || resp.message || 'Failed to update points')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to update points')
    } finally {
      setLoading(false)
    }
  }

  // Fetch member details (including points) when opened
  React.useEffect(() => {
    let mounted = true
    const fetchMemberPoints = async () => {
      if (!memberId) return
      try {
        const resp = await apiClient.getMemberPoints(memberId, clubId || undefined)
        if (mounted && resp.success) {
          setCurrentPoints(typeof resp.data?.points === 'number' ? resp.data.points : null)
        }
      } catch (err) {
        // ignore
      }
    }

    if (isOpen) fetchMemberPoints()
    return () => { mounted = false }
  }, [isOpen, memberId, clubId])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Adjust Points</DialogTitle>
          <DialogDescription>Grant or subtract points for this member. An audit record will be created.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {currentPoints !== null && (
            <div className="text-sm text-muted-foreground">
              Current Points: <span className="font-medium">{currentPoints}</span>
            </div>
          )}
          <div>
            <Label>Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as 'add' | 'subtract')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Add Points</SelectItem>
                <SelectItem value="subtract">Subtract Points</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Points</Label>
            <Input
              type="number"
              value={points as any}
              onChange={(e) => setPoints(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="10"
            />
          </div>

          <div>
            <Label>Reason (optional)</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for adjustment" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
