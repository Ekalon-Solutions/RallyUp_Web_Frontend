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

export function useClubFeatures(
  clubId: string | null | undefined,
  options?: { asMember?: boolean }
) {
  const asMember = options?.asMember ?? false;
  const [config, setConfig] = useState<ResolvedClubFeatures | null>(null);
  const [loading, setLoading] = useState(Boolean(clubId));
  const [loadFailed, setLoadFailed] = useState(false);
  const { socket, isConnected } = useSocket();
  const prevConfigRef = useRef<ResolvedClubFeatures | null>(null);
  const clubIdRef = useRef(clubId);
  const requestIdRef = useRef(0);
  clubIdRef.current = clubId;

  const applyConfig = useCallback((next: ResolvedClubFeatures) => {
    // Drop updates that belong to a club we already switched away from.
    if (clubIdRef.current && String(next.clubId) !== String(clubIdRef.current)) return;
    setConfig(next);
    prevConfigRef.current = next;
  }, []);

  const loadFromCacheWithFallback = useCallback(async (id: string) => {
    const { config: cached, expired, tampered } = await readFeatureCache(id);
    if (clubIdRef.current && String(id) !== String(clubIdRef.current)) return;

    if (tampered) {
      console.warn('[features] Tampered cache detected for club', id, '— using locked safe state');
      applyConfig(lockedSafeConfig(id));
      return;
    }

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    if (cached && !expired) {
      applyConfig(cached);
    } else if (cached && expired && isOffline) {
      console.warn('[features] Cache expired while offline for club', id, '— using locked safe state');
      applyConfig(lockedSafeConfig(id));
    } else if (cached && expired && !isOffline) {
      applyConfig(cached);
    } else if (isOffline) {
      // Offline with nothing cached — lock. Online with nothing cached stays
      // unlocked so a failed fetch cannot freeze the dashboard after a club switch.
      applyConfig(lockedSafeConfig(id));
    }
  }, [applyConfig]);

  const load = useCallback(async () => {
    if (!clubId) {
      setConfig(null);
      prevConfigRef.current = null;
      setLoadFailed(false);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setLoadFailed(false);

    try {
      const res = asMember
        ? await apiClient.getMyClubFeaturesAsMember(clubId)
        : await apiClient.getMyClubFeatures(clubId);

      if (requestId !== requestIdRef.current) return;

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
      if (requestId !== requestIdRef.current) return;
      setLoadFailed(true);
      await loadFromCacheWithFallback(clubId);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [clubId, asMember, applyConfig, loadFromCacheWithFallback]);

  useEffect(() => {
    if (!clubId) {
      ++requestIdRef.current;
      setConfig(null);
      prevConfigRef.current = null;
      setLoading(false);
      setLoadFailed(false);
      return;
    }

    // Drop the previous club's flags immediately so nav/page locks cannot
    // apply club A features to club B while the new fetch is in flight.
    ++requestIdRef.current;
    setConfig(null);
    prevConfigRef.current = null;
    setLoading(true);
    setLoadFailed(false);

    let cancelled = false;
    const requestId = requestIdRef.current;

    const run = async () => {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      if (isOffline) {
        await loadFromCacheWithFallback(clubId);
        if (!cancelled && requestId === requestIdRef.current) setLoading(false);
        return;
      }
      // Online: fetch first. Seeding from cache here re-locked pages after a
      // club switch whenever the new club's cache was stale or fully-locked.
      await load();
    };

    void run();
    return () => {
      cancelled = true;
      ++requestIdRef.current;
    };
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

  const scopedConfig =
    config && clubId && String(config.clubId) === String(clubId) ? config : null;

  const isEnabled = useCallback(
    (key: ClubFeatureKey): boolean => {
      // Trust a loaded config even during a background refresh. Treating
      // `loading` as "everything enabled" kept disabled sidebar items visible.
      if (scopedConfig) {
        return clubFeatureFlags(scopedConfig).find((f) => f.key === key)?.enabled ?? false;
      }
      // No config yet — stay unlocked so a failed first fetch cannot freeze nav.
      return true;
    },
    [scopedConfig]
  );

  return { config: scopedConfig, loading, loadFailed, isEnabled, reload: load };
}
