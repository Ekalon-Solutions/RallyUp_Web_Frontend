"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useClubFeaturesCtxSafe } from "@/contexts/club-features-context"
import { apiClient, WhatsAppStatusCard as CardData } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  MessageSquare,
  AlertTriangle,
  CircleAlert,
  HelpCircle,
  ExternalLink,
  Wifi,
  WifiOff,
} from "lucide-react"

/** Tiny inline sparkline (view-only) of the last 7 days of message volume. */
function Sparkline({ data }: { data: number[] }) {
  const w = 140
  const h = 36
  const max = Math.max(1, ...data)
  const step = data.length > 1 ? w / (data.length - 1) : w
  const points = data
    .map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * (h - 4) - 2).toFixed(1)}`)
    .join(" ")
  return (
    <svg width={w} height={h} className="overflow-visible" aria-label="7-day message volume">
      <polyline
        points={points}
        fill="none"
        stroke="#2563eb"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((v, i) => (
        <circle key={i} cx={i * step} cy={h - (v / max) * (h - 4) - 2} r={1.6} fill="#2563eb" />
      ))}
    </svg>
  )
}

interface Props {
  clubId: string | null
}

export function WhatsAppStatusCard({ clubId }: Props) {
  const { user } = useAuth()
  const clubFeatures = useClubFeaturesCtxSafe()
  const [card, setCard] = useState<CardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [faqOpen, setFaqOpen] = useState(false)

  const isVendor = (user as any)?.role === "vendor" || (user as any)?.isVendor === true
  // Awaiting a definitive answer from the feature-flag config (not yet loaded) is
  // treated as "unknown", never as enabled — avoids briefly fetching/flashing the
  // card before we know the club actually has the wa_marketing entitlement.
  const waMarketingUnknown = Boolean(clubFeatures?.isLoading && !clubFeatures.config)
  const waMarketingEnabled = clubFeatures ? clubFeatures.isEnabled("wa_marketing") : true

  const load = useCallback(async () => {
    if (!clubId) return
    const res = await apiClient.getWhatsAppStatusCard(clubId)
    if (res.success && res.data) setCard(res.data.card)
    setLoading(false)
  }, [clubId])

  useEffect(() => {
    if (isVendor || waMarketingUnknown || !waMarketingEnabled) {
      return
    }
    load()
  }, [isVendor, waMarketingUnknown, waMarketingEnabled, load])

  // Vendor / Bouncer: pricing details are hidden. Club without the wa_marketing
  // feature entitlement never sees the card (or its config/billing warnings).
  if (isVendor || !waMarketingEnabled) return null
  if (loading || !card) return null

  const disconnected = card.connectionStatus === "error"
  const inr = (n: number) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n)

  return (
    <>
      <Card className={disconnected ? "border-red-300" : "border-green-200"}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-green-600" />
            WhatsApp Service
          </CardTitle>
          <div className="flex items-center gap-2">
            {card.serviceActive ? (
              <Badge className="bg-green-600 gap-1">
                <Wifi className="h-3 w-3" /> Service Active
              </Badge>
            ) : disconnected ? (
              <Badge variant="destructive" className="gap-1">
                <WifiOff className="h-3 w-3" /> Disconnected
              </Badge>
            ) : (
              <Badge variant="secondary">{card.enabled ? "Pending" : "Off"}</Badge>
            )}
            <button
              onClick={() => setFaqOpen(true)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="WhatsApp messaging FAQ"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Warning banner(s) */}
          {card.warnings.map((w, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 rounded-md p-2 text-xs ${
                w.severity === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {w.severity === "error" ? (
                <CircleAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              )}
              <span>{w.message}</span>
            </div>
          ))}

          {/* Reconnect (API disconnection) */}
          {disconnected && (
            <a href={card.supportUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="destructive" size="sm" className="w-full">
                Reconnect Service · Contact Support
              </Button>
            </a>
          )}

          {/* Rate */}
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Marketing rate</span>
            <span className="text-xl font-extrabold text-green-700">
              INR {inr(card.ratePerMessage)}
              <span className="text-xs font-medium text-muted-foreground"> /msg + {card.gstPercent}% GST</span>
            </span>
          </div>

          {/* Usage at a glance */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-md border p-2 text-center">
              <div className="text-lg font-bold">{card.usage.marketing}</div>
              <div className="text-[11px] text-muted-foreground">Marketing (this month)</div>
            </div>
            <div className="rounded-md border p-2 text-center">
              <div className="text-lg font-bold">{card.usage.utility}</div>
              <div className="text-[11px] text-muted-foreground">Utility (this month)</div>
            </div>
            <div className="rounded-md border p-2 text-center">
              <div className="text-lg font-bold">{card.usage.authentication}</div>
              <div className="text-[11px] text-muted-foreground">Auth (this month)</div>
            </div>
          </div>

          {/* Plan usage vs monthly limit */}
          <div className="space-y-1">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">Plan usage (this month)</span>
              <span className="font-semibold">
                {card.planUsed} {card.planLimit !== null ? `/ ${card.planLimit}` : "· Unlimited"}
              </span>
            </div>
            {card.planLimit !== null && (
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    card.planUsed >= card.planLimit
                      ? "bg-red-600"
                      : card.planUsed >= card.planLimit * 0.9
                        ? "bg-amber-500"
                        : "bg-green-600"
                  }`}
                  style={{ width: `${Math.min(100, (card.planUsed / card.planLimit) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Templates approved + Recent activity sparkline */}
          <div className="flex items-center justify-between">
            <Link
              href={card.messagingUrl}
              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              Templates approved: <strong>{card.approvedTemplates ?? "—"}</strong>
              <ExternalLink className="h-3 w-3" />
            </Link>
            <div className="text-right">
              <Sparkline data={card.sparkline} />
              <div className="text-[10px] text-muted-foreground">Last 7 days</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ modal */}
      <Dialog open={faqOpen} onOpenChange={setFaqOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marketing vs Utility messages</DialogTitle>
            <DialogDescription>Why the rates differ</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>
              <strong>Marketing messages</strong> are promotional — offers, event announcements,
              broadcasts. Meta categorises these as Marketing and they are billed at{" "}
              <strong>INR {inr(card.ratePerMessage)} per message + GST</strong>.
            </p>
            <p>
              <strong>Utility messages</strong> are tied to a specific transaction or request the
              member already made (e.g. a ticket confirmation or order update). They are billed under
              a different, lower utility category.
            </p>
            <p className="text-muted-foreground">
              Rates differ because Meta prices conversation categories differently. Only Marketing
              messages require T&amp;C acceptance and count toward your marketing spend.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
