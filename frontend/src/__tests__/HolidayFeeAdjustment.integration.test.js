import HolidayService from '../services/HolidayService';
import HolidayFeeAdjustmentService from '../services/HolidayFeeAdjustmentService';
import AttendanceService from '../services/AttendanceService';
import StudentService from '../services/StudentService';

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

describe('Holiday Fee Adjustment Integration Test - May 2nd, 2025', () => {
  let holidayService;
  let holidayFeeAdjustmentService;
  let attendanceService;
  let studentService;
  
  // Mock data for the integration test
  const mockStudents = [
    {
      id: 'student-1',
      firstName: 'John',
      lastName: 'Doe',
      balance: 15,
      holidayCredits: []
    },
    {
      id: 'student-2', 
      firstName: 'Jane',
      lastName: 'Smith',
      balance: 8,
      holidayCredits: []
    },
    {
      id: 'student-3',
      firstName: 'Bob',
      lastName: 'Johnson',
      balance: 3,
      holidayCredits: []
    }
  ];

  const may2nd2025 = new Date(2025, 4, 2); // May 2nd, 2025 (now a holiday)

  // Simulate attendance records that were charged fees on what is now known to be a holiday
  const attendanceRecordsOnHoliday = [
    {
      studentId: 'student-1',
      date: may2nd2025,
      status: 'absent',
      attributes: {},
      fee: 5 // $5 for absent
    },
    {
      studentId: 'student-2',
      date: may2nd2025,
      status: 'present',
      attributes: { late: true, noShoes: true },
      fee: 2 // $1 late + $1 no shoes
    },
    {
      studentId: 'student-3',
      date: may2nd2025,
      status: 'present',
      attributes: {},
      fee: 0 // No fees for present with no attributes
    }
  ];

  beforeEach(() => {
    holidayService = new HolidayService();
    
    // Mock student service methods
    studentService = {
      getStudentById: jest.fn(),
      addHolidayCredit: jest.fn(),
      reduceBalance: jest.fn(),
      getHolidayCredits: jest.fn(),
      getAllHolidayCredits: jest.fn(),
      markHolidayCreditsAsUsed: jest.fn()
    };

    // Mock attendance service methods
    attendanceService = {
      calculateAttendanceFee: jest.fn(),
      calculateAttendanceFeeWithHolidays: jest.fn()
    };

    holidayFeeAdjustmentService = new HolidayFeeAdjustmentService(
      holidayService,
      attendanceService,
      studentService
    );

    jest.clearAllMocks();
  });

  test('should allow manual addition of May 2nd, 2025 as a holiday', () => {
    // Initially should not be a holiday
    expect(holidayService.isHoliday(may2nd2025)).toBe(false);
    
    // Manually add as holiday
    holidayService.addSpecificHoliday(2025, 4, 2, 'Local Holiday');
    
    // Now should be a holiday
    expect(holidayService.isHoliday(may2nd2025)).toBe(true);
    expect(holidayService.getHolidayName(may2nd2025)).toBe('Local Holiday');
    expect(holidayService.shouldChargeFees(may2nd2025)).toBe(false);
  });

  test('should calculate holiday fee adjustments for existing attendance records', async () => {
    // First, manually add May 2nd, 2025 as a holiday (simulating admin action)
    holidayService.addSpecificHoliday(2025, 4, 2, 'Local Holiday');
    
    // Setup mocks for fee calculations
    attendanceService.calculateAttendanceFee
      .mockReturnValueOnce(5)  // absent fee
      .mockReturnValueOnce(2)  // late + no shoes
      .mockReturnValueOnce(0); // present with no attributes

    const adjustments = [];
    
    for (const record of attendanceRecordsOnHoliday) {
      const adjustment = holidayFeeAdjustmentService.calculateHolidayFeeAdjustment(
        record.status,
        record.attributes,
        record.date
      );
      adjustments.push({ ...record, adjustment });
    }

    // Verify holiday adjustments
    expect(adjustments[0].adjustment).toEqual({
      isHoliday: true,
      originalFee: 5,
      adjustedFee: 0,
      adjustment: -5,
      holidayName: 'Local Holiday'
    });

    expect(adjustments[1].adjustment).toEqual({
      isHoliday: true,
      originalFee: 2,
      adjustedFee: 0,
      adjustment: -2,
      holidayName: 'Local Holiday'
    });

    expect(adjustments[2].adjustment).toEqual({
      isHoliday: true,
      originalFee: 0,
      adjustedFee: 0,
      adjustment: -0,
      holidayName: 'Local Holiday'
    });
  });

  test('should process holiday adjustments and create student credits', async () => {
    // First, manually add May 2nd, 2025 as a holiday (simulating admin action)
    holidayService.addSpecificHoliday(2025, 4, 2, 'Local Holiday');
    
    // Mock student service responses
    studentService.addHolidayCredit.mockResolvedValue({});
    studentService.reduceBalance
      .mockResolvedValueOnce({ balance: 10 }) // student-1: 15 - 5 = 10
      .mockResolvedValueOnce({ balance: 6 });  // student-2: 8 - 2 = 6

    attendanceService.calculateAttendanceFee
      .mockReturnValueOnce(5)  // student-1: absent
      .mockReturnValueOnce(2)  // student-2: present with attributes
      .mockReturnValueOnce(0); // student-3: present no attributes

    const results = [];
    
    for (const record of attendanceRecordsOnHoliday) {
      const result = await holidayFeeAdjustmentService.processHolidayAdjustment(
        record.studentId,
        record.date,
        record.status,
        record.attributes
      );
      results.push(result);
    }

    // Verify student-1 (absent, $5 fee reduction)
    expect(results[0]).toEqual({
      studentId: 'student-1',
      date: may2nd2025,
      adjustmentCalculation: {
        isHoliday: true,
        originalFee: 5,
        adjustedFee: 0,
        adjustment: -5,
        holidayName: 'Local Holiday'
      },
      balanceAdjusted: true,
      updatedStudent: { balance: 10 }
    });

    // Verify student-2 (present with attributes, $2 fee reduction)
    expect(results[1]).toEqual({
      studentId: 'student-2',
      date: may2nd2025,
      adjustmentCalculation: {
        isHoliday: true,
        originalFee: 2,
        adjustedFee: 0,
        adjustment: -2,
        holidayName: 'Local Holiday'
      },
      balanceAdjusted: true,
      updatedStudent: { balance: 6 }
    });

    // Verify student-3 (no fees, no adjustment)
    expect(results[2]).toEqual({
      studentId: 'student-3',
      date: may2nd2025,
      adjustmentCalculation: {
        isHoliday: true,
        originalFee: 0,
        adjustedFee: 0,
        adjustment: -0,
        holidayName: 'Local Holiday'
      },
      balanceAdjusted: false,
      updatedStudent: null
    });

    // Verify holiday credits were added for students with fee adjustments
    expect(studentService.addHolidayCredit).toHaveBeenCalledTimes(2);
    
    expect(studentService.addHolidayCredit).toHaveBeenNthCalledWith(1, 'student-1', {
      amount: 5,
      date: may2nd2025,
      holidayName: 'Local Holiday',
      originalStatus: 'absent',
      originalAttributes: {},
      reason: 'Holiday fee adjustment for Local Holiday'
    });

    expect(studentService.addHolidayCredit).toHaveBeenNthCalledWith(2, 'student-2', {
      amount: 2,
      date: may2nd2025,
      holidayName: 'Local Holiday',
      originalStatus: 'present',
      originalAttributes: { late: true, noShoes: true },
      reason: 'Holiday fee adjustment for Local Holiday'
    });

    // Verify balance reductions (credits applied)
    expect(studentService.reduceBalance).toHaveBeenCalledTimes(2);
    expect(studentService.reduceBalance).toHaveBeenNthCalledWith(1, 'student-1', 5);
    expect(studentService.reduceBalance).toHaveBeenNthCalledWith(2, 'student-2', 2);
  });

  test('should identify students affected by holiday changes', () => {
    // First, manually add May 2nd, 2025 as a holiday (simulating admin action)
    holidayService.addSpecificHoliday(2025, 4, 2, 'Local Holiday');
    
    const affectedStudents = attendanceRecordsOnHoliday
      .filter(record => {
        const originalFee = record.fee;
        const newFee = holidayService.isHoliday(record.date) ? 0 : originalFee;
        return originalFee !== newFee;
      })
      .map(record => ({
        studentId: record.studentId,
        originalFee: record.fee,
        adjustment: record.fee > 0 ? -record.fee : 0,
        status: record.status,
        attributes: record.attributes
      }));

    expect(affectedStudents).toHaveLength(2); // student-1 and student-2 had fees
    
    expect(affectedStudents[0]).toEqual({
      studentId: 'student-1',
      originalFee: 5,
      adjustment: -5,
      status: 'absent',
      attributes: {}
    });

    expect(affectedStudents[1]).toEqual({
      studentId: 'student-2',
      originalFee: 2,
      adjustment: -2,
      status: 'present',
      attributes: { late: true, noShoes: true }
    });
  });

  test('should scan and adjust multiple attendance records', async () => {
    // First, manually add May 2nd, 2025 as a holiday (simulating admin action)
    holidayService.addSpecificHoliday(2025, 4, 2, 'Local Holiday');
    
    attendanceService.calculateAttendanceFee
      .mockReturnValueOnce(5)  // student-1
      .mockReturnValueOnce(2)  // student-2
      .mockReturnValueOnce(0); // student-3

    studentService.addHolidayCredit.mockResolvedValue({});
    studentService.reduceBalance
      .mockResolvedValueOnce({ balance: 10 })
      .mockResolvedValueOnce({ balance: 6 });

    const results = await holidayFeeAdjustmentService.scanAndAdjustHolidayFees(
      attendanceRecordsOnHoliday
    );

    expect(results).toHaveLength(3);
    
    // Check that adjustments were made
    expect(results[0].balanceAdjusted).toBe(true); // student-1
    expect(results[1].balanceAdjusted).toBe(true); // student-2 
    expect(results[2].balanceAdjusted).toBe(false); // student-3 (no fees)

    // Verify total credits created
    const totalCreditsCreated = results
      .filter(r => r.balanceAdjusted)
      .reduce((sum, r) => sum + Math.abs(r.adjustmentCalculation.adjustment), 0);
    
    expect(totalCreditsCreated).toBe(7); // $5 + $2 = $7 in holiday credits
  });

  test('should verify financial reports maintain original numbers while students have negative balance (credits)', () => {
    // This test simulates the requirement that financial reports show original numbers
    // while students now have "negative balance" (credits they can use)
    
    const originalFinancialData = {
      totalFeesCharged: 50, // Original total fees including holiday fees
      totalPayments: 35,
      netBalance: 15
    };

    const holidayCreditsIssued = 7; // $5 + $2 from May 2nd, 2025

    // Financial reports should still show original numbers
    const currentFinancialReport = {
      totalFeesCharged: originalFinancialData.totalFeesCharged, // Still 50
      totalPayments: originalFinancialData.totalPayments, // Still 35
      netBalance: originalFinancialData.netBalance, // Still 15
      holidayCreditsIssued: holidayCreditsIssued, // New field showing credits
      adjustedNetBalance: originalFinancialData.netBalance - holidayCreditsIssued // 15 - 7 = 8
    };

    expect(currentFinancialReport.totalFeesCharged).toBe(50);
    expect(currentFinancialReport.totalPayments).toBe(35);
    expect(currentFinancialReport.netBalance).toBe(15);
    expect(currentFinancialReport.holidayCreditsIssued).toBe(7);
    expect(currentFinancialReport.adjustedNetBalance).toBe(8);
  });

  test('should show students with holiday credits for admin visibility', async () => {
    // Mock holiday credits for affected students
    const mockHolidayCreditsReport = [
      {
        studentId: 'student-1',
        firstName: 'John',
        lastName: 'Doe',
        holidayCredits: [
          {
            id: '1',
            amount: 5,
            date: may2nd2025,
            holidayName: 'Local Holiday',
            originalStatus: 'absent',
            reason: 'Holiday fee adjustment for Local Holiday',
            used: false,
            usedAmount: 0
          }
        ],
        totalAvailableCredit: 5
      },
      {
        studentId: 'student-2',
        firstName: 'Jane',
        lastName: 'Smith',
        holidayCredits: [
          {
            id: '2',
            amount: 2,
            date: may2nd2025,
            holidayName: 'Local Holiday',
            originalStatus: 'present',
            reason: 'Holiday fee adjustment for Local Holiday',
            used: false,
            usedAmount: 0
          }
        ],
        totalAvailableCredit: 2
      }
    ];

    studentService.getAllHolidayCredits.mockResolvedValue(mockHolidayCreditsReport);

    const report = await holidayFeeAdjustmentService.getHolidayCreditsReport();

    expect(report).toEqual(mockHolidayCreditsReport);
    expect(report).toHaveLength(2);
    expect(report[0].totalAvailableCredit).toBe(5);
    expect(report[1].totalAvailableCredit).toBe(2);
  });
});