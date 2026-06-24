"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { apiClient, WhatsAppConfig, WhatsAppMessageLogEntry, WhatsAppMetaTier } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Lock,
  Activity,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { ProtectedRoute } from '@/components/protected-route'
import { useSocket } from '@/contexts/socket-context'

const TIER_LABELS: Record<WhatsAppMetaTier, string> = {
  TIER_250: '250 / day (Tier 1)',
  TIER_1K: '1,000 / day (Tier 2)',
  TIER_10K: '10,000 / day (Tier 3)',
  TIER_100K: '100,000 / day (Tier 4)',
  UNLIMITED: 'Unlimited',
}

const STATUS_STYLES: Record<string, string> = {
  queued: 'bg-amber-100 text-amber-800',
  sent: 'bg-blue-100 text-blue-800',
  delivered: 'bg-indigo-100 text-indigo-800',
  read: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  suppressed: 'bg-gray-200 text-gray-700',
}

export default function WhatsAppConfigPage() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [config, setConfig] = useState<WhatsAppConfig | null>(null)
  const [messages, setMessages] = useState<WhatsAppMessageLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [savingTier, setSavingTier] = useState(false)
  const [savingRate, setSavingRate] = useState(false)
  const [rateInput, setRateInput] = useState("")

  const loadConfig = useCallback(async () => {
    const res = await apiClient.getWhatsAppConfig()
    if (res.success && res.data) {
      setConfig(res.data.config)
      setRateInput(String(res.data.config.marketingRatePerMessage ?? ''))
    } else toast.error(res.error || 'Failed to load configuration')
  }, [])

  const loadMessages = useCallback(async () => {
    const res = await apiClient.listWhatsAppMessages({ limit: 25 })
    if (res.success && res.data) setMessages(res.data.messages)
  }, [])

  useEffect(() => {
    if (user?.role !== 'system_owner') return
    Promise.all([loadConfig(), loadMessages()]).finally(() => setLoading(false))
  }, [user?.role, loadConfig, loadMessages])

  // Live status updates from the webhook listener.
  useEffect(() => {
    if (!socket) return
    const onStatus = (data: { messageId: string; status: string; metaErrorCode?: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.messageId === data.messageId
            ? { ...m, status: data.status as WhatsAppMessageLogEntry['status'], metaErrorCode: data.metaErrorCode }
            : m
        )
      )
    }
    socket.on('whatsapp:message-status', onStatus)
    return () => {
      socket.off('whatsapp:message-status', onStatus)
    }
  }, [socket])

  const handleTest = async () => {
    setTesting(true)
    const res = await apiClient.testWhatsAppConnection()
    if (res.success) toast.success('Connection active — AiSensy returned 200 OK')
    else toast.error(`Connection error${res.data?.metaErrorCode ? ` (Meta code ${res.data.metaErrorCode})` : ''}`)
    await loadConfig()
    setTesting(false)
  }

  const handleTierChange = async (metaTier: WhatsAppMetaTier) => {
    setSavingTier(true)
    const res = await apiClient.updateWhatsAppConfig({ metaTier })
    if (res.success && res.data) {
      setConfig(res.data.config)
      toast.success('Meta tier updated')
    } else {
      toast.error(res.error || 'Failed to update tier')
    }
    setSavingTier(false)
  }

  const handleRateSave = async () => {
    const value = Number(rateInput)
    if (!value || value <= 0) {
      toast.error('Enter a valid rate')
      return
    }
    setSavingRate(true)
    const res = await apiClient.updateWhatsAppConfig({ marketingRatePerMessage: value })
    if (res.success && res.data) {
      setConfig(res.data.config)
      toast.success('Marketing rate updated — admin dashboards reflect it on next load')
    } else {
      toast.error(res.error || 'Failed to update rate')
    }
    setSavingRate(false)
  }

  if (user?.role !== 'system_owner') {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-muted-foreground mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                Only the System Owner can access the WhatsApp / AiSensy configuration.
              </p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const status = config?.connectionStatus ?? 'unconfigured'
  const isActive = status === 'active'
  const isError = status === 'error'

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-7 h-7 text-green-600" />
              <div>
                <h1 className="text-3xl font-bold">WhatsApp / AiSensy</h1>
                <p className="text-muted-foreground">
                  System User configuration for WhatsApp messaging
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
              Test Connection
            </Button>
          </div>

          {/* Connection Status indicator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" /> Connection Status
              </CardTitle>
              <CardDescription>
                Live AiSensy handshake result. Green = 200 OK, red = error with Meta code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    isActive ? 'bg-green-500 animate-pulse' : isError ? 'bg-red-500' : 'bg-gray-400'
                  }`}
                />
                <span className="font-semibold">
                  {isActive ? 'Active' : isError ? 'Error' : 'Not Configured'}
                </span>
                {isError && config?.lastError?.code && (
                  <Badge variant="destructive">Meta code {config.lastError.code}</Badge>
                )}
              </div>
              {isError && config?.lastError?.message && (
                <p className="text-sm text-red-600">{config.lastError.message}</p>
              )}
              {config?.lastCheckedAt && (
                <p className="text-xs text-muted-foreground">
                  Last checked {new Date(config.lastCheckedAt).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>

          {/* View-Only API credentials (masked) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" /> API Credentials
                <Badge variant="secondary" className="ml-2">View Only</Badge>
              </CardTitle>
              <CardDescription>
                Credentials are loaded from the secure server environment and shown masked.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Channel ID</Label>
                <p className="font-mono text-sm break-all">{config?.channelId || '—'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Namespace</Label>
                <p className="font-mono text-sm break-all">{config?.namespace || '—'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Project API Key</Label>
                <p className="font-mono text-sm">{config?.apiKeyMasked || '—'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Environment</Label>
                <p className="text-sm flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  {config?.envConfigured ? 'Configured' : 'Missing keys'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Meta tier / rate-limit buffer */}
          <Card>
            <CardHeader>
              <CardTitle>Meta Messaging Tier</CardTitle>
              <CardDescription>
                Daily send cap for the rate-limit buffer. Excess messages are queued and sent in
                batches as capacity frees up. ({config?.sentInWindow ?? 0} sent in current window)
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Select
                value={config?.metaTier}
                onValueChange={(v) => handleTierChange(v as WhatsAppMetaTier)}
                disabled={savingTier}
              >
                <SelectTrigger className="w-72">
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TIER_LABELS) as WhatsAppMetaTier[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {TIER_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {config && (
                <span className="text-sm text-muted-foreground">
                  Limit: {config.tierLimit === Number.MAX_SAFE_INTEGER ? '∞' : config.tierLimit.toLocaleString()}/day
                </span>
              )}
            </CardContent>
          </Card>

          {/* Marketing rate (instant-sync to admin dashboards) */}
          <Card>
            <CardHeader>
              <CardTitle>Marketing Rate</CardTitle>
              <CardDescription>
                INR per marketing message. Admin status cards reflect changes on their next page load.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">INR</span>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">/ message</span>
              <Button onClick={handleRateSave} disabled={savingRate}>
                {savingRate ? 'Saving…' : 'Save Rate'}
              </Button>
            </CardContent>
          </Card>

          {/* Live message log */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Messages</CardTitle>
                <CardDescription>Real-time delivery status from the webhook listener.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={loadMessages}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              ) : (
                <div className="divide-y">
                  {messages.map((m) => (
                    <div key={m._id} className="flex items-center justify-between py-2 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{m.templateName}</p>
                        <p className="text-muted-foreground font-mono text-xs">{m.recipientPhone}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {m.status === 'failed' && m.metaErrorCode && (
                          <span className="text-xs text-red-600">code {m.metaErrorCode}</span>
                        )}
                        <Badge className={STATUS_STYLES[m.status] || ''} variant="secondary">
                          {m.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
