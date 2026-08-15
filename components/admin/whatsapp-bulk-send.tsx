"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  apiClient,
  Event,
  WhatsAppBulkPreview,
  WhatsAppMarketingTemplate,
} from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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
import { Send, ShieldCheck, AlertTriangle, Lock, ImagePlus, Loader2, X } from "lucide-react"
import { WhatsAppMessagePreview } from "@/components/admin/whatsapp-message-preview"
import { cn } from "@/lib/utils"
import {
  MEMBER_TOKENS,
  ROLE_LABELS,
  SAMPLE_MEMBER,
  SLOT_ROLES,
  TemplateSlot,
  TemplateSlotRole,
  emptySlots,
  isDynamicUrlButton,
  isMemberRole,
  renderTemplatePreview,
  valueForRole,
} from "@/lib/whatsapp-template-mapping"

const inr = (n: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n)
const MAX_HEADER_BYTES = 5 * 1024 * 1024


function placeholdersFromText(text?: string): number[] {
  if (!text) return []
  const indexes = new Set<number>()
  for (const match of text.matchAll(/\{\{\s*(\d+)\s*\}\}/g)) {
    const index = Number(match[1])
    if (Number.isFinite(index) && index > 0) indexes.add(index)
  }
  return Array.from(indexes).sort((a, b) => a - b)
}

function asEventList(data: unknown): Event[] {
  if (Array.isArray(data)) return data as Event[]
  if (data && typeof data === "object" && Array.isArray((data as { events?: Event[] }).events)) {
    return (data as { events: Event[] }).events
  }
  return []
}

interface Props {
  clubId: string
}

export function WhatsAppBulkSend({ clubId }: Props) {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === "super_admin"
  const [templateName, setTemplateName] = useState("")
  const [templates, setTemplates] = useState<WhatsAppMarketingTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [templatesError, setTemplatesError] = useState("")
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [slotRoles, setSlotRoles] = useState<Record<string, TemplateSlotRole>>({})
  const [headerImageUrl, setHeaderImageUrl] = useState("")
  const [headerUploading, setHeaderUploading] = useState(false)
  const [pasteImageUrl, setPasteImageUrl] = useState(false)
  const [buttonUrls, setButtonUrls] = useState<Record<string, string>>({})
  const headerInputRef = useRef<HTMLInputElement>(null)
  const [headerDragOver, setHeaderDragOver] = useState(false)
  const [clubName, setClubName] = useState("")
  const [events, setEvents] = useState<Event[]>([])
  const [eventId, setEventId] = useState("")
  const [previewing, setPreviewing] = useState(false)
  const [sending, setSending] = useState(false)
  const [preview, setPreview] = useState<WhatsAppBulkPreview | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const selectedTemplate = templates.find((template) => template.name === templateName)
  const selectedEvent = events.find((event) => event._id === eventId) || null
  const selectedVariableIndexes = useMemo(
    () =>
      selectedTemplate?.variableIndexes?.length
        ? selectedTemplate.variableIndexes
        : placeholdersFromText(selectedTemplate?.bodyPreview),
    [selectedTemplate]
  )
  const slots: TemplateSlot[] = useMemo(
    () =>
      emptySlots(selectedVariableIndexes).map((slot) => {
        const role = slotRoles[String(slot.index)] || "custom"
        return { ...slot, role, label: ROLE_LABELS[role] }
      }),
    [selectedVariableIndexes, slotRoles]
  )
  const missingVariableIndexes = slots
    .filter((slot) => !isMemberRole(slot.role) && !variables[String(slot.index)]?.trim())
    .map((slot) => slot.index)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setTemplatesLoading(true)
      setTemplatesError("")
      setVariables({})
      setSlotRoles({})
      setPreview(null)

      const [templatesRes, clubRes, eventsRes] = await Promise.all([
        apiClient.listBulkMarketingTemplates(clubId),
        apiClient.getClubById(clubId),
        apiClient.getEventsByClub(clubId),
      ])

      if (cancelled) return

      if (templatesRes.success && templatesRes.data) {
        const availableTemplates = templatesRes.data.templates || []
        setTemplates(availableTemplates)
        setTemplateName((current) =>
          availableTemplates.some((template) => template.name === current)
            ? current
            : availableTemplates[0]?.name || ""
        )
      } else {
        setTemplates([])
        setTemplatesError(templatesRes.error || "Could not load approved marketing templates from AiSensy")
      }

      const clubData = clubRes.success ? (clubRes.data as { name?: string; club?: { name?: string } } | undefined) : undefined
      setClubName(clubData?.name?.trim() || clubData?.club?.name?.trim() || "")

      const loadedEvents = eventsRes.success ? asEventList(eventsRes.data) : []
      const sorted = [...loadedEvents].sort((a, b) => {
        const aTime = new Date(a.startTime || a.eventDate || 0).getTime()
        const bTime = new Date(b.startTime || b.eventDate || 0).getTime()
        return bTime - aTime
      })
      setEvents(sorted)
      setEventId("")
      setTemplatesLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [clubId])

  useEffect(() => {
    setSlotRoles({})
    setVariables({})
    setHeaderImageUrl("")
    setPasteImageUrl(false)
    setPreview(null)
    const nextUrls: Record<string, string> = {}
    for (const button of selectedTemplate?.buttons || []) {
      if (button.type !== "URL") continue
      const key = String(button.urlIndex ?? button.index)
      nextUrls[key] = button.example || button.url || ""
    }
    setButtonUrls(nextUrls)
  }, [selectedTemplate?.name])

  useEffect(() => {
    setVariables((current) => {
      const next = { ...current }
      let changed = false
      for (const slot of slots) {
        if (slot.role === "custom") continue
        const value = valueForRole(slot.role, { clubName, event: selectedEvent })
        if (next[String(slot.index)] !== value) {
          next[String(slot.index)] = value
          changed = true
        }
      }
      return changed ? next : current
    })
  }, [slots, clubName, selectedEvent])

  const handleTemplateChange = (name: string) => {
    setTemplateName(name)
    setPreview(null)
  }

  const handleRoleChange = (index: number, role: TemplateSlotRole) => {
    setSlotRoles((current) => ({ ...current, [String(index)]: role }))
    setVariables((current) => ({
      ...current,
      [String(index)]: valueForRole(role, { clubName, event: selectedEvent }),
    }))
    setPreview(null)
  }

  const needsHeaderImage =
    selectedTemplate?.type === "IMAGE" || selectedTemplate?.headerFormat === "IMAGE"
  const missingHeaderImage = needsHeaderImage && !headerImageUrl.trim()
  const urlButtons = (selectedTemplate?.buttons || []).filter((button) => button.type === "URL")
  const missingUrlButton = urlButtons.find((button) => {
    if (!isDynamicUrlButton(button.url)) return false
    return !buttonUrls[String(button.urlIndex ?? button.index)]?.trim()
  })

  const buildVariables = () => {
    const v: Record<string, string> = {}
    slots.forEach((slot) => {
      v[String(slot.index)] = isMemberRole(slot.role)
        ? MEMBER_TOKENS[slot.role]
        : variables[String(slot.index)]?.trim() || ""
    })
    return v
  }

  const templatePreview = selectedTemplate?.bodyPreview
    ? renderTemplatePreview(selectedTemplate.bodyPreview, variables)
    : ""

  const handlePreview = async () => {
    if (!templateName.trim()) {
      toast.error("Select an approved marketing template")
      return
    }
    if (missingVariableIndexes.length > 0) {
      const label = slots.find((slot) => slot.index === missingVariableIndexes[0])?.label || "required fields"
      toast.error(`Fill ${label} before previewing`)
      return
    }
    if (missingHeaderImage) {
      toast.error("This template needs a header image")
      return
    }
    if (missingUrlButton) {
      toast.error(`Add a URL for the "${missingUrlButton.text}" button`)
      return
    }
    setPreviewing(true)
    const res = await apiClient.previewBulkMarketing(clubId, {
      templateName: templateName.trim(),
      variables: buildVariables(),
      headerImageUrl: headerImageUrl.trim() || undefined,
      buttonUrls,
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
      const label = slots.find((slot) => slot.index === missingVariableIndexes[0])?.label || "required fields"
      toast.error(`Fill ${label} before sending`)
      return
    }
    if (missingHeaderImage) {
      toast.error("This template needs a header image")
      return
    }
    if (missingUrlButton) {
      toast.error(`Add a URL for the "${missingUrlButton.text}" button`)
      return
    }
    setSending(true)
    const res = await apiClient.sendBulkMarketing(clubId, {
      templateName: templateName.trim(),
      variables: buildVariables(),
      headerImageUrl: headerImageUrl.trim() || undefined,
      buttonUrls,
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

  const acceptHeaderFile = async (file: File | undefined | null) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file")
      return
    }
    if (file.size > MAX_HEADER_BYTES) {
      toast.error("Image must be smaller than 5MB")
      return
    }
    setHeaderUploading(true)
    const res = await apiClient.uploadWhatsAppHeaderImage(clubId, file)
    if (res.success && res.data?.url) {
      setHeaderImageUrl(res.data.url)
      setPasteImageUrl(false)
      setPreview(null)
      toast.success("Header image uploaded")
    } else {
      toast.error(res.error || "Could not upload header image")
    }
    setHeaderUploading(false)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-green-600" /> Bulk Marketing Message
          </CardTitle>
          <CardDescription>
            Sends to all active members using an <strong>Approved</strong> template. Member numbers
            are processed securely on the server.
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
          </div>

          {selectedTemplate && (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs">Event (for mapped event fields)</Label>
                  <Select
                    value={eventId}
                    onValueChange={setEventId}
                    disabled={events.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={events.length === 0 ? "No club events found" : "Select an event"} />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event._id} value={event._id}>
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {needsHeaderImage && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs">Header image</Label>
                      <button
                        type="button"
                        className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
                        onClick={() => setPasteImageUrl((open) => !open)}
                      >
                        {pasteImageUrl ? "Upload a file instead" : "Or paste an image URL"}
                      </button>
                    </div>
                    <input
                      ref={headerInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        void acceptHeaderFile(e.target.files?.[0])
                        e.target.value = ""
                      }}
                    />
                    {pasteImageUrl ? (
                      <Input
                        value={headerImageUrl}
                        onChange={(e) => {
                          setHeaderImageUrl(e.target.value)
                          setPreview(null)
                        }}
                        placeholder="https://… public image URL"
                      />
                    ) : headerImageUrl && !headerUploading ? (
                      <div className="relative overflow-hidden rounded-lg border">
                        <img
                          src={headerImageUrl}
                          alt="Header preview"
                          className="h-36 w-full object-cover"
                        />
                        <div className="absolute right-2 top-2 flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => headerInputRef.current?.click()}
                          >
                            Replace
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                            onClick={() => {
                              setHeaderImageUrl("")
                              setPreview(null)
                            }}
                            aria-label="Remove header image"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={headerUploading}
                        onClick={() => headerInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault()
                          setHeaderDragOver(true)
                        }}
                        onDragLeave={() => setHeaderDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault()
                          setHeaderDragOver(false)
                          void acceptHeaderFile(e.dataTransfer.files?.[0])
                        }}
                        className={cn(
                          "flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-muted-foreground transition-colors",
                          headerDragOver ? "border-primary bg-primary/5" : "hover:border-muted-foreground/50",
                          headerUploading && "cursor-not-allowed opacity-70"
                        )}
                      >
                        {headerUploading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <ImagePlus className="h-6 w-6" />
                        )}
                        <span className="text-sm font-medium">
                          {headerUploading ? "Uploading…" : "Drop or select an image"}
                        </span>
                        <span className="text-xs">PNG, JPG or WebP — up to 5MB. Stored on S3.</span>
                      </button>
                    )}
                  </div>
                )}
                {urlButtons.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      This template has a URL button. Paste or change the destination used when the member taps it.
                    </p>
                    {urlButtons.map((button) => {
                      const key = String(button.urlIndex ?? button.index)
                      const dynamic = isDynamicUrlButton(button.url)
                      return (
                        <div key={`${button.index}-${button.text}`} className="space-y-1 rounded-md border p-2">
                          <Label className="text-xs">
                            {button.text} {dynamic ? "URL" : "button URL"}
                          </Label>
                          <Input
                            value={buttonUrls[key] || ""}
                            onChange={(e) => {
                              setButtonUrls((current) => ({ ...current, [key]: e.target.value }))
                              setPreview(null)
                            }}
                            placeholder={button.url || "https://…"}
                          />
                          {!dynamic && button.url ? (
                            <p className="text-[11px] text-muted-foreground">
                              Meta approved this button as {button.url}. Changing it only updates the preview unless the template URL is dynamic.
                            </p>
                          ) : (
                            <p className="text-[11px] text-muted-foreground">
                              Paste the full link or just the part after the approved prefix.
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
                {slots.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Map each placeholder. The WhatsApp preview on the right updates as you type.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {slots.map((slot) => {
                        const autoMember = isMemberRole(slot.role)
                        return (
                          <div key={slot.index} className="space-y-1 rounded-md border p-2">
                            <Label className="text-xs">
                              {`{{${slot.index}}}`} mapping
                            </Label>
                            <Select
                              value={slot.role}
                              onValueChange={(role) => handleRoleChange(slot.index, role as TemplateSlotRole)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SLOT_ROLES.map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {ROLE_LABELS[role]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Textarea
                              value={
                                autoMember
                                  ? `${ROLE_LABELS[slot.role]} · filled per member at send`
                                  : variables[String(slot.index)] || ""
                              }
                              onChange={(e) =>
                                setVariables((current) => ({
                                  ...current,
                                  [String(slot.index)]: e.target.value,
                                }))
                              }
                              rows={1}
                              disabled={autoMember}
                              placeholder={autoMember ? "Personalized per member" : `Value for {{${slot.index}}}`}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
                    This template does not expose body variables from AiSensy.
                  </p>
                )}
              </div>

              <div className="space-y-2 lg:sticky lg:top-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Live WhatsApp preview</Label>
                  <span className="text-[11px] text-muted-foreground">
                    {selectedTemplate.category} · {selectedTemplate.status}
                  </span>
                </div>
                <WhatsAppMessagePreview
                  body={templatePreview || selectedTemplate.bodyPreview}
                  headerImageUrl={headerImageUrl.trim() || undefined}
                  clubName={clubName}
                  footer={selectedTemplate.footerPreview}
                  buttons={selectedTemplate.buttons}
                  buttonUrls={buttonUrls}
                />
                {slots.some((slot) => isMemberRole(slot.role)) && (
                  <p className="text-[11px] text-muted-foreground">
                    Preview uses sample member “{SAMPLE_MEMBER.member_name}”. Each recipient gets their own details.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={
                previewing ||
                templatesLoading ||
                !templateName.trim() ||
                missingVariableIndexes.length > 0 ||
                missingHeaderImage ||
                Boolean(missingUrlButton) ||
                headerUploading
              }
            >
              {previewing ? "Calculating…" : "Preview & Cost"}
            </Button>
            {missingVariableIndexes.length > 0 && (
              <span className="text-xs text-amber-700">
                Fill{" "}
                {slots
                  .filter((slot) => missingVariableIndexes.includes(slot.index))
                  .map((slot) => slot.label)
                  .join(", ")}{" "}
                to continue.
              </span>
            )}
            {missingUrlButton && (
              <span className="text-xs text-amber-700">
                Paste a URL for the “{missingUrlButton.text}” button to continue.
              </span>
            )}
            {!isSuperAdmin && (
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Lock className="w-3 h-3" /> Admins can draft &amp; preview; only a Super-Admin can send.
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
              <WhatsAppMessagePreview
                body={templatePreview || selectedTemplate?.bodyPreview}
                headerImageUrl={headerImageUrl.trim() || undefined}
                clubName={clubName}
                footer={selectedTemplate?.footerPreview}
                buttons={selectedTemplate?.buttons}
                buttonUrls={buttonUrls}
              />
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
            {isSuperAdmin ? (
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
                    Only a Super-Admin can trigger the final blast.
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
