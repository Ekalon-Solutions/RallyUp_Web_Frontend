/**
 * Feature Flag Cache Store
 *
 * Stores an advisory offline snapshot in localStorage. Browser storage is fully
 * controlled by the client, so this cache makes no tamper-evidence claim; the
 * backend remains authoritative and enforces every feature gate.
 *
 * 24-hour offline rule: if the device has been offline for more than 24 hours
 * the cache is treated as stale and the safe/locked state is returned instead.
 */

import {
  type ClubFeatureKey,
  type ResolvedClubFeatures,
  CLUB_FEATURE_KEYS,
  normalizeResolvedClubFeatures,
} from './clubFeatures';

// Bump this constant to force a global cache invalidation across all clients.
const CACHE_VERSION = 'v3';
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  payload: string; // JSON.stringify(ResolvedClubFeatures)
  savedAt: number; // Date.now()
  version: string;
}

export interface CacheReadResult {
  config: ResolvedClubFeatures | null;
  ageMs: number;
  tampered: boolean;
  expired: boolean;
}

// ── Crypto helpers ─────────────────────────────────────────────────────────────

function cacheKey(clubId: string) {
  return `club-features:${clubId}`;
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function writeFeatureCache(clubId: string, config: ResolvedClubFeatures): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const payload = JSON.stringify(config);
    const entry: CacheEntry = { payload, savedAt: Date.now(), version: CACHE_VERSION };
    localStorage.setItem(cacheKey(clubId), JSON.stringify(entry));
  } catch {
    // Storage quota unavailable — fail silently
  }
}

export async function readFeatureCache(clubId: string): Promise<CacheReadResult> {
  const missing: CacheReadResult = { config: null, ageMs: Infinity, tampered: false, expired: true };
  if (typeof window === 'undefined') return missing;

  const raw = localStorage.getItem(cacheKey(clubId));
  if (!raw) return missing;

  let entry: CacheEntry;
  try {
    entry = JSON.parse(raw) as CacheEntry;
  } catch {
    localStorage.removeItem(cacheKey(clubId));
    return missing;
  }

  if (entry.version !== CACHE_VERSION) {
    localStorage.removeItem(cacheKey(clubId));
    return missing;
  }

  const ageMs = Date.now() - entry.savedAt;
  const expired = ageMs > CACHE_TTL_MS;

  let parsed: unknown;
  try {
    parsed = JSON.parse(entry.payload);
  } catch {
    localStorage.removeItem(cacheKey(clubId));
    return { config: null, ageMs, tampered: false, expired };
  }

  const config = normalizeResolvedClubFeatures(parsed as Partial<ResolvedClubFeatures>);
  return { config, ageMs, tampered: false, expired };
}

export function clearFeatureCache(clubId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(cacheKey(clubId));
}

export function clearAllFeatureCaches(): void {
  if (typeof window === 'undefined') return;
  Object.keys(localStorage)
    .filter((k) => k.startsWith('club-features:'))
    .forEach((k) => localStorage.removeItem(k));
}

/**
 * Returns a fully-locked ResolvedClubFeatures — every feature disabled.
 * Used as the safe fallback when the advisory cache is expired while offline
 * or unavailable.
 */
export function lockedSafeConfig(clubId: string): ResolvedClubFeatures {
  return {
    clubId,
    features_schema_version: 0,
    billing_tier: 'free',
    billing_status: 'active',
    feature_constraints: {},
    flags: CLUB_FEATURE_KEYS.map((key: ClubFeatureKey) => ({
      key,
      enabled: false,
      state: 'inactive' as const,
      label: key,
    })),
    experimental_flags: {},
    platformFeePercent: 5,
    estimated_monthly_usd: 0,
    synced_at: new Date().toISOString(),
  };
}
