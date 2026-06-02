'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api';
import type { ClubFeatureKey, ResolvedClubFeatures } from '@/lib/clubFeatures';
import { useSocket } from '@/contexts/socket-context';
import { toast } from 'sonner';

const STALE_MS = 24 * 60 * 60 * 1000;

function loadCachedFeatures(clubId: string): ResolvedClubFeatures | null {
  if (typeof window === 'undefined') return null;
  const cached = localStorage.getItem(`club-features:${clubId}`);
  if (!cached) return null;
  try {
    const parsed = JSON.parse(cached) as { data: ResolvedClubFeatures; savedAt: number };
    if (Date.now() - parsed.savedAt > STALE_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function useClubFeatures(clubId: string | null | undefined) {
  const [config, setConfig] = useState<ResolvedClubFeatures | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const { socket, isConnected } = useSocket();
  const prevConfigRef = useRef<ResolvedClubFeatures | null>(null);

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
        setConfig(res.data);
        prevConfigRef.current = res.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            `club-features:${clubId}`,
            JSON.stringify({ data: res.data, savedAt: Date.now() })
          );
        }
      } else {
        setLoadFailed(true);
        const cached = loadCachedFeatures(clubId);
        setConfig(cached);
      }
    } catch {
      setLoadFailed(true);
      const cached = loadCachedFeatures(clubId);
      setConfig(cached);
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket || !isConnected || !clubId) return;
    socket.emit('join-club-config', clubId);
    const onSync = (payload: { clubId?: string; config?: ResolvedClubFeatures }) => {
      if (payload.clubId && String(payload.clubId) !== String(clubId)) return;
      if (payload.config) {
        const prev = prevConfigRef.current;
        const newlyEnabled = payload.config.flags.filter(
          (f) => f.enabled && !prev?.flags.find((p) => p.key === f.key)?.enabled
        );
        setConfig(payload.config);
        prevConfigRef.current = payload.config;
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            `club-features:${clubId}`,
            JSON.stringify({ data: payload.config, savedAt: Date.now() })
          );
        }
        if (newlyEnabled.length > 0) {
          toast.info('New module available', {
            description: `${newlyEnabled.map((f) => f.label).join(', ')} is now enabled for your club.`,
          });
        }
      } else {
        load();
      }
    };
    socket.on('club:config-sync', onSync);
    return () => {
      socket.emit('leave-club-config', clubId);
      socket.off('club:config-sync', onSync);
    };
  }, [socket, isConnected, clubId, load]);

  const isEnabled = useCallback(
    (key: ClubFeatureKey) => {
      if (loading && !config) return true;
      if (loadFailed && !config) return true;
      if (!config) return true;
      return config.flags.find((f) => f.key === key)?.enabled ?? false;
    },
    [config, loading, loadFailed]
  );

  return { config, loading, loadFailed, isEnabled, reload: load };
}
