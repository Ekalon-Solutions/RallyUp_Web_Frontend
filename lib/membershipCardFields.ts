import { getBaseUrl } from '@/lib/config'

// Shared geometry + field metadata for the image-background membership card.
// Used by the card renderer (member view, admin live preview) and the admin
// "Field Placement" editor so a dragged position lands identically on every
// surface. Positions are percentages of the card box, so they survive any
// render size (320px admin preview, full-width member card, mobile app).

export const CARD_BG_WIDTH = 1012
export const CARD_BG_HEIGHT = 638
export const CARD_BG_ASPECT_RATIO = CARD_BG_WIDTH / CARD_BG_HEIGHT
export const CARD_BG_RATIO_TOLERANCE = 0.15 // Allows ~15% deviation (~1.35:1 to ~1.82:1)
export const CARD_BG_MAX_MB = 10
export const CARD_BG_MAX_BYTES = CARD_BG_MAX_MB * 1024 * 1024
export const CARD_BG_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png']

export type BackgroundMode = 'gradient' | 'image'

export type CardFieldKey =
  | 'clubName'
  | 'memberName'
  | 'planName'
  | 'membershipId'
  | 'endDate'
  | 'status'
  | 'clubLogo'
  | 'profilePicture'

export interface FieldPosition {
  /** Distance of the field's left edge from the card's left edge, in % of card width. */
  x: number
  /** Distance of the field's top edge from the card's top edge, in % of card height. */
  y: number
}

export type FieldPositions = Partial<Record<CardFieldKey, FieldPosition>>

/** The out-of-the-box layout an admin sees before dragging anything. */
export const DEFAULT_FIELD_POSITIONS: Record<CardFieldKey, FieldPosition> = {
  clubName: { x: 4, y: 6 },
  memberName: { x: 4, y: 26 },
  status: { x: 76, y: 6 },
  profilePicture: { x: 82, y: 28 },
  clubLogo: { x: 4, y: 48 },
  planName: { x: 40, y: 56 },
  membershipId: { x: 6, y: 78 },
  endDate: { x: 66, y: 78 },
}

/** Small caption rendered above each value on the card, also used in the admin list. */
export const CARD_FIELD_LABELS: Record<CardFieldKey, string> = {
  clubName: 'Club Name',
  memberName: 'Member Name',
  planName: 'Plan Name',
  membershipId: 'Membership ID',
  endDate: 'End Date',
  status: 'Status',
  clubLogo: 'Club Logo',
  profilePicture: 'Profile Picture',
}

export function getFieldPosition(positions: FieldPositions | undefined, key: CardFieldKey): FieldPosition {
  const pos = positions?.[key]
  return pos && Number.isFinite(pos.x) && Number.isFinite(pos.y) ? pos : DEFAULT_FIELD_POSITIONS[key]
}

/** Keeps a dragged field fully inside the card. `size` is the field's own size in % of the card. */
export function clampFieldPosition(pos: FieldPosition, size: { width: number; height: number }): FieldPosition {
  return {
    x: Math.min(Math.max(pos.x, 0), Math.max(0, 100 - size.width)),
    y: Math.min(Math.max(pos.y, 0), Math.max(0, 100 - size.height)),
  }
}

interface DragRect { left: number; top: number; width: number; height: number }

/**
 * Where a dragged field lands, as a percentage of the card box.
 * `grab` is the pointer's offset inside the field at pointer-down, which keeps
 * the field from snapping its top-left corner to the cursor.
 */
export function dragPositionPercent(
  pointer: { x: number; y: number },
  grab: { x: number; y: number },
  chip: { width: number; height: number },
  box: DragRect
): FieldPosition {
  return clampFieldPosition(
    {
      x: ((pointer.x - grab.x - box.left) / box.width) * 100,
      y: ((pointer.y - grab.y - box.top) / box.height) * 100,
    },
    { width: (chip.width / box.width) * 100, height: (chip.height / box.height) * 100 }
  )
}

function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    img.src = url
  })
}

function canvasToFile(
  canvas: HTMLCanvasElement,
  filename: string,
  mimeType: string,
  quality = 0.95
): Promise<File> {
  return new Promise((resolve, reject) => {
    if (canvas.toBlob) {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], filename, { type: mimeType, lastModified: Date.now() }))
          } else {
            try {
              const dataUrl = canvas.toDataURL(mimeType, quality)
              const arr = dataUrl.split(',')
              const bstr = atob(arr[1])
              let n = bstr.length
              const u8arr = new Uint8Array(n)
              while (n--) {
                u8arr[n] = bstr.charCodeAt(n)
              }
              resolve(new File([u8arr], filename, { type: mimeType, lastModified: Date.now() }))
            } catch (err) {
              reject(err)
            }
          }
        },
        mimeType,
        quality
      )
    } else {
      try {
        const dataUrl = canvas.toDataURL(mimeType, quality)
        const arr = dataUrl.split(',')
        const bstr = atob(arr[1])
        let n = bstr.length
        const u8arr = new Uint8Array(n)
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n)
        }
        resolve(new File([u8arr], filename, { type: mimeType, lastModified: Date.now() }))
      } catch (err) {
        reject(err)
      }
    }
  })
}

/**
 * Scales and stretches an image to fit the exact card dimensions (CARD_BG_WIDTH × CARD_BG_HEIGHT).
 * Returns the original file if it already matches the exact dimensions.
 */
export async function fitImageToCardDimensions(
  file: File,
  knownSize?: { width: number; height: number }
): Promise<File> {
  if (knownSize && knownSize.width === CARD_BG_WIDTH && knownSize.height === CARD_BG_HEIGHT) {
    return file
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = async () => {
      URL.revokeObjectURL(url)
      if (img.naturalWidth === CARD_BG_WIDTH && img.naturalHeight === CARD_BG_HEIGHT) {
        resolve(file)
        return
      }

      try {
        const canvas = document.createElement('canvas')
        canvas.width = CARD_BG_WIDTH
        canvas.height = CARD_BG_HEIGHT
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, CARD_BG_WIDTH, CARD_BG_HEIGHT)

        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        const fittedFile = await canvasToFile(canvas, file.name, outputType, 0.95)
        resolve(fittedFile)
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image for processing'))
    }
    img.src = url
  })
}

export interface CardImageProcessResult {
  error: string | null
  processedFile: File | null
  originalSize?: { width: number; height: number }
  wasAdjusted?: boolean
}

/**
 * Validates the uploaded background image and fits it to CARD_BG_WIDTH × CARD_BG_HEIGHT.
 * Accepts images with an aspect ratio approximately equal to ~1.586:1 (within CARD_BG_RATIO_TOLERANCE)
 * and automatically stretches/fits them to the exact card dimensions required.
 */
export async function processCardBackgroundImage(file: File): Promise<CardImageProcessResult> {
  if (!CARD_BG_MIME_TYPES.includes(file.type.toLowerCase())) {
    return { error: 'Image must be a JPG or PNG file.', processedFile: null }
  }
  if (file.size > CARD_BG_MAX_BYTES) {
    return { error: `Image must be ${CARD_BG_MAX_MB}MB or smaller.`, processedFile: null }
  }
  const size = await readImageSize(file)
  if (!size) {
    return { error: 'That file could not be read as an image. Please try another one.', processedFile: null }
  }
  if (size.width < 100 || size.height < 60) {
    return { error: 'Image is too small to be used as a card background.', processedFile: null }
  }

  const imageRatio = size.width / size.height
  const ratioDifference = Math.abs(imageRatio - CARD_BG_ASPECT_RATIO) / CARD_BG_ASPECT_RATIO

  if (ratioDifference > CARD_BG_RATIO_TOLERANCE) {
    return {
      error: `Image ratio (${imageRatio.toFixed(2)}:1) does not match the required card ratio (~1.586:1). This image is ${size.width}×${size.height}px. Please upload an image with an aspect ratio closer to 1.586:1 (e.g. ${CARD_BG_WIDTH}×${CARD_BG_HEIGHT}px).`,
      processedFile: null,
      originalSize: size,
    }
  }

  const wasAdjusted = size.width !== CARD_BG_WIDTH || size.height !== CARD_BG_HEIGHT

  try {
    const processedFile = await fitImageToCardDimensions(file, size)
    return {
      error: null,
      processedFile,
      originalSize: size,
      wasAdjusted,
    }
  } catch {
    return {
      error: 'Failed to process and fit image. Please try another image.',
      processedFile: null,
      originalSize: size,
    }
  }
}

/**
 * Returns an error message, or null when the file is a usable card background.
 * Maintained for backward compatibility.
 */
export async function validateCardBackgroundImage(file: File): Promise<string | null> {
  const result = await processCardBackgroundImage(file)
  return result.error
}

/** Resolves a stored asset path (S3 URL, data/blob URL, or API-relative path) for <img>. */
export function resolveCardAssetUrl(url: string): string {
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url
  return `${getBaseUrl()}${url}`
}

export type CardStyleKey = 'default' | 'premium' | 'vintage' | 'modern' | 'elite' | 'emerald'

/** Preset gradients. Mirrored by the mobile app in components/membership-card-visual.tsx. */
export const CARD_STYLE_COLORS: Record<CardStyleKey, { primaryColor: string; secondaryColor: string }> = {
  default: { primaryColor: '#2563eb', secondaryColor: '#1e40af' },
  premium: { primaryColor: '#fbbf24', secondaryColor: '#dc2626' },
  vintage: { primaryColor: '#b45309', secondaryColor: '#7c2d12' },
  modern: { primaryColor: '#1e293b', secondaryColor: '#581c87' },
  elite: { primaryColor: '#111827', secondaryColor: '#000000' },
  emerald: { primaryColor: '#10b981', secondaryColor: '#0d9488' },
}

export const CARD_STYLE_OPTIONS: { value: CardStyleKey; label: string }[] = [
  { value: 'default', label: 'Classic Blue' },
  { value: 'premium', label: 'Premium Gold' },
  { value: 'vintage', label: 'Vintage Amber' },
  { value: 'modern', label: 'Modern Purple' },
  { value: 'elite', label: 'Elite Black' },
  { value: 'emerald', label: 'Emerald Green' },
]

export const FONT_FAMILIES: { value: string; label: string }[] = [
  { value: 'Inter', label: 'Inter (Default)' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Oswald', label: 'Oswald' },
  { value: 'Bebas Neue', label: 'Bebas Neue' },
  { value: 'Teko', label: 'Teko' },
  { value: 'Anton', label: 'Anton' },
  { value: 'Exo 2', label: 'Exo 2' },
  { value: 'Barlow', label: 'Barlow' },
  { value: 'Archivo Black', label: 'Archivo Black' },
  { value: 'Titillium Web', label: 'Titillium Web' },
  { value: 'Merriweather', label: 'Merriweather' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Lora', label: 'Lora' },
  { value: 'Roboto Slab', label: 'Roboto Slab' },
  { value: 'Bitter', label: 'Bitter' },
]

export const DEFAULT_CARD_FONT_COLOR = '#FFFFFF'

export type CardCustomization = NonNullable<
  import('@/lib/api').PublicMembershipCardDisplay['card']['customization']
>

/** Fills in every default so the editor and preview never read `undefined`. */
export function normalizeCardCustomization(
  value?: Partial<CardCustomization> | null
): CardCustomization {
  return {
    primaryColor: value?.primaryColor ?? CARD_STYLE_COLORS.default.primaryColor,
    secondaryColor: value?.secondaryColor ?? CARD_STYLE_COLORS.default.secondaryColor,
    fontFamily: value?.fontFamily ?? 'Inter',
    logoSize: value?.logoSize ?? 'medium',
    showLogo: value?.showLogo ?? true,
    showUserProfile: value?.showUserProfile ?? false,
    idPrefix: value?.idPrefix ?? 'UM',
    backgroundMode: value?.backgroundMode ?? 'gradient',
    fontColor: value?.fontColor ?? DEFAULT_CARD_FONT_COLOR,
    showClubName: value?.showClubName ?? true,
    showStatus: value?.showStatus ?? true,
    showEndDate: value?.showEndDate ?? true,
    showMembershipId: value?.showMembershipId ?? true,
    fieldPositions: value?.fieldPositions ?? {},
    ...(value?.customLogo ? { customLogo: value.customLogo } : {}),
    ...(value?.backgroundImage ? { backgroundImage: value.backgroundImage } : {}),
  }
}
