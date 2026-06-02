import type { Album, AlbumMediaItem } from "@/lib/api"

export function getAlbumMediaItems(
  album: Pick<Album, "mediaItems"> | null | undefined
): AlbumMediaItem[] {
  return Array.isArray(album?.mediaItems) ? album.mediaItems : []
}

export function normalizeAlbum(album: Album): Album {
  return {
    ...album,
    mediaItems: getAlbumMediaItems(album),
  }
}

export function normalizeAlbums(albums: Album[] | null | undefined): Album[] {
  if (!Array.isArray(albums)) return []
  return albums.map(normalizeAlbum)
}
