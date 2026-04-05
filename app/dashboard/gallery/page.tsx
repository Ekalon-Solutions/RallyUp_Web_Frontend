"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { apiClient, Album, AlbumMediaItem, GalleryStorageSummary } from "@/lib/api"
import { useSocket } from "@/contexts/socket-context"
import { getApiUrl } from "@/lib/config"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { toast } from "sonner"
import { FolderPlus, HardDrive, Image as ImageIcon, Upload, ShoppingCart, RefreshCw, Trash2, Play } from "lucide-react"
import { PaymentSimulationModal } from "@/components/modals/payment-simulation-modal"

declare global {
  interface Window { Razorpay: any }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const bytesToReadable = (bytes: number): string => {
  if (!bytes) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  let value = bytes; let idx = 0
  while (value >= 1024 && idx < units.length - 1) { value /= 1024; idx++ }
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`
}

// ─── types & constants ────────────────────────────────────────────────────────

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

// ─── file size validation ──────────────────────────────────────────────────────

const MAX_IMAGE_BYTES = 5 * 1024 * 1024         // 5 MB
const MAX_VIDEO_BYTES = 300 * 1024 * 1024        // 300 MB
const VIDEO_EXTS = /\.(mp4|mpeg|mpg|avi|mov|mkv|webm)$/i

function isVideoFile(f: File): boolean {
  return f.type.startsWith("video/") || (!f.type && VIDEO_EXTS.test(f.name))
}

function validateFileSizes(files: File[]): string[] {
  return files
    .filter((f) => f.size > (isVideoFile(f) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES))
    .map((f) => `${f.name} exceeds ${isVideoFile(f) ? 300 : 5} MB limit`)
}

// ─── upload progress bar ──────────────────────────────────────────────────────

interface UploadProgressBarProps {
  uploadProgress: number   // 0-100: XHR browser→server transfer
  serverProgress: number   // 0-100: socket-driven server→S3 processing
  processingLabel: string  // e.g. "Processing 1/3: photo.jpg"
  selectedFiles: File[]
}

function UploadProgressBar({ uploadProgress, serverProgress, processingLabel, selectedFiles }: UploadProgressBarProps) {
  const totalBytes = selectedFiles.reduce((sum, f) => sum + f.size, 0)
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1)
  const uploadedMB = ((uploadProgress / 100) * totalBytes / (1024 * 1024)).toFixed(1)

  // Phase 1: transferring  (uploadProgress 0→100)
  // Phase 2: waiting       (uploadProgress=100, serverProgress=0)
  // Phase 3: processing    (serverProgress 0→100)
  const isTransferring = uploadProgress < 100
  const isWaiting = !isTransferring && serverProgress === 0
  const barPercent = isTransferring ? uploadProgress : serverProgress

  let label: string
  if (isTransferring) {
    label = `Uploading… ${uploadedMB} / ${totalMB} MB`
  } else if (isWaiting) {
    label = "Processing on server…"
  } else {
    label = processingLabel
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        {!isWaiting && <span className="font-medium tabular-nums">{barPercent}%</span>}
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full bg-primary transition-all duration-300 ${isWaiting ? "animate-pulse" : ""}`}
          style={{ width: isWaiting ? "50%" : `${barPercent}%` }}
        />
      </div>
    </div>
  )
}

// ─── upload helper ────────────────────────────────────────────────────────────

async function uploadAlbumFiles(albumId: string, files: File[], onProgress: (p: number) => void): Promise<any> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const endpoint = getApiUrl(`/gallery/albums/${albumId}/upload`)
  const formData = new FormData()
  files.forEach((f) => formData.append("files", f))
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", endpoint)
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`)
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)) }
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText || "{}")
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(json)
        } else {
          const detail = Array.isArray(json?.errors) && json.errors.length
            ? json.errors.join("\n")
            : json?.message || "Upload failed"
          reject(new Error(detail))
        }
      } catch { reject(new Error("Upload failed")) }
    }
    xhr.onerror = () => reject(new Error("Network error during upload"))
    xhr.send(formData)
  })
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function GalleryManagementPage() {
  const clubId = useRequiredClubId()

  // data
  const [albums, setAlbums] = useState<Album[]>([])
  const [storage, setStorage] = useState<GalleryStorageSummary | null>(null)
  const [loading, setLoading] = useState(true)

  // album creation
  const [albumName, setAlbumName] = useState("")
  const [albumDescription, setAlbumDescription] = useState("")
  const [folderName, setFolderName] = useState("")
  const [creatingAlbum, setCreatingAlbum] = useState(false)

  // upload
  const [selectedAlbumId, setSelectedAlbumId] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [serverProgress, setServerProgress] = useState(0)
  const [processingLabel, setProcessingLabel] = useState("")
  const uploadAlbumIdRef = useRef<string>("")

  const { socket } = useSocket()

  // delete album
  const [deletingAlbumId, setDeletingAlbumId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // delete media item
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null)


  // upgrade modal
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  // create album modal
  const [createAlbumModalOpen, setCreateAlbumModalOpen] = useState(false)

  // tiered add-on selection
  const [selectedStorageGb, setSelectedStorageGb] = useState<StorageGb>(100)
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<BillingCycle>("monthly")
  const [addonAutoRenew, setAddonAutoRenew] = useState(true)

  // razorpay plans (fetched from dashboard)
  const [razorpayPlans, setRazorpayPlans] = useState<any[]>([])
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const razorpayScriptRef = useRef(false)

  // subscription confirmation modal (auto-renew ON)
  const [pendingSubscription, setPendingSubscription] = useState<{
    storageGb: StorageGb; plan: BillingCycle
  } | null>(null)

  // one-time payment modal (auto-renew OFF)
  const [pendingUpgrade, setPendingUpgrade] = useState<{
    storageGb: StorageGb; plan: BillingCycle
    orderId: string; orderNumber: string
    total: number
    currency: string
  } | null>(null)

  const selectedAlbum = useMemo(
    () => albums.find((a) => a._id === selectedAlbumId) || null,
    [albums, selectedAlbumId]
  )

  // ── load Razorpay script once ──────────────────────────────────────────────
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

  // ── fetch Razorpay plans ───────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/razorpay/plans")
      .then((r) => r.json())
      .then((d) => { if (d.plans) setRazorpayPlans(d.plans) })
      .catch(() => { /* non-critical */ })
  }, [])

  // ── load gallery data ──────────────────────────────────────────────────────
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

  // ── album creation ─────────────────────────────────────────────────────────
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

  // ── socket: server-side processing progress ───────────────────────────────
  useEffect(() => {
    if (!socket) return
    const handleProgress = (data: { albumId: string; processed: number; total: number; percent: number; currentFile: string }) => {
      if (data.albumId !== uploadAlbumIdRef.current) return
      setServerProgress(data.percent)
      // processed is the index (0-based) mid-file; show file number as min(processed+1, total)
      const fileNum = Math.min(data.processed + 1, data.total)
      setProcessingLabel(`Uploading to S3 — file ${fileNum}/${data.total}: ${data.currentFile}`)
      if (data.processed >= data.total) {
        uploadAlbumIdRef.current = ""
      }
    }
    socket.on("gallery:upload-progress", handleProgress)
    return () => { socket.off("gallery:upload-progress", handleProgress) }
  }, [socket])

  // ── upload ─────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedAlbumId) { toast.error("Select an album first"); return }
    if (!selectedFiles.length) { toast.error("Select files to upload"); return }
    const sizeErrors = validateFileSizes(selectedFiles)
    if (sizeErrors.length) { sizeErrors.forEach((msg) => toast.error(msg)); return }
    try {
      setUploading(true)
      setUploadProgress(0)
      setServerProgress(0)
      setProcessingLabel("")
      uploadAlbumIdRef.current = selectedAlbumId
      await uploadAlbumFiles(selectedAlbumId, selectedFiles, setUploadProgress)
      // Server confirmed done — push to 100% then hide
      setServerProgress(100)
      await new Promise((r) => setTimeout(r, 400))
      setUploading(false)
      setUploadProgress(0)
      setServerProgress(0)
      toast.success("Files uploaded successfully")
      setSelectedFiles([])
      await loadData()
    } catch (e: any) {
      toast.error(e?.message || "Upload failed")
      uploadAlbumIdRef.current = ""
    }
    finally { setUploading(false) }
  }

  // ── set cover ──────────────────────────────────────────────────────────────
  const handleSetCover = async (albumId: string, mediaItem: AlbumMediaItem) => {
    if (mediaItem.type !== "image") { toast.error("Only image can be set as cover"); return }
    const res = await apiClient.setAlbumCoverImage(albumId, mediaItem._id)
    if (!res.success) { toast.error(res.error || "Failed to set cover image"); return }
    toast.success("Cover image updated")
    await loadData()
  }

  // ── delete media item ─────────────────────────────────────────────────────
  const handleDeleteMediaItem = async (albumId: string, mediaItemId: string) => {
    try {
      setDeletingMediaId(mediaItemId)
      const res = await apiClient.deleteMediaItem(albumId, mediaItemId)
      if (!res.success) { toast.error(res.error || "Failed to delete media item"); return }
      toast.success("Media item deleted")
      await loadData()
    } catch { toast.error("Failed to delete media item") }
    finally { setDeletingMediaId(null) }
  }

  // ── delete album ───────────────────────────────────────────────────────────
  const handleDeleteAlbum = async (albumId: string) => {
    if (confirmDeleteId !== albumId) { setConfirmDeleteId(albumId); return }
    try {
      setDeletingAlbumId(albumId)
      setConfirmDeleteId(null)
      const res = await apiClient.deleteAlbum(albumId)
      if (!res.success) { toast.error(res.error || "Failed to delete album"); return }
      if (res.data?.deleteErrors?.length) {
        toast.warning(`Album deleted, but ${res.data.deleteErrors.length} file(s) could not be removed from storage`)
      } else {
        toast.success("Album deleted")
      }
      if (selectedAlbumId === albumId) setSelectedAlbumId("")
      await loadData()
    } catch { toast.error("Failed to delete album") }
    finally { setDeletingAlbumId(null) }
  }

  // ── activate storage after any successful payment ──────────────────────────
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

  // ── subscription checkout (auto-renew ON) ──────────────────────────────────
  const handleSubscriptionCheckout = async (storageGb: StorageGb, plan: BillingCycle) => {
    const priceInr = STORAGE_PRICING[storageGb][plan]
    const priceInPaise = priceInr * 100

    // find matching plan by amount
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
      // create subscription from the plan
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
            // verify subscription signature
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

  // ── buy storage (branches on auto-renew) ──────────────────────────────────
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

  // ── one-time payment success (auto-renew OFF) ──────────────────────────────
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

  // ── render ─────────────────────────────────────────────────────────────────
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
              {/* ── Storage Usage ─────────────────────────────────────────── */}
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
                  {/* Progress bar */}
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
                  {/* Stats row */}
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
                  {/* Active add-ons */}
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

              {/* ── Upload Media ──────────────────────────────────────────── */}
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
                  <Input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,video/mp4,video/mpeg,video/avi,video/x-msvideo"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      const errors = validateFileSizes(files)
                      if (errors.length) {
                        errors.forEach((msg) => toast.error(msg))
                        e.target.value = ""
                        setSelectedFiles([])
                        return
                      }
                      setSelectedFiles(files)
                    }}
                  />
                  {selectedFiles.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {selectedFiles.length} {selectedFiles.length === 1 ? "file" : "files"} selected
                    </p>
                  )}
                  {uploading && UploadProgressBar({ uploadProgress, serverProgress, processingLabel, selectedFiles })}
                  <Button onClick={handleUpload} disabled={uploading} className="w-full">
                    {uploading ? "Uploading..." : "Upload Files"}
                  </Button>
                </CardContent>
              </Card>

              {/* ── Album grid ───────────────────────────────────────────── */}
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
                      {/* Cover */}
                      <div className="relative h-44 bg-muted shrink-0">
                        {album.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={album.coverImage} alt={album.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-10 w-10 text-muted-foreground/25" />
                          </div>
                        )}
                        <button
                          type="button"
                          disabled={deletingAlbumId === album._id}
                          onClick={() => handleDeleteAlbum(album._id)}
                          title={confirmDeleteId === album._id ? "Click again to confirm" : "Delete album"}
                          className={`absolute top-2 right-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium shadow transition-colors disabled:opacity-50 ${
                            confirmDeleteId === album._id
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
                          }`}
                        >
                          <Trash2 className="h-3 w-3" />
                          {confirmDeleteId === album._id && <span>Confirm?</span>}
                        </button>
                      </div>

                      {/* Info */}
                      <div className="p-4 flex flex-col gap-3 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold line-clamp-1 text-sm">{album.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {album.mediaItems.length} {album.mediaItems.length === 1 ? "file" : "files"} &middot; {bytesToReadable(album.totalSize)}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Badge variant="secondary" className="text-xs">
                              {album.mediaItems.filter((m) => m.type === "image").length} img
                            </Badge>
                            {album.mediaItems.filter((m) => m.type === "video").length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {album.mediaItems.filter((m) => m.type === "video").length} vid
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Expanded media grid */}
                        {selectedAlbum?._id === album._id && selectedAlbum.mediaItems.length > 0 && (
                          <div className="grid grid-cols-4 gap-1.5 max-h-52 overflow-y-auto rounded-lg">
                            {selectedAlbum.mediaItems.map((m) => (
                              <div key={m._id} className="relative group rounded-md overflow-hidden bg-muted aspect-square">
                                {m.type === "image" ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                                ) : (
                                  <>
                                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                                    <video src={`${m.url}#t=0.001`} className="w-full h-full object-cover" preload="metadata" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                                      <Play className="h-4 w-4 text-white fill-white" />
                                    </div>
                                  </>
                                )}
                                {m.type === "image" && (
                                  <button
                                    type="button"
                                    title="Set as cover image"
                                    onClick={() => handleSetCover(album._id, m)}
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity"
                                  />
                                )}
                                <button
                                  type="button"
                                  title="Delete"
                                  disabled={deletingMediaId === m._id}
                                  onClick={() => handleDeleteMediaItem(album._id, m._id)}
                                  className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full p-0.5 disabled:opacity-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <Button
                          variant={selectedAlbum?._id === album._id ? "default" : "outline"}
                          size="sm"
                          className="mt-auto w-full"
                          onClick={() => setSelectedAlbumId(selectedAlbum?._id === album._id ? "" : album._id)}
                        >
                          {selectedAlbum?._id === album._id ? "Hide Media" : "Manage Media"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Upgrade Storage Modal ──────────────────────────────────────────── */}
        <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Add Storage</DialogTitle>
              <DialogDescription>
                Choose a storage tier and billing cycle to expand your gallery space.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Tier cards */}
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

              {/* Billing cycle */}
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

              {/* Auto-renew */}
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

              {/* Summary + CTA */}
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

      {/* ── Create Album Modal ──────────────────────────────────────────────── */}
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

      {/* ── Subscription Confirmation Modal (auto-renew ON) ──────────────────── */}
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
              {/* Plan summary */}
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

      {/* one-time payment modal (auto-renew OFF) */}
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
