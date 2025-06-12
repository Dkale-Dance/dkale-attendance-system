import { DateConverterUtils } from '../utils/DateConverterUtils';
import { Timestamp } from 'firebase/firestore';

// Mock firebase/firestore
jest.mock('firebase/firestore', () => ({
  Timestamp: {
    fromDate: jest.fn((date) => ({ toDate: () => date })),
  },
}));

describe('DateConverterUtils', () => {
  describe('convertToDate', () => {
    test('should return null for null/undefined input', () => {
      expect(DateConverterUtils.convertToDate(null)).toBeNull();
      expect(DateConverterUtils.convertToDate(undefined)).toBeNull();
    });

    test('should convert Firestore Timestamp to Date', () => {
      const testDate = new Date('2024-01-15');
      const mockTimestamp = {
        toDate: jest.fn(() => testDate)
      };

      const result = DateConverterUtils.convertToDate(mockTimestamp);

      expect(mockTimestamp.toDate).toHaveBeenCalled();
      expect(result).toBe(testDate);
    });

    test('should return Date object as-is', () => {
      const testDate = new Date('2024-01-15');
      const result = DateConverterUtils.convertToDate(testDate);
      expect(result).toBe(testDate);
    });

    test('should convert string to Date', () => {
      const dateString = '2024-01-15';
      const result = DateConverterUtils.convertToDate(dateString);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(new Date(dateString).getTime());
    });

    test('should convert number to Date', () => {
      const timestamp = Date.now();
      const result = DateConverterUtils.convertToDate(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(timestamp);
    });
  });

  describe('convertToTimestamp', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should return null for null/undefined input', () => {
      expect(DateConverterUtils.convertToTimestamp(null)).toBeNull();
      expect(DateConverterUtils.convertToTimestamp(undefined)).toBeNull();
    });

    test('should return Timestamp object as-is', () => {
      const mockTimestamp = { toDate: () => new Date() };
      const result = DateConverterUtils.convertToTimestamp(mockTimestamp);
      expect(result).toBe(mockTimestamp);
    });

    test('should convert Date to Timestamp', () => {
      const testDate = new Date('2024-01-15');
      const mockTimestamp = { toDate: () => testDate };
      
      Timestamp.fromDate.mockReturnValue(mockTimestamp);

      const result = DateConverterUtils.convertToTimestamp(testDate);

      expect(Timestamp.fromDate).toHaveBeenCalledWith(testDate);
      expect(result).toBe(mockTimestamp);
    });

    test('should convert string to Timestamp', () => {
      const dateString = '2024-01-15';
      const expectedDate = new Date(dateString);
      const mockTimestamp = { toDate: () => expectedDate };
      
      Timestamp.fromDate.mockReturnValue(mockTimestamp);

      const result = DateConverterUtils.convertToTimestamp(dateString);

      expect(Timestamp.fromDate).toHaveBeenCalledWith(expectedDate);
      expect(result).toBe(mockTimestamp);
    });
  });
});