import HolidayFeeAdjustmentService from './HolidayFeeAdjustmentService';

// Mock Firebase dependencies
jest.mock('../lib/firebase/config/config', () => ({}));
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
  Timestamp: {
    fromDate: jest.fn(date => ({ toDate: () => date }))
  }
}));

// Mock the services
const mockHolidayService = {
  isHoliday: jest.fn(),
  getHolidayName: jest.fn(),
  shouldChargeFees: jest.fn()
};

const mockAttendanceService = {
  calculateAttendanceFee: jest.fn()
};

const mockStudentService = {
  getStudentById: jest.fn(),
  addHolidayCredit: jest.fn(),
  reduceBalance: jest.fn(),
  getHolidayCredits: jest.fn(),
  getAllHolidayCredits: jest.fn(),
  markHolidayCreditsAsUsed: jest.fn()
};

describe('HolidayFeeAdjustmentService', () => {
  let holidayFeeAdjustmentService;

  beforeEach(() => {
    holidayFeeAdjustmentService = new HolidayFeeAdjustmentService(
      mockHolidayService,
      mockAttendanceService,
      mockStudentService
    );

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('calculateHolidayFeeAdjustment', () => {
    test('should calculate fee adjustment for attendance record on holiday', () => {
      // Mock holiday service
      mockHolidayService.isHoliday.mockReturnValue(true);
      mockHolidayService.getHolidayName.mockReturnValue("New Year's Day");
      
      // Mock attendance fee calculation
      mockAttendanceService.calculateAttendanceFee.mockReturnValue(5);

      const result = holidayFeeAdjustmentService.calculateHolidayFeeAdjustment(
        'absent',
        {},
        new Date(2024, 0, 1) // New Year's Day
      );

      expect(result).toEqual({
        isHoliday: true,
        originalFee: 5,
        adjustedFee: 0,
        adjustment: -5,
        holidayName: "New Year's Day"
      });

      expect(mockHolidayService.isHoliday).toHaveBeenCalledWith(new Date(2024, 0, 1));
      expect(mockAttendanceService.calculateAttendanceFee).toHaveBeenCalledWith('absent', {});
    });

    test('should return zero adjustment for non-holiday', () => {
      mockHolidayService.isHoliday.mockReturnValue(false);
      mockAttendanceService.calculateAttendanceFee.mockReturnValue(5);

      const result = holidayFeeAdjustmentService.calculateHolidayFeeAdjustment(
        'absent',
        {},
        new Date(2024, 0, 2) // Regular day
      );

      expect(result).toEqual({
        isHoliday: false,
        originalFee: 5,
        adjustedFee: 5,
        adjustment: 0
      });
    });

    test('should handle attendance with attributes on holiday', () => {
      mockHolidayService.isHoliday.mockReturnValue(true);
      mockHolidayService.getHolidayName.mockReturnValue('Independence Day');
      mockAttendanceService.calculateAttendanceFee.mockReturnValue(3); // late + noShoes + notInUniform

      const attributes = { late: true, noShoes: true, notInUniform: true };
      const result = holidayFeeAdjustmentService.calculateHolidayFeeAdjustment(
        'present',
        attributes,
        new Date(2024, 6, 4) // July 4th
      );

      expect(result).toEqual({
        isHoliday: true,
        originalFee: 3,
        adjustedFee: 0,
        adjustment: -3,
        holidayName: 'Independence Day'
      });
    });

    test('should handle zero fee attendance on holiday', () => {
      mockHolidayService.isHoliday.mockReturnValue(true);
      mockHolidayService.getHolidayName.mockReturnValue("New Year's Day");
      mockAttendanceService.calculateAttendanceFee.mockReturnValue(0);

      const result = holidayFeeAdjustmentService.calculateHolidayFeeAdjustment(
        'present',
        {},
        new Date(2024, 0, 1)
      );

      expect(result).toEqual({
        isHoliday: true,
        originalFee: 0,
        adjustedFee: 0,
        adjustment: -0,
        holidayName: "New Year's Day"
      });
    });
  });

  describe('processHolidayAdjustment', () => {
    test('should adjust student balance for holiday fee', async () => {
      const studentId = 'student-123';
      const date = new Date(2024, 0, 1);
      const status = 'absent';
      const attributes = {};

      mockHolidayService.isHoliday.mockReturnValue(true);
      mockHolidayService.getHolidayName.mockReturnValue("New Year's Day");
      mockAttendanceService.calculateAttendanceFee.mockReturnValue(5);
      mockStudentService.addHolidayCredit.mockResolvedValue({});
      mockStudentService.reduceBalance.mockResolvedValue({ balance: 15 });

      const result = await holidayFeeAdjustmentService.processHolidayAdjustment(
        studentId,
        date,
        status,
        attributes
      );

      expect(result).toEqual({
        studentId,
        date,
        adjustmentCalculation: {
          isHoliday: true,
          originalFee: 5,
          adjustedFee: 0,
          adjustment: -5,
          holidayName: "New Year's Day"
        },
        balanceAdjusted: true,
        updatedStudent: { balance: 15 }
      });

      expect(mockStudentService.addHolidayCredit).toHaveBeenCalledWith(studentId, {
        amount: 5,
        date: date,
        holidayName: "New Year's Day",
        originalStatus: status,
        originalAttributes: attributes,
        reason: "Holiday fee adjustment for New Year's Day"
      });
      expect(mockStudentService.reduceBalance).toHaveBeenCalledWith(studentId, 5);
    });

    test('should not adjust balance for non-holiday', async () => {
      const studentId = 'student-123';
      const date = new Date(2024, 0, 2);
      const status = 'absent';
      const attributes = {};

      mockHolidayService.isHoliday.mockReturnValue(false);
      mockAttendanceService.calculateAttendanceFee.mockReturnValue(5);

      const result = await holidayFeeAdjustmentService.processHolidayAdjustment(
        studentId,
        date,
        status,
        attributes
      );

      expect(result).toEqual({
        studentId,
        date,
        adjustmentCalculation: {
          isHoliday: false,
          originalFee: 5,
          adjustedFee: 5,
          adjustment: 0
        },
        balanceAdjusted: false,
        updatedStudent: null
      });

      expect(mockStudentService.reduceBalance).not.toHaveBeenCalled();
    });

    test('should not adjust balance when adjustment is zero', async () => {
      const studentId = 'student-123';
      const date = new Date(2024, 0, 1);
      const status = 'present';
      const attributes = {};

      mockHolidayService.isHoliday.mockReturnValue(true);
      mockHolidayService.getHolidayName.mockReturnValue("New Year's Day");
      mockAttendanceService.calculateAttendanceFee.mockReturnValue(0);

      const result = await holidayFeeAdjustmentService.processHolidayAdjustment(
        studentId,
        date,
        status,
        attributes
      );

      expect(result).toEqual({
        studentId,
        date,
        adjustmentCalculation: {
          isHoliday: true,
          originalFee: 0,
          adjustedFee: 0,
          adjustment: -0,
          holidayName: "New Year's Day"
        },
        balanceAdjusted: false,
        updatedStudent: null
      });

      expect(mockStudentService.reduceBalance).not.toHaveBeenCalled();
    });

    test('should handle errors during balance adjustment', async () => {
      const studentId = 'student-123';
      const date = new Date(2024, 0, 1);
      const status = 'absent';
      const attributes = {};

      mockHolidayService.isHoliday.mockReturnValue(true);
      mockAttendanceService.calculateAttendanceFee.mockReturnValue(5);
      mockStudentService.reduceBalance.mockRejectedValue(new Error('Balance update failed'));

      await expect(
        holidayFeeAdjustmentService.processHolidayAdjustment(studentId, date, status, attributes)
      ).rejects.toThrow('Failed to process holiday adjustment: Balance update failed');
    });
  });

  describe('scanAndAdjustHolidayFees', () => {
    test('should scan attendance records and adjust fees for holidays', async () => {
      const attendanceRecords = [
        {
          studentId: 'student-1',
          date: new Date(2024, 0, 1), // Holiday
          status: 'absent',
          attributes: {}
        },
        {
          studentId: 'student-2',
          date: new Date(2024, 0, 2), // Not holiday
          status: 'absent',
          attributes: {}
        },
        {
          studentId: 'student-3',
          date: new Date(2024, 6, 4), // Holiday
          status: 'present',
          attributes: { late: true }
        }
      ];

      // Mock holiday service responses
      mockHolidayService.isHoliday
        .mockReturnValueOnce(true)  // First call for 2024-01-01
        .mockReturnValueOnce(false) // Second call for 2024-01-02
        .mockReturnValueOnce(true); // Third call for 2024-07-04

      // Mock fee calculations
      mockAttendanceService.calculateAttendanceFee
        .mockReturnValueOnce(5)  // absent fee
        .mockReturnValueOnce(5)  // absent fee (non-holiday)
        .mockReturnValueOnce(1); // late fee

      // Mock balance adjustments
      mockStudentService.reduceBalance
        .mockResolvedValueOnce({ balance: 15 }) // student-1
        .mockResolvedValueOnce({ balance: 19 }); // student-3

      const results = await holidayFeeAdjustmentService.scanAndAdjustHolidayFees(attendanceRecords);

      expect(results).toHaveLength(3);
      
      // Check first result (holiday adjustment)
      expect(results[0]).toEqual({
        studentId: 'student-1',
        date: new Date(2024, 0, 1),
        adjustmentCalculation: {
          isHoliday: true,
          originalFee: 5,
          adjustedFee: 0,
          adjustment: -5
        },
        balanceAdjusted: true,
        updatedStudent: { balance: 15 }
      });

      // Check second result (no adjustment)
      expect(results[1]).toEqual({
        studentId: 'student-2',
        date: new Date(2024, 0, 2),
        adjustmentCalculation: {
          isHoliday: false,
          originalFee: 5,
          adjustedFee: 5,
          adjustment: 0
        },
        balanceAdjusted: false,
        updatedStudent: null
      });

      // Check third result (holiday adjustment)
      expect(results[2]).toEqual({
        studentId: 'student-3',
        date: new Date(2024, 6, 4),
        adjustmentCalculation: {
          isHoliday: true,
          originalFee: 1,
          adjustedFee: 0,
          adjustment: -1
        },
        balanceAdjusted: true,
        updatedStudent: { balance: 19 }
      });

      expect(mockStudentService.reduceBalance).toHaveBeenCalledTimes(2);
      expect(mockStudentService.reduceBalance).toHaveBeenNthCalledWith(1, 'student-1', 5);
      expect(mockStudentService.reduceBalance).toHaveBeenNthCalledWith(2, 'student-3', 1);
    });

    test('should handle empty attendance records', async () => {
      const results = await holidayFeeAdjustmentService.scanAndAdjustHolidayFees([]);
      expect(results).toEqual([]);
    });
  });
});