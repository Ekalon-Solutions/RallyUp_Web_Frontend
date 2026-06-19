import type { VendorScanPass } from '@/lib/vendorScanTypes';

const DB_NAME = 'rallyup-vendor-scan';
const DB_VERSION = 1;
const PASS_STORE = 'passes';
const QUEUE_STORE = 'pendingAttendance';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PASS_STORE)) {
        db.createObjectStore(PASS_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cacheVendorPass(key: string, pass: VendorScanPass): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PASS_STORE, 'readwrite');
      tx.objectStore(PASS_STORE).put({ key, pass, cachedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* non-blocking */
  }
}

export async function getCachedVendorPass(key: string): Promise<VendorScanPass | null> {
  try {
    const db = await openDb();
    const result = await new Promise<VendorScanPass | null>((resolve, reject) => {
      const tx = db.transaction(PASS_STORE, 'readonly');
      const req = tx.objectStore(PASS_STORE).get(key);
      req.onsuccess = () => resolve(req.result?.pass ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return result;
  } catch {
    return null;
  }
}

export type PendingAttendance = {
  key: string;
  registrationId: string;
  attendeeId: string;
  clubId?: string;
  assignmentId?: string;
  gateZone?: string;
  queuedAt: number;
};

export async function queuePendingAttendance(entry: PendingAttendance): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readwrite');
      tx.objectStore(QUEUE_STORE).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* non-blocking */
  }
}

export async function listPendingAttendance(): Promise<PendingAttendance[]> {
  try {
    const db = await openDb();
    const items = await new Promise<PendingAttendance[]>((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readonly');
      const req = tx.objectStore(QUEUE_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return items;
  } catch {
    return [];
  }
}

export async function removePendingAttendance(key: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readwrite');
      tx.objectStore(QUEUE_STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* non-blocking */
  }
}

const SESSION_COUNT_KEY = 'vendorScanSessionCount';

export function getSessionScanCount(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(sessionStorage.getItem(SESSION_COUNT_KEY) || '0', 10) || 0;
}

export function incrementSessionScanCount(): number {
  if (typeof window === 'undefined') return 0;
  const next = getSessionScanCount() + 1;
  sessionStorage.setItem(SESSION_COUNT_KEY, String(next));
  return next;
}

export function resetSessionScanCount(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_COUNT_KEY);
}
