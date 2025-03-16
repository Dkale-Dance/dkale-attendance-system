import { CacheService } from '../services/CacheService';

describe('CacheService', () => {
  let cacheService;
  
  // Mock the current time for testing
  const mockNow = new Date('2025-03-15T12:00:00Z').getTime();
  const originalDate = global.Date;
  
  beforeEach(() => {
    // Mock Date.now() to return a fixed timestamp
    global.Date.now = jest.fn(() => mockNow);
    
    // Create a new cache service instance for each test
    cacheService = new CacheService();
  });
  
  afterEach(() => {
    // Restore the original Date object
    global.Date = originalDate;
  });
  
  describe('set', () => {
    it('should store a value in the cache with default TTL', () => {
      // Act
      cacheService.set('testKey', { data: 'testValue' });
      
      // Assert
      const cachedItem = cacheService.cache.get('testKey');
      expect(cachedItem).toBeDefined();
      expect(cachedItem.value).toEqual({ data: 'testValue' });
      expect(cachedItem.expiresAt).toBe(mockNow + CacheService.DEFAULT_TTL);
    });
    
    it('should store a value with custom TTL', () => {
      // Arrange
      const customTTL = 60000; // 1 minute
      
      // Act
      cacheService.set('testKey', { data: 'testValue' }, customTTL);
      
      // Assert
      const cachedItem = cacheService.cache.get('testKey');
      expect(cachedItem.expiresAt).toBe(mockNow + customTTL);
    });
    
    it('should replace an existing cache entry', () => {
      // Arrange
      cacheService.set('testKey', { data: 'originalValue' });
      
      // Act
      cacheService.set('testKey', { data: 'updatedValue' });
      
      // Assert
      const cachedItem = cacheService.cache.get('testKey');
      expect(cachedItem.value).toEqual({ data: 'updatedValue' });
    });
  });
  
  describe('get', () => {
    it('should retrieve a value from the cache', () => {
      // Arrange
      cacheService.set('testKey', { data: 'testValue' });
      
      // Act
      const result = cacheService.get('testKey');
      
      // Assert
      expect(result).toEqual({ data: 'testValue' });
    });
    
    it('should return null for a non-existent key', () => {
      // Act
      const result = cacheService.get('nonExistentKey');
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should return null for an expired cache entry', () => {
      // Arrange - set with a negative TTL to make it immediately expired
      cacheService.set('expiredKey', { data: 'expiredValue' }, -1000);
      
      // Act
      const result = cacheService.get('expiredKey');
      
      // Assert
      expect(result).toBeNull();
      // The expired entry should be removed
      expect(cacheService.cache.has('expiredKey')).toBe(false);
    });
  });
  
  describe('remove', () => {
    it('should remove a specific key from the cache', () => {
      // Arrange
      cacheService.set('testKey', { data: 'testValue' });
      
      // Act
      cacheService.remove('testKey');
      
      // Assert
      expect(cacheService.cache.has('testKey')).toBe(false);
    });
    
    it('should not throw an error when removing a non-existent key', () => {
      // Act & Assert
      expect(() => cacheService.remove('nonExistentKey')).not.toThrow();
    });
  });
  
  describe('clear', () => {
    it('should clear all entries from the cache', () => {
      // Arrange
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      
      // Act
      cacheService.clear();
      
      // Assert
      expect(cacheService.cache.size).toBe(0);
    });
  });
  
  describe('getKeys', () => {
    it('should return all cache keys', () => {
      // Arrange
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      
      // Act
      const keys = cacheService.getKeys();
      
      // Assert
      expect(keys).toEqual(['key1', 'key2']);
    });
    
    it('should return an empty array for an empty cache', () => {
      // Act
      const keys = cacheService.getKeys();
      
      // Assert
      expect(keys).toEqual([]);
    });
  });
  
  describe('cleanup', () => {
    it('should remove expired entries from the cache', () => {
      // Arrange
      cacheService.set('validKey', 'validValue', 3600000); // 1 hour
      cacheService.set('expiredKey', 'expiredValue', -1000); // Expired
      
      // Act
      cacheService.cleanup();
      
      // Assert
      expect(cacheService.cache.has('validKey')).toBe(true);
      expect(cacheService.cache.has('expiredKey')).toBe(false);
    });
  });
  
  describe('has', () => {
    it('should return true for a valid cache entry', () => {
      // Arrange
      cacheService.set('testKey', 'testValue');
      
      // Act
      const result = cacheService.has('testKey');
      
      // Assert
      expect(result).toBe(true);
    });
    
    it('should return false for a non-existent key', () => {
      // Act
      const result = cacheService.has('nonExistentKey');
      
      // Assert
      expect(result).toBe(false);
    });
    
    it('should return false for an expired cache entry', () => {
      // Arrange
      cacheService.set('expiredKey', 'expiredValue', -1000);
      
      // Act
      const result = cacheService.has('expiredKey');
      
      // Assert
      expect(result).toBe(false);
    });
  });
  
  describe('getWithTimestamp', () => {
    it('should return value with creation timestamp', () => {
      // Arrange
      cacheService.set('testKey', { data: 'testValue' });
      
      // Act
      const result = cacheService.getWithTimestamp('testKey');
      
      // Assert
      expect(result.value).toEqual({ data: 'testValue' });
      expect(result.timestamp).toBe(mockNow);
    });
    
    it('should return null for a non-existent key', () => {
      // Act
      const result = cacheService.getWithTimestamp('nonExistentKey');
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('getSize', () => {
    it('should return the number of items in the cache', () => {
      // Arrange
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      
      // Act
      const size = cacheService.getSize();
      
      // Assert
      expect(size).toBe(2);
    });
  });
});