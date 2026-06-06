'use client';

/**
 * ClubFeaturesContext
 *
 * Single shared source of truth for the club's resolved feature config within
 * the dashboard. All consuming components read from this context, guaranteeing
 * that when a CONFIG_SYNC event arrives the entire UI updates in one React
 * state flush (atomic re-rendering — no partial states where a button is
 * visible but its page is already gone).
 *
 * Usage:
 *   1. Wrap the dashboard area with <ClubFeaturesProvider clubId={clubId}>
 *   2. Consume via useClubFeaturesCtx() in any child component
 *
 * Components that live outside the dashboard (e.g. public pages) should
 * continue to call useClubFeatures(clubId) directly.
 */

import React, { createContext, useContext, type ReactNode } from 'react';
import { useClubFeatures } from '@/hooks/useClubFeatures';
import type { ClubFeatureKey, ClubFeatureState, ResolvedClubFeatures } from '@/lib/clubFeatures';
import { clubFeatureFlags, featureState, getFeatureConstraint } from '@/lib/clubFeatures';

interface ClubFeaturesContextValue {
  config: ResolvedClubFeatures | null;
  isLoading: boolean;
  loadFailed: boolean;
  /** True if the feature is enabled for this club. Defaults to true while loading (optimistic). */
  isEnabled: (key: ClubFeatureKey) => boolean;
  /** State of the feature flag (active | inactive | trial | limited). */
  featureState: (key: ClubFeatureKey) => ClubFeatureState;
  /** Returns the numeric constraint limit for a key, or null if unconstrained. */
  getConstraint: (constraintKey: string) => number | null;
  /** Trigger a full refresh from the API (e.g. on manual reload). */
  reload: () => Promise<void>;
}

const ClubFeaturesContext = createContext<ClubFeaturesContextValue | null>(null);

interface ClubFeaturesProviderProps {
  clubId: string | null | undefined;
  children: ReactNode;
}

export function ClubFeaturesProvider({ clubId, children }: ClubFeaturesProviderProps) {
  const { config, loading, loadFailed, isEnabled, reload } = useClubFeatures(clubId);

  const value: ClubFeaturesContextValue = {
    config,
    isLoading: loading,
    loadFailed,
    isEnabled,
    featureState: (key) => featureState(config, key),
    getConstraint: (constraintKey) => getFeatureConstraint(config, constraintKey),
    reload,
  };

  return (
    <ClubFeaturesContext.Provider value={value}>
      {children}
    </ClubFeaturesContext.Provider>
  );
}

/**
 * Hook for consuming the shared club feature config within the dashboard.
 * Throws if called outside a <ClubFeaturesProvider>.
 */
export function useClubFeaturesCtx(): ClubFeaturesContextValue {
  const ctx = useContext(ClubFeaturesContext);
  if (!ctx) {
    throw new Error('useClubFeaturesCtx must be used inside <ClubFeaturesProvider>');
  }
  return ctx;
}

/**
 * Same as useClubFeaturesCtx but returns null instead of throwing when called
 * outside the provider. Use this in components that may render on public pages.
 */
export function useClubFeaturesCtxSafe(): ClubFeaturesContextValue | null {
  return useContext(ClubFeaturesContext);
}
