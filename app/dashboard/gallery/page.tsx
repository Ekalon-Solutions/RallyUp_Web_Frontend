"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { apiClient, Album, AlbumMediaItem, GalleryStorageSummary } from "@/lib/api"
import { useSocket } from "@/contexts/socket-context"
import { getApiUrl } from "@/lib/config"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { toast } from "sonner"
import { FolderPlus, HardDrive, Image as ImageIcon, Upload, ShoppingCart, RefreshCw, Trash2, Play, X, Megaphone } from "lucide-react"
import { PaymentSimulationModal } from "@/components/modals/payment-simulation-modal"

declare global {
  interface Window { Razorpay: any }
}

const bytesToReadable = (bytes: number): string => {
  if (!bytes) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  let value = bytes; let idx = 0
  while (value >= 1024 && idx < units.length - 1) { value /= 1024; idx++ }
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`
}

type StorageGb = 50 | 100 | 300
type BillingCycle = "monthly" | "quarterly" | "annual"

const STORAGE_PRICING: Record<StorageGb, Record<BillingCycle, number>> = {
  50: { monthly: 159, quarterly: 449, annual: 1699 },
  100: { monthly: 299, quarterly: 889, annual: 3199 },
  300: { monthly: 749, quarterly: 2299, annual: 7999 },
}

const BILLING_LABELS: Record<BillingCycle, string> = {
  monthly: "Monthly", quarterly: "Quarterly", annual: "Annual",
}

const BILLING_DURATION_LABEL: Record<BillingCycle, string> = {
  monthly: "/ month", quarterly: "/ quarter", annual: "/ year",
}


const MAX_IMAGE_BYTES = 25 * 1024 * 1024
const MAX_VIDEO_BYTES = 1024 * 1024 * 1024
const MAX_FILES_PER_UPLOAD = 250
const MAX_BATCH_BYTES = 3 * 1024 * 1024 * 1024
const UPLOAD_CHUNK_FILES = 15
const UPLOAD_CONCURRENT_CHUNKS = 3
const GALLERY_PUBLISH_COOLDOWN_MS = 5 * 60 * 1000
const VIDEO_EXTS = /\.(mp4|mpeg|mpg|avi|mov|mkv|webm)$/i

function getPublishCooldownRemaining(lastSent?: string | null, now = Date.now()): number {
  if (!lastSent) return 0
  const remaining = GALLERY_PUBLISH_COOLDOWN_MS - (now - new Date(lastSent).getTime())
  return remaining > 0 ? remaining : 0
}

function formatPublishCooldown(ms: number): string {
  const sec = Math.ceil(ms / 1000)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m <= 0) return `${s}s`
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function formatElapsed(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`
}

function isVideoFile(f: File): boolean {
  return f.type.startsWith("video/") || (!f.type && VIDEO_EXTS.test(f.name))
}

function validateFiles(files: File[]): string[] {
  const errors: string[] = []
  if (files.length > MAX_FILES_PER_UPLOAD) {
    errors.push(`Too many files. Maximum ${MAX_FILES_PER_UPLOAD} per upload.`)
  }
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0)
  if (totalBytes > MAX_BATCH_BYTES) {
    errors.push(`Total size ${bytesToReadable(totalBytes)} exceeds ${bytesToReadable(MAX_BATCH_BYTES)} per upload. Split into smaller batches.`)
  }
  files
    .filter((f) => f.size > (isVideoFile(f) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES))
    .forEach((f) => errors.push(`${f.name} exceeds ${isVideoFile(f) ? '1GB' : '25MB'} limit`))
  return errors
}


interface UploadProgressBarProps {
  uploadProgress: number
  serverProgress: number
  processingLabel: string
  selectedFiles: File[]
  startedAt: number
}

function UploadProgressBar({ uploadProgress, serverProgress, processingLabel, selectedFiles, startedAt }: UploadProgressBarProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const totalBytes = selectedFiles.reduce((sum, f) => sum + f.size, 0)
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1)
  const isTransferring = uploadProgress < 100
  const isWaiting = !isTransferring && serverProgress === 0
  const barPercent = isTransferring ? uploadProgress : Math.max(serverProgress, uploadProgress)
  const bytesDone = Math.round((barPercent / 100) * totalBytes)
  const uploadedMB = (bytesDone / (1024 * 1024)).toFixed(1)
  const elapsedSec = Math.max(1, (now - startedAt) / 1000)
  const speedBps = bytesDone / elapsedSec
  const speedLabel = speedBps > 0 ? `${bytesToReadable(speedBps)}/s` : "—"
  const elapsedLabel = formatElapsed(elapsedSec)

  let label: string
  if (isTransferring) {
    label = `Uploading… ${uploadedMB} / ${totalMB} MB`
  } else if (isWaiting) {
    label = "Processing on server…"
  } else {
    label = processingLabel || `Saving to storage… ${uploadedMB} / ${totalMB} MB`
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 font-medium tabular-nums">{isWaiting ? "…" : `${barPercent}%`}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full bg-primary transition-all duration-300 ${isWaiting ? "animate-pulse" : ""}`}
          style={{ width: isWaiting ? "50%" : `${barPercent}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>{elapsedLabel} elapsed</span>
        <span>{speedLabel}</span>
      </div>
    </div>
  )
}


function uploadAlbumChunk(
  albumId: string,
  files: File[],
  sessionId: string,
  onChunkProgress: (percent: number) => void
): Promise<any> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const endpoint = getApiUrl(`/gallery/albums/${albumId}/upload`)
  const formData = new FormData()
  files.forEach((f) => formData.append("files", f))
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", endpoint)
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`)
    if (sessionId) xhr.setRequestHeader("X-Upload-Session-Id", sessionId)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onChunkProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText || "{}")
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(json)
        } else if (xhr.status === 413) {
          reject(new Error("File too large for the server. Max 25MB per image, 1GB per video, 250 files and 3GB total per batch."))
        } else if (xhr.status === 408) {
          reject(new Error("Upload timed out at the server. Try fewer files at once or a smaller total size."))
        } else {
          const detail = Array.isArray(json?.errors) && json.errors.length
            ? json.errors.join("\n")
            : json?.message || `Upload failed (${xhr.status})`
          reject(new Error(detail))
        }
      } catch {
        reject(new Error(xhr.status === 0 ? "Connection lost during upload. Try again with fewer files." : "Upload failed"))
      }
    }
    xhr.onerror = () => reject(new Error("Network error during upload (connection dropped or server restarted)"))
    xhr.ontimeout = () => reject(new Error("Upload timed out. Try again or use a smaller batch."))
    xhr.timeout = 0
    xhr.send(formData)
  })
}

async function uploadAlbumFiles(
  albumId: string,
  files: File[],
  onProgress: (p: number) => void,
  sessionId: string
): Promise<any> {
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0)
  const chunks: File[][] = []
  for (let i = 0; i < files.length; i += UPLOAD_CHUNK_FILES) {
    chunks.push(files.slice(i, i + UPLOAD_CHUNK_FILES))
  }
  const chunkBytes = chunks.map((c) => c.reduce((sum, f) => sum + f.size, 0))
  const chunkLoaded = new Array(chunks.length).fill(0)

  const reportProgress = () => {
    const loaded = chunkLoaded.reduce((a, b) => a + b, 0)
    onProgress(totalBytes > 0 ? Math.min(100, Math.round((loaded / totalBytes) * 100)) : 0)
  }

  let lastResult: any = null
  for (let i = 0; i < chunks.length; i += UPLOAD_CONCURRENT_CHUNKS) {
    const wave = chunks.slice(i, i + UPLOAD_CONCURRENT_CHUNKS)
    const results = await Promise.all(
      wave.map((chunk, waveIdx) => {
        const idx = i + waveIdx
        return uploadAlbumChunk(albumId, chunk, sessionId, (chunkPct) => {
          chunkLoaded[idx] = (chunkPct / 100) * chunkBytes[idx]
          reportProgress()
        }).then((res) => {
          chunkLoaded[idx] = chunkBytes[idx]
          reportProgress()
          return res
        })
      })
    )
    lastResult = results[results.length - 1]
  }
  onProgress(100)
  return lastResult
}

export default function GalleryManagementPage() {
  const clubId = useRequiredClubId()

  const [albums, setAlbums] = useState<Album[]>([])
  const [storage, setStorage] = useState<GalleryStorageSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const [albumName, setAlbumName] = useState("")
  const [albumDescription, setAlbumDescription] = useState("")
  const [folderName, setFolderName] = useState("")
  const [creatingAlbum, setCreatingAlbum] = useState(false)

  const [selectedAlbumId, setSelectedAlbumId] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [serverProgress, setServerProgress] = useState(0)
  const [uploadStartedAt, setUploadStartedAt] = useState<number | null>(null)
  const [processingLabel, setProcessingLabel] = useState("")
  const uploadAlbumIdRef = useRef<string>("")
  const uploadSessionIdRef = useRef<string>("")

  const { socket } = useSocket()

  const [deletingAlbumId, setDeletingAlbumId] = useState<string | null>(null)
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null)

  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null)
  const [mediaToDelete, setMediaToDelete] = useState<{ albumId: string; item: AlbumMediaItem } | null>(null)


  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  const [createAlbumModalOpen, setCreateAlbumModalOpen] = useState(false)

  const [selectedStorageGb, setSelectedStorageGb] = useState<StorageGb>(100)
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<BillingCycle>("monthly")
  const [addonAutoRenew, setAddonAutoRenew] = useState(true)

  const [razorpayPlans, setRazorpayPlans] = useState<any[]>([])
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const razorpayScriptRef = useRef(false)

  const [pendingSubscription, setPendingSubscription] = useState<{
    storageGb: StorageGb; plan: BillingCycle
  } | null>(null)

  const [pendingUpgrade, setPendingUpgrade] = useState<{
    storageGb: StorageGb; plan: BillingCycle
    orderId: string; orderNumber: string
    total: number
    currency: string
  } | null>(null)

  const [publishingAlbumId, setPublishingAlbumId] = useState<string | null>(null)
  const [cooldownNow, setCooldownNow] = useState(() => Date.now())

  const selectedAlbum = useMemo(
    () => albums.find((a) => a._id === selectedAlbumId) || null,
    [albums, selectedAlbumId]
  )

  const hasPublishCooldown = useMemo(
    () => albums.some((a) => getPublishCooldownRemaining(a.lastNotificationSentAt, cooldownNow) > 0),
    [albums, cooldownNow]
  )

  useEffect(() => {
    if (!hasPublishCooldown) return
    const id = setInterval(() => setCooldownNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [hasPublishCooldown])

  useEffect(() => {
    if (razorpayScriptRef.current || document.querySelector('script[src*="checkout.razorpay"]')) {
      razorpayScriptRef.current = true
      return
    }
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => { razorpayScriptRef.current = true }
    document.body.appendChild(script)
  }, [])

  useEffect(() => {
    fetch("/api/razorpay/plans")
      .then((r) => r.json())
      .then((d) => { if (d.plans) setRazorpayPlans(d.plans) })
      .catch(() => {})
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [albumsRes, storageRes] = await Promise.all([
        apiClient.getAdminAlbums(clubId || undefined),
        apiClient.getGalleryStorageSummary(clubId || undefined),
      ])
      setAlbums(albumsRes.success && albumsRes.data?.albums ? albumsRes.data.albums : [])
      setStorage(storageRes.success && storageRes.data ? storageRes.data : null)
    } catch { toast.error("Failed to load gallery management data") }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [clubId])

  const handlePublishToMembers = async (album: Album) => {
    if (!album.mediaItems.length) {
      toast.error("Upload at least one file before notifying members")
      return
    }
    const cooldown = getPublishCooldownRemaining(album.lastNotificationSentAt, cooldownNow)
    if (cooldown > 0) {
      toast.error(`Please wait ${formatPublishCooldown(cooldown)} before notifying again`)
      return
    }
    try {
      setPublishingAlbumId(album._id)
      const res = await apiClient.publishAlbumToMembers(album._id)
      if (res.success) {
        toast.success(res.data?.message || "Members will be notified")
        await loadData()
        setCooldownNow(Date.now())
        return
      }
      const payload = res.data as { message?: string; retryAfterSeconds?: number; lastNotificationSentAt?: string } | undefined
      if (payload?.lastNotificationSentAt) {
        setAlbums((prev) =>
          prev.map((a) =>
            a._id === album._id ? { ...a, lastNotificationSentAt: payload.lastNotificationSentAt } : a
          )
        )
        setCooldownNow(Date.now())
      }
      toast.error(res.error || payload?.message || "Could not send notification")
    } finally {
      setPublishingAlbumId(null)
    }
  }

  const renderPublishButton = (album: Album, compact = false) => {
    const hasMedia = album.mediaItems.length > 0
    const cooldown = getPublishCooldownRemaining(album.lastNotificationSentAt, cooldownNow)
    const onCooldown = cooldown > 0
    const publishing = publishingAlbumId === album._id

    return (
      <div className={compact ? "space-y-1" : "space-y-1.5 border-t pt-3"}>
        <Button
          variant={hasMedia && !onCooldown ? "default" : "secondary"}
          disabled={!hasMedia || onCooldown || publishing || uploading}
          onClick={() => void handlePublishToMembers(album)}
          className="w-full"
          size={compact ? "sm" : "default"}
        >
          <Megaphone className="h-4 w-4 mr-2 shrink-0" />
          {publishing
            ? "Sending…"
            : onCooldown
              ? `Notify again in ${formatPublishCooldown(cooldown)}`
              : "Publish to members"}
        </Button>
        {!hasMedia && (
          <p className="text-[11px] text-muted-foreground text-center">
            Upload at least one file to notify members
          </p>
        )}
        {hasMedia && !onCooldown && !publishing && (
          <p className="text-[11px] text-muted-foreground text-center">
            {compact
              ? "Email members who opted in. Gallery is visible without this."
              : "Sends an email to members who opted in. Uploaded photos are already visible in the gallery."}
          </p>
        )}
      </div>
    )
  }

  const handleCreateAlbum = async () => {
    if (!albumName.trim()) { toast.error("Album name is required"); return }
    try {
      setCreatingAlbum(true)
      const res = await apiClient.createAlbum({
        name: albumName.trim(),
        description: albumDescription.trim() || undefined,
        folderName: folderName.trim() || undefined,
        clubId: clubId || undefined,
      })
      if (!res.success) { toast.error(res.error || "Failed to create album"); return }
      toast.success("Album created")
      setAlbumName(""); setAlbumDescription(""); setFolderName("")
      setCreateAlbumModalOpen(false)
      await loadData()
    } finally { setCreatingAlbum(false) }
  }

  useEffect(() => {
    if (!socket) return
    const handleProgress = (data: { albumId: string; sessionId?: string; processed: number; total: number; percent: number; currentFile: string }) => {
      if (data.albumId !== uploadAlbumIdRef.current) return
      if (data.sessionId && uploadSessionIdRef.current && data.sessionId !== uploadSessionIdRef.current) return
      setServerProgress(data.percent)
      const fileNum = Math.min(data.processed + 1, data.total)
      setProcessingLabel(`Uploading to S3 — file ${fileNum}/${data.total}: ${data.currentFile}`)
      if (data.processed >= data.total) {
        uploadAlbumIdRef.current = ""
        uploadSessionIdRef.current = ""
      }
    }
    socket.on("gallery:upload-progress", handleProgress)
    return () => { socket.off("gallery:upload-progress", handleProgress) }
  }, [socket])

  const handleUpload = async () => {
    if (!selectedAlbumId) { toast.error("Select an album first"); return }
    if (!selectedFiles.length) { toast.error("Select files to upload"); return }
    const sizeErrors = validateFiles(selectedFiles)
    if (sizeErrors.length) { sizeErrors.forEach((msg) => toast.error(msg)); return }
    try {
      setUploading(true)
      setUploadProgress(0)
      setServerProgress(0)
      setUploadStartedAt(Date.now())
      setProcessingLabel("")
      const sessionId = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      uploadAlbumIdRef.current = selectedAlbumId
      uploadSessionIdRef.current = sessionId
      await uploadAlbumFiles(selectedAlbumId, selectedFiles, setUploadProgress, sessionId)
      setServerProgress(100)
      await new Promise((r) => setTimeout(r, 400))
      setUploading(false)
      setUploadProgress(0)
      setServerProgress(0)
      toast.success("Files uploaded successfully")
      setSelectedFiles([])
      await loadData()
      setSelectedAlbumId(selectedAlbumId)
    } catch (e: any) {
      toast.error(e?.message || "Upload failed")
      uploadAlbumIdRef.current = ""
      uploadSessionIdRef.current = ""
    }
    finally {
      setUploading(false)
      setUploadStartedAt(null)
    }
  }

  const handleSetCover = async (albumId: string, mediaItem: AlbumMediaItem) => {
    if (mediaItem.type !== "image") { toast.error("Only image can be set as cover"); return }
    const res = await apiClient.setAlbumCoverImage(albumId, mediaItem._id)
    if (!res.success) { toast.error(res.error || "Failed to set cover image"); return }
    toast.success("Cover image updated")
    await loadData()
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const confirmDeleteMediaItem = async () => {
    if (!mediaToDelete) return
    const { albumId, item } = mediaToDelete
    try {
      setDeletingMediaId(item._id)
      const res = await apiClient.deleteMediaItem(albumId, item._id)
      if (!res.success) { toast.error(res.error || "Failed to delete media item"); return }
      toast.success("Media item deleted")
      setMediaToDelete(null)
      await loadData()
    } catch { toast.error("Failed to delete media item") }
    finally { setDeletingMediaId(null) }
  }

  const renderMediaThumb = (albumId: string, m: AlbumMediaItem, compact = false) => (
    <div
      key={m._id}
      className={`relative group rounded-md overflow-hidden bg-muted ${compact ? "aspect-square" : "aspect-square"}`}
    >
      {m.type === "image" ? (
        <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
      ) : (
        <>
          <video src={`${m.url}#t=0.001`} className="w-full h-full object-cover" preload="metadata" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            <Play className={`${compact ? "h-4 w-4" : "h-5 w-5"} text-white fill-white`} />
          </div>
        </>
      )}
      {m.type === "image" && (
        <button
          type="button"
          title="Set as cover image"
          onClick={() => handleSetCover(albumId, m)}
          className="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 py-0.5 text-[10px] text-white hover:bg-black/80"
        >
          Cover
        </button>
      )}
      <button
        type="button"
        title="Delete"
        disabled={deletingMediaId === m._id}
        onClick={() => setMediaToDelete({ albumId, item: m })}
        className="absolute top-0.5 right-0.5 rounded-full bg-destructive/90 p-1 text-destructive-foreground shadow hover:bg-destructive disabled:opacity-50"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  )

  const confirmDeleteAlbum = async () => {
    if (!albumToDelete) return
    const albumId = albumToDelete._id
    try {
      setDeletingAlbumId(albumId)
      const res = await apiClient.deleteAlbum(albumId)
      if (!res.success) { toast.error(res.error || "Failed to delete album"); return }
      if (res.data?.deleteErrors?.length) {
        toast.warning(`Album deleted, but ${res.data.deleteErrors.length} file(s) could not be removed from storage`)
      } else {
        toast.success("Album deleted")
      }
      if (selectedAlbumId === albumId) setSelectedAlbumId("")
      setAlbumToDelete(null)
      await loadData()
    } catch { toast.error("Failed to delete album") }
    finally { setDeletingAlbumId(null) }
  }

  const activateStorage = async (
    storageGb: StorageGb,
    plan: BillingCycle,
    paymentId: string,
    razorpayOrderId?: string,
    razorpaySubscriptionId?: string,
    signature?: string,
  ) => {
    const res = await apiClient.upgradeGalleryStorage({
      plan,
      storageGb,
      autoRenew: addonAutoRenew,
      clubId: clubId || undefined,
      razorpay_payment_id: paymentId,
      razorpay_order_id: razorpayOrderId,
      razorpay_subscription_id: razorpaySubscriptionId,
      razorpay_signature: signature,
    } as any)
    if (!res.success) throw new Error(res.error || "Failed to activate storage")
    toast.success(`${storageGb} GB storage add-on activated (${BILLING_LABELS[plan]})`)
    await loadData()
  }

  const handleSubscriptionCheckout = async (storageGb: StorageGb, plan: BillingCycle) => {
    const priceInr = STORAGE_PRICING[storageGb][plan]
    const priceInPaise = priceInr * 100

    const matchedPlan = razorpayPlans.find(
      (p) => Number(p.item?.amount) === priceInPaise
    )

    if (!matchedPlan) {
      toast.error(
        razorpayPlans.length === 0
          ? "Could not load Razorpay plans. Please try again."
          : `No Razorpay plan found for ₹${priceInr} (${storageGb} GB ${BILLING_LABELS[plan]}). Check your Razorpay dashboard.`
      )
      return
    }

    if (!razorpayScriptRef.current) {
      toast.error("Payment system is still loading. Please wait a moment.")
      return
    }

    setCheckoutBusy(true)
    try {
      const subRes = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: matchedPlan.id, billingCycle: plan, storageGb, clubId }),
      })
      const subData = await subRes.json()
      if (!subRes.ok || !subData.subscriptionId) {
        toast.error(subData.error || "Failed to create subscription")
        return
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: subData.subscriptionId,
        name: "RallyUp",
        description: `${storageGb} GB Gallery Storage — ${BILLING_LABELS[plan]}`,
        theme: { color: "#3b82f6" },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/razorpay/verify-subscription", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })
            if (!verifyRes.ok) throw new Error("Signature verification failed")

            await activateStorage(
              storageGb, plan,
              response.razorpay_payment_id,
              undefined,
              response.razorpay_subscription_id,
              response.razorpay_signature,
            )
          } catch (e: any) {
            toast.error(e?.message || "Payment verified but activation failed. Contact support.")
          } finally {
            setCheckoutBusy(false)
          }
        },
        modal: {
          ondismiss: () => {
            setCheckoutBusy(false)
            toast.error("Payment cancelled.")
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on("payment.failed", (r: any) => {
        toast.error(r.error?.description || "Payment failed.")
        setCheckoutBusy(false)
      })
      setUpgradeModalOpen(false)
      rzp.open()
    } catch (e: any) {
      toast.error(e?.message || "Failed to initiate subscription checkout.")
      setCheckoutBusy(false)
    }
  }

  const handleBuyStorage = () => {
    if (addonAutoRenew) {
      setUpgradeModalOpen(false)
      setPendingSubscription({ storageGb: selectedStorageGb, plan: selectedBillingCycle })
    } else {
      const baseAmount = STORAGE_PRICING[selectedStorageGb][selectedBillingCycle]
      const orderId = `gallery-storage-${selectedStorageGb}gb-${selectedBillingCycle}-${Date.now()}`
      const orderNumber = `STG-${Math.floor(Math.random() * 900000) + 100000}`
      setUpgradeModalOpen(false)
      setPendingUpgrade({
        storageGb: selectedStorageGb, plan: selectedBillingCycle,
        orderId, orderNumber,
        total: baseAmount,
        currency: "INR",
      })
    }
  }

  const handlePaymentSuccess = async (
    _orderId: string, paymentId: string, razorpayOrderId: string, razorpaySignature: string
  ) => {
    if (!pendingUpgrade) return
    const { storageGb, plan } = pendingUpgrade
    try {
      await activateStorage(storageGb, plan, paymentId, razorpayOrderId, undefined, razorpaySignature)
      setPendingUpgrade(null)
    } catch (e: any) {
      toast.error(e?.message || "Failed to activate storage upgrade after payment")
    }
  }

  const handlePaymentFailure = () => {
    toast.error("Payment failed or was cancelled. Please try again.")
    setPendingUpgrade(null)
  }

  const selectedPrice = STORAGE_PRICING[selectedStorageGb][selectedBillingCycle]

  return (
    <ProtectedRoute requireAdmin={true}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Gallery Management</h1>
            <p className="text-muted-foreground">Create albums, upload media, manage cover image and storage</p>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="rounded-xl border bg-card animate-pulse p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-5 bg-muted rounded w-36" />
                  <div className="h-9 bg-muted rounded w-32" />
                </div>
                <div className="h-2 bg-muted rounded-full" />
                <div className="grid grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-muted rounded" />)}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="rounded-xl border bg-card animate-pulse p-6 space-y-3">
                    <div className="h-4 bg-muted rounded w-28" />
                    <div className="h-10 bg-muted rounded" />
                    <div className="h-10 bg-muted rounded" />
                    <div className="h-9 bg-muted rounded w-28" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-xl border bg-card animate-pulse overflow-hidden">
                    <div className="h-40 bg-muted" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      Storage
                    </CardTitle>
                    {storage && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {bytesToReadable(storage.usage.usedBytes)} used of {bytesToReadable(storage.usage.totalBytes)}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => setUpgradeModalOpen(true)}
                  >
                    <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                    Add Storage
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="space-y-1.5">
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all rounded-full"
                        style={{
                          width: storage
                            ? `${Math.min(100, (storage.usage.usedBytes / Math.max(storage.usage.totalBytes, 1)) * 100)}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-1">
                    {[
                      { label: "Used", value: storage ? `${storage.usage.usedGb} GB` : "—" },
                      { label: "Available", value: storage ? `${storage.usage.availableGb} GB` : "—" },
                      { label: "Total", value: storage ? `${storage.usage.totalGb} GB` : "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-lg bg-muted/50 px-3 py-2.5">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
                        <p className="text-sm font-semibold mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                  {storage && storage.upgrades.filter((u) => u.isActive).length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs text-muted-foreground">Active add-ons:</span>
                      {storage.upgrades.filter((u) => u.isActive).map((u) => (
                        <Badge key={u._id} variant="secondary" className="text-xs">
                          {u.storageGb ?? Math.round(u.additionalBytes / 1024 ** 3)} GB &middot; {BILLING_LABELS[u.plan] ?? u.plan}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    Upload Media
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="flex gap-2">
                    <select
                      className="flex-1 h-10 rounded-md border px-3 bg-background text-sm"
                      value={selectedAlbumId}
                      onChange={(e) => setSelectedAlbumId(e.target.value)}
                    >
                      <option value="">Select album…</option>
                      {albums.map((a) => (
                        <option key={a._id} value={a._id}>{a.name}</option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 h-10 px-3 gap-1.5"
                      onClick={() => setCreateAlbumModalOpen(true)}
                    >
                      <FolderPlus className="h-4 w-4" />
                      New Album
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Up to {MAX_FILES_PER_UPLOAD} files per upload · max {bytesToReadable(MAX_BATCH_BYTES)} total · 25MB/image · 1GB/video
                  </p>
                  <Input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,video/mp4,video/mpeg,video/avi,video/x-msvideo"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      const errors = validateFiles(files)
                      if (errors.length) {
                        errors.forEach((msg: string) => toast.error(msg))
                        e.target.value = ""
                        setSelectedFiles([])
                        return
                      }
                      setSelectedFiles(files)
                    }}
                  />
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2 rounded-lg border bg-muted/30 p-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        {selectedFiles.length} {selectedFiles.length === 1 ? "file" : "files"} ready to upload
                        {" · "}
                        {bytesToReadable(selectedFiles.reduce((sum, f) => sum + f.size, 0))} total
                      </p>
                      <ul className="max-h-36 space-y-1 overflow-y-auto">
                        {selectedFiles.map((f, i) => (
                          <li key={`${f.name}-${f.size}-${i}`} className="flex items-center gap-2 text-xs">
                            <span className="min-w-0 flex-1 truncate" title={f.name}>{f.name}</span>
                            <span className="shrink-0 text-muted-foreground">{bytesToReadable(f.size)}</span>
                            <button
                              type="button"
                              className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              title="Remove from upload queue"
                              disabled={uploading}
                              onClick={() => removeSelectedFile(i)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {uploading && uploadStartedAt != null && (
                    <UploadProgressBar
                      uploadProgress={uploadProgress}
                      serverProgress={serverProgress}
                      processingLabel={processingLabel}
                      selectedFiles={selectedFiles}
                      startedAt={uploadStartedAt}
                    />
                  )}
                  <Button onClick={handleUpload} disabled={uploading} className="w-full">
                    {uploading ? "Uploading..." : "Upload Files"}
                  </Button>

                  {selectedAlbum && renderPublishButton(selectedAlbum)}

                  {selectedAlbum && selectedAlbum.mediaItems.length > 0 && (
                    <div className="space-y-2 border-t pt-3">
                      <p className="text-xs font-medium">
                        Uploaded in &ldquo;{selectedAlbum.name}&rdquo; ({selectedAlbum.mediaItems.length})
                      </p>
                      <div className="grid grid-cols-4 gap-1.5 max-h-56 overflow-y-auto rounded-lg border p-2">
                        {selectedAlbum.mediaItems.map((m) => renderMediaThumb(selectedAlbum._id, m, true))}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Use the trash icon on a file to delete it.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {albums.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-3 opacity-25" />
                  <p className="font-medium text-foreground">No albums yet</p>
                  <p className="text-sm mt-1">Create your first album above to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {albums.map((album) => (
                    <div key={album._id} className="rounded-xl border bg-card overflow-hidden flex flex-col">
                      <div className="relative h-44 bg-muted shrink-0">
                        {album.coverImage ? (
                          <img src={album.coverImage} alt={album.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-10 w-10 text-muted-foreground/25" />
                          </div>
                        )}
                        <button
                          type="button"
                          disabled={deletingAlbumId === album._id}
                          onClick={() => setAlbumToDelete(album)}
                          title="Delete album"
                          className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/50 px-2 py-1 text-xs font-medium text-white shadow backdrop-blur-sm transition-colors hover:bg-black/70 disabled:opacity-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="p-4 flex flex-col gap-3 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold line-clamp-1 text-sm">{album.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {album.mediaItems.length} {album.mediaItems.length === 1 ? "file" : "files"} &middot; {bytesToReadable(album.totalSize)}
                            </p>
                          </div>
                          {album.mediaItems.length > 0 && (
                            <div className="flex gap-1 shrink-0">
                              {album.mediaItems.filter((m) => m.type === "image").length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {album.mediaItems.filter((m) => m.type === "image").length} img
                                </Badge>
                              )}
                              {album.mediaItems.filter((m) => m.type === "video").length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {album.mediaItems.filter((m) => m.type === "video").length} vid
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {selectedAlbum?._id === album._id && selectedAlbum.mediaItems.length > 0 && (
                          <div className="grid grid-cols-4 gap-1.5 max-h-52 overflow-y-auto rounded-lg border p-1.5">
                            {selectedAlbum.mediaItems.map((m) => renderMediaThumb(album._id, m, true))}
                          </div>
                        )}

                        {album.mediaItems.length > 0 && (
                          <Button
                            variant={selectedAlbum?._id === album._id ? "default" : "outline"}
                            size="sm"
                            className="mt-auto w-full"
                            onClick={() => setSelectedAlbumId(selectedAlbum?._id === album._id ? "" : album._id)}
                          >
                            {selectedAlbum?._id === album._id ? "Hide Media" : "Manage Media"}
                          </Button>
                        )}

                        {selectedAlbum?._id === album._id && renderPublishButton(album, true)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Add Storage</DialogTitle>
              <DialogDescription>
                Choose a storage tier and billing cycle to expand your gallery space.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              <div className="grid grid-cols-3 gap-3">
                {([50, 100, 300] as StorageGb[]).map((gb) => (
                  <button
                    key={gb}
                    type="button"
                    onClick={() => setSelectedStorageGb(gb)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      selectedStorageGb === gb
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
                    }`}
                  >
                    <p className="text-xl font-bold">{gb} GB</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      from ₹{STORAGE_PRICING[gb]["annual"].toLocaleString("en-IN")}/yr
                    </p>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Billing cycle</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["monthly", "quarterly", "annual"] as BillingCycle[]).map((cycle) => {
                    const isSelected = selectedBillingCycle === cycle
                    return (
                      <button
                        key={cycle}
                        type="button"
                        onClick={() => setSelectedBillingCycle(cycle)}
                        className={`rounded-lg border px-3 py-2.5 text-center transition-all ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
                        }`}
                      >
                        <p className="text-sm font-semibold">₹{STORAGE_PRICING[selectedStorageGb][cycle].toLocaleString("en-IN")}</p>
                        <p className="text-[11px] opacity-75 mt-0.5">{BILLING_DURATION_LABEL[cycle]}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                    Auto-renew
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {addonAutoRenew
                      ? `Renews via Razorpay Subscription each ${BILLING_LABELS[selectedBillingCycle].toLowerCase()} cycle`
                      : "One-time payment"}
                  </p>
                </div>
                <Switch checked={addonAutoRenew} onCheckedChange={setAddonAutoRenew} id="modal-auto-renew" />
              </div>

              <div className="rounded-lg bg-muted/50 px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">
                    {selectedStorageGb} GB &middot; {BILLING_LABELS[selectedBillingCycle]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ₹{selectedPrice.toLocaleString("en-IN")} {BILLING_DURATION_LABEL[selectedBillingCycle]}
                  </p>
                </div>
                <Button
                  onClick={handleBuyStorage}
                  disabled={checkoutBusy}
                  className="shrink-0"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {checkoutBusy ? "Opening checkout…" : "Buy Now"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>

      <Dialog open={createAlbumModalOpen} onOpenChange={(open) => {
        setCreateAlbumModalOpen(open)
        if (!open) { setAlbumName(""); setAlbumDescription(""); setFolderName("") }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-4 w-4" />
              New Album
            </DialogTitle>
            <DialogDescription>
              Create a new album to organise your event media.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="modal-album-name" className="text-sm">Album name <span className="text-destructive">*</span></Label>
              <Input
                id="modal-album-name"
                placeholder="e.g. Annual Day 2025"
                value={albumName}
                onChange={(e) => setAlbumName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateAlbum()}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="modal-folder-name" className="text-sm">Folder name <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                id="modal-folder-name"
                placeholder="e.g. annual-day-2025"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="modal-album-desc" className="text-sm">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                id="modal-album-desc"
                placeholder="Short description of this album…"
                rows={3}
                className="resize-none"
                value={albumDescription}
                onChange={(e) => setAlbumDescription(e.target.value)}
              />
            </div>
            <Button onClick={handleCreateAlbum} disabled={creatingAlbum} className="w-full mt-1">
              {creatingAlbum ? "Creating..." : "Create Album"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {pendingSubscription && (
        <Dialog open={!!pendingSubscription} onOpenChange={(open) => { if (!open) setPendingSubscription(null) }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Confirm Subscription</DialogTitle>
              <DialogDescription>
                Review your plan before proceeding to checkout.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Storage</span>
                  <span className="font-semibold">{pendingSubscription.storageGb} GB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Billing</span>
                  <span className="font-semibold">{BILLING_LABELS[pendingSubscription.plan]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-semibold">
                    ₹{STORAGE_PRICING[pendingSubscription.storageGb][pendingSubscription.plan].toLocaleString("en-IN")}
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      {BILLING_DURATION_LABEL[pendingSubscription.plan]}
                    </span>
                  </span>
                </div>
                <div className="border-t pt-3 flex items-start gap-2">
                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Renews automatically each {BILLING_LABELS[pendingSubscription.plan].toLowerCase()} cycle via Razorpay Subscription. Cancel anytime.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPendingSubscription(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  disabled={checkoutBusy}
                  onClick={() => {
                    handleSubscriptionCheckout(pendingSubscription.storageGb, pendingSubscription.plan)
                    setPendingSubscription(null)
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {checkoutBusy ? "Opening…" : "Proceed to Pay"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={!!albumToDelete} onOpenChange={(open) => { if (!open) setAlbumToDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete album?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{albumToDelete?.name}&rdquo;
              {albumToDelete && albumToDelete.mediaItems.length > 0
                ? ` and all ${albumToDelete.mediaItems.length} file(s) in it`
                : ""}
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingAlbumId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!!deletingAlbumId}
              onClick={(e) => {
                e.preventDefault()
                confirmDeleteAlbum()
              }}
            >
              {deletingAlbumId ? "Deleting…" : "Delete album"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!mediaToDelete} onOpenChange={(open) => { if (!open && !deletingMediaId) setMediaToDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove &ldquo;{mediaToDelete?.item.name}&rdquo; from this album? The file will be deleted from storage and cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingMediaId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!!deletingMediaId}
              onClick={(e) => {
                e.preventDefault()
                confirmDeleteMediaItem()
              }}
            >
              {deletingMediaId ? "Deleting…" : "Delete file"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {pendingUpgrade && (
        <PaymentSimulationModal
          isOpen={!!pendingUpgrade}
          onClose={() => setPendingUpgrade(null)}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
          orderId={pendingUpgrade.orderId}
          orderNumber={pendingUpgrade.orderNumber}
          total={pendingUpgrade.total}
          currency={pendingUpgrade.currency}
          paymentMethod="all"
          dialogTitle={`Buy ${pendingUpgrade.storageGb} GB Storage`}
          dialogDescription={`${BILLING_LABELS[pendingUpgrade.plan]} add-on — ${pendingUpgrade.storageGb} GB extra gallery storage`}
          payButtonLabel="Pay & Activate Storage"
        />
      )}
    </ProtectedRoute>
  )
}
