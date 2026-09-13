"use client"

import React from "react"
import { BarChart3, Bell, ImageIcon, Star, Tag, Ticket } from "lucide-react"
import { cn } from "@/lib/utils"
import { planBenefits, type PublicPlanConfig } from "@/lib/membershipPlanConfig"

const BENEFIT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  matchday_tickets: Ticket,
  events_store_discounts: Tag,
  news_updates: Bell,
  polls: BarChart3,
  gallery_access: ImageIcon,
  additional_perks: Star,
}

/**
 * The public benefit list for a plan — driven by the plan's Feature Selection
 * step. Shared by the plan details modal and the checkout sidebar so both
 * always show the same thing.
 */
export function PlanBenefits({
  plan,
  className,
}: {
  plan: PublicPlanConfig | null | undefined
  className?: string
}) {
  const benefits = planBenefits(plan)
  if (benefits.length === 0) return null

  return (
    <ul className={cn("divide-y divide-muted-foreground/20", className)}>
      {benefits.map((benefit) => {
        const Icon = BENEFIT_ICONS[benefit.key] ?? Star
        return (
          <li key={benefit.key} className="flex items-start gap-3 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted-foreground/10">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </span>
            <div className="min-w-0">
              {/* No colour class — inherits the container's, which may override the theme. */}
              <p className="font-semibold">{benefit.title}</p>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** Brochure files an admin uploaded in the plan wizard. Images preview inline; PDFs link out. */
export function PlanBrochure({
  plan,
  className,
}: {
  plan: PublicPlanConfig | null | undefined
  className?: string
}) {
  const files = (plan?.brochure ?? []).filter((f) => f?.url)
  if (files.length === 0) return null

  return (
    <div className={className}>
      <h3 className="mb-3 font-bold">Membership Brochure</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {files.map((file, i) => {
          const isPdf = /\.pdf($|\?)/i.test(file.url)
          return (
            <a
              key={`${file.url}-${i}`}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              title={file.name || "Brochure"}
              className="group flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-muted-foreground/20 bg-muted-foreground/5 transition-colors hover:border-muted-foreground/40"
            >
              {isPdf ? (
                <span className="px-2 text-center text-xs font-medium text-muted-foreground">
                  {file.name || "Brochure"} (PDF)
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.url}
                  alt={file.name || "Membership brochure"}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              )}
            </a>
          )
        })}
      </div>
    </div>
  )
}
