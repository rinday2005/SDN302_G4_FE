/**
 * Safe LocalStorage Utility
 * Prevents QuotaExceededError and unhandled storage exceptions from crashing the React application.
 */

// Keys that can be safely discarded if localStorage quota is exceeded
const EXPENDABLE_STORAGE_KEYS = [
  'cached_rent_products_db',
  'mockRentProducts',
  'temp_',
];

const EXPENDABLE_KEY_PREFIXES = [
  'cla_proof_',
  'kyc_draft_',
  'return_request_backup_',
  'cached_',
];

/**
 * Attempts to clear expendable cache items from localStorage
 */
export function purgeExpendableStorage(): boolean {
  try {
    EXPENDABLE_STORAGE_KEYS.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    });

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && EXPENDABLE_KEY_PREFIXES.some((prefix) => k.startsWith(prefix))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore
      }
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Strips huge base64 strings from an object or array to save storage quota
 */
function stripLargeBase64<T>(data: T, maxBase64Length = 50000): T {
  if (!data) return data;
  if (typeof data === 'string') {
    if (data.startsWith('data:') && data.length > maxBase64Length) {
      return '' as unknown as T;
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => stripLargeBase64(item, maxBase64Length)) as unknown as T;
  }
  if (typeof data === 'object') {
    const copy: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      copy[k] = stripLargeBase64(v, maxBase64Length);
    }
    return copy as T;
  }
  return data;
}

/**
 * Safely writes to localStorage with automatic QuotaExceededError recovery
 */
export function safeSetItem<T = unknown>(
  key: string,
  value: T,
  options: { cleanLargeBase64?: boolean } = { cleanLargeBase64: true }
): boolean {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);

  try {
    localStorage.setItem(key, serialized);
    return true;
  } catch (err: unknown) {
    const isQuota =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        err.code === 22 ||
        err.code === 1014);

    if (isQuota) {
      console.warn(`[SafeStorage] QuotaExceededError for key "${key}". Running cleanup...`);
      // Step 1: Purge expendable cache
      purgeExpendableStorage();

      try {
        localStorage.setItem(key, serialized);
        console.info(`[SafeStorage] Successfully saved "${key}" after purge.`);
        return true;
      } catch {
        // Step 2: Strip large base64 if enabled
        if (options.cleanLargeBase64 && typeof value === 'object' && value !== null) {
          try {
            const stripped = stripLargeBase64(value);
            const strippedSerialized = JSON.stringify(stripped);
            localStorage.setItem(key, strippedSerialized);
            console.info(`[SafeStorage] Successfully saved sanitized "${key}".`);
            return true;
          } catch {
            // Still full, ignore to prevent React crash
          }
        }
      }
      console.error(`[SafeStorage] Could not persist key "${key}" due to storage limits. State will remain in memory.`);
      return false;
    }

    console.warn(`[SafeStorage] Unexpected error setting "${key}":`, err);
    return false;
  }
}

/**
 * Safely reads and parses JSON from localStorage
 */
export function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[SafeStorage] Failed to read/parse key "${key}":`, err);
    return fallback;
  }
}

/**
 * Reset application storage cache while preserving auth
 */
export function resetAppStorage(preserveAuth = true): void {
  try {
    const token = preserveAuth ? localStorage.getItem('token') || localStorage.getItem('accessToken') : null;
    const user = preserveAuth ? localStorage.getItem('user') : null;

    localStorage.clear();

    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('accessToken', token);
    }
    if (user) {
      localStorage.setItem('user', user);
    }
  } catch (e) {
    console.error('[SafeStorage] Error resetting storage:', e);
  }
}
