import { 
  formatDateForDocId, 
  formatDateForInput, 
  formatDateForDisplay,
  timestampToDate,
  createDateFromComponents,
  parseDateString,
  areDatesEqual,
  getTodayDate
} from './DateUtils';

// Mock Firestore Timestamp object
const mockFirestoreTimestamp = {
  toDate: jest.fn(() => new Date('2025-05-16T12:00:00Z'))
};

describe('DateUtils', () => {
  
  describe('formatDateForDocId', () => {
    it('formats a date object as YYYY-MM-DD', () => {
      const date = new Date('2025-05-16T12:00:00Z');
      expect(formatDateForDocId(date)).toBe('2025-05-16');
    });
    
    it('formats a date string as YYYY-MM-DD', () => {
      expect(formatDateForDocId('2025-05-16T12:00:00Z')).toBe('2025-05-16');
    });
    
    it('handles dates with single-digit month and day', () => {
      const date = new Date('2025-01-05T12:00:00Z');
      expect(formatDateForDocId(date)).toBe('2025-01-05');
    });
    
    it('returns null for null or undefined input', () => {
      expect(formatDateForDocId(null)).toBeNull();
      expect(formatDateForDocId(undefined)).toBeNull();
    });
  });
  
  describe('formatDateForInput', () => {
    it('formats a date for HTML input elements', () => {
      const date = new Date('2025-05-16T12:00:00Z');
      expect(formatDateForInput(date)).toBe('2025-05-16');
    });
    
    it('returns empty string for null or undefined input', () => {
      expect(formatDateForInput(null)).toBe('');
      expect(formatDateForInput(undefined)).toBe('');
    });
  });
  
  describe('formatDateForDisplay', () => {
    it('formats a date for display using locale-specific formatting', () => {
      // Since toLocaleDateString output varies by locale, we'll just check for non-emptiness
      const date = new Date('2025-05-16T12:00:00Z');
      const result = formatDateForDisplay(date);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
    
    it('handles date strings', () => {
      const result = formatDateForDisplay('2025-05-16T12:00:00Z');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
    
    it('returns N/A for null or undefined input', () => {
      expect(formatDateForDisplay(null)).toBe('N/A');
      expect(formatDateForDisplay(undefined)).toBe('N/A');
    });
  });
  
  describe('timestampToDate', () => {
    it('converts a Firestore Timestamp to a Date object', () => {
      // Create a proper mock that actually returns a Date
      const actualDate = new Date('2025-05-16T12:00:00Z');
      const properMockTimestamp = {
        toDate: () => actualDate
      };
      
      const result = timestampToDate(properMockTimestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toContain('2025-05-16');
    });
    
    it('returns null for invalid inputs', () => {
      expect(timestampToDate(null)).toBeNull();
      expect(timestampToDate(undefined)).toBeNull();
      expect(timestampToDate({})).toBeNull();
    });
  });
  
  describe('createDateFromComponents', () => {
    it('creates a Date from year, month, and day components', () => {
      const result = createDateFromComponents(2025, 5, 16);
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(4); // Month is 0-indexed in JS Date
      expect(result.getDate()).toBe(16);
    });
  });
  
  describe('parseDateString', () => {
    it('parses a YYYY-MM-DD string into a Date object', () => {
      const result = parseDateString('2025-05-16');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(4); // Month is 0-indexed in JS Date
      expect(result.getDate()).toBe(16);
    });
    
    it('returns null for invalid inputs', () => {
      expect(parseDateString(null)).toBeNull();
      expect(parseDateString(undefined)).toBeNull();
      expect(parseDateString('')).toBeNull();
    });
  });
  
  describe('areDatesEqual', () => {
    it('returns true for dates representing the same day', () => {
      const date1 = new Date('2025-05-16T12:00:00Z');
      const date2 = new Date('2025-05-16T18:30:00Z');
      expect(areDatesEqual(date1, date2)).toBe(true);
    });
    
    it('returns false for dates representing different days', () => {
      const date1 = new Date('2025-05-16T12:00:00Z');
      const date2 = new Date('2025-05-17T12:00:00Z');
      expect(areDatesEqual(date1, date2)).toBe(false);
    });
    
    it('works with different date formats', () => {
      // Need to ensure we create the same date regardless of local timezone
      // by parsing the date components directly
      const dateStr = '2025-05-16';
      const dateObj = new Date(2025, 4, 16); // May is 4 (zero-indexed)
      
      expect(areDatesEqual(dateStr, dateObj)).toBe(true);
      expect(areDatesEqual(new Date(2025, 4, 16), dateStr)).toBe(true);
    });
    
    it('returns false for invalid inputs', () => {
      expect(areDatesEqual(null, new Date())).toBe(false);
      expect(areDatesEqual(new Date(), undefined)).toBe(false);
      expect(areDatesEqual(null, null)).toBe(false);
    });
  });
  
  describe('getTodayDate', () => {
    it('returns today\'s date with time set to midnight', () => {
      // Mock Date.now to ensure consistent results
      const originalNow = Date.now;
      const mockDate = new Date('2025-05-16T12:34:56Z');
      Date.now = jest.fn(() => mockDate.getTime());
      
      const result = getTodayDate();
      expect(result).toBeInstanceOf(Date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
      
      // Restore original Date.now
      Date.now = originalNow;
    });
  });
});