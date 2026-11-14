"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { LockedFeaturePage } from "@/components/feature-gate"
import { ForumProvider, useForum } from "@/components/forum/forum-store"
import { useClubFeatures } from "@/hooks/useClubFeatures"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { isFeatureEnabled } from "@/lib/clubFeatures"
import { cn } from "@/lib/utils"

const links = [
  { href: "/dashboard/forum", label: "Discussions" },
  { href: "/dashboard/forum/moderation", label: "Moderation Queue" },
  { href: "/dashboard/forum/sub-topics", label: "Sub-topics" },
  { href: "/dashboard/forum/settings", label: "Forum Settings" },
]

const Ready = ({ children }: { children: ReactNode }) => {
  const { loading } = useForum()
  return loading ? <p className="py-10 text-center text-sm text-muted-foreground">Loading forum…</p> : <>{children}</>
}

export default function ForumLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const clubId = useRequiredClubId()
  const { config } = useClubFeatures(clubId ?? null)

  if (!isFeatureEnabled(config, "chants")) {
    return <LockedFeaturePage featureKey="chants" featureLabel="Forum & Chants" clubId={clubId ?? ""} currentTier={config?.billing_tier} />
  }

  if (!clubId) return null

  return (
    <ForumProvider clubId={clubId}>
      <div className="space-y-6">
        <nav className="flex gap-1 overflow-x-auto border-b">
          {links.map((l) => {
            const active = l.href === links[0].href ? !links.slice(1).some((x) => pathname.startsWith(x.href)) : pathname.startsWith(l.href)
            return (
              <Link key={l.href} href={l.href} className={cn("whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium", active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
                {l.label}
              </Link>
            )
          })}
        </nav>
        <Ready>{children}</Ready>
      </div>
    </ForumProvider>
  )
}
