'use client';

import React, { createContext, useContext, type ReactNode } from 'react';
import { useClubFeatures } from '@/hooks/useClubFeatures';
import type { ClubFeatureKey, ClubFeatureState, ResolvedClubFeatures } from '@/lib/clubFeatures';
import { clubFeatureFlags, featureState, getFeatureConstraint } from '@/lib/clubFeatures';

interface ClubFeaturesContextValue {
  config: ResolvedClubFeatures | null;
  isLoading: boolean;
  loadFailed: boolean;
  isEnabled: (key: ClubFeatureKey) => boolean;
  featureState: (key: ClubFeatureKey) => ClubFeatureState;
  getConstraint: (constraintKey: string) => number | null;
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

export function useClubFeaturesCtx(): ClubFeaturesContextValue {
  const ctx = useContext(ClubFeaturesContext);
  if (!ctx) {
    throw new Error('useClubFeaturesCtx must be used inside <ClubFeaturesProvider>');
  }
  return ctx;
}

export function useClubFeaturesCtxSafe(): ClubFeaturesContextValue | null {
  return useContext(ClubFeaturesContext);
}
