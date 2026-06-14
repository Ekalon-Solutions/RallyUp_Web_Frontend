"use client"

import { Award, CalendarClock } from "lucide-react"
import { formatDisplayDate } from "@/lib/utils"
import { cn } from "@/lib/utils"

export function formatEventDateTime(value?: string | null): string {
  if (!value) return "—"
  try {
    const d = new Date(value)
    return `${formatDisplayDate(d)} · ${d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`
  } catch {
    return "—"
  }
}

export function formatBookingWindow(
  start?: string | null,
  end?: string | null
): string | null {
  if (!start?.trim() && !end?.trim()) return null
  if (start && end) {
    return `${formatEventDateTime(start)} – ${formatEventDateTime(end)}`
  }
  return formatEventDateTime(start || end)
}

type Props = {
  bookingStartTime?: string | null
  bookingEndTime?: string | null
  attendancePoints?: number | string | null
  className?: string
  compact?: boolean
}

export function EventScheduleMeta({
  bookingStartTime,
  bookingEndTime,
  attendancePoints,
  className,
  compact = false,
}: Props) {
  const booking = formatBookingWindow(bookingStartTime, bookingEndTime)
  const pointsNum = Number(attendancePoints)
  const points = Number.isFinite(pointsNum) && pointsNum > 0 ? pointsNum : null

  if (!booking && points == null) return null

  if (compact) {
    return (
      <div className={cn("space-y-1 text-xs text-muted-foreground", className)}>
        {booking && (
          <div className="flex items-center gap-1.5">
            <CalendarClock className="w-3 h-3 shrink-0" />
            <span>Booking: {booking}</span>
          </div>
        )}
        {points != null && (
          <div className="flex items-center gap-1.5">
            <Award className="w-3 h-3 shrink-0" />
            <span>{points} attendance pts</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {booking && (
        <div className="flex items-start gap-2 text-sm">
          <CalendarClock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <span className="min-w-0">
            <span className="text-xs text-muted-foreground block">Booking window</span>
            <span className="font-medium leading-snug break-words">{booking}</span>
          </span>
        </div>
      )}
      {points != null && (
        <div className="flex items-center gap-2 text-sm">
          <Award className="w-4 h-4 text-muted-foreground shrink-0" />
          <span>
            <span className="text-xs text-muted-foreground">Reward points · </span>
            <span className="font-medium">{points} </span>
            <span className="font-medium">(Member Only)</span>
          </span>
        </div>
      )}
    </div>
  )
}
