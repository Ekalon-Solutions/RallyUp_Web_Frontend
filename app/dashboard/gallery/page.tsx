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
import { apiClient, Album, AlbumMediaItem, GalleryStorageSummary } from "@/lib/api"
import { getApiUrl } from "@/lib/config"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { toast } from "sonner"
import { FolderPlus, HardDrive, Image as ImageIcon, Upload, ShoppingCart, RefreshCw } from "lucide-react"
import { PaymentSimulationModal } from "@/components/modals/payment-simulation-modal"
import { calculateTransactionFees } from "@/lib/transactionFees"

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
        xhr.status >= 200 && xhr.status < 300 ? resolve(json) : reject(new Error(json?.message || "Upload failed"))
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

  // base monthly/annual upgrade (direct, no payment modal)
  const [upgradingPlan, setUpgradingPlan] = useState<"monthly" | "annual" | null>(null)
  const [baseAutoRenew, setBaseAutoRenew] = useState(true)

  // tiered add-on selection
  const [selectedStorageGb, setSelectedStorageGb] = useState<StorageGb>(100)
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<BillingCycle>("monthly")
  const [addonAutoRenew, setAddonAutoRenew] = useState(true)

  // razorpay plans (fetched from dashboard)
  const [razorpayPlans, setRazorpayPlans] = useState<any[]>([])
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const razorpayScriptRef = useRef(false)

  // one-time payment modal (auto-renew OFF)
  const [pendingUpgrade, setPendingUpgrade] = useState<{
    storageGb: StorageGb; plan: BillingCycle
    orderId: string; orderNumber: string
    total: number; subtotal: number
    platformFeeTotal: number; razorpayFeeTotal: number
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
      await loadData()
    } finally { setCreatingAlbum(false) }
  }

  // ── upload ─────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedAlbumId) { toast.error("Select an album first"); return }
    if (!selectedFiles.length) { toast.error("Select files to upload"); return }
    try {
      setUploading(true); setUploadProgress(0)
      await uploadAlbumFiles(selectedAlbumId, selectedFiles, setUploadProgress)
      toast.success("Files uploaded successfully")
      setSelectedFiles([])
      await loadData()
    } catch (e: any) { toast.error(e?.message || "Upload failed") }
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

  // ── base upgrade (direct call, no payment UI) ──────────────────────────────
  const handleUpgrade = async (plan: "monthly" | "annual") => {
    try {
      setUpgradingPlan(plan)
      const res = await apiClient.upgradeGalleryStorage({
        plan, storageGb: 100, autoRenew: baseAutoRenew, clubId: clubId || undefined,
      })
      if (!res.success) { toast.error(res.error || "Failed to upgrade storage"); return }
      toast.success(`Storage upgraded (${plan})`)
      await loadData()
    } finally { setUpgradingPlan(null) }
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
      rzp.open()
    } catch (e: any) {
      toast.error(e?.message || "Failed to initiate subscription checkout.")
      setCheckoutBusy(false)
    }
  }

  // ── buy storage (branches on auto-renew) ──────────────────────────────────
  const handleBuyStorage = () => {
    if (addonAutoRenew) {
      handleSubscriptionCheckout(selectedStorageGb, selectedBillingCycle)
    } else {
      const baseAmount = STORAGE_PRICING[selectedStorageGb][selectedBillingCycle]
      const fees = calculateTransactionFees(baseAmount)
      const orderId = `gallery-storage-${selectedStorageGb}gb-${selectedBillingCycle}-${Date.now()}`
      const orderNumber = `STG-${Math.floor(Math.random() * 900000) + 100000}`
      setPendingUpgrade({
        storageGb: selectedStorageGb, plan: selectedBillingCycle,
        orderId, orderNumber,
        total: fees.finalAmount, subtotal: fees.baseAmount,
        platformFeeTotal: fees.platformFee + fees.platformFeeGst,
        razorpayFeeTotal: fees.razorpayFee + fees.razorpayFeeGst,
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
            <div className="text-muted-foreground">Loading...</div>
          ) : (
            <>
              {/* ── Storage Usage ─────────────────────────────────────────── */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    Storage Usage
                  </CardTitle>
                  <CardDescription>Track used and available club gallery space</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Used</p>
                      <p className="text-xl font-semibold">{storage ? `${storage.usage.usedGb} GB` : "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Available</p>
                      <p className="text-xl font-semibold">{storage ? `${storage.usage.availableGb} GB` : "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-semibold">{storage ? `${storage.usage.totalGb} GB` : "-"}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: storage
                            ? `${Math.min(100, (storage.usage.usedBytes / Math.max(storage.usage.totalBytes, 1)) * 100)}%`
                            : "0%",
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {storage ? `${bytesToReadable(storage.usage.usedBytes)} / ${bytesToReadable(storage.usage.totalBytes)}` : ""}
                    </p>
                  </div>

                  {/* active add-ons */}
                  {storage && storage.upgrades.filter((u) => u.isActive).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Active Storage Add-ons</p>
                      <div className="flex flex-wrap gap-2">
                        {storage.upgrades.filter((u) => u.isActive).map((u) => (
                          <Badge key={u._id} variant="secondary">
                            {u.storageGb ?? Math.round(u.additionalBytes / 1024 ** 3)} GB &mdash; {BILLING_LABELS[u.plan] ?? u.plan}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── Buy Extra Storage (tiered) ────────────────────────────── */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Buy Extra Storage
                  </CardTitle>
                  <CardDescription>
                    Select a storage tier and billing cycle to expand your gallery space
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* pricing table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-muted text-muted-foreground">
                          <th className="text-left px-4 py-3 font-medium">Storage</th>
                          {(["monthly", "quarterly", "annual"] as BillingCycle[]).map((cycle) => (
                            <th key={cycle} className="text-center px-4 py-3 font-medium">
                              {BILLING_LABELS[cycle]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {([50, 100, 300] as StorageGb[]).map((gb, i) => (
                          <tr key={gb} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                            <td className="px-4 py-3 font-semibold">{gb} GB</td>
                            {(["monthly", "quarterly", "annual"] as BillingCycle[]).map((cycle) => {
                              const isSelected = selectedStorageGb === gb && selectedBillingCycle === cycle
                              return (
                                <td key={cycle} className="px-4 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => { setSelectedStorageGb(gb); setSelectedBillingCycle(cycle) }}
                                    className={`inline-flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 transition-all border ${isSelected
                                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                        : "border-transparent hover:border-muted-foreground/30 hover:bg-muted"
                                      }`}
                                  >
                                    <span className="font-bold">₹{STORAGE_PRICING[gb][cycle].toLocaleString("en-IN")}</span>
                                    <span className="text-[11px] opacity-75">{BILLING_DURATION_LABEL[cycle]}</span>
                                  </button>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* summary + controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">
                        Selected:{" "}
                        <span className="text-primary">
                          {selectedStorageGb} GB — {BILLING_LABELS[selectedBillingCycle]}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ₹{selectedPrice.toLocaleString("en-IN")} {BILLING_DURATION_LABEL[selectedBillingCycle]}
                        {addonAutoRenew
                          ? " · Recurring via Razorpay Subscription"
                          : " · One-time payment · platform & gateway fees apply"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch checked={addonAutoRenew} onCheckedChange={setAddonAutoRenew} id="addon-auto-renew" />
                      <Label htmlFor="addon-auto-renew" className="text-sm flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" />
                        Auto-renew
                      </Label>
                    </div>
                    <Button onClick={handleBuyStorage} disabled={checkoutBusy} className="shrink-0">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {checkoutBusy
                        ? "Opening checkout..."
                        : `Buy Now — ₹${selectedPrice.toLocaleString("en-IN")}`}
                    </Button>
                  </div>

                  {addonAutoRenew && (
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                      Auto-renew uses a Razorpay Subscription — you approve a mandate once and it renews automatically each {BILLING_LABELS[selectedBillingCycle].toLowerCase()} cycle.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* ── Create Album ──────────────────────────────────────────── */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderPlus className="h-5 w-5" />
                    Create Album
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                  <Input placeholder="Album name" value={albumName} onChange={(e) => setAlbumName(e.target.value)} />
                  <Input placeholder="Folder name (optional)" value={folderName} onChange={(e) => setFolderName(e.target.value)} />
                  <Button onClick={handleCreateAlbum} disabled={creatingAlbum}>
                    {creatingAlbum ? "Creating..." : "Create Album"}
                  </Button>
                  <div className="md:col-span-3">
                    <Textarea
                      placeholder="Description (optional)"
                      value={albumDescription}
                      onChange={(e) => setAlbumDescription(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* ── Upload Media ──────────────────────────────────────────── */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Media
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <select
                    className="w-full h-10 rounded-md border px-3 bg-background"
                    value={selectedAlbumId}
                    onChange={(e) => setSelectedAlbumId(e.target.value)}
                  >
                    <option value="">Select album</option>
                    {albums.map((a) => (
                      <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                  </select>
                  <Input
                    type="file" multiple
                    accept="image/jpeg,image/png,video/mp4,video/mpeg,video/avi,video/x-msvideo"
                    onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                  />
                  {selectedFiles.length > 0 && (
                    <p className="text-sm text-muted-foreground">{selectedFiles.length} files selected</p>
                  )}
                  {uploading && (
                    <div className="space-y-2">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground">Uploading... {uploadProgress}%</p>
                    </div>
                  )}
                  <Button onClick={handleUpload} disabled={uploading}>
                    {uploading ? "Uploading..." : "Upload Files"}
                  </Button>
                </CardContent>
              </Card>

              {/* ── Album grid ───────────────────────────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {albums.map((album) => (
                  <Card key={album._id}>
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{album.name}</CardTitle>
                      <CardDescription>{album.mediaItems.length} files</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {album.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={album.coverImage} alt={album.name} className="w-full h-36 object-cover rounded-md" />
                      ) : (
                        <div className="w-full h-36 rounded-md bg-muted flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{bytesToReadable(album.totalSize)}</Badge>
                        <Badge variant="secondary">{album.mediaItems.filter((m) => m.type === "image").length} images</Badge>
                      </div>
                      {selectedAlbum?._id === album._id && selectedAlbum.mediaItems.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {selectedAlbum.mediaItems.filter((m) => m.type === "image").slice(0, 6).map((m) => (
                            <button
                              key={m._id} type="button" title="Set as cover image"
                              onClick={() => handleSetCover(album._id, m)}
                              className="rounded overflow-hidden border hover:ring-2 hover:ring-primary"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={m.url} alt={m.name} className="w-full h-16 object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                      <Button variant="outline" className="w-full" onClick={() => setSelectedAlbumId(album._id)}>
                        Manage This Album
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </DashboardLayout>

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
          subtotal={pendingUpgrade.subtotal}
          platformFeeTotal={pendingUpgrade.platformFeeTotal}
          razorpayFeeTotal={pendingUpgrade.razorpayFeeTotal}
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
