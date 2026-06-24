"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, FileText, ArrowDown } from "lucide-react"
import type { WhatsAppMarketingTerms } from "@/lib/api"

interface Props {
  open: boolean
  terms: WhatsAppMarketingTerms | null
  pdfUrl: string
  accepting?: boolean
  onAccept: () => void
  onCancel: () => void
}

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n)

export function WhatsAppMarketingTermsModal({
  open,
  terms,
  pdfUrl,
  accepting = false,
  onAccept,
  onCancel,
}: Props) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [memberCount, setMemberCount] = useState(1000)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Reset gating each time the modal opens.
  useEffect(() => {
    if (open) {
      setScrolledToBottom(false)
      setAgreed(false)
    }
  }, [open])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    // Treat "within 24px of the end" as bottom (rounding / sub-pixel tolerance).
    if (el.scrollHeight - el.scrollTop - el.clientHeight <= 24) {
      setScrolledToBottom(true)
    }
  }, [])

  const rate = terms?.ratePerMessage ?? 1.5
  const gstPercent = terms?.gstPercent ?? 18
  const base = memberCount * rate
  const gst = (base * gstPercent) / 100
  const total = base + gst

  const canAccept = scrolledToBottom && agreed && !accepting

  return (
    <DialogPrimitive.Root open={open}>
      <DialogPrimitive.Portal>
        {/* Background Blur overlay — focuses the admin and blocks the dashboard behind. */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          // Mandatory modal: cannot be dismissed by clicking outside or pressing Escape.
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%]",
            "gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          )}
        >
          <div className="space-y-1.5">
            <DialogPrimitive.Title className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              {terms?.title ?? "WhatsApp Marketing — Terms & Conditions"}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              You must read these terms in full and accept them before enabling WhatsApp Marketing.
            </DialogPrimitive.Description>
          </div>

          {/* Billing rate — bold, high-contrast to prevent future disputes. */}
          <div className="rounded-md border-2 border-green-600 bg-green-50 dark:bg-green-950/30 px-4 py-3">
            <p className="text-sm text-muted-foreground">Billing rate</p>
            <p className="text-2xl font-extrabold text-green-700 dark:text-green-400">
              INR {inr(rate)} <span className="text-base font-bold">per Marketing Message</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">+ {gstPercent}% GST on all charges</p>
          </div>

          {/* Scrollable terms — scroll to the bottom to unlock acceptance. */}
          <div className="relative">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="h-56 overflow-y-auto rounded-md border bg-muted/30 p-4 text-sm leading-relaxed space-y-3"
            >
              {terms?.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Version {terms?.version} — End of terms.
              </p>
            </div>
            {!scrolledToBottom && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-foreground/80 text-background text-xs px-3 py-1 pointer-events-none">
                <ArrowDown className="w-3 h-3" /> Scroll to read all terms
              </div>
            )}
          </div>

          {/* Preview of Charges — sample calculation. */}
          <div className="rounded-md border p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="member-count" className="text-sm font-medium">
                Preview of Charges
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="member-count"
                  type="number"
                  min={1}
                  value={memberCount}
                  onChange={(e) => setMemberCount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-28 h-8"
                />
                <span className="text-sm text-muted-foreground">members</span>
              </div>
            </div>
            <p className="text-sm">
              {inr(memberCount)} members ={" "}
              <span className="font-semibold">INR {inr(base)}</span> + {gstPercent}% GST ={" "}
              <span className="font-bold text-foreground">INR {inr(total)}</span>
            </p>
          </div>

          {/* Download PDF for records. */}
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline w-fit"
          >
            <Download className="w-4 h-4" /> Download PDF copy for your records
          </a>

          {/* Active acceptance checkbox. */}
          <label className="flex items-start gap-2 cursor-pointer">
            <Checkbox
              checked={agreed}
              onCheckedChange={(v) => setAgreed(Boolean(v))}
              disabled={!scrolledToBottom}
              className="mt-0.5"
            />
            <span className="text-sm">
              I have read and accept the WhatsApp Marketing Terms & Conditions, including the billing
              rate of <span className="font-semibold">INR {inr(rate)} per marketing message + GST</span>,
              on behalf of the club.
            </span>
          </label>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={onCancel} disabled={accepting}>
              Cancel
            </Button>
            <Button
              onClick={onAccept}
              disabled={!canAccept}
              className="bg-green-600 hover:bg-green-700"
            >
              {accepting ? "Saving…" : "Accept & Enable"}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
