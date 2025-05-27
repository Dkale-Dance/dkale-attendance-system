import HolidayService from './HolidayService';

describe('HolidayService', () => {
  let holidayService;

  beforeEach(() => {
    holidayService = new HolidayService();
  });

  describe('isHoliday', () => {
    test('should identify major US federal holidays', () => {
      // New Year's Day 2024
      expect(holidayService.isHoliday(new Date(2024, 0, 1))).toBe(true);
      
      // Independence Day 2024
      expect(holidayService.isHoliday(new Date(2024, 6, 4))).toBe(true);
      
      // Christmas Day 2024
      expect(holidayService.isHoliday(new Date(2024, 11, 25))).toBe(true);
      
      // Regular weekday
      expect(holidayService.isHoliday(new Date(2024, 0, 2))).toBe(false);
    });

    test('should handle string dates', () => {
      expect(holidayService.isHoliday('2024-01-01')).toBe(true);
      expect(holidayService.isHoliday('2024-07-04')).toBe(true);
      expect(holidayService.isHoliday('2024-01-02')).toBe(false);
    });

    test('should handle invalid dates', () => {
      expect(holidayService.isHoliday(null)).toBe(false);
      expect(holidayService.isHoliday(undefined)).toBe(false);
      expect(holidayService.isHoliday('invalid-date')).toBe(false);
    });

    test('should identify Martin Luther King Jr. Day (third Monday in January)', () => {
      // 2024: January 15th is MLK Day
      expect(holidayService.isHoliday(new Date(2024, 0, 15))).toBe(true);
      
      // 2025: January 20th is MLK Day
      expect(holidayService.isHoliday(new Date(2025, 0, 20))).toBe(true);
    });

    test('should identify Presidents Day (third Monday in February)', () => {
      // 2024: February 19th is Presidents Day
      expect(holidayService.isHoliday(new Date(2024, 1, 19))).toBe(true);
      
      // 2025: February 17th is Presidents Day
      expect(holidayService.isHoliday(new Date(2025, 1, 17))).toBe(true);
    });

    test('should identify Memorial Day (last Monday in May)', () => {
      // 2024: May 27th is Memorial Day
      expect(holidayService.isHoliday(new Date(2024, 4, 27))).toBe(true);
      
      // 2025: May 26th is Memorial Day
      expect(holidayService.isHoliday(new Date(2025, 4, 26))).toBe(true);
    });

    test('should identify Labor Day (first Monday in September)', () => {
      // 2024: September 2nd is Labor Day
      expect(holidayService.isHoliday(new Date(2024, 8, 2))).toBe(true);
      
      // 2025: September 1st is Labor Day
      expect(holidayService.isHoliday(new Date(2025, 8, 1))).toBe(true);
    });

    test('should identify Columbus Day (second Monday in October)', () => {
      // 2024: October 14th is Columbus Day
      expect(holidayService.isHoliday(new Date(2024, 9, 14))).toBe(true);
      
      // 2025: October 13th is Columbus Day
      expect(holidayService.isHoliday(new Date(2025, 9, 13))).toBe(true);
    });

    test('should identify Thanksgiving (fourth Thursday in November)', () => {
      // 2024: November 28th is Thanksgiving
      expect(holidayService.isHoliday(new Date(2024, 10, 28))).toBe(true);
      
      // 2025: November 27th is Thanksgiving
      expect(holidayService.isHoliday(new Date(2025, 10, 27))).toBe(true);
    });

    test('should support manually added specific year holidays', () => {
      // Initially, May 2nd, 2025 should NOT be a holiday
      expect(holidayService.isHoliday(new Date(2025, 4, 2))).toBe(false);
      
      // Add May 2nd, 2025 as a holiday manually
      holidayService.addSpecificHoliday(2025, 4, 2, 'Local Holiday');
      
      // Now it should be a holiday
      expect(holidayService.isHoliday(new Date(2025, 4, 2))).toBe(true);
      expect(holidayService.getHolidayName(new Date(2025, 4, 2))).toBe('Local Holiday');
      
      // May 2nd, 2024 should still NOT be a holiday
      expect(holidayService.isHoliday(new Date(2024, 4, 2))).toBe(false);
      
      // Remove the holiday
      holidayService.removeSpecificHoliday(2025, 4, 2);
      expect(holidayService.isHoliday(new Date(2025, 4, 2))).toBe(false);
    });
  });

  describe('getHolidayName', () => {
    test('should return correct holiday names', () => {
      expect(holidayService.getHolidayName(new Date(2024, 0, 1))).toBe("New Year's Day");
      expect(holidayService.getHolidayName(new Date(2024, 6, 4))).toBe('Independence Day');
      expect(holidayService.getHolidayName(new Date(2024, 11, 25))).toBe('Christmas Day');
      expect(holidayService.getHolidayName(new Date(2024, 0, 15))).toBe('Martin Luther King Jr. Day');
    });

    test('should return null for non-holidays', () => {
      expect(holidayService.getHolidayName(new Date(2024, 0, 2))).toBeNull();
    });
  });

  describe('shouldChargeFees', () => {
    test('should return false for holidays', () => {
      expect(holidayService.shouldChargeFees(new Date(2024, 0, 1))).toBe(false);
      expect(holidayService.shouldChargeFees(new Date(2024, 6, 4))).toBe(false);
    });

    test('should return true for non-holidays', () => {
      expect(holidayService.shouldChargeFees(new Date(2024, 0, 2))).toBe(true);
      expect(holidayService.shouldChargeFees(new Date(2024, 1, 14))).toBe(true);
    });
  });
});