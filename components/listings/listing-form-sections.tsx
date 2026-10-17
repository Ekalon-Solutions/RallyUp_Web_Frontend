"use client"

import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { EventImageUploader } from "@/components/events/event-image-uploader"

export function SectionCard({ title, description, children, action }: {
  title: React.ReactNode
  description?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

export function PosterSection({ list400, full1080, existingUrl, onList400, onFull1080, disabled }: {
  list400: File | null
  full1080: File | null
  existingUrl: string | null
  onList400: (f: File | null) => void
  onFull1080: (f: File | null) => void
  disabled?: boolean
}) {
  return (
    <SectionCard title="Event poster" description="Optional. If you upload only one image, it is used for both. Saved after the event.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>List image — 400px wide</Label>
          <EventImageUploader value={list400} onChange={onList400} existingImageUrl={existingUrl} title="Upload 400px list image" hint="Shown on the events feed — up to 10MB" disabled={disabled} />
        </div>
        <div className="space-y-2">
          <Label>Detail image — 1080px wide</Label>
          <EventImageUploader value={full1080} onChange={onFull1080} existingImageUrl={existingUrl} title="Upload 1080px detail image" hint="Shown on the event detail page — up to 10MB" disabled={disabled} />
        </div>
      </div>
    </SectionCard>
  )
}

export function ToggleRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label>{label}</Label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  )
}

export function EventSettingsSection({ memberOnly, onMemberOnly, attendancePoints, onAttendancePoints, waitlist, onWaitlist }: {
  memberOnly: boolean
  onMemberOnly: (v: boolean) => void
  attendancePoints: string
  onAttendancePoints: (v: string) => void
  /** Omit to hide the waitlist toggle (e.g. donation drives have no capacity). */
  waitlist?: boolean
  onWaitlist?: (v: boolean) => void
}) {
  return (
    <SectionCard title="Event settings">
      <ToggleRow label="Members only" hint="Only club members can register" checked={memberOnly} onChange={onMemberOnly} />
      <div className="space-y-2">
        <Label htmlFor="attendancePoints">Attendance points</Label>
        <Input id="attendancePoints" type="number" min={0} step={1} value={attendancePoints} onChange={(e) => onAttendancePoints(e.target.value)} />
        <p className="text-xs text-muted-foreground">Points awarded to members upon QR attendance scan</p>
      </div>
      {onWaitlist && (
        <>
          <Separator />
          <ToggleRow label="Enable waitlist" hint="Allow members to join a waitlist when the event is full" checked={Boolean(waitlist)} onChange={onWaitlist} />
        </>
      )}
    </SectionCard>
  )
}

/** Editable list of rows with a remove button and "+ Add". Renders whatever fields `renderRow` returns. */
export function RepeatingRows<T>({ rows, onChange, makeEmpty, renderRow, addLabel = "+ Add", max }: {
  rows: T[]
  onChange: (rows: T[]) => void
  makeEmpty: () => T
  renderRow: (row: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode
  addLabel?: string
  max?: number
}) {
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 gap-2">
            {renderRow(row, (patch) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r))), i)}
          </div>
          <Button type="button" variant="outline" size="icon" aria-label="Remove row" onClick={() => onChange(rows.filter((_, j) => j !== i))}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {(max === undefined || rows.length < max) && (
        <Button type="button" variant="outline" size="sm" className="border-dashed" onClick={() => onChange([...rows, makeEmpty()])}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          {addLabel.replace(/^\+\s*/, "")}
        </Button>
      )}
    </div>
  )
}

export function toDatetimeLocal(iso?: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
