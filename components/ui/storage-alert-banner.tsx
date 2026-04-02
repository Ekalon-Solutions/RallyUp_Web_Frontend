"use client"

import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, HardDrive, X } from "lucide-react"
import Link from "next/link"
import type { StorageAlertLevel } from "@/lib/api"

interface StorageAlertBannerProps {
  usagePercent: number
  usedGb: number
  totalGb: number
  alertLevel: StorageAlertLevel
  onDismiss?: () => void
}

const LEVEL_CONFIG: Record<StorageAlertLevel, {
  borderColor: string
  bgColor: string
  textColor: string
  iconColor: string
  badgeColor: string
  label: string
}> = {
  warning: {
    borderColor: "border-yellow-300",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    textColor: "text-yellow-900 dark:text-yellow-200",
    iconColor: "text-yellow-600",
    badgeColor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    label: "Storage Warning",
  },
  danger: {
    borderColor: "border-orange-300",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    textColor: "text-orange-900 dark:text-orange-200",
    iconColor: "text-orange-600",
    badgeColor: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    label: "Storage Alert",
  },
  critical: {
    borderColor: "border-red-300",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    textColor: "text-red-900 dark:text-red-200",
    iconColor: "text-red-600",
    badgeColor: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    label: "Storage Critical",
  },
  exceeded: {
    borderColor: "border-red-500",
    bgColor: "bg-red-100 dark:bg-red-950/30",
    textColor: "text-red-900 dark:text-red-200",
    iconColor: "text-red-700",
    badgeColor: "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100",
    label: "Storage Full",
  },
}

const LEVEL_MESSAGES: Record<StorageAlertLevel, string> = {
  warning: "Your gallery storage has reached 80% capacity. Consider upgrading or removing unused media.",
  danger: "Your gallery storage is at 90%. Upgrade your plan soon to avoid upload disruptions.",
  critical: "Critical: gallery storage is at 95%. New uploads may be blocked shortly.",
  exceeded: "Your gallery storage is full. New uploads are blocked. Delete media or upgrade your plan to continue.",
}

export function StorageAlertBanner({
  usagePercent,
  usedGb,
  totalGb,
  alertLevel,
  onDismiss,
}: StorageAlertBannerProps) {
  const config = LEVEL_CONFIG[alertLevel]

  return (
    <Alert className={`${config.borderColor} ${config.bgColor} ${config.textColor} mb-4`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.badgeColor}`}>
              {config.label}
            </span>
            <span className="font-semibold text-sm">
              {usagePercent.toFixed(1)}% used
            </span>
          </div>
          <AlertDescription className="mt-1 font-medium text-sm">
            {LEVEL_MESSAGES[alertLevel]}
          </AlertDescription>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs opacity-75">
              <HardDrive className="h-3 w-3" />
              <span>{usedGb.toFixed(2)} GB / {totalGb.toFixed(2)} GB used</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/gallery">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs font-semibold border-current/30 hover:bg-current/10"
                >
                  Manage Storage
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {onDismiss && alertLevel !== "exceeded" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 flex-shrink-0 opacity-60 hover:opacity-100"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  )
}
