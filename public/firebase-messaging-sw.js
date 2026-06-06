/**
 * Firebase Cloud Messaging Service Worker
 *
 * Handles background CONFIG_SYNC push notifications when the app tab is
 * closed or backgrounded. On receiving a CONFIG_SYNC message, it posts a
 * message to all controlled clients so they can trigger a fresh feature-flag
 * fetch. If no clients are open, the next page load will reconcile on mount.
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Firebase config is injected at runtime via a meta tag read in the SW context.
// We use a safe fallback so the SW doesn't crash if env vars aren't available.
const firebaseConfig = self.__FIREBASE_CONFIG__ || {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data ?? {};
  const isConfigSync = data.type === 'CONFIG_SYNC';

  // Notify all open clients so they clear their cache and re-fetch
  if (isConfigSync) {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'CONFIG_SYNC',
          clubId: data.clubId,
          syncedAt: data.syncedAt,
        });
      });
    });
  }

  // Show a silent notification only for non-sync pushes (avoids notification noise)
  if (!isConfigSync) {
    const title = payload.notification?.title ?? 'Wingman Pro';
    const body = payload.notification?.body ?? 'Your club has a new update.';
    return self.registration.showNotification(title, {
      body,
      icon: '/WingmanPro Logo (White BG).svg',
      badge: '/WingmanPro Logo (White BG).svg',
      tag: 'wingmanpro-update',
    });
  }
});

// Handle notification click — focus or open the dashboard
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      const existing = clientList.find((c) => c.url.includes('/dashboard'));
      if (existing) return existing.focus();
      return self.clients.openWindow('/dashboard');
    })
  );
});
