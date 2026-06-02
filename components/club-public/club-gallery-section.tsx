"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Album, AlbumMediaItem } from "@/lib/api"
import { getAlbumMediaItems } from "@/lib/album-utils"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FolderOpen,
  Image as ImageIcon,
  PlayCircle,
} from "lucide-react"
import { toast } from "sonner"

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

type ClubGallerySectionProps = {
  albums: Album[]
  loading: boolean
  primaryColor: string
}

export function ClubGallerySection({ albums, loading, primaryColor }: ClubGallerySectionProps) {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const mediaItems = useMemo(
    () => getAlbumMediaItems(selectedAlbum),
    [selectedAlbum]
  )
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
    } catch {
      toast.error("Unable to download media")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }} />
      </div>
    )
  }

  if (selectedAlbum) {
    const albumMedia = getAlbumMediaItems(selectedAlbum)
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedAlbum(null)} className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            Back to Albums
          </Button>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold truncate">{selectedAlbum.name}</span>
            <Badge variant="secondary" className="shrink-0">
              {albumMedia.length} items
            </Badge>
          </div>
        </div>

        {albumMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground rounded-xl border border-dashed">
            <ImageIcon className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">No media in this album yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {albumMedia.map((item, index) => (
              <button
                key={item._id}
                type="button"
                onClick={() => openLightbox(index)}
                className="relative rounded-lg overflow-hidden bg-muted aspect-square group focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ outlineColor: primaryColor }}
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
                    <video src={`${item.url}#t=0.001`} className="w-full h-full object-cover" preload="metadata" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                      <PlayCircle className="h-10 w-10 text-white drop-shadow" />
                    </div>
                  </>
                )}
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
                      {activeIndex + 1} / {mediaItems.length}
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
    )
  }

  if (albums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <FolderOpen className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-lg text-muted-foreground">No gallery albums available yet.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {albums.map((album) => {
        const albumMedia = getAlbumMediaItems(album)
        return (
        <button
          key={album._id}
          type="button"
          onClick={() => setSelectedAlbum(album)}
          className="group relative rounded-xl overflow-hidden bg-muted aspect-[4/3] text-left focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{ outlineColor: primaryColor }}
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
                {albumMedia.length} items
              </span>
              <span className="text-xs text-white/55">{bytesToReadable(album.totalSize)}</span>
            </div>
          </div>
        </button>
        )
      })}
    </div>
  )
}
