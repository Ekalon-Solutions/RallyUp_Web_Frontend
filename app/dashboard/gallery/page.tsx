"use client"

import React, { useEffect, useMemo, useState } from "react"
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
import { FolderPlus, HardDrive, Image as ImageIcon, Upload } from "lucide-react"

const bytesToReadable = (bytes: number): string => {
  if (!bytes) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  let value = bytes
  let idx = 0
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024
    idx += 1
  }
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`
}

async function uploadAlbumFiles(
  albumId: string,
  files: File[],
  onProgress: (percent: number) => void
): Promise<any> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const endpoint = getApiUrl(`/gallery/albums/${albumId}/upload`)
  const formData = new FormData()
  files.forEach((file) => formData.append("files", file))

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", endpoint)
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText || "{}")
        if (xhr.status >= 200 && xhr.status < 300) resolve(json)
        else reject(new Error(json?.message || "Upload failed"))
      } catch (error) {
        reject(new Error("Upload failed"))
      }
    }
    xhr.onerror = () => reject(new Error("Network error during upload"))
    xhr.send(formData)
  })
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

  const [selectedAlbumId, setSelectedAlbumId] = useState<string>("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const [upgradeAutoRenew, setUpgradeAutoRenew] = useState(true)
  const [upgradingPlan, setUpgradingPlan] = useState<"monthly" | "annual" | null>(null)

  const selectedAlbum = useMemo(
    () => albums.find((a) => a._id === selectedAlbumId) || null,
    [albums, selectedAlbumId]
  )

  const loadData = async () => {
    try {
      setLoading(true)
      const [albumsRes, storageRes] = await Promise.all([
        apiClient.getAdminAlbums(clubId || undefined),
        apiClient.getGalleryStorageSummary(clubId || undefined),
      ])
      setAlbums(albumsRes.success && albumsRes.data?.albums ? albumsRes.data.albums : [])
      setStorage(storageRes.success && storageRes.data ? storageRes.data : null)
    } catch (error) {
      toast.error("Failed to load gallery management data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [clubId])

  const handleCreateAlbum = async () => {
    if (!albumName.trim()) {
      toast.error("Album name is required")
      return
    }
    try {
      setCreatingAlbum(true)
      const res = await apiClient.createAlbum({
        name: albumName.trim(),
        description: albumDescription.trim() || undefined,
        folderName: folderName.trim() || undefined,
        clubId: clubId || undefined,
      })
      if (!res.success) {
        toast.error(res.error || "Failed to create album")
        return
      }
      toast.success("Album created")
      setAlbumName("")
      setAlbumDescription("")
      setFolderName("")
      await loadData()
    } finally {
      setCreatingAlbum(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedAlbumId) {
      toast.error("Select an album first")
      return
    }
    if (selectedFiles.length === 0) {
      toast.error("Select files to upload")
      return
    }
    try {
      setUploading(true)
      setUploadProgress(0)
      await uploadAlbumFiles(selectedAlbumId, selectedFiles, setUploadProgress)
      toast.success("Files uploaded successfully")
      setSelectedFiles([])
      await loadData()
    } catch (error: any) {
      toast.error(error?.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleSetCover = async (albumId: string, mediaItem: AlbumMediaItem) => {
    if (mediaItem.type !== "image") {
      toast.error("Only image can be set as cover")
      return
    }
    const res = await apiClient.setAlbumCoverImage(albumId, mediaItem._id)
    if (!res.success) {
      toast.error(res.error || "Failed to set cover image")
      return
    }
    toast.success("Cover image updated")
    await loadData()
  }

  const handleUpgrade = async (plan: "monthly" | "annual") => {
    try {
      setUpgradingPlan(plan)
      const res = await apiClient.upgradeGalleryStorage({
        plan,
        autoRenew: upgradeAutoRenew,
        clubId: clubId || undefined,
      })
      if (!res.success) {
        toast.error(res.error || "Failed to upgrade storage")
        return
      }
      toast.success(`Storage upgraded (${plan})`)
      await loadData()
    } finally {
      setUpgradingPlan(null)
    }
  }

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
                  <div className="flex items-center gap-3">
                    <Switch checked={upgradeAutoRenew} onCheckedChange={setUpgradeAutoRenew} id="auto-renew" />
                    <Label htmlFor="auto-renew">Auto-renew storage upgrades</Label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => handleUpgrade("monthly")} disabled={upgradingPlan !== null}>
                      Upgrade Monthly (INR 299)
                    </Button>
                    <Button variant="outline" onClick={() => handleUpgrade("annual")} disabled={upgradingPlan !== null}>
                      Upgrade Annual (INR 3199)
                    </Button>
                  </div>
                </CardContent>
              </Card>

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
                      <option key={a._id} value={a._id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="file"
                    multiple
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
                          {selectedAlbum.mediaItems
                            .filter((m) => m.type === "image")
                            .slice(0, 6)
                            .map((m) => (
                              <button
                                key={m._id}
                                type="button"
                                title="Set as cover image"
                                onClick={() => handleSetCover(album._id, m)}
                                className="rounded overflow-hidden border hover:ring-2 hover:ring-primary"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={m.url} alt={m.name} className="w-full h-16 object-cover" />
                              </button>
                            ))}
                        </div>
                      )}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setSelectedAlbumId(album._id)}
                      >
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
    </ProtectedRoute>
  )
}
