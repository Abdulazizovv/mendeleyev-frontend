/**
 * Cache Utility for localStorage
 * Handles caching user data with expiry timestamps
 */

export interface CacheData<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
}

export const CACHE_KEYS = {
  USER_DATA: 'cache_user_data',
  BRANCH_DATA: 'cache_branch_data',
  MEMBERSHIPS_DATA: 'cache_memberships_data',
} as const;

// Cache expiry times (milliseconds)
export const CACHE_EXPIRY = {
  USER_PROFILE: 15 * 60 * 1000,      // 15 daqiqa
  BRANCH_INFO: 15 * 60 * 1000,       // 15 daqiqa
  MEMBERSHIPS: 15 * 60 * 1000,       // 15 daqiqa
} as const;

/**
 * Set data to cache with timestamp
 */
export function setCache<T>(key: string, data: T, expiresIn: number): void {
  if (typeof window === 'undefined') return;
  
  const cacheData: CacheData<T> = {
    data,
    timestamp: Date.now(),
    expiresIn,
  };
  
  try {
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error setting cache:', error);
  }
}

/**
 * Get data from cache if not expired
 */
export function getCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const cacheData: CacheData<T> = JSON.parse(cached);
    const now = Date.now();
    const age = now - cacheData.timestamp;
    
    // Check if cache is expired
    if (age > cacheData.expiresIn) {
      // Cache expired, remove it
      localStorage.removeItem(key);
      return null;
    }
    
    return cacheData.data;
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
}

/**
 * Check if cache is still valid (not expired)
 */
export function isCacheValid(key: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return false;
    
    const cacheData: CacheData<unknown> = JSON.parse(cached);
    const now = Date.now();
    const age = now - cacheData.timestamp;
    
    return age <= cacheData.expiresIn;
  } catch (error) {
    console.error('Error checking cache validity:', error);
    return false;
  }
}

/**
 * Get cache age in milliseconds
 */
export function getCacheAge(key: string): number | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const cacheData: CacheData<unknown> = JSON.parse(cached);
    const now = Date.now();
    return now - cacheData.timestamp;
  } catch (error) {
    console.error('Error getting cache age:', error);
    return null;
  }
}

/**
 * Get time until cache expires (in milliseconds)
 */
export function getCacheTimeRemaining(key: string): number | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const cacheData: CacheData<unknown> = JSON.parse(cached);
    const now = Date.now();
    const age = now - cacheData.timestamp;
    const remaining = cacheData.expiresIn - age;
    
    return remaining > 0 ? remaining : 0;
  } catch (error) {
    console.error('Error getting cache time remaining:', error);
    return null;
  }
}

/**
 * Clear specific cache
 */
export function clearCache(key: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  if (typeof window === 'undefined') return;
  
  try {
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing all caches:', error);
  }
}

/**
 * Get formatted cache info for debugging
 */
export function getCacheInfo(key: string): {
  exists: boolean;
  valid: boolean;
  age: number | null;
  remaining: number | null;
  ageFormatted?: string;
  remainingFormatted?: string;
} | null {
  if (typeof window === 'undefined') return null;
  
  const exists = !!localStorage.getItem(key);
  const valid = isCacheValid(key);
  const age = getCacheAge(key);
  const remaining = getCacheTimeRemaining(key);
  
  const formatTime = (ms: number | null): string | undefined => {
    if (ms === null) return undefined;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };
  
  return {
    exists,
    valid,
    age,
    remaining,
    ageFormatted: formatTime(age),
    remainingFormatted: formatTime(remaining),
  };
}
