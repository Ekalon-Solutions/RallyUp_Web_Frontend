'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api';
import type { ClubFeatureKey, ResolvedClubFeatures } from '@/lib/clubFeatures';
import { clubFeatureFlags, normalizeResolvedClubFeatures, ADMIN_NAV_FEATURE_MAP } from '@/lib/clubFeatures';
import {
  writeFeatureCache,
  readFeatureCache,
  lockedSafeConfig,
} from '@/lib/featureCacheStore';
import { useSocket } from '@/contexts/socket-context';
import { toast } from 'sonner';

/** Route to navigate to when "Take a Look" is pressed for a newly-enabled feature. */
const FEATURE_NAV_ROUTE: Partial<Record<ClubFeatureKey, string>> = Object.fromEntries(
  Object.entries(ADMIN_NAV_FEATURE_MAP)
    .filter(([, v]) => v !== null)
    .map(([route, feature]) => [feature, route])
) as Partial<Record<ClubFeatureKey, string>>;

export function useClubFeatures(clubId: string | null | undefined) {
  const [config, setConfig] = useState<ResolvedClubFeatures | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const { socket, isConnected } = useSocket();
  const prevConfigRef = useRef<ResolvedClubFeatures | null>(null);

  const applyConfig = useCallback((next: ResolvedClubFeatures) => {
    setConfig(next);
    prevConfigRef.current = next;
  }, []);

  const load = useCallback(async () => {
    if (!clubId) {
      setConfig(null);
      setLoadFailed(false);
      return;
    }

    setLoading(true);
    setLoadFailed(false);

    try {
      const res = await apiClient.getMyClubFeatures(clubId);

      if (res.success && res.data) {
        const normalized = normalizeResolvedClubFeatures(res.data);
        if (normalized) {
          applyConfig(normalized);
          await writeFeatureCache(clubId, normalized);
        }
      } else {
        setLoadFailed(true);
        await loadFromCacheWithFallback(clubId);
      }
    } catch {
      setLoadFailed(true);
      await loadFromCacheWithFallback(clubId);
    } finally {
      setLoading(false);
    }
  }, [clubId, applyConfig]);

  const loadFromCacheWithFallback = useCallback(async (id: string) => {
    const { config: cached, expired, tampered } = await readFeatureCache(id);

    if (tampered) {
      // Detected manual edit — fall back to fully-locked safe state
      console.warn('[features] Tampered cache detected for club', id, '— using locked safe state');
      applyConfig(lockedSafeConfig(id));
      return;
    }

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    if (cached && !expired) {
      // Fresh-enough stale cache — use it
      applyConfig(cached);
    } else if (cached && expired && isOffline) {
      // Cache exists but > 24h AND device is offline — safe/locked state
      console.warn('[features] Cache expired while offline for club', id, '— using locked safe state');
      applyConfig(lockedSafeConfig(id));
    } else if (cached && expired && !isOffline) {
      // Cache stale but online — serve stale while fresh data is being fetched
      applyConfig(cached);
    } else {
      // No cache at all
      applyConfig(lockedSafeConfig(id));
    }
  }, [applyConfig]);

  useEffect(() => {
    // On first mount, seed from cache synchronously (async HMAC verify is fast)
    if (!clubId) return;
    readFeatureCache(clubId).then(({ config: cached, expired, tampered }) => {
      if (tampered) {
        applyConfig(lockedSafeConfig(clubId));
      } else if (cached && !expired) {
        applyConfig(cached);
      }
      // Then trigger a fresh network fetch (state reconciliation on every load)
      load();
    });
  }, [clubId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Socket.io real-time config sync
  useEffect(() => {
    if (!socket || !isConnected || !clubId) return;

    socket.emit('join-club-config', clubId);

    const onSync = (payload: { clubId?: string; config?: ResolvedClubFeatures; syncedAt?: string }) => {
      if (payload.clubId && String(payload.clubId) !== String(clubId)) return;

      if (!payload.config) {
        load();
        return;
      }

      const next = normalizeResolvedClubFeatures(payload.config);
      if (!next) { load(); return; }

      const prev = prevConfigRef.current;
      const prevFlags = clubFeatureFlags(prev);
      const newlyEnabled = clubFeatureFlags(next).filter(
        (f) => f.enabled && !prevFlags.find((p) => p.key === f.key)?.enabled
      );

      applyConfig(next);
      void writeFeatureCache(clubId, next);

      if (newlyEnabled.length > 0) {
        const first = newlyEnabled[0];
        const route = FEATURE_NAV_ROUTE[first.key];
        toast.info('New Feature Available!', {
          description: `${newlyEnabled.map((f) => f.label).join(', ')} is now enabled for your club.`,
          duration: 10_000,
          action: route
            ? {
                label: 'Take a Look →',
                onClick: () => { window.location.href = route; },
              }
            : undefined,
        });
      }
    };

    socket.on('club:config-sync', onSync);

    return () => {
      socket.emit('leave-club-config', clubId);
      socket.off('club:config-sync', onSync);
    };
  }, [socket, isConnected, clubId, load, applyConfig]);

  const isEnabled = useCallback(
    (key: ClubFeatureKey): boolean => {
      // While loading with no config yet, optimistically allow (avoids flash of locked state)
      if (loading && !config) return true;
      if (loadFailed && !config) return true;
      if (!config) return true;
      return clubFeatureFlags(config).find((f) => f.key === key)?.enabled ?? false;
    },
    [config, loading, loadFailed]
  );

  return { config, loading, loadFailed, isEnabled, reload: load };
}
