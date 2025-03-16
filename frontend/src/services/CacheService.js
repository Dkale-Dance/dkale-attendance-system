/**
 * Service for caching data to optimize Firebase query performance
 */
export class CacheService {
  // Default TTL (Time To Live) for cache items: 5 minutes
  static DEFAULT_TTL = 5 * 60 * 1000;
  
  // Default cleanup interval: 10 minutes
  static CLEANUP_INTERVAL = 10 * 60 * 1000;
  
  constructor() {
    // Using a Map for better performance with object keys
    this.cache = new Map();
    
    // Set up automatic cleanup to prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, CacheService.CLEANUP_INTERVAL);
  }
  
  /**
   * Store a value in the cache
   * @param {string} key - The cache key
   * @param {any} value - The value to store
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  set(key, value, ttl = CacheService.DEFAULT_TTL) {
    const now = Date.now();
    
    this.cache.set(key, {
      value,
      timestamp: now,
      expiresAt: now + ttl
    });
  }
  
  /**
   * Retrieve a value from cache
   * @param {string} key - The cache key
   * @returns {any|null} The cached value or null if not found/expired
   */
  get(key) {
    const item = this.cache.get(key);
    
    // If item doesn't exist or is expired
    if (!item || item.expiresAt < Date.now()) {
      if (item) {
        // Clean up expired item
        this.remove(key);
      }
      return null;
    }
    
    return item.value;
  }
  
  /**
   * Check if a key exists in the cache and is not expired
   * @param {string} key - The cache key
   * @returns {boolean} Whether the key exists and is valid
   */
  has(key) {
    const item = this.cache.get(key);
    
    // If item doesn't exist or is expired
    if (!item || item.expiresAt < Date.now()) {
      if (item) {
        // Clean up expired item
        this.remove(key);
      }
      return false;
    }
    
    return true;
  }
  
  /**
   * Remove a specific key from the cache
   * @param {string} key - The cache key to remove
   */
  remove(key) {
    this.cache.delete(key);
  }
  
  /**
   * Clear all items from the cache
   */
  clear() {
    this.cache.clear();
  }
  
  /**
   * Get all keys in the cache
   * @returns {string[]} Array of cache keys
   */
  getKeys() {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Get the number of items in the cache
   * @returns {number} Number of cache items
   */
  getSize() {
    return this.cache.size;
  }
  
  /**
   * Remove all expired items from the cache
   */
  cleanup() {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Get a value with its timestamp
   * @param {string} key - The cache key
   * @returns {Object|null} Object with value and timestamp, or null if not found
   */
  getWithTimestamp(key) {
    const item = this.cache.get(key);
    
    // If item doesn't exist or is expired
    if (!item || item.expiresAt < Date.now()) {
      if (item) {
        // Clean up expired item
        this.remove(key);
      }
      return null;
    }
    
    return {
      value: item.value,
      timestamp: item.timestamp
    };
  }
  
  /**
   * Refresh the TTL of a cached item
   * @param {string} key - The cache key
   * @param {number} ttl - New TTL in milliseconds (optional)
   * @returns {boolean} Whether the operation was successful
   */
  refreshTTL(key, ttl = CacheService.DEFAULT_TTL) {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    // Update the expiration time
    item.expiresAt = Date.now() + ttl;
    return true;
  }
  
  /**
   * Stop the cleanup interval when the service is no longer needed
   */
  dispose() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();