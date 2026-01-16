"use client"

import React from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Info, X } from "lucide-react"
import Link from "next/link"

interface MemberStatusBannerProps {
  type: "member" | "non-member" | "info"
  message: string
  onDismiss?: () => void
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export function MemberStatusBanner({
  type,
  message,
  onDismiss,
  actionLabel,
  actionHref,
  onAction,
}: MemberStatusBannerProps) {
  const getAlertStyles = () => {
    switch (type) {
      case "member":
        return "border-green-200 bg-green-50 text-green-800"
      case "non-member":
        return "border-blue-200 bg-blue-50 text-blue-800"
      case "info":
        return "border-blue-200 bg-blue-50 text-blue-800"
      default:
        return "border-gray-200 bg-gray-50 text-gray-800"
    }
  }

  const getIcon = () => {
    switch (type) {
      case "member":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "non-member":
      case "info":
        return <Info className="h-4 w-4 text-blue-600" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  return (
    <Alert className={getAlertStyles()}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <AlertDescription className="font-medium">
            {message}
          </AlertDescription>
          {(actionLabel && (actionHref || onAction)) && (
            <div className="mt-2">
              {actionHref ? (
                <Link href={actionHref}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                  >
                    {actionLabel}
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={onAction}
                >
                  {actionLabel}
                </Button>
              )}
            </div>
          )}
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  )
}
