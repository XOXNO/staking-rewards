/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @file cacheUtils.ts
 * @description Utilities for caching expensive calculations
 */

// In-memory cache for calculated data
const memoryCache = new Map<string, { data: any; timestamp: number }>();

// Maximum approximate size for a localStorage entry (in characters)
const MAX_STORAGE_ENTRY_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Options for caching
 */
interface ICacheOptions {
  /** Time-to-live in milliseconds, default 5 minutes */
  ttl?: number;
  /** Indicates if we should persist the cache in localStorage */
  persistToStorage?: boolean;
  /** Prefix for localStorage keys */
  storageKeyPrefix?: string;
  /** Description of the calculation for logs */
  computeDescription?: string;
  /** Force refresh the calculation regardless of cache */
  forceRefresh?: boolean;
}

/**
 * Checks if a value can be stored in localStorage
 */
function canStoreInLocalStorage(value: any): boolean {
  try {
    const serialized = JSON.stringify({ data: value, timestamp: Date.now() });
    return serialized.length <= MAX_STORAGE_ENTRY_SIZE;
  } catch (error) {
    return false;
  }
}

/**
 * Cleans up localStorage if necessary
 */
function cleanupLocalStorage(storageKeyPrefix: string): void {
  try {
    const keys = Object.keys(localStorage)
      .filter(key => key.startsWith(storageKeyPrefix))
      .sort((a, b) => {
        try {
          const timeA = JSON.parse(localStorage.getItem(a) || '{}').timestamp || 0;
          const timeB = JSON.parse(localStorage.getItem(b) || '{}').timestamp || 0;
          return timeA - timeB;
        } catch {
          return 0;
        }
      });

    // Remove oldest entries until 80% of space remains
    while (keys.length > 0) {
      const oldestKey = keys.shift();
      if (oldestKey) {
        localStorage.removeItem(oldestKey);
      }
      
      // Check if we have enough space
      try {
        const testKey = `${storageKeyPrefix}test`;
        const testData = 'x'.repeat(MAX_STORAGE_ENTRY_SIZE * 0.1); // Test with 10% of max size
        localStorage.setItem(testKey, testData);
        localStorage.removeItem(testKey);
        break;
      } catch {
        continue;
      }
    }
  } catch (_error) {
    // Silent error
  }
}

/**
 * Retrieves a value from cache or executes the calculation function if not found
 * 
 * @param cacheKey Unique key to identify the data in the cache
 * @param computeFunc Function to execute if data is not in cache or has expired
 * @param options Caching options
 * @returns Result of computeFunc (from cache or freshly calculated)
 */
export function getCachedValue<T>(
  cacheKey: string, 
  computeFunc: () => T, 
  options: ICacheOptions = {}
): T {
  const { 
    ttl = 5 * 60 * 1000, // 5 minutes by default
    persistToStorage = false,
    storageKeyPrefix = 'staking_cache_',
    computeDescription = 'Calculation',
    forceRefresh = false
  } = options;

  const now = Date.now();
  const fullCacheKey = storageKeyPrefix + cacheKey;
  
  // Skip cache lookup if forceRefresh is true
  if (!forceRefresh) {
    // First check memory cache
    const memCacheEntry = memoryCache.get(cacheKey);
    if (memCacheEntry && now - memCacheEntry.timestamp < ttl) {
      return memCacheEntry.data;
    }
    
    // If persistToStorage is enabled, check localStorage
    if (persistToStorage) {
      try {
        const storedValue = localStorage.getItem(fullCacheKey);
        if (storedValue) {
          const { data, timestamp } = JSON.parse(storedValue);
          if (now - timestamp < ttl) {
            // Update memory cache with this value
            memoryCache.set(cacheKey, { data, timestamp });
            return data;
          }
        }
      } catch (error) {
        // Silently ignore read errors
      }
    }
  }
  
  // Calculate the value if it's not in cache or has expired
  const result = computeFunc();
  
  // Store in memory cache
  memoryCache.set(cacheKey, { data: result, timestamp: now });
  
  // Store in localStorage if requested and possible
  if (persistToStorage && canStoreInLocalStorage(result)) {
    try {
      localStorage.setItem(
        fullCacheKey,
        JSON.stringify({ data: result, timestamp: now })
      );
    } catch (error) {
      // In case of storage error, try to clean up and retry
      try {
        cleanupLocalStorage(storageKeyPrefix);
        localStorage.setItem(
          fullCacheKey,
          JSON.stringify({ data: result, timestamp: now })
        );
      } catch (retryError) {
        // Silent error
      }
    }
  }
  
  return result;
}

/**
 * Invalidates a specific cache entry
 * 
 * @param cacheKey Key to invalidate
 * @param options Cache options (for localStorage)
 */
export function invalidateCache(
  cacheKey: string, 
  options: { persistToStorage?: boolean; storageKeyPrefix?: string } = {}
): void {
  const { 
    persistToStorage = false,
    storageKeyPrefix = 'staking_cache_'
  } = options;
  
  // Remove from memory cache
  memoryCache.delete(cacheKey);
  
  // Remove from localStorage if persistToStorage
  if (persistToStorage) {
    try {
      localStorage.removeItem(storageKeyPrefix + cacheKey);
    } catch (error) {
      // Silently ignore errors
    }
  }
}

/**
 * Clears the entire cache or a specific group
 * 
 * @param keyPrefix Optional prefix to only clear a group of keys
 * @param options Cache options (for localStorage)
 */
export function clearCache(
  keyPrefix?: string,
  options: { persistToStorage?: boolean; storageKeyPrefix?: string } = {}
): void {
  const {
    persistToStorage = false,
    storageKeyPrefix = 'staking_cache_'
  } = options;
  
  // Vider le cache mémoire
  if (keyPrefix) {
    // Supprimer seulement les entrées avec le préfixe
    Array.from(memoryCache.keys())
      .filter(key => key.startsWith(keyPrefix))
      .forEach(key => memoryCache.delete(key));
  } else {
    // Vider tout le cache
    memoryCache.clear();
  }
  
  // Vider localStorage si persistToStorage
  if (persistToStorage) {
    try {
      if (keyPrefix) {
        // Supprimer seulement les entrées avec le préfixe
        const fullPrefix = storageKeyPrefix + keyPrefix;
        Object.keys(localStorage)
          .filter(key => key.startsWith(fullPrefix))
          .forEach(key => localStorage.removeItem(key));
      } else {
        // Supprimer toutes les entrées avec le préfixe de cache
        Object.keys(localStorage)
          .filter(key => key.startsWith(storageKeyPrefix))
          .forEach(key => localStorage.removeItem(key));
      }
    } catch (error) {
      // Ignorer silencieusement les erreurs
    }
  }
} 