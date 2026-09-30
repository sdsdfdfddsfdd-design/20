/**
 * Persistent Media Storage & Upload Utility
 * Handles persistent server file storage via /api/upload and IndexedDB caching for offline resilience.
 */

export const DB_NAME = 'jiawei_media_vault';
export const DB_VERSION = 1;
export const STORE_NAME = 'media_blobs';

// Global in-memory cache map to hold synchronous Object URLs
export const globalMemoryCache = new Map<string, string>();

// Open IndexedDB database
export function openMediaDb(): Promise<IDBDatabase> {
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
 * Pre-populates the in-memory cache with previously stored items for instant, synchronous access
 */
export async function warmUpMemoryCache(): Promise<void> {
  try {
    const db = await openMediaDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const results = request.result || [];
        for (const item of results) {
          if (item && item.blob) {
            try {
              const url = URL.createObjectURL(item.blob);
              globalMemoryCache.set(item.id, url);
              if (item.filename) {
                globalMemoryCache.set(item.filename, url);
              }
            } catch (err) {}
          }
        }
        resolve();
      };
      request.onerror = () => resolve();
    });
  } catch (e) {
    console.warn('Memory cache warm up failed:', e);
  }
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
    
    // Save to global in-memory Object URL cache for zero-latency retrieval
    try {
      const memoryUrl = URL.createObjectURL(blob);
      globalMemoryCache.set(id, memoryUrl);
      if (filename) {
        globalMemoryCache.set(filename, memoryUrl);
      }
    } catch (err) {}

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
          const blob = request.result.blob;
          // Populate the memory cache on demand
          if (!globalMemoryCache.has(id)) {
            try {
              const memoryUrl = URL.createObjectURL(blob);
              globalMemoryCache.set(id, memoryUrl);
              if (request.result.filename) {
                globalMemoryCache.set(request.result.filename, memoryUrl);
              }
            } catch (err) {}
          }
          resolve(blob);
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
 * Supports local uploads, Google Drive, Dropbox, Top4top, and general web videos & images
 */
export function resolveMediaUrl(url?: string, useProxy = false): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Handle Google Drive view links -> convert to direct thumbnail/image links
  const gdriveMatch = trimmed.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
  if (gdriveMatch && gdriveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${gdriveMatch[1]}`;
  }

  // Handle Dropbox share links -> convert to direct raw links
  if (trimmed.includes('dropbox.com')) {
    return trimmed.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace(/\?dl=[01]/, '');
  }

  // Automatically proxy top4top (all TLDs/subdomains), imgbb, postimg, streamable, and external MP4/video URLs when needed
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (
      useProxy ||
      trimmed.includes('top4top.') ||
      trimmed.includes('ibb.co') ||
      trimmed.includes('postimg.cc') ||
      trimmed.includes('streamable.com') ||
      trimmed.includes('catbox.moe') ||
      trimmed.includes('gofile.io') ||
      trimmed.includes('discordapp.com') ||
      trimmed.includes('vimeo.com') ||
      trimmed.includes('bunnycdn.com') ||
      trimmed.includes('r2.cloudflarestorage.com') ||
      trimmed.includes('cloudinary.com') ||
      trimmed.toLowerCase().includes('.mp4') ||
      trimmed.toLowerCase().includes('.webm') ||
      trimmed.toLowerCase().includes('.mov')
    ) {
      return `/api/proxy-media?url=${encodeURIComponent(trimmed)}`;
    }
  }

  return trimmed;
}

/**
 * Gets a proxy streaming URL for an external media resource to bypass CORS and allow canvas frame capturing
 */
export function getProxyMediaUrl(url: string): string {
  if (!url || url.startsWith('/uploads/') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  return `/api/proxy-media?url=${encodeURIComponent(url.trim())}`;
}
