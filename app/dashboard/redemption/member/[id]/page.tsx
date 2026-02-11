"use client"

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

export default function MemberRedemptionPage() {
  const params = useParams()
  const memberId = params?.id
  const [loading, setLoading] = useState(true)
  const [batches, setBatches] = useState<any[]>([])
  const [onePointValue, setOnePointValue] = useState<number>(0)

  useEffect(() => {
    if (!memberId) return
    const load = async () => {
      setLoading(true)
      const resp = await apiClient.getMemberRedemption(memberId)
      if (resp.success && resp.data) {
        setBatches(resp.data.batches || [])
        setOnePointValue(resp.data.onePointValue || 0)
      } else {
        toast.error('Failed to load redemption data')
      }
      setLoading(false)
    }
    load()
  }, [memberId])

  const totalPoints = batches.reduce((s, b) => s + (b.points || 0), 0)

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Redemption</h1>
        <Card>
          <CardHeader>
            <CardTitle>Points & Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">Total points: <strong>{totalPoints}</strong></div>
            <div className="mb-4">Estimated value: <strong>{(totalPoints * onePointValue).toFixed(2)}</strong></div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Earned At</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Expires At</TableHead>
                    <TableHead>Expired</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((b: any) => (
                    <TableRow key={b._id}>
                      <TableCell>{new Date(b.earnedAt).toLocaleString()}</TableCell>
                      <TableCell>{b.points}</TableCell>
                      <TableCell>{b.expiresAt ? new Date(b.expiresAt).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>{b.expired ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{b.notes || ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
