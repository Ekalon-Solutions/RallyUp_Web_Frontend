"use client"

import { cn } from "@/lib/utils"

type Props = {
  className?: string
  onClick?: () => void
  interactive?: boolean
}

export function NonRefundableBadge({ className, onClick, interactive = false }: Props) {
  const baseClass = cn(
    "inline-flex items-center rounded-md border-2 border-amber-600 bg-amber-500 px-2.5 py-0.5",
    "text-[10px] font-bold uppercase tracking-wider text-amber-950 shadow-sm",
    interactive && "cursor-pointer hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700",
    className
  )

  if (interactive && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={baseClass}
        aria-label="This ticket is non-refundable. View refund policy."
      >
        <span aria-hidden="true">NON-REFUNDABLE</span>
      </button>
    )
  }

  return (
    <span className={baseClass} role="status" aria-label="This ticket is non-refundable">
      <span aria-hidden="true">NON-REFUNDABLE</span>
    </span>
  )
}
