"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function WizardHeader({ title, backHref }: { title: string; backHref: string }) {
  return (
    <div className="flex items-center gap-3">
      <Link href={backHref} aria-label="Back">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </Link>
      <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
    </div>
  )
}

export function PublishingTo({ clubName }: { clubName?: string }) {
  return (
    <div className="rounded-lg border bg-muted/50 px-4 py-3 text-sm">
      {clubName ? (
        <p>
          <span className="text-muted-foreground">Publishing to:</span> <span className="font-semibold">{clubName}</span>
        </p>
      ) : (
        <p className="text-amber-700 dark:text-amber-300">Select a club from the sidebar before publishing.</p>
      )}
    </div>
  )
}

export function StepPills({
  steps,
  current,
  onSelect,
}: {
  steps: readonly string[]
  current: number
  onSelect: (index: number) => void
}) {
  return (
    <nav aria-label="Steps" className="flex flex-wrap gap-2">
      {steps.map((label, i) => (
        <button
          key={label}
          type="button"
          // Going back is free; going forward runs validation in the page's Next handler.
          onClick={() => i < current && onSelect(i)}
          disabled={i > current}
          aria-current={i === current ? "step" : undefined}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            i === current ? "border-foreground text-foreground" : "text-muted-foreground",
            i < current && "hover:bg-muted cursor-pointer",
            i > current && "cursor-not-allowed"
          )}
        >
          <span
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-xs",
              i === current ? "bg-foreground text-background" : "bg-muted-foreground/60 text-background"
            )}
          >
            {i + 1}
          </span>
          {label}
        </button>
      ))}
    </nav>
  )
}

export function WizardFooter({
  cancelHref,
  isFirstStep,
  isLastStep,
  loading,
  isEdit,
  isPublished,
  onBack,
  onNext,
  onSave,
}: {
  cancelHref: string
  isFirstStep: boolean
  isLastStep: boolean
  loading: boolean
  isEdit: boolean
  /** Editing a live listing: hide "Save as Draft" (a published listing can't go back to draft). */
  isPublished: boolean
  onBack: () => void
  onNext: () => void
  onSave: (mode: "draft" | "publish") => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <Link href={cancelHref}>
        <Button type="button" variant="outline">Cancel</Button>
      </Link>
      <div className="flex flex-wrap gap-2">
        {!isFirstStep && (
          <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        )}
        {!isLastStep ? (
          <Button type="button" onClick={onNext}>
            Next
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <>
            {!isPublished && (
              <Button type="button" variant="secondary" onClick={() => onSave("draft")} disabled={loading}>
                Save as Draft
              </Button>
            )}
            <Button type="button" onClick={() => onSave("publish")} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit && isPublished ? "Save Changes" : "Publish"}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
