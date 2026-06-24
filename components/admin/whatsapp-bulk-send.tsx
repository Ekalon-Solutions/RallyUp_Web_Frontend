"use client"

import { useEffect, useState } from "react"
import { apiClient, WhatsAppBulkPreview, WhatsAppMarketingTemplate } from "@/lib/api"
import { usePrimaryClubOwner } from "@/hooks/usePrimaryClubOwner"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Send, ShieldCheck, AlertTriangle, Lock } from "lucide-react"

const inr = (n: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n)
const OPT_OUT_SUFFIX = "Reply STOP to unsubscribe."

function placeholdersFromText(text?: string): number[] {
  if (!text) return []
  const indexes = new Set<number>()
  for (const match of text.matchAll(/\{\{\s*(\d+)\s*\}\}/g)) {
    const index = Number(match[1])
    if (Number.isFinite(index) && index > 0) indexes.add(index)
  }
  return Array.from(indexes).sort((a, b) => a - b)
}

interface Props {
  clubId: string
}

export function WhatsAppBulkSend({ clubId }: Props) {
  const { isPrimaryOwner } = usePrimaryClubOwner()
  const [templateName, setTemplateName] = useState("")
  const [templates, setTemplates] = useState<WhatsAppMarketingTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [templatesError, setTemplatesError] = useState("")
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [previewing, setPreviewing] = useState(false)
  const [sending, setSending] = useState(false)
  const [preview, setPreview] = useState<WhatsAppBulkPreview | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const selectedTemplate = templates.find((template) => template.name === templateName)
  const selectedVariableIndexes =
    selectedTemplate?.variableIndexes?.length
      ? selectedTemplate.variableIndexes
      : placeholdersFromText(selectedTemplate?.bodyPreview)
  const missingVariableIndexes = selectedVariableIndexes.filter(
    (index) => !variables[String(index)]?.trim()
  )

  useEffect(() => {
    let cancelled = false

    const loadTemplates = async () => {
      setTemplatesLoading(true)
      setTemplatesError("")
      setVariables({})
      setPreview(null)
      const res = await apiClient.listBulkMarketingTemplates(clubId)

      if (cancelled) return

      if (res.success && res.data) {
        const availableTemplates = res.data.templates
        setTemplates(availableTemplates)
        setTemplateName((current) =>
          availableTemplates.some((template) => template.name === current)
            ? current
            : availableTemplates[0]?.name || ""
        )
      } else {
        setTemplates([])
        setTemplatesError(res.error || "Could not load approved marketing templates from AiSensy")
      }
      setTemplatesLoading(false)
    }

    loadTemplates()

    return () => {
      cancelled = true
    }
  }, [clubId])

  const handleTemplateChange = (name: string) => {
    setTemplateName(name)
    setVariables({})
    setPreview(null)
  }

  const buildVariables = () => {
    const v: Record<string, string> = {}
    if (selectedVariableIndexes.length > 0) {
      selectedVariableIndexes.forEach((index) => {
        v[String(index)] = variables[String(index)]?.trim() || ""
      })
      return v
    }
    Object.entries(variables).forEach(([key, value]) => {
      if (value.trim()) v[key] = value.trim()
    })
    return v
  }

  const templatePreview = (() => {
    if (!selectedTemplate?.bodyPreview) return ""
    return selectedTemplate.bodyPreview.replace(/\{\{\s*(\d+)\s*\}\}/g, (match, index) => {
      return variables[index] || match
    })
  })()

  const handlePreview = async () => {
    if (!templateName.trim()) {
      toast.error("Select an approved marketing template")
      return
    }
    if (missingVariableIndexes.length > 0) {
      toast.error(`Fill variable {{${missingVariableIndexes[0]}}} before previewing`)
      return
    }
    setPreviewing(true)
    const res = await apiClient.previewBulkMarketing(clubId, {
      templateName: templateName.trim(),
      variables: buildVariables(),
      audience: { type: "all_active_members" },
    })
    if (res.success && res.data) {
      setPreview(res.data.preview)
      setConfirmOpen(true)
    } else {
      toast.error(res.error || "Preview failed")
    }
    setPreviewing(false)
  }

  const handleSend = async () => {
    if (missingVariableIndexes.length > 0) {
      toast.error(`Fill variable {{${missingVariableIndexes[0]}}} before sending`)
      return
    }
    setSending(true)
    const res = await apiClient.sendBulkMarketing(clubId, {
      templateName: templateName.trim(),
      variables: buildVariables(),
      audience: { type: "all_active_members" },
    })
    if (res.success && res.data) {
      const r = res.data.result
      toast.success(`Blast ${r.result}: ${r.sent} sent, ${r.failed} failed`)
      setConfirmOpen(false)
    } else {
      // Surfaces template-not-approved / unsafe-content / cap-exceeded rejections.
      toast.error(res.error || "Send failed")
    }
    setSending(false)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-green-600" /> Bulk Marketing Message
          </CardTitle>
          <CardDescription>
            Sends to all active members using an <strong>Approved</strong> template. An opt-out line
            is appended automatically. Member numbers are processed securely on the server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Approved Marketing Template</Label>
            <Select
              value={templateName}
              onValueChange={handleTemplateChange}
              disabled={templatesLoading || templates.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={templatesLoading ? "Loading AiSensy templates..." : "Select a template"} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.name} value={template.name}>
                    <div className="flex flex-col">
                      <span>{template.name}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {template.category} - {template.status}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!templatesLoading && templates.length === 0 && (
              <p className="text-xs text-amber-700">
                {templatesError || "No approved marketing templates were found in AiSensy."}
              </p>
            )}
            {selectedTemplate && (
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Template Preview</span>
                  <span className="text-[11px] text-muted-foreground">
                    {selectedTemplate.category} - {selectedTemplate.status}
                  </span>
                </div>
                {templatePreview ? (
                  <p className="whitespace-pre-wrap text-foreground">
                    {templatePreview}
                    {"\n"}
                    {OPT_OUT_SUFFIX}
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    AiSensy did not return preview text for this template. Variables and the opt-out
                    line will still be applied during send.
                  </p>
                )}
              </div>
            )}
          </div>
          {selectedVariableIndexes.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {selectedVariableIndexes.map((index) => (
                <div key={index} className="space-y-1">
                  <Label className="text-xs">Variable {`{{${index}}}`}</Label>
                  <Textarea
                    value={variables[String(index)] || ""}
                    onChange={(e) =>
                      setVariables((current) => ({
                        ...current,
                        [String(index)]: e.target.value,
                      }))
                    }
                    rows={1}
                    placeholder={`Enter value for {{${index}}}`}
                  />
                </div>
              ))}
            </div>
          ) : selectedTemplate ? (
            <p className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
              This template does not expose body variables from AiSensy.
            </p>
          ) : null}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={
                previewing ||
                templatesLoading ||
                !templateName.trim() ||
                missingVariableIndexes.length > 0
              }
            >
              {previewing ? "Calculating…" : "Preview & Cost"}
            </Button>
            {missingVariableIndexes.length > 0 && (
              <span className="text-xs text-amber-700">
                Fill {missingVariableIndexes.map((index) => `{{${index}}}`).join(", ")} to continue.
              </span>
            )}
            {!isPrimaryOwner && (
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Lock className="w-3 h-3" /> Sub-Admins can draft &amp; preview; only the Primary Admin can send.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Safety Confirmation modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-600" /> Safety Confirmation
            </DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-3 text-sm">
              <p className="text-base">
                Are you sure you want to send this to{" "}
                <strong>{preview.eligible.toLocaleString("en-IN")} members</strong> for a cost of{" "}
                <strong className="text-green-700">INR {inr(preview.totalCost)}</strong>?
              </p>
              <p className="text-xs text-muted-foreground">
                {inr(preview.eligible)} × INR {inr(preview.ratePerMessage)} = INR {inr(preview.baseCost)} +{" "}
                {preview.gstPercent}% GST
              </p>

              {(preview.excluded.optedOut +
                preview.excluded.blocked +
                preview.excluded.cooldown +
                preview.excluded.invalidPhone) > 0 && (
                <div className="rounded-md bg-amber-50 text-amber-800 p-2 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    Excluded for safety: {preview.excluded.optedOut} opted-out,{" "}
                    {preview.excluded.blocked} blocked, {preview.excluded.cooldown} cooldown,{" "}
                    {preview.excluded.invalidPhone} invalid number
                    {" "}(of {preview.audienceRequested} total).
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={sending}>
              Cancel
            </Button>
            {isPrimaryOwner ? (
              <Button onClick={handleSend} disabled={sending || !preview || preview.eligible === 0}>
                {sending ? "Sending…" : "Confirm & Send Blast"}
              </Button>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button disabled>Confirm &amp; Send Blast</Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Only the Primary Admin can trigger the final blast.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
