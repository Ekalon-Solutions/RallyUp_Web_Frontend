'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefundDetailsModal } from '@/components/modals/refund-details-modal'
import { getApiUrl } from '@/lib/config'
import { ChevronLeft, ChevronRight, Eye, CheckCircle, Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { toast as sonnerToast } from 'sonner'
import { useRequiredClubId } from '@/hooks/useRequiredClubId'

interface RefundRequest {
  _id: string
  sourceType: 'event_ticket' | 'store_order'
  user: {
    first_name: string
    last_name: string
    email: string
    phoneNumber: string
  }
  eventId?: {
    title: string
    startTime: string
    venue?: string
  }
  orderId?: {
    orderNumber: string
    total: number
  }
  currency: string
  estimatedRefund: number
  breakdown: {
    grossPaid: number
    taxesExcluded: number
    platformFeesExcluded: number
    paymentGatewayFeesExcluded: number
  }
  status: 'requested' | 'processed' | 'rejected'
  requestedAt: string
  processedAt?: string
  adminNotes?: string
}

interface RefundRule {
  _id?: string
  daysBefore: number
  refundPercentage: number
  applicableTo: 'event_ticket' | 'store_order'
}

export default function RefundsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const clubId = useRequiredClubId()
  const [refunds, setRefunds] = useState<RefundRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null)
  const [recalculated, setRecalculated] = useState<{ recalculatedRefund: number; percentage: number; differs: boolean } | null>(null)
  const [rules, setRules] = useState<RefundRule[]>([])
  const [rulesLoading, setRulesLoading] = useState(false)
  const [rulesSaving, setRulesSaving] = useState(false)
  const [rulesType, setRulesType] = useState<'event_ticket' | 'store_order'>('event_ticket')
  const [newRule, setNewRule] = useState({ daysBefore: 7, refundPercentage: 50 })

  useEffect(() => {
    fetchRefunds()
  }, [page, statusFilter, clubId])

  useEffect(() => {
    if (clubId) fetchRules()
  }, [clubId, rulesType])

  useEffect(() => {
    if (!selectedRefund || selectedRefund.status !== 'requested') {
      setRecalculated(null)
      return
    }
    let cancelled = false
    const fetchRecalc = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(getApiUrl(`/refunds/admin/${selectedRefund._id}/recalculate`), {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (!cancelled && res.ok && data.success && data.data?.differs) {
          setRecalculated({
            recalculatedRefund: data.data.recalculatedRefund,
            percentage: data.data.percentage,
            differs: data.data.differs
          })
        } else if (!cancelled) {
          setRecalculated(null)
        }
      } catch {
        if (!cancelled) setRecalculated(null)
      }
    }
    fetchRecalc()
    return () => { cancelled = true }
  }, [selectedRefund?._id, selectedRefund?.status])

  const fetchRules = async () => {
    if (!clubId) return
    try {
      setRulesLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch(
        getApiUrl(`/refunds/admin/rules?clubId=${clubId}&applicableTo=${rulesType}`),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await res.json()
      if (res.ok && data.success) setRules(data.data.rules || [])
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch refund rules', variant: 'destructive' })
    } finally {
      setRulesLoading(false)
    }
  }

  const validateRules = (): string | null => {
    const daysSet = new Set<number>()
    for (const r of rules) {
      const db = Number(r.daysBefore)
      if (daysSet.has(db)) return `Duplicate "days before" (${db}) not allowed`
      daysSet.add(db)
    }
    const sorted = [...rules].sort((a, b) => Number(b.daysBefore) - Number(a.daysBefore))
    for (let i = 1; i < sorted.length; i++) {
      if (Number(sorted[i].refundPercentage) > Number(sorted[i - 1].refundPercentage)) {
        return 'Refund % must not increase as days before decreases (e.g. 8 days: 50%, 4 days: 25%, 0 days: 10%)'
      }
    }
    return null
  }

  const saveRules = async () => {
    if (!clubId) return
    if (rules.length > 5) {
      sonnerToast.error('Maximum 5 rules allowed')
      return
    }
    const err = validateRules()
    if (err) {
      sonnerToast.error(err)
      return
    }
    try {
      setRulesSaving(true)
      const token = localStorage.getItem('token')
      const payload = rules.map((r, i) => ({
        daysBefore: Number(r.daysBefore),
        refundPercentage: Number(r.refundPercentage),
        applicableTo: rulesType,
        order: i,
      }))
      const res = await fetch(getApiUrl('/refunds/admin/rules'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clubId, rules: payload }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        sonnerToast.success('Refund rules saved successfully')
        fetchRules()
      } else {
        sonnerToast.error(data.message || 'Failed to save rules')
      }
    } catch {
      sonnerToast.error('Failed to save refund rules')
    } finally {
      setRulesSaving(false)
    }
  }

  const addRule = () => {
    if (rules.length >= 5) return
    const db = Number(newRule.daysBefore)
    if (rules.some((r) => Number(r.daysBefore) === db)) {
      sonnerToast.error(`Duplicate "days before" (${db}) not allowed`)
      return
    }
    setRules([...rules, { ...newRule, applicableTo: rulesType }])
  }

  const removeRule = (idx: number) => {
    setRules(rules.filter((_, i) => i !== idx))
  }

  const fetchRefunds = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const searchParams = new URLSearchParams({
        page: String(page),
        limit: '20',
        status: statusFilter,
      })
      if (clubId) searchParams.set('clubId', clubId)
      const response = await fetch(
        getApiUrl(`/refunds/admin?${searchParams.toString()}`),
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      const data = await response.json()

      if (response.ok && data.success) {
        setRefunds(data.data.refunds)
        setTotalPages(data.data.pagination.totalPages)
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to fetch refunds',
          variant: 'destructive'
        })
      }
    } catch (err) {
      console.error('Failed to fetch refunds:', err)
      toast({
        title: 'Error',
        description: 'Failed to fetch refunds',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkProcessed = async (refundId: string, adminNotes: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        getApiUrl(`/refunds/admin/${refundId}/processed`),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ adminNotes })
        }
      )

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: 'Success',
          description: 'Refund marked as processed'
        })
        fetchRefunds()
        setSelectedRefund(null)
        setRecalculated(null)
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to process refund',
          variant: 'destructive'
        })
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to process refund',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Requested</Badge>
      case 'processed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Refund Processed</Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Refund Requests</h1>
          <p className="text-muted-foreground">Manage and process refund requests</p>
        </div>

        <Tabs defaultValue="requests">
          <TabsList>
            <TabsTrigger value="requests">Refund Log</TabsTrigger>
            <TabsTrigger value="rules">Refund Rules</TabsTrigger>
          </TabsList>
          <TabsContent value="rules" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Refund Rules</CardTitle>
                <CardDescription>
                  Set T-minus days vs refund %. Max 5 rules. E.g. &quot;7 days before: 50%&quot;
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={rulesType} onValueChange={(v: 'event_ticket' | 'store_order') => setRulesType(v)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="event_ticket">Event Tickets</SelectItem>
                        <SelectItem value="store_order">Store Orders</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {rulesLoading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {rules.map((r, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
                          <span className="text-sm font-medium">
                            {rulesType === 'event_ticket' ? `${r.daysBefore} days before` : `Within ${r.daysBefore} days`}: {r.refundPercentage}%
                          </span>
                          <Button size="sm" variant="ghost" onClick={() => removeRule(i)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    {rules.length < 5 && (
                      <div className="flex gap-2 items-end">
                        <div>
                          <Label>Days</Label>
                          <Input
                            type="number"
                            min={0}
                            value={newRule.daysBefore}
                            onChange={(e) => setNewRule({ ...newRule, daysBefore: Number(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label>Refund %</Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={newRule.refundPercentage}
                            onChange={(e) => setNewRule({ ...newRule, refundPercentage: Number(e.target.value) || 0 })}
                          />
                        </div>
                        <Button onClick={addRule} size="sm">
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    )}
                    <Button onClick={saveRules} disabled={rulesSaving}>
                      {rulesSaving ? 'Saving...' : 'Save Rules'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="requests" className="mt-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Refunds</CardTitle>
                <CardDescription>View and manage all refund requests</CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="requested">Requested</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : refunds.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No refund requests found
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Event / Order</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Refund</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {refunds.map((refund) => (
                        <TableRow key={refund._id}>
                          <TableCell className="text-sm">
                            {new Date(refund.requestedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {refund.user.first_name} {refund.user.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {refund.user.email}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {refund.sourceType === 'event_ticket' ? 'Event Ticket' : 'Store Order'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {refund.sourceType === 'event_ticket' ? (
                              refund.eventId && typeof refund.eventId === 'object' && refund.eventId.title ? (
                                <div className="space-y-0.5">
                                  <div className="font-medium">{refund.eventId.title}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(refund.eventId.startTime).toLocaleString(undefined, {
                                      dateStyle: 'medium',
                                      timeStyle: 'short'
                                    })}
                                  </div>
                                  {refund.eventId.venue && (
                                    <div className="text-xs text-muted-foreground">{refund.eventId.venue}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Event details unavailable</span>
                              )
                            ) : (
                              <>#{refund.orderId?.orderNumber ?? '—'}</>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {refund.currency} {refund.breakdown.grossPaid.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold text-green-600">
                            {refund.currency} {refund.estimatedRefund.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(refund.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {refund.status === 'requested' && (
                                <Button
                                  onClick={() => setSelectedRefund(refund)}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Process
                                </Button>
                              )}
                              <Button
                                onClick={() => setSelectedRefund(refund)}
                                size="sm"
                                variant="outline"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      variant="outline"
                      size="sm"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      variant="outline"
                      size="sm"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>

      <RefundDetailsModal
        refund={selectedRefund}
        recalculated={recalculated}
        onClose={() => { setSelectedRefund(null); setRecalculated(null) }}
        onMarkProcessed={handleMarkProcessed}
      />
    </DashboardLayout>
  )
}
