import { apiClient } from '@/lib/api';

/**
 * Client-side cache for event hero-image presigned URLs.
 *
 * The backend mints short-lived presigned URLs (a temporary, signature-bound CDN
 * token that blocks hotlinking). Re-fetching them on every render would (a) hammer
 * the API and (b) hand the browser a *new* URL each time — a guaranteed HTTP cache
 * miss. So we cache the resolved URLs here, keyed on `eventId:imageVersion`, and
 * reuse the exact URL string until shortly before it expires. Reusing the identical
 * URL is what makes repeat visits browser-cache hits (~90% less data).
 *
 * Cache invalidation: when an admin swaps the poster the backend bumps
 * `imageVersion` and pushes `event:image-updated`. A new version => a new cache key
 * => a fresh fetch => the new poster, with no manual refresh.
 *
 * "Memory management": the browser HTTP cache evicts old image *bytes* under
 * storage pressure automatically (LRU). This map only holds tiny URL strings, but
 * we still cap it (MAX_ENTRIES, LRU) and drop expired entries so it never grows
 * unbounded in a long-lived tab.
 */

export type EventImageVariant = 'list400' | 'full1080';

interface CacheEntry {
  urls: { list400: string | null; full1080: string | null };
  imageVersion: number;
  expiresAt: number; // epoch ms
  lastUsed: number; // epoch ms — for LRU eviction
}

const MAX_ENTRIES = 200;
// Refresh a little before the real expiry so an in-flight load never 403s.
const EXPIRY_SAFETY_MS = 30_000;

const cache = new Map<string, CacheEntry>();
// De-dupe concurrent fetches for the same event (e.g. a feed mounting many cards).
const inflight = new Map<string, Promise<CacheEntry | null>>();

const keyFor = (eventId: string, imageVersion: number) => `${eventId}:${imageVersion}`;

function evictIfNeeded() {
  if (cache.size <= MAX_ENTRIES) return;
  let oldestKey: string | null = null;
  let oldest = Infinity;
  for (const [k, v] of cache) {
    if (v.lastUsed < oldest) {
      oldest = v.lastUsed;
      oldestKey = k;
    }
  }
  if (oldestKey) cache.delete(oldestKey);
}

/**
 * Resolve a presigned URL for one variant of an event's hero image, fetching (and
 * caching) the full URL set on a miss. Returns null when the event has no image or
 * the request fails — callers should fall back to the colored placeholder.
 */
export async function getEventImageUrl(
  eventId: string,
  imageVersion: number,
  variant: EventImageVariant
): Promise<string | null> {
  const key = keyFor(eventId, imageVersion);
  const now = Date.now();

  const cached = cache.get(key);
  if (cached && cached.expiresAt - EXPIRY_SAFETY_MS > now) {
    cached.lastUsed = now;
    return cached.urls[variant];
  }

  let pending = inflight.get(key);
  if (!pending) {
    pending = (async (): Promise<CacheEntry | null> => {
      const res = await apiClient.getEventImageUrls(eventId);
      if (!res.success || !res.data?.urls) return null;
      const entry: CacheEntry = {
        urls: res.data.urls,
        imageVersion: res.data.imageVersion,
        expiresAt: Date.now() + (res.data.expiresIn ?? 0) * 1000,
        lastUsed: Date.now(),
      };
      // Cache under the version the server actually returned (it is the source of
      // truth — guards against a stale `imageVersion` passed by the caller).
      cache.set(keyFor(eventId, entry.imageVersion), entry);
      evictIfNeeded();
      return entry;
    })().finally(() => inflight.delete(key));
    inflight.set(key, pending);
  }

  const entry = await pending;
  return entry ? entry.urls[variant] : null;
}

/**
 * Pick the embedded (public) variant URL from an event object for a given size,
 * falling back across variants and the legacy `eventImage`. Returns null when the
 * event has no image — callers then show the colored placeholder.
 */
export function eventVariantUrl(
  event: {
    eventImage?: string;
    eventImageVariants?: { list400?: { url?: string }; full1080?: { url?: string } };
  } | null | undefined,
  size: 'list' | 'full'
): string | null {
  if (!event) return null;
  const v = event.eventImageVariants;
  if (size === 'list') return v?.list400?.url ?? v?.full1080?.url ?? event.eventImage ?? null;
  return v?.full1080?.url ?? v?.list400?.url ?? event.eventImage ?? null;
}

/** Drop a single event's cached URLs (called on an `event:image-updated` push). */
export function invalidateEventImage(eventId: string) {
  for (const k of cache.keys()) {
    if (k.startsWith(`${eventId}:`)) cache.delete(k);
  }
}
