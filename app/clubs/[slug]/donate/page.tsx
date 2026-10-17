"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, HandHeart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient, Club } from "@/lib/api"
import { DonateForm } from "@/components/donations/donate-form"

type Config = { clubName: string; minAmount: number; presetAmounts: number[] }

/** Always-on donation page for a club — members and guests, no login needed. */
export default function ClubDonatePage() {
  const { slug } = useParams<{ slug: string }>()
  const [club, setClub] = useState<Club | null>(null)
  const [config, setConfig] = useState<Config | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "closed">("loading")
  const [primaryColor, setPrimaryColor] = useState<string | undefined>()

  useEffect(() => {
    ;(async () => {
      const clubRes = await apiClient.getClubById(slug, true)
      if (!clubRes.success || !clubRes.data) return setState("closed")
      setClub(clubRes.data)
      const [cfg, settings] = await Promise.all([apiClient.getDonationConfig(clubRes.data._id), apiClient.getClubSettings(slug, true)])
      const actual = (settings.data as any)?.data || settings.data
      setPrimaryColor(actual?.designSettings?.primaryColor)
      if (!cfg.success || !cfg.data) return setState("closed")
      setConfig(cfg.data)
      setState("ready")
    })()
  }, [slug])

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-md space-y-6">
        <Link href={`/clubs/${slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to {club?.name ?? "club"}
        </Link>
        <Card className="border-2 shadow-md">
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2 text-center">
              <HandHeart className="mx-auto h-10 w-10" style={{ color: primaryColor }} />
              <h1 className="text-2xl font-black">Support {config?.clubName ?? club?.name ?? "the club"}</h1>
              <p className="text-sm text-muted-foreground">Give any amount, any time. You don't need an account.</p>
            </div>
            {state === "loading" && <p className="text-center text-sm text-muted-foreground">Loading…</p>}
            {state === "closed" && <p className="rounded-lg bg-muted px-4 py-3 text-center text-sm">This club isn't accepting donations right now.</p>}
            {state === "ready" && config && club && (
              <DonateForm
                clubId={club._id}
                title={config.clubName}
                presetAmounts={config.presetAmounts}
                minAmount={config.minAmount}
                allowCustom
                primaryColor={primaryColor}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
