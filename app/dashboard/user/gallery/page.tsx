"use client"

import React, { useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { apiClient, Album, AlbumMediaItem } from "@/lib/api"
import { useRequiredClubId } from "@/hooks/useRequiredClubId"
import { toast } from "sonner"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FolderOpen,
  Image as ImageIcon,
  PlayCircle,
  X,
} from "lucide-react"

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

export default function UserGalleryPage() {
  const clubId = useRequiredClubId()
  const [albums, setAlbums] = useState<Album[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        setIsLoading(true)
        const res = await apiClient.getMemberAlbums(clubId || undefined)
        if (res.success && res.data?.albums) {
          setAlbums(res.data.albums)
        } else {
          setAlbums([])
        }
      } catch (error) {
        setAlbums([])
        toast.error("Failed to load gallery albums")
      } finally {
        setIsLoading(false)
      }
    }
    fetchAlbums()
  }, [clubId])

  const mediaItems = useMemo(() => selectedAlbum?.mediaItems || [], [selectedAlbum])
  const activeMedia = mediaItems[activeIndex]

  const openLightbox = (index: number) => {
    setActiveIndex(index)
    setLightboxOpen(true)
  }

  const nextMedia = () => {
    if (!mediaItems.length) return
    setActiveIndex((prev) => (prev + 1) % mediaItems.length)
  }

  const prevMedia = () => {
    if (!mediaItems.length) return
    setActiveIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length)
  }

  const downloadMedia = async (item: AlbumMediaItem) => {
    try {
      const response = await fetch(item.url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = item.name || `media-${item._id}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      toast.error("Unable to download media")
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Gallery</h1>
            <p className="text-muted-foreground">Browse event albums and view media in full screen</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[260px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                <p className="text-muted-foreground">Loading albums...</p>
              </div>
            </div>
          ) : albums.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-lg font-medium">No albums available yet</p>
                <p className="text-muted-foreground">Your club has not published any event gallery folders.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {albums.map((album) => (
                <Card key={album._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <button
                    type="button"
                    onClick={() => setSelectedAlbum(album)}
                    className="w-full text-left"
                  >
                    <div className="relative h-44 bg-muted">
                      {album.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={album.coverImage} alt={album.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{album.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {album.description || "Event album"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 flex items-center justify-between">
                      <Badge variant="secondary">{album.mediaItems.length} items</Badge>
                      <span className="text-xs text-muted-foreground">{bytesToReadable(album.totalSize)}</span>
                    </CardContent>
                  </button>
                </Card>
              ))}
            </div>
          )}

          {selectedAlbum && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{selectedAlbum.name}</CardTitle>
                  <CardDescription>
                    {selectedAlbum.mediaItems.length} files - {bytesToReadable(selectedAlbum.totalSize)}
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setSelectedAlbum(null)}>
                  <X className="h-4 w-4 mr-2" />
                  Close Album
                </Button>
              </CardHeader>
              <CardContent>
                {selectedAlbum.mediaItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No media in this album yet.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {selectedAlbum.mediaItems.map((item, index) => (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => openLightbox(index)}
                        className="relative rounded-lg overflow-hidden bg-muted aspect-square group"
                      >
                        {item.type === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <>
                            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                            <video
                              src={`${item.url}#t=0.001`}
                              className="w-full h-full object-cover"
                              preload="metadata"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <PlayCircle className="h-10 w-10 text-white drop-shadow" />
                            </div>
                          </>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-xs p-1.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.name}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
            <DialogContent className="max-w-[95vw] w-[95vw] md:max-w-5xl p-2 sm:p-4">
              <DialogTitle className="sr-only">Gallery Media Viewer</DialogTitle>
              {activeMedia && (
                <div className="space-y-3">
                  <div className="relative bg-black rounded-md min-h-[65vh] flex items-center justify-center overflow-hidden">
                    {activeMedia.type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={activeMedia.url} alt={activeMedia.name} className="max-h-[75vh] w-auto object-contain" />
                    ) : (
                      <video src={activeMedia.url} controls className="max-h-[75vh] w-full" />
                    )}

                    {mediaItems.length > 1 && (
                      <>
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          className="absolute left-2 top-1/2 -translate-y-1/2"
                          onClick={prevMedia}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={nextMedia}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{activeMedia.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {activeIndex + 1} / {mediaItems.length} - {bytesToReadable(activeMedia.size)}
                      </p>
                    </div>
                    <Button onClick={() => downloadMedia(activeMedia)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
