'use client';

/**
 * useFcmRegistration
 *
 * Registers the browser with Firebase Cloud Messaging and stores the device
 * token on the backend so CONFIG_SYNC push notifications can be delivered
 * when the tab is backgrounded or closed.
 *
 * Gracefully degrades:
 * - If Firebase Messaging is unavailable (VAPID key not set, browser doesn't
 *   support service workers, or user denies notifications) → no-op.
 * - Re-registers on every session so stale tokens are refreshed automatically.
 */

import { useEffect } from 'react';
import { apiClient } from '@/lib/api';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

async function getFcmToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!VAPID_KEY) return null;
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    // Dynamic import to avoid SSR issues and keep bundle lean when FCM is unused
    const { getMessaging, getToken } = await import('firebase/messaging');
    const { initializeApp, getApps } = await import('firebase/app');

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return token || null;
  } catch (err) {
    // Non-fatal — push notifications unavailable, Socket.io sync still works
    console.info('[fcm] Token registration skipped:', (err as Error).message);
    return null;
  }
}

interface UseFcmRegistrationOptions {
  isAdmin: boolean;
  isAuthenticated: boolean;
}

export function useFcmRegistration({ isAdmin, isAuthenticated }: UseFcmRegistrationOptions) {
  useEffect(() => {
    if (!isAuthenticated || !VAPID_KEY) return;

    getFcmToken().then((token) => {
      if (!token) return;
      const endpoint = isAdmin ? apiClient.registerAdminFcmToken : apiClient.registerUserFcmToken;
      endpoint(token).catch(() => {});
    });
  }, [isAuthenticated, isAdmin]);
}
