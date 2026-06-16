"use client"

import { Badge } from "@/components/ui/badge"
import { getJointScreeningClubNames } from "@/lib/joint-screening-clubs"
import { cn } from "@/lib/utils"
import { Handshake } from "lucide-react"

export type JointScreeningConfig = {
  enabled?: boolean
  homeClubName?: string
  homeTeam?: string
  partnerClubNames?: string[]
}

export function isJointScreeningEvent(config?: JointScreeningConfig | null): boolean {
  return Boolean(config?.enabled && (config.partnerClubNames?.length ?? 0) > 0)
}

export function getJointScreeningLabel(config?: JointScreeningConfig | null): string {
  const clubs = getJointScreeningClubNames(config ?? undefined)
  return clubs.join(" × ")
}

type Props = {
  jointScreening?: JointScreeningConfig | null
  variant?: "badge" | "detail" | "row"
  className?: string
  primaryColor?: string
}

export function JointScreeningDisplay({
  jointScreening,
  variant = "badge",
  className,
  primaryColor = "#3b82f6",
}: Props) {
  if (!isJointScreeningEvent(jointScreening)) return null

  const label = getJointScreeningLabel(jointScreening)

  if (variant === "badge") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "text-xs bg-violet-50 dark:bg-violet-950/40 text-violet-800 dark:text-violet-200 border-violet-200 dark:border-violet-800",
          className
        )}
        title={`Joint screening: ${label}`}
      >
        <Handshake className="w-3 h-3 mr-1 shrink-0" />
        <span className="truncate max-w-[200px] sm:max-w-none">Joint · {label}</span>
      </Badge>
    )
  }

  if (variant === "row") {
    return (
      <div className={cn("flex items-start gap-2.5", className)}>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
        >
          <Handshake className="h-4 w-4" />
        </div>
        <div className="min-w-0 pt-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Joint Screening
          </p>
          <p className="font-medium leading-snug break-words">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Fans select their club at checkout</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/80 dark:bg-violet-950/30 px-3 py-2.5 space-y-1", className)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-200">
        <Handshake className="w-3.5 h-3.5" />
        Joint Screening
      </div>
      <p className="text-sm font-medium leading-snug break-words">{label}</p>
      <p className="text-xs text-muted-foreground">Fans select their club affiliation at checkout</p>
    </div>
  )
}
