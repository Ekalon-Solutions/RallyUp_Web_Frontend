"use client"

import React, { useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden bg-muted animate-pulse">
                  <div className="aspect-[4/3] bg-muted-foreground/10" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
                    <div className="h-3 bg-muted-foreground/20 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : selectedAlbum ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAlbum(null)}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to Albums
                </Button>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold truncate">{selectedAlbum.name}</span>
                  <Badge variant="secondary" className="shrink-0">
                    {selectedAlbum.mediaItems.length} items
                  </Badge>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {bytesToReadable(selectedAlbum.totalSize)}
                  </span>
                </div>
              </div>

              {selectedAlbum.mediaItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground rounded-xl border border-dashed">
                  <ImageIcon className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">No media in this album yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {selectedAlbum.mediaItems.map((item, index) => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => openLightbox(index)}
                      className="relative rounded-lg overflow-hidden bg-muted aspect-square group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      {item.type === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <>
                          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                          <video
                            src={`${item.url}#t=0.001`}
                            className="w-full h-full object-cover"
                            preload="metadata"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                            <PlayCircle className="h-10 w-10 text-white drop-shadow" />
                          </div>
                        </>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent text-white text-xs px-2 py-1.5 truncate translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                        {item.name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : albums.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 text-muted-foreground rounded-xl border border-dashed">
              <FolderOpen className="h-16 w-16 mb-4 opacity-25" />
              <p className="text-lg font-semibold text-foreground">No albums available yet</p>
              <p className="text-sm mt-1">Your club has not published any event gallery folders.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {albums.map((album) => (
                <button
                  key={album._id}
                  type="button"
                  onClick={() => setSelectedAlbum(album)}
                  className="group relative rounded-xl overflow-hidden bg-muted aspect-[4/3] text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  {album.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={album.coverImage}
                      alt={album.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <p className="font-semibold text-sm leading-tight line-clamp-1">{album.name}</p>
                    {album.description && (
                      <p className="text-xs text-white/65 mt-0.5 line-clamp-1">{album.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-2 py-0.5 text-xs text-white">
                        {album.mediaItems.length} items
                      </span>
                      <span className="text-xs text-white/55">{bytesToReadable(album.totalSize)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
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
                        {activeIndex + 1} / {mediaItems.length} &mdash; {bytesToReadable(activeMedia.size)}
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
