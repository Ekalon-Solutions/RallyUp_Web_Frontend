'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useSocket } from '@/contexts/socket-context';
import { useInViewport } from '@/hooks/useInViewport';
import {
  getEventImageUrl,
  invalidateEventImage,
  type EventImageVariant,
} from '@/lib/eventImageCache';
import { DEFAULT_CLUB_PRIMARY } from '@/lib/clubThemeButton';

interface EventImageProps {
  eventId: string;
  /** Bumped by the backend whenever the poster changes — drives cache invalidation. */
  imageVersion?: number;
  /** `list` -> 400px feed variant, `full` -> 1080px detail variant. */
  size?: 'list' | 'full';
  /**
   * Embedded variant URL from the event object (e.g. eventImageVariants.list400.url).
   * When provided it renders immediately — no presigned round-trip. Presigned
   * fetch is used only as a fallback, or to refresh after a live image update.
   */
  directUrl?: string | null;
  /** Club primary colour for the blurred placeholder (defaults to brand blue). */
  primaryColor?: string;
  alt: string;
  className?: string;
  /** Tailwind aspect class for the frame, e.g. "aspect-video". */
  aspectClassName?: string;
  priority?: boolean;
}

const VARIANT: Record<'list' | 'full', EventImageVariant> = {
  list: 'list400',
  full: 'full1080',
};

/**
 * Lazy-loaded, cached event hero image with multi-resolution delivery.
 *
 * - Only fetches once within 10% of the viewport (useInViewport).
 * - Requests the size-appropriate variant (400px list / 1080px detail).
 * - Shows a blurred club-primary-colour gradient + skeleton shimmer while loading.
 * - Resolves a short-lived presigned URL (anti-hotlink), cached per imageVersion.
 * - Listens for `event:image-updated` to swap in a new poster with no refresh.
 */
export function EventImage({
  eventId,
  imageVersion = 0,
  size = 'list',
  directUrl,
  primaryColor,
  alt,
  className,
  aspectClassName = 'aspect-video',
  priority = false,
}: EventImageProps) {
  const { ref, isInViewport } = useInViewport<HTMLDivElement>();
  const { socket } = useSocket();
  const [url, setUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  // Bumped on socket invalidation to force a re-resolve.
  const [version, setVersion] = useState(imageVersion);
  // After a live update the embedded directUrl is stale — fetch a fresh presigned one.
  const [forceFetch, setForceFetch] = useState(false);

  const shouldLoad = priority || isInViewport;
  const color = primaryColor || DEFAULT_CLUB_PRIMARY;

  // Keep local version in sync if the prop changes (e.g. parent re-fetches event).
  useEffect(() => {
    setVersion(imageVersion);
  }, [imageVersion]);

  // Realtime cache invalidation: when an admin swaps this event's poster.
  useEffect(() => {
    if (!socket) return;
    const handler = (payload: { eventId: string; imageVersion: number }) => {
      if (payload?.eventId !== eventId) return;
      invalidateEventImage(eventId);
      setLoaded(false);
      setFailed(false);
      setUrl(null);
      setForceFetch(true); // ignore the now-stale directUrl, fetch fresh
      setVersion(payload.imageVersion ?? Date.now());
    };
    socket.on('event:image-updated', handler);
    return () => {
      socket.off('event:image-updated', handler);
    };
  }, [socket, eventId]);

  // Resolve the image URL once in view: prefer the embedded directUrl (instant),
  // otherwise fetch a presigned URL.
  useEffect(() => {
    if (!shouldLoad) return;
    if (directUrl && !forceFetch) {
      setUrl(directUrl);
      setFailed(false);
      return;
    }
    let cancelled = false;
    getEventImageUrl(eventId, version, VARIANT[size])
      .then((resolved) => {
        if (cancelled) return;
        if (resolved) setUrl(resolved);
        else setFailed(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [shouldLoad, eventId, version, size, directUrl, forceFetch]);

  const showImage = !!url && !failed;

  return (
    <div
      ref={ref}
      className={cn('relative w-full overflow-hidden bg-muted', aspectClassName, className)}
    >
      {/* Blurred club-primary-colour placeholder + skeleton shimmer. */}
      {!loaded && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background: `linear-gradient(135deg, ${color}33 0%, ${color}66 50%, ${color}22 100%)`,
            filter: 'blur(8px)',
          }}
          aria-hidden
        />
      )}

      {showImage && (
        // Plain <img> (next/image is unoptimized in this project) with native lazy
        // loading as a second line of defence behind the IntersectionObserver.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url!}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-500',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </div>
  );
}
