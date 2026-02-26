"use client"

import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { apiClient } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export default function RedemptionSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<any>(null)
  const [onePointValue, setOnePointValue] = useState<number>(0)
  const [form, setForm] = useState<any>({ points: 100, currencyAmount: 0, currency: 'INR', expiryPolicy: 'never' })
  const [confirming, setConfirming] = useState(false)
  const [affectedCount, setAffectedCount] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const resp = await apiClient.getRedemptionSettings()
      if (resp.success && resp.data) {
        setSettings(resp.data.settings)
        setOnePointValue(resp.data.onePointValue)
        setForm({
          points: resp.data.settings?.points || 100,
          currencyAmount: resp.data.settings?.currencyAmount || 0,
          currency: resp.data.settings?.currency || 'INR',
          expiryPolicy: resp.data.settings?.expiryPolicy || 'never',
          expiryMonths: resp.data.settings?.expiryMonths || '',
          expiryMonthDay: resp.data.settings?.expiryMonthDay || { month: '', day: '' }
        })
      } else {
        toast.error('Failed to load redemption settings')
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async (confirmFlag = false) => {
    try {
      const payload: any = {
        points: Number(form.points),
        currencyAmount: Number(form.currencyAmount),
        currency: form.currency,
        expiryPolicy: form.expiryPolicy
      }
      if (form.expiryPolicy === 'months') payload.expiryMonths = Number(form.expiryMonths)
      if (form.expiryPolicy === 'annual_date') payload.expiryMonthDay = form.expiryMonthDay
      if (confirmFlag) payload.confirm = true

      const resp = await apiClient.updateRedemptionSettings(payload)
      if (resp.success) {
        toast.success('Redemption settings saved')
        setSettings(resp.data?.settings || resp.data)
        setOnePointValue(resp.data?.onePointValue || 0)
        setAffectedCount(null)
        setConfirming(false)
      } else if (resp.status === 409 && resp.data && (resp.data as any).affectedCount) {
        // show warning
        const count = (resp.data as any).affectedCount
        setAffectedCount(count)
        setConfirming(true)
        toast.warning(`Retroactive expiry will affect ${count} batches. Confirm to apply.`)
      } else {
        toast.error(resp.error || resp.message || 'Failed to save settings')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Error saving settings')
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold">Redemption & Expiry Settings</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded p-4">
            <Label>Points per conversion</Label>
            <Input value={form.points} onChange={(e: any) => setForm({ ...form, points: e.target.value })} />
            <Label className="mt-2">Currency amount for points</Label>
            <Input value={form.currencyAmount} onChange={(e: any) => setForm({ ...form, currencyAmount: e.target.value })} />
            <Label className="mt-2">Currency</Label>
            <Input value={form.currency} onChange={(e: any) => setForm({ ...form, currency: e.target.value })} />
            <p className="text-sm text-muted-foreground mt-2">One point value: {onePointValue.toFixed(4)} {form.currency}</p>
          </div>

          <div className="border rounded p-4">
            <Label>Expiry Policy</Label>
            <Select value={form.expiryPolicy} onValueChange={(v) => setForm({ ...form, expiryPolicy: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never expire</SelectItem>
                <SelectItem value="months">Expire after N months</SelectItem>
                <SelectItem value="annual_date">Expire on annual date</SelectItem>
              </SelectContent>
            </Select>
            {form.expiryPolicy === 'months' && (
              <div className="mt-2">
                <Label>Expiry months</Label>
                <Input value={form.expiryMonths} onChange={(e: any) => setForm({ ...form, expiryMonths: e.target.value })} />
              </div>
            )}
            {form.expiryPolicy === 'annual_date' && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <Label>Month (1-12)</Label>
                  <Input value={form.expiryMonthDay.month} onChange={(e: any) => setForm({ ...form, expiryMonthDay: { ...form.expiryMonthDay, month: e.target.value } })} />
                </div>
                <div>
                  <Label>Day (1-31)</Label>
                  <Input value={form.expiryMonthDay.day} onChange={(e: any) => setForm({ ...form, expiryMonthDay: { ...form.expiryMonthDay, day: e.target.value } })} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => handleSave(false)}>Save</Button>
          {confirming && (
            <>
              <Button variant="destructive" onClick={() => handleSave(true)}>Confirm Retroactive Expiry ({affectedCount})</Button>
              <Button onClick={() => { setConfirming(false); setAffectedCount(null); }}>Cancel</Button>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
