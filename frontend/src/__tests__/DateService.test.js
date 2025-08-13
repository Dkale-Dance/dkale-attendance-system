import { DateService } from '../services/DateService';

describe('DateService', () => {
  let dateService;

  beforeEach(() => {
    dateService = new DateService();
  });

  describe('calculateFeeYearStartDate', () => {
    it('should return August 13 of current year when current date is after August 13', () => {
      const mockCurrentDate = new Date(2025, 9, 15); // October 15, 2025
      const result = dateService.calculateFeeYearStartDate(mockCurrentDate);
      
      expect(result).toEqual(new Date(2025, 7, 13)); // August 13, 2025
    });

    it('should return August 13 of previous year when current date is before August 13', () => {
      const mockCurrentDate = new Date(2025, 6, 10); // July 10, 2025
      const result = dateService.calculateFeeYearStartDate(mockCurrentDate);
      
      expect(result).toEqual(new Date(2024, 7, 13)); // August 13, 2024
    });

    it('should return August 13 of current year when current date is exactly August 13', () => {
      const mockCurrentDate = new Date(2025, 7, 13); // August 13, 2025
      const result = dateService.calculateFeeYearStartDate(mockCurrentDate);
      
      expect(result).toEqual(new Date(2025, 7, 13)); // August 13, 2025
    });

    it('should handle year transitions correctly', () => {
      const mockCurrentDate = new Date(2024, 0, 15); // January 15, 2024
      const result = dateService.calculateFeeYearStartDate(mockCurrentDate);
      
      expect(result).toEqual(new Date(2023, 7, 13)); // August 13, 2023 (previous year since before Aug 13)
    });

    it('should handle leap years correctly', () => {
      const mockCurrentDate = new Date(2024, 8, 1); // September 1, 2024 (leap year)
      const result = dateService.calculateFeeYearStartDate(mockCurrentDate);
      
      expect(result).toEqual(new Date(2024, 7, 13)); // August 13, 2024
    });
  });

  describe('getFeeYearEndDate', () => {
    it('should return August 12 of next year when current date is after August 13', () => {
      const mockCurrentDate = new Date(2025, 9, 15); // October 15, 2025
      const result = dateService.getFeeYearEndDate(mockCurrentDate);
      
      expect(result).toEqual(new Date(2026, 7, 12)); // August 12, 2026
    });

    it('should return August 12 of current year when current date is before August 13', () => {
      const mockCurrentDate = new Date(2025, 6, 10); // July 10, 2025
      const result = dateService.getFeeYearEndDate(mockCurrentDate);
      
      expect(result).toEqual(new Date(2025, 7, 12)); // August 12, 2025
    });

    it('should return August 12 of next year when current date is exactly August 13', () => {
      const mockCurrentDate = new Date(2025, 7, 13); // August 13, 2025
      const result = dateService.getFeeYearEndDate(mockCurrentDate);
      
      expect(result).toEqual(new Date(2026, 7, 12)); // August 12, 2026
    });
  });

  describe('getFeeYearDateRange', () => {
    it('should return correct date range for current fee year', () => {
      const mockCurrentDate = new Date(2025, 9, 15); // October 15, 2025
      const result = dateService.getFeeYearDateRange(mockCurrentDate);
      
      expect(result.startDate).toEqual(new Date(2025, 7, 13)); // August 13, 2025
      expect(result.endDate).toEqual(new Date(2026, 7, 12)); // August 12, 2026
    });

    it('should return correct date range when before fee year start', () => {
      const mockCurrentDate = new Date(2025, 6, 10); // July 10, 2025
      const result = dateService.getFeeYearDateRange(mockCurrentDate);
      
      expect(result.startDate).toEqual(new Date(2024, 7, 13)); // August 13, 2024
      expect(result.endDate).toEqual(new Date(2025, 7, 12)); // August 12, 2025
    });
  });

  describe('isWithinCurrentFeeYear', () => {
    it('should return true for date within current fee year', () => {
      const mockCurrentDate = new Date(2025, 9, 15); // October 15, 2025
      const testDate = new Date(2025, 8, 1); // September 1, 2025
      const result = dateService.isWithinCurrentFeeYear(testDate, mockCurrentDate);
      
      expect(result).toBe(true);
    });

    it('should return false for date outside current fee year', () => {
      const mockCurrentDate = new Date(2025, 9, 15); // October 15, 2025
      const testDate = new Date(2024, 6, 1); // July 1, 2024
      const result = dateService.isWithinCurrentFeeYear(testDate, mockCurrentDate);
      
      expect(result).toBe(false);
    });

    it('should return true for fee year start date', () => {
      const mockCurrentDate = new Date(2025, 9, 15); // October 15, 2025
      const testDate = new Date(2025, 7, 14); // August 14, 2025
      const result = dateService.isWithinCurrentFeeYear(testDate, mockCurrentDate);
      
      expect(result).toBe(true);
    });

    it('should return true for fee year end date', () => {
      const mockCurrentDate = new Date(2025, 9, 15); // October 15, 2025
      const testDate = new Date(2026, 7, 12); // August 12, 2026
      const result = dateService.isWithinCurrentFeeYear(testDate, mockCurrentDate);
      
      expect(result).toBe(true);
    });
  });

  describe('getFeeYearPeriodString', () => {
    it('should return correct period string for current fee year', () => {
      const mockCurrentDate = new Date(2025, 9, 15); // October 15, 2025
      const result = dateService.getFeeYearPeriodString(mockCurrentDate);
      
      expect(result).toBe('August 2025 - Current');
    });

    it('should return correct period string when before fee year start', () => {
      const mockCurrentDate = new Date(2025, 6, 10); // July 10, 2025
      const result = dateService.getFeeYearPeriodString(mockCurrentDate);
      
      expect(result).toBe('August 2024 - Current');
    });

    it('should return correct period string for August 13 start date', () => {
      const mockCurrentDate = new Date(2025, 7, 13); // August 13, 2025
      const result = dateService.getFeeYearPeriodString(mockCurrentDate);
      
      expect(result).toBe('August 2025 - Current');
    });
  });
});