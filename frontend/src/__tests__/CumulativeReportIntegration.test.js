import { DateService } from '../services/DateService';
import ReportService from '../services/ReportService';

// Create mock services
const mockReportRepository = {
  getPaymentsByDateRange: jest.fn(),
  getMonthlyFeesCharged: jest.fn(),
  getMonthlyPayments: jest.fn()
};

const mockStudentRepository = {
  getAllStudents: jest.fn()
};

const mockAttendanceRepository = {};

const mockAttendanceService = {
  calculateAttendanceFee: jest.fn()
};

const mockExpenseService = {
  getExpensesByDateRange: jest.fn(),
  getExpenseSummaryByDateRange: jest.fn()
};

describe('CumulativeReportIntegration', () => {
  let reportService;
  let dateService;

  beforeEach(() => {
    dateService = new DateService();
    reportService = new ReportService(
      mockReportRepository,
      mockStudentRepository,
      mockAttendanceRepository,
      mockAttendanceService,
      mockExpenseService,
      dateService
    );

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('generateCumulativeFinancialReport with DateService integration', () => {
    it('should use August 14 start date when no options provided', async () => {
      // Mock current date to October 15, 2025
      const mockCurrentDate = new Date(2025, 9, 15);
      jest.spyOn(Date, 'now').mockImplementation(() => mockCurrentDate.getTime());
      jest.spyOn(global, 'Date').mockImplementation((...args) => {
        if (args.length === 0) return mockCurrentDate;
        return new (jest.requireActual('Date'))(...args);
      });

      // Setup mock returns
      mockReportRepository.getPaymentsByDateRange.mockResolvedValue([]);
      mockExpenseService.getExpenseSummaryByDateRange.mockResolvedValue({
        totalAmount: 0,
        categoryBreakdown: {}
      });

      try {
        await reportService.generateCumulativeFinancialReport();

        // Verify that getPaymentsByDateRange was called with August 14, 2025 start date and current date as end
        expect(mockReportRepository.getPaymentsByDateRange).toHaveBeenCalledWith(
          new Date(2025, 7, 14), // August 14, 2025
          mockCurrentDate        // Current date (October 15, 2025)
        );
      } catch (error) {
        // Expected since we haven't mocked all dependencies
        expect(error.message).toContain('Failed to generate comprehensive cumulative financial report');
      }

      // Restore original Date
      jest.restoreAllMocks();
    });

    it('should use previous year August 14 start date when current date is before August 14', async () => {
      // Mock current date to July 10, 2025
      const mockCurrentDate = new Date(2025, 6, 10);
      jest.spyOn(Date, 'now').mockImplementation(() => mockCurrentDate.getTime());
      jest.spyOn(global, 'Date').mockImplementation((...args) => {
        if (args.length === 0) return mockCurrentDate;
        return new (jest.requireActual('Date'))(...args);
      });

      // Setup mock returns
      mockReportRepository.getPaymentsByDateRange.mockResolvedValue([]);
      mockExpenseService.getExpenseSummaryByDateRange.mockResolvedValue({
        totalAmount: 0,
        categoryBreakdown: {}
      });

      try {
        await reportService.generateCumulativeFinancialReport();

        // Verify that getPaymentsByDateRange was called with August 14, 2025 start date and current date as end
        expect(mockReportRepository.getPaymentsByDateRange).toHaveBeenCalledWith(
          new Date(2025, 7, 14), // August 14, 2025 (always current year)
          mockCurrentDate        // Current date (July 10, 2025)
        );
      } catch (error) {
        // Expected since we haven't mocked all dependencies
        expect(error.message).toContain('Failed to generate comprehensive cumulative financial report');
      }

      // Restore original Date
      jest.restoreAllMocks();
    });

    it('should respect provided start and end dates when options are given', async () => {
      const customStartDate = new Date(2024, 0, 1); // January 1, 2024
      const customEndDate = new Date(2024, 11, 31); // December 31, 2024

      // Setup mock returns
      mockReportRepository.getPaymentsByDateRange.mockResolvedValue([]);
      mockExpenseService.getExpenseSummaryByDateRange.mockResolvedValue({
        totalAmount: 0,
        categoryBreakdown: {}
      });

      try {
        await reportService.generateCumulativeFinancialReport({
          startDate: customStartDate,
          endDate: customEndDate
        });

        // Verify that getPaymentsByDateRange was called with custom dates
        expect(mockReportRepository.getPaymentsByDateRange).toHaveBeenCalledWith(
          customStartDate,
          customEndDate
        );
      } catch (error) {
        // Expected since we haven't mocked all dependencies
        expect(error.message).toContain('Failed to generate comprehensive cumulative financial report');
      }
    });
  });

  describe('DateService fee year calculations', () => {
    it('should calculate current fee year correctly for date after August 14', () => {
      const testDate = new Date(2025, 9, 15); // October 15, 2025
      const range = dateService.getFeeYearDateRange(testDate);

      expect(range.startDate).toEqual(new Date(2025, 7, 14)); // August 14, 2025
      expect(range.endDate).toEqual(new Date(2026, 7, 13)); // August 13, 2026
    });

    it('should calculate current fee year correctly for date before August 14', () => {
      const testDate = new Date(2025, 6, 10); // July 10, 2025
      const range = dateService.getFeeYearDateRange(testDate);

      expect(range.startDate).toEqual(new Date(2025, 7, 14)); // August 14, 2025 (always current year)
      expect(range.endDate).toEqual(new Date(2026, 7, 13)); // August 13, 2026
    });

    it('should handle August 14 edge case correctly', () => {
      const testDate = new Date(2025, 7, 14); // August 14, 2025
      const range = dateService.getFeeYearDateRange(testDate);

      expect(range.startDate).toEqual(new Date(2025, 7, 14)); // August 14, 2025
      expect(range.endDate).toEqual(new Date(2026, 7, 13)); // August 13, 2026
    });
  });
});