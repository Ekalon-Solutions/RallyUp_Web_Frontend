"use client"

import React, { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Check, Image as ImageIcon, Upload } from "lucide-react"
import { toast } from "sonner"
import { MembershipCard } from "@/components/membership-card"
import { apiClient, PublicMembershipCardDisplay } from "@/lib/api"
import { cn } from "@/lib/utils"
import { LOGO_SIZES, hasScalableLogo } from "@/lib/membershipCardLogo"
import { MEMBERSHIP_CARD_PREVIEW_PROFILE_PICTURE } from "@/lib/membershipCardProfile"
import {
  CARD_BG_HEIGHT,
  CARD_BG_MAX_MB,
  CARD_BG_WIDTH,
  CARD_STYLE_COLORS,
  CARD_STYLE_OPTIONS,
  CardCustomization,
  CardFieldKey,
  CardStyleKey,
  FONT_FAMILIES,
  FieldPosition,
  normalizeCardCustomization,
  resolveCardAssetUrl,
  validateCardBackgroundImage,
} from "@/lib/membershipCardFields"

export interface CardEditorResult {
  cardStyle: CardStyleKey
  customization: CardCustomization
}

interface MembershipCardEditorProps {
  card: PublicMembershipCardDisplay
  onCancel: () => void
  onSave: (result: CardEditorResult) => Promise<void>
}

const BACKGROUND_MODES = [
  { value: "gradient" as const, label: "Gradient", hint: "Two-tone color card" },
  { value: "image" as const, label: "Image Background", hint: "Upload a custom photo" },
]

export function MembershipCardEditor({ card, onCancel, onSave }: MembershipCardEditorProps) {
  const [custom, setCustom] = useState<CardCustomization>(() => normalizeCardCustomization(card.card.customization))
  const [cardStyle, setCardStyle] = useState<CardStyleKey>((card.card.cardStyle ?? "default") as CardStyleKey)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null)
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null)
  const [backgroundError, setBackgroundError] = useState<string | null>(null)
  const [isDropTarget, setIsDropTarget] = useState(false)
  const [saving, setSaving] = useState(false)
  const backgroundInputRef = useRef<HTMLInputElement>(null)

  // Object URLs are only valid until revoked, so release them when replaced/unmounted.
  useEffect(() => () => { if (logoPreview) URL.revokeObjectURL(logoPreview) }, [logoPreview])
  useEffect(() => () => { if (backgroundPreview) URL.revokeObjectURL(backgroundPreview) }, [backgroundPreview])

  const patch = (changes: Partial<CardCustomization>) => setCustom((prev) => ({ ...prev, ...changes }))

  const isImageMode = custom.backgroundMode === "image"

  const handleCardStyleChange = (value: string) => {
    const style = value as CardStyleKey
    const colors = CARD_STYLE_COLORS[style] ?? CARD_STYLE_COLORS.default
    setCardStyle(style)
    patch({ primaryColor: colors.primaryColor, secondaryColor: colors.secondaryColor })
  }

  const handleBackgroundFile = async (file?: File | null) => {
    if (!file) return
    const error = await validateCardBackgroundImage(file)
    if (error) {
      setBackgroundError(error)
      setBackgroundFile(null)
      setBackgroundPreview(null)
      return
    }
    setBackgroundError(null)
    setBackgroundFile(file)
    setBackgroundPreview(URL.createObjectURL(file))
  }

  const handleLogoFile = (file?: File | null) => {
    setLogoFile(file ?? null)
    setLogoPreview(file ? URL.createObjectURL(file) : null)
  }

  const handleFieldMove = (field: CardFieldKey, position: FieldPosition) =>
    setCustom((prev) => ({ ...prev, fieldPositions: { ...prev.fieldPositions, [field]: position } }))

  const handleSave = async () => {
    try {
      setSaving(true)
      let { backgroundImage, customLogo } = custom

      if (backgroundFile) {
        const uploaded = await apiClient.uploadMembershipCardImage(backgroundFile)
        if (!uploaded.success || !uploaded.data?.url) {
          throw new Error(uploaded.error || "Background image upload failed")
        }
        backgroundImage = uploaded.data.url
      }

      if (logoFile) {
        const uploaded = await apiClient.uploadMembershipCardImage(logoFile)
        if (!uploaded.success || !uploaded.data?.url) {
          throw new Error(uploaded.error || "Logo upload failed")
        }
        customLogo = uploaded.data.url
      }

      await onSave({ cardStyle, customization: { ...custom, backgroundImage, customLogo } })
    } catch (error: any) {
      toast.error("Failed to save card", { description: error?.message || "Please try again." })
    } finally {
      setSaving(false)
    }
  }

  const previewData: PublicMembershipCardDisplay = {
    ...card,
    card: {
      ...card.card,
      cardStyle,
      customization: {
        ...custom,
        ...(logoPreview ? { customLogo: logoPreview } : {}),
        ...(backgroundPreview ? { backgroundImage: backgroundPreview } : {}),
      },
    },
  }

  const logoAvailable = hasScalableLogo({
    customLogo: logoPreview || custom.customLogo,
    clubLogo: card.club?.logo,
  })

  const idPrefixField = (
    <div className="space-y-1.5">
      <Label htmlFor="cardIdPrefix">Membership ID Prefix</Label>
      <Input
        id="cardIdPrefix"
        type="text"
        placeholder="UM"
        maxLength={10}
        value={custom.idPrefix ?? ""}
        onChange={(e) => patch({ idPrefix: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })}
        className="font-mono uppercase"
      />
      <p className="text-xs text-muted-foreground">
        Prefix for member IDs (e.g. {custom.idPrefix || "UM"}-{new Date().getFullYear()}-XXXXXX)
      </p>
    </div>
  )

  const logoFields = (
    <>
      <div className="space-y-1.5">
        <Label>Logo Size</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          value={custom.logoSize}
          onValueChange={(value) => { if (value) patch({ logoSize: value as CardCustomization["logoSize"] }) }}
          disabled={!logoAvailable}
          className="justify-start"
        >
          {LOGO_SIZES.map((size) => (
            <ToggleGroupItem key={size.value} value={size.value} aria-label={`${size.label} logo`} className="flex-1">
              {size.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-xs text-muted-foreground">
          {logoAvailable
            ? "Large increases the logo to 150% of the default size."
            : "Upload a custom logo (or set a club logo) to adjust logo size."}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cardCustomLogo">Custom Logo</Label>
        <Input
          id="cardCustomLogo"
          type="file"
          accept="image/*"
          onChange={(e) => handleLogoFile(e.target.files?.[0] ?? null)}
        />
        {(logoPreview || custom.customLogo) && (
          <div className="flex items-center gap-3 pt-1">
            <img
              src={logoPreview || resolveCardAssetUrl(custom.customLogo!)}
              alt="Card logo"
              className="h-12 w-12 rounded border object-contain"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => { handleLogoFile(null); patch({ customLogo: undefined }) }}
              className="text-red-600 hover:text-red-700"
            >
              Remove
            </Button>
          </div>
        )}
      </div>
    </>
  )

  const toggleRow = (id: string, label: string, checked: boolean, onChange: (v: boolean) => void) => (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
      <Label htmlFor={id} className="cursor-pointer text-sm font-medium">{label}</Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )

  const gradientControls = (
    <div className="space-y-4">
      {idPrefixField}

      <div className="space-y-1.5">
        <Label htmlFor="cardStyle">Card Style</Label>
        <Select value={cardStyle} onValueChange={handleCardStyleChange}>
          <SelectTrigger id="cardStyle">
            <SelectValue placeholder="Select style" />
          </SelectTrigger>
          <SelectContent>
            {CARD_STYLE_OPTIONS.map((style) => (
              <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="primaryColor">Primary Color</Label>
        <Input
          id="primaryColor"
          type="color"
          value={custom.primaryColor}
          onChange={(e) => patch({ primaryColor: e.target.value })}
          className="h-10 w-full cursor-pointer"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="secondaryColor">Secondary Color</Label>
        <Input
          id="secondaryColor"
          type="color"
          value={custom.secondaryColor}
          onChange={(e) => patch({ secondaryColor: e.target.value })}
          className="h-10 w-full cursor-pointer"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fontFamily">Font Family</Label>
        <Select value={custom.fontFamily} onValueChange={(value) => patch({ fontFamily: value })}>
          <SelectTrigger id="fontFamily">
            <SelectValue asChild>
              <span style={{ fontFamily: `'${custom.fontFamily}', sans-serif` }}>{custom.fontFamily}</span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILIES.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                <span style={{ fontFamily: `'${font.value}', sans-serif` }}>{font.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <Switch id="showStatus" checked={custom.showStatus ?? true} onCheckedChange={(v) => patch({ showStatus: v })} />
        <Label htmlFor="showStatus">Status (Active)</Label>
      </div>

      <div className="flex items-center gap-3">
        <Switch id="showLogo" checked={custom.showLogo} onCheckedChange={(v) => patch({ showLogo: v })} />
        <Label htmlFor="showLogo">Show Club Logo</Label>
      </div>

      {custom.showLogo && logoFields}

      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <Switch
            id="showUserProfile"
            checked={custom.showUserProfile}
            onCheckedChange={(v) => patch({ showUserProfile: v })}
          />
          <Label htmlFor="showUserProfile">Show Member Profile Picture</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          When enabled, members with an uploaded profile photo will see it on their card.
        </p>
      </div>
    </div>
  )

  const imageControls = (
    <div className="space-y-4">
      <div className="rounded-xl border p-4 space-y-2">
        <p className="font-semibold text-sm">Before you upload</p>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0" />Format: <span className="font-semibold text-foreground">JPG or PNG</span></li>
          <li className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0" />Max file size: <span className="font-semibold text-foreground">{CARD_BG_MAX_MB}MB</span></li>
          <li className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0" />Exact dimensions: <span className="font-semibold text-foreground">{CARD_BG_WIDTH} × {CARD_BG_HEIGHT}px</span></li>
        </ul>
        <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
          <strong>Note:</strong> (~1.586:1) — images outside this won't be stretched or auto-fit, so they'll be rejected
        </p>
      </div>

      <div className="rounded-xl border p-4 space-y-2">
        <p className="font-semibold text-sm">Background Image</p>
        <p className="text-xs text-muted-foreground">Uploading a new image replaces the current one for this card only.</p>
        <input
          ref={backgroundInputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => handleBackgroundFile(e.target.files?.[0])}
        />
        <div
          role="button"
          tabIndex={0}
          onClick={() => backgroundInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") backgroundInputRef.current?.click() }}
          onDragOver={(e) => { e.preventDefault(); setIsDropTarget(true) }}
          onDragLeave={() => setIsDropTarget(false)}
          onDrop={(e) => { e.preventDefault(); setIsDropTarget(false); handleBackgroundFile(e.dataTransfer.files?.[0]) }}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
            backgroundError
              ? "border-red-400 bg-red-50 text-red-600 dark:bg-red-900/20"
              : isDropTarget
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
          )}
        >
          <Upload className="h-5 w-5" />
          <p className="text-sm font-semibold">Click to upload, or drag and drop</p>
          <p className="text-xs text-muted-foreground">
            JPG or PNG · {CARD_BG_WIDTH}×{CARD_BG_HEIGHT}px · up to {CARD_BG_MAX_MB}MB
          </p>
        </div>
        {backgroundError && (
          <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-900/20">
            {backgroundError}
          </p>
        )}
        {(backgroundPreview || custom.backgroundImage) && !backgroundError && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBackgroundFile(null)
              setBackgroundPreview(null)
              patch({ backgroundImage: undefined })
            }}
            className="text-red-600 hover:text-red-700"
          >
            Remove image
          </Button>
        )}
      </div>

      <div className="rounded-xl border p-4 space-y-2">
        <p className="font-semibold text-sm">Font Color</p>
        <p className="text-xs text-muted-foreground">Choose the color used for text on the card.</p>
        <Input
          type="color"
          aria-label="Font color"
          value={custom.fontColor}
          onChange={(e) => patch({ fontColor: e.target.value })}
          className="h-10 w-full cursor-pointer"
        />
      </div>

      <div className="rounded-xl border p-4 space-y-2">
        <p className="font-semibold text-sm">Field Placement</p>
        <p className="text-xs text-muted-foreground">
          Drag fields directly on the card preview. Member Name and Plan Name are always shown.
        </p>
        <div className="space-y-2 pt-1">
          {toggleRow("fieldClubName", "Club Name", custom.showClubName ?? true, (v) => patch({ showClubName: v }))}
          {toggleRow("fieldProfile", "Show Member Profile Picture", custom.showUserProfile, (v) => patch({ showUserProfile: v }))}
          {toggleRow("fieldStatus", "Status (Active)", custom.showStatus ?? true, (v) => patch({ showStatus: v }))}
          {toggleRow("fieldLogo", "Show Club Logo", custom.showLogo, (v) => patch({ showLogo: v }))}
          {custom.showLogo && <div className="space-y-4 pl-1">{logoFields}</div>}
          {toggleRow("fieldEndDate", "Membership End Date", custom.showEndDate ?? true, (v) => patch({ showEndDate: v }))}
          {toggleRow("fieldMembershipId", "Membership ID", custom.showMembershipId ?? true, (v) => patch({ showMembershipId: v }))}
          {(custom.showMembershipId ?? true) && <div className="pl-1">{idPrefixField}</div>}
        </div>
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Style &amp; Visuals</CardTitle>
        <CardDescription>
          Choose how your membership card looks — a color gradient, or a custom background image.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Background Mode</Label>
          <div className="flex flex-wrap gap-3">
            {BACKGROUND_MODES.map((mode) => {
              const active = (custom.backgroundMode ?? "gradient") === mode.value
              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => patch({ backgroundMode: mode.value })}
                  className={cn(
                    "relative w-52 rounded-xl border p-3 text-left transition-colors",
                    active ? "border-green-500 ring-1 ring-green-500" : "hover:border-muted-foreground/40"
                  )}
                >
                  {active && (
                    <span className="absolute right-2 top-2 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">
                      ACTIVE
                    </span>
                  )}
                  {mode.value === "gradient" ? (
                    <div
                      className="h-16 w-full rounded-md"
                      style={{
                        background: `linear-gradient(to bottom right, ${custom.primaryColor}, ${custom.secondaryColor})`,
                      }}
                    />
                  ) : (
                    <div className="flex h-16 w-full items-center justify-center rounded-md bg-muted">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <p className="mt-2 text-sm font-semibold">{mode.label}</p>
                  <p className="text-xs text-muted-foreground">{mode.hint}</p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 rounded-xl border p-4 sm:p-6 lg:grid-cols-2 lg:gap-8">
          {isImageMode ? imageControls : gradientControls}

          <div className="space-y-3 lg:sticky lg:top-6 lg:self-start">
            <div className="flex items-center justify-between">
              <Label>Live Preview</Label>
              {isImageMode && <Badge variant="secondary">{CARD_BG_WIDTH} × {CARD_BG_HEIGHT}</Badge>}
            </div>
            <div className="w-full max-w-sm">
              <MembershipCard
                cardData={previewData}
                cardStyle={cardStyle}
                showLogo={custom.showLogo}
                userName="John Doe"
                membershipId={`${custom.idPrefix || "UM"}-${new Date().getFullYear()}-123456`}
                profilePicture={custom.showUserProfile ? MEMBERSHIP_CARD_PREVIEW_PROFILE_PICTURE : undefined}
                onFieldMove={isImageMode ? handleFieldMove : undefined}
              />
            </div>
            {isImageMode && (
              <p className="max-w-sm text-center text-sm font-semibold">
                Drag any field to reposition it on the card
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </div>
      </CardContent>
    </Card>
  )
}
