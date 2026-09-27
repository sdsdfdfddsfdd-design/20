/**
 * Persistent Media Storage & Upload Utility
 * Handles persistent server file storage via /api/upload and IndexedDB caching for offline resilience.
 */

const DB_NAME = 'jiawei_media_vault';
const DB_VERSION = 1;
const STORE_NAME = 'media_blobs';

// Open IndexedDB database
function openMediaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported in this browser'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves a media Blob / File to IndexedDB
 */
export async function saveMediaToIndexedDb(id: string, blob: Blob | File, filename?: string): Promise<void> {
  try {
    const db = await openMediaDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({
      id,
      blob,
      type: blob.type,
      filename: filename || id,
      timestamp: Date.now()
    });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('Could not save media to IndexedDB:', e);
  }
}

/**
 * Retrieves a media Blob from IndexedDB
 */
export async function getMediaFromIndexedDb(id: string): Promise<Blob | null> {
  try {
    const db = await openMediaDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result && request.result.blob) {
          resolve(request.result.blob);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

/**
 * Uploads a file to the persistent backend server storage
 */
export async function uploadMediaToServer(
  file: File | Blob,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; filename: string; size: number; mimeType: string }> {
  const formData = new FormData();
  formData.append('file', file, fileName);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    if (data && data.url) {
      return data;
    }
    throw new Error('Invalid upload response from server');
  } catch (err: any) {
    console.warn('Server upload fallback:', err);
    // Fallback URL if server upload fails
    const localBlobUrl = URL.createObjectURL(file);
    return {
      url: localBlobUrl,
      filename: fileName,
      size: file.size,
      mimeType: file.type || 'video/mp4'
    };
  }
}

/**
 * Resolves a media URL to an absolute or playable stream URL
 */
export function resolveMediaUrl(url?: string, useProxy = false): string {
  if (!url) return '';
  if (url.startsWith('/uploads/') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  // Automatically proxy top4top.io URLs to extract direct file and bypass hotlink protection/CORS
  if (url.includes('top4top.io') || useProxy) {
    return `/api/proxy-media?url=${encodeURIComponent(url)}`;
  }
  return url;
}

/**
 * Gets a proxy streaming URL for an external media resource to bypass CORS
 */
export function getProxyMediaUrl(url: string): string {
  if (!url || url.startsWith('/uploads/') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  return `/api/proxy-media?url=${encodeURIComponent(url)}`;
}
