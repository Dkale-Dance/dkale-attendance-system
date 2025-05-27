import AttendanceDashboardService from '../services/AttendanceDashboardService';

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

describe('AttendanceDashboardService - Manual Holiday Change', () => {
  let attendanceDashboardService;
  let mockHolidayService;
  let mockAttendanceService;
  let mockHolidayFeeAdjustmentService;
  let mockStudentService;
  let mockPaymentService;

  const testDate = new Date(2025, 4, 2); // May 2nd, 2025

  // Mock students with attendance on the test date
  const mockStudents = [
    { id: 'student-1', firstName: 'John', lastName: 'Doe' },
    { id: 'student-2', firstName: 'Jane', lastName: 'Smith' },
    { id: 'student-3', firstName: 'Bob', lastName: 'Johnson' }
  ];

  // Mock attendance data showing students had fees charged
  const mockAttendanceData = {
    'student-1': { status: 'absent', attributes: {} }, // $5 fee
    'student-2': { status: 'present', attributes: { late: true, noShoes: true } }, // $2 fee
    'student-3': { status: 'present', attributes: {} } // $0 fee
  };

  beforeEach(() => {
    // Mock holiday service
    mockHolidayService = {
      isHoliday: jest.fn(),
      addSpecificHoliday: jest.fn(),
      removeSpecificHoliday: jest.fn()
    };

    // Mock attendance service
    mockAttendanceService = {
      getAttendanceByDate: jest.fn(),
      getEligibleStudents: jest.fn(),
      calculateAttendanceFee: jest.fn(),
      bulkMarkAttendance: jest.fn()
    };

    // Mock holiday fee adjustment service
    mockHolidayFeeAdjustmentService = {
      scanAndAdjustHolidayFees: jest.fn()
    };

    // Mock student service
    mockStudentService = {
      getStudentById: jest.fn(),
      addHolidayCredit: jest.fn(),
      reduceBalance: jest.fn(),
      getHolidayCredits: jest.fn()
    };

    // Mock payment service
    mockPaymentService = {
      getPaymentsByDateRange: jest.fn(),
      getAllPayments: jest.fn()
    };

    attendanceDashboardService = new AttendanceDashboardService(
      mockHolidayService,
      mockAttendanceService,
      mockHolidayFeeAdjustmentService,
      mockStudentService,
      mockPaymentService
    );

    jest.clearAllMocks();
  });

  describe('analyzeHolidayChangeImpact', () => {
    test('should identify students affected by manual holiday change', async () => {
      // Setup mocks
      mockAttendanceService.getAttendanceByDate.mockResolvedValue(mockAttendanceData);
      mockAttendanceService.getEligibleStudents.mockResolvedValue(mockStudents);
      mockPaymentService.getPaymentsByDateRange.mockResolvedValue([]);
      mockPaymentService.getAllPayments.mockResolvedValue([]); // No payments in notes either
      
      // Mock fee calculations
      mockAttendanceService.calculateAttendanceFee
        .mockReturnValueOnce(5)  // student-1: absent
        .mockReturnValueOnce(2)  // student-2: present with attributes
        .mockReturnValueOnce(0); // student-3: present, no attributes

      const impact = await attendanceDashboardService.analyzeHolidayChangeImpact(testDate, 'Manual Holiday');

      expect(impact).toEqual({
        hasImpact: true,
        affectedStudents: [
          {
            studentId: 'student-1',
            firstName: 'John',
            lastName: 'Doe',
            currentStatus: 'absent',
            currentAttributes: {},
            currentFee: 5,
            newFee: 0,
            adjustment: -5,
            creditAmount: 5,
            type: 'attendance'
          },
          {
            studentId: 'student-2',
            firstName: 'Jane',
            lastName: 'Smith',
            currentStatus: 'present',
            currentAttributes: { late: true, noShoes: true },
            currentFee: 2,
            newFee: 0,
            adjustment: -2,
            creditAmount: 2,
            type: 'attendance'
          }
        ],
        totalAdjustment: 7,
        totalAttendanceAdjustment: 7,
        totalPaymentAdjustment: 0,
        date: testDate,
        newHolidayName: 'Manual Holiday',
        message: 'Warning: 2 students will receive holiday credits totaling $7 (Attendance fees: $7)'
      });

      expect(mockAttendanceService.getAttendanceByDate).toHaveBeenCalledWith(testDate);
      expect(mockAttendanceService.getEligibleStudents).toHaveBeenCalled();
      expect(mockAttendanceService.calculateAttendanceFee).toHaveBeenCalledTimes(3);
    });

    test('should handle date with no attendance records', async () => {
      mockAttendanceService.getAttendanceByDate.mockResolvedValue({});
      mockAttendanceService.getEligibleStudents.mockResolvedValue(mockStudents);
      mockPaymentService.getPaymentsByDateRange.mockResolvedValue([]);
      mockPaymentService.getAllPayments.mockResolvedValue([]);

      const impact = await attendanceDashboardService.analyzeHolidayChangeImpact(testDate);

      expect(impact).toEqual({
        hasImpact: false,
        affectedStudents: [],
        totalAdjustment: 0,
        message: `No attendance records or payments found for ${testDate.toLocaleDateString()}. Safe to mark as holiday.`
      });
    });

    test('should handle date where no students had fees', async () => {
      const noFeeAttendanceData = {
        'student-1': { status: 'present', attributes: {} },
        'student-2': { status: 'present', attributes: {} },
        'student-3': { status: 'medicalAbsence', attributes: {} }
      };

      mockAttendanceService.getAttendanceByDate.mockResolvedValue(noFeeAttendanceData);
      mockAttendanceService.getEligibleStudents.mockResolvedValue(mockStudents);
      mockPaymentService.getPaymentsByDateRange.mockResolvedValue([]);
      mockPaymentService.getAllPayments.mockResolvedValue([]);
      
      // All students had $0 fees
      mockAttendanceService.calculateAttendanceFee
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0);

      const impact = await attendanceDashboardService.analyzeHolidayChangeImpact(testDate);

      expect(impact.hasImpact).toBe(false);
      expect(impact.affectedStudents).toHaveLength(0);
      expect(impact.totalAdjustment).toBe(0);
    });
  });

  describe('getHolidayWarning', () => {
    test('should generate detailed warning message for affected students', async () => {
      mockAttendanceService.getAttendanceByDate.mockResolvedValue(mockAttendanceData);
      mockAttendanceService.getEligibleStudents.mockResolvedValue(mockStudents);
      mockPaymentService.getPaymentsByDateRange.mockResolvedValue([]);
      mockPaymentService.getAllPayments.mockResolvedValue([]);
      
      mockAttendanceService.calculateAttendanceFee
        .mockReturnValueOnce(5)  // student-1
        .mockReturnValueOnce(2)  // student-2
        .mockReturnValueOnce(0); // student-3

      const warning = await attendanceDashboardService.getHolidayWarning(testDate);

      expect(warning.showWarning).toBe(true);
      expect(warning.affectedStudentCount).toBe(2);
      expect(warning.totalCredits).toBe(7);
      expect(warning.totalAttendanceCredits).toBe(7);
      expect(warning.totalPaymentCredits).toBe(0);
      expect(warning.studentNames).toEqual(['John Doe', 'Jane Smith']);
      expect(warning.feeDetails).toEqual([
        'John Doe: $5 credit (was absent)',
        'Jane Smith: $2 credit (was present with late, noShoes)'
      ]);
      expect(warning.message).toContain('Warning: Changing');
      expect(warning.message).toContain('$7 in holiday credits');
      expect(warning.message).toContain('Do you want to proceed?');
    });

    test('should show no warning when no impact', async () => {
      mockAttendanceService.getAttendanceByDate.mockResolvedValue({});
      mockAttendanceService.getEligibleStudents.mockResolvedValue(mockStudents);
      mockPaymentService.getPaymentsByDateRange.mockResolvedValue([]);
      mockPaymentService.getAllPayments.mockResolvedValue([]);

      const warning = await attendanceDashboardService.getHolidayWarning(testDate);

      expect(warning.showWarning).toBe(false);
      expect(warning.message).toContain('No attendance records or payments found');
    });
  });

  describe('processHolidayChange', () => {
    test('should process complete holiday change with confirmations', async () => {
      // Setup mocks
      mockAttendanceService.getAttendanceByDate.mockResolvedValue(mockAttendanceData);
      mockAttendanceService.getEligibleStudents.mockResolvedValue(mockStudents);
      mockAttendanceService.bulkMarkAttendance.mockResolvedValue();
      mockPaymentService.getPaymentsByDateRange.mockResolvedValue([]);
      mockPaymentService.getAllPayments.mockResolvedValue([]);

      const mockAdjustmentResults = [
        {
          studentId: 'student-1',
          balanceAdjusted: true,
          adjustmentCalculation: { adjustment: -5 }
        },
        {
          studentId: 'student-2',
          balanceAdjusted: true,
          adjustmentCalculation: { adjustment: -2 }
        },
        {
          studentId: 'student-3',
          balanceAdjusted: false,
          adjustmentCalculation: { adjustment: 0 }
        }
      ];

      mockHolidayFeeAdjustmentService.scanAndAdjustHolidayFees.mockResolvedValue(mockAdjustmentResults);

      const result = await attendanceDashboardService.processHolidayChange(
        testDate,
        'Manual Holiday',
        true // confirmed
      );

      expect(result.success).toBe(true);
      expect(result.holidayAdded).toBe(true);
      expect(result.attendanceUpdated).toBe(3);
      expect(result.totalCreditsIssued).toBe(7);
      expect(result.totalAttendanceCredits).toBe(7);
      expect(result.totalPaymentCredits).toBe(0);
      expect(result.affectedStudents).toBe(2);

      // Verify holiday was added
      expect(mockHolidayService.addSpecificHoliday).toHaveBeenCalledWith(
        2025, 4, 2, 'Manual Holiday'
      );

      // Verify attendance was updated to 'holiday' status
      expect(mockAttendanceService.bulkMarkAttendance).toHaveBeenCalledWith(
        testDate,
        ['student-1', 'student-2', 'student-3'],
        'holiday'
      );

      // Verify fee adjustments were processed
      expect(mockHolidayFeeAdjustmentService.scanAndAdjustHolidayFees).toHaveBeenCalledWith([
        { studentId: 'student-1', date: testDate, status: 'absent', attributes: {} },
        { studentId: 'student-2', date: testDate, status: 'present', attributes: { late: true, noShoes: true } },
        { studentId: 'student-3', date: testDate, status: 'present', attributes: {} }
      ]);
    });

    test('should reject unconfirmed holiday changes', async () => {
      await expect(
        attendanceDashboardService.processHolidayChange(testDate, 'Manual Holiday', false)
      ).rejects.toThrow('Holiday change must be explicitly confirmed');

      expect(mockHolidayService.addSpecificHoliday).not.toHaveBeenCalled();
    });

    test('should handle empty attendance data gracefully', async () => {
      mockAttendanceService.getAttendanceByDate.mockResolvedValue({});
      mockAttendanceService.getEligibleStudents.mockResolvedValue(mockStudents);
      mockPaymentService.getPaymentsByDateRange.mockResolvedValue([]);
      mockPaymentService.getAllPayments.mockResolvedValue([]);
      mockHolidayFeeAdjustmentService.scanAndAdjustHolidayFees.mockResolvedValue([]);

      const result = await attendanceDashboardService.processHolidayChange(
        testDate,
        'Manual Holiday',
        true
      );

      expect(result.success).toBe(true);
      expect(result.attendanceUpdated).toBe(0);
      expect(result.totalCreditsIssued).toBe(0);
      expect(result.totalAttendanceCredits).toBe(0);
      expect(result.totalPaymentCredits).toBe(0);
      expect(result.affectedStudents).toBe(0);

      // Holiday should still be added
      expect(mockHolidayService.addSpecificHoliday).toHaveBeenCalled();
      
      // No attendance updates needed
      expect(mockAttendanceService.bulkMarkAttendance).not.toHaveBeenCalled();
    });
  });

  describe('Integration workflow', () => {
    test('should demonstrate complete workflow: analyze -> warn -> confirm -> process', async () => {
      // Step 1: Analyze impact
      mockAttendanceService.getAttendanceByDate.mockResolvedValue(mockAttendanceData);
      mockAttendanceService.getEligibleStudents.mockResolvedValue(mockStudents);
      mockPaymentService.getPaymentsByDateRange.mockResolvedValue([]);
      mockPaymentService.getAllPayments.mockResolvedValue([]);
      mockAttendanceService.calculateAttendanceFee
        .mockReturnValueOnce(5)
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(0);

      const impact = await attendanceDashboardService.analyzeHolidayChangeImpact(testDate);
      expect(impact.hasImpact).toBe(true);
      expect(impact.affectedStudents).toHaveLength(2);
      expect(impact.totalAdjustment).toBe(7);

      // Step 2: Generate warning
      mockAttendanceService.calculateAttendanceFee
        .mockReturnValueOnce(5)
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(0);

      const warning = await attendanceDashboardService.getHolidayWarning(testDate);
      expect(warning.showWarning).toBe(true);
      expect(warning.message).toContain('Do you want to proceed?');

      // Step 3: Process with confirmation
      mockAttendanceService.bulkMarkAttendance.mockResolvedValue();
      mockHolidayFeeAdjustmentService.scanAndAdjustHolidayFees.mockResolvedValue([
        { studentId: 'student-1', balanceAdjusted: true, adjustmentCalculation: { adjustment: -5 } },
        { studentId: 'student-2', balanceAdjusted: true, adjustmentCalculation: { adjustment: -2 } },
        { studentId: 'student-3', balanceAdjusted: false, adjustmentCalculation: { adjustment: 0 } }
      ]);

      const result = await attendanceDashboardService.processHolidayChange(
        testDate,
        'Emergency Holiday',
        true
      );

      expect(result.success).toBe(true);
      expect(result.totalCreditsIssued).toBe(7);
      expect(result.totalAttendanceCredits).toBe(7);
      expect(result.totalPaymentCredits).toBe(0);
      expect(result.message).toContain('Successfully marked');
      expect(result.message).toContain('Emergency Holiday');
      expect(result.message).toContain('$7 in holiday credits');
    });
  });

  describe('Holiday Payment Adjustments', () => {
    const mockPaymentsOnHoliday = [
      {
        id: 'payment-1',
        studentId: 'student-1', 
        studentName: 'Andres Naranjo',
        amount: 1,
        paymentMethod: 'cash',
        notes: '5/2/2025 fee',
        date: testDate
      },
      {
        id: 'payment-2',
        studentId: 'student-2',
        studentName: 'Maria Garcia', 
        amount: 3,
        paymentMethod: 'card',
        notes: 'Late fee payment',
        date: testDate
      }
    ];

    test('should analyze holiday payment impact correctly', async () => {
      mockPaymentService.getPaymentsByDateRange.mockResolvedValue(mockPaymentsOnHoliday);
      mockPaymentService.getAllPayments.mockResolvedValue([]);
      mockAttendanceService.getAttendanceByDate.mockResolvedValue({});
      mockAttendanceService.getEligibleStudents.mockResolvedValue([]);

      const impact = await attendanceDashboardService.analyzeHolidayChangeImpact(testDate);

      expect(impact.hasImpact).toBe(true);
      expect(impact.totalPaymentAdjustment).toBe(4); // $1 + $3
      expect(impact.affectedStudents).toHaveLength(2);

      // Check payment students
      const paymentStudents = impact.affectedStudents.filter(s => s.type === 'payment');
      expect(paymentStudents).toHaveLength(2);
      expect(paymentStudents[0].creditAmount).toBe(1);
      expect(paymentStudents[1].creditAmount).toBe(3);
    });

    test('should process holiday payment adjustments with student credits', async () => {
      mockPaymentService.getPaymentsByDateRange.mockResolvedValue(mockPaymentsOnHoliday);
      mockPaymentService.getAllPayments.mockResolvedValue([]);
      mockStudentService.getHolidayCredits.mockResolvedValue([]); // No existing credits
      mockStudentService.addHolidayCredit.mockResolvedValue({});
      mockStudentService.reduceBalance
        .mockResolvedValueOnce({ balance: -1 }) // Andres: 0 - 1 = -1
        .mockResolvedValueOnce({ balance: 7 }); // Maria: 10 - 3 = 7

      const result = await attendanceDashboardService.processHolidayPaymentAdjustments(testDate, 'Manual Holiday');

      expect(result.paymentAdjustments).toHaveLength(2);
      expect(result.totalPaymentCredits).toBe(4);

      // Verify Andres Naranjo gets $1 credit
      expect(result.paymentAdjustments[0]).toEqual({
        studentId: 'student-1',
        studentName: 'Andres Naranjo',
        paymentId: 'payment-1',
        amount: 1,
        creditAmount: 1,
        balanceAdjusted: true
      });

      // Verify holiday credits were added
      expect(mockStudentService.addHolidayCredit).toHaveBeenCalledTimes(2);
      expect(mockStudentService.addHolidayCredit).toHaveBeenNthCalledWith(1, 'student-1', {
        amount: 1,
        date: testDate,
        holidayName: 'Manual Holiday',
        paymentId: 'payment-1',
        paymentMethod: 'cash',
        originalNotes: '5/2/2025 fee',
        reason: 'Holiday payment adjustment for Manual Holiday - Payment made on holiday'
      });

      // Verify balances were reduced (credits applied)
      expect(mockStudentService.reduceBalance).toHaveBeenCalledTimes(2);
      expect(mockStudentService.reduceBalance).toHaveBeenNthCalledWith(1, 'student-1', 1);
      expect(mockStudentService.reduceBalance).toHaveBeenNthCalledWith(2, 'student-2', 3);
    });

    test('should generate comprehensive warning with both attendance and payment impacts', async () => {
      // Mock both attendance and payment data
      mockAttendanceService.getAttendanceByDate.mockResolvedValue({
        'student-3': { status: 'absent', attributes: {} }
      });
      mockAttendanceService.getEligibleStudents.mockResolvedValue([
        { id: 'student-3', firstName: 'John', lastName: 'Doe' }
      ]);
      mockAttendanceService.calculateAttendanceFee.mockReturnValue(5);
      mockPaymentService.getPaymentsByDateRange.mockResolvedValue([mockPaymentsOnHoliday[0]]);
      mockPaymentService.getAllPayments.mockResolvedValue([]);

      const warning = await attendanceDashboardService.getHolidayWarning(testDate);

      expect(warning.showWarning).toBe(true);
      expect(warning.totalCredits).toBe(6); // $5 attendance + $1 payment
      expect(warning.totalAttendanceCredits).toBe(5);
      expect(warning.totalPaymentCredits).toBe(1);
      
      expect(warning.attendanceDetails).toHaveLength(1);
      expect(warning.paymentDetails).toHaveLength(1);
      
      expect(warning.message).toContain('$6 in holiday credits');
      expect(warning.message).toContain('Attendance: $5, Payments: $1');
      expect(warning.paymentDetails[0]).toContain('Andres Naranjo: $1 credit (payment cash - 5/2/2025 fee)');
    });

    test('should handle complete holiday change workflow with payments', async () => {
      // Setup comprehensive scenario
      mockAttendanceService.getAttendanceByDate.mockResolvedValue({
        'student-3': { status: 'absent', attributes: {} }
      });
      mockAttendanceService.getEligibleStudents.mockResolvedValue([
        { id: 'student-3', firstName: 'John', lastName: 'Doe' }
      ]);
      mockAttendanceService.bulkMarkAttendance.mockResolvedValue();
      
      mockPaymentService.getPaymentsByDateRange.mockResolvedValue([mockPaymentsOnHoliday[0]]);
      mockPaymentService.getAllPayments.mockResolvedValue([]);
      
      mockHolidayFeeAdjustmentService.scanAndAdjustHolidayFees.mockResolvedValue([
        { studentId: 'student-3', balanceAdjusted: true, adjustmentCalculation: { adjustment: -5 } }
      ]);
      
      mockStudentService.getHolidayCredits.mockResolvedValue([]); // No existing credits
      mockStudentService.addHolidayCredit.mockResolvedValue({});
      mockStudentService.reduceBalance.mockResolvedValue({ balance: -1 });

      const result = await attendanceDashboardService.processHolidayChange(
        testDate,
        'Complete Holiday Test',
        true
      );

      expect(result.success).toBe(true);
      expect(result.totalCreditsIssued).toBe(6); // $5 attendance + $1 payment
      expect(result.totalAttendanceCredits).toBe(5);
      expect(result.totalPaymentCredits).toBe(1);
      expect(result.affectedStudents).toBe(2); // 1 attendance + 1 payment
      
      expect(result.message).toContain('$6 in holiday credits');
      expect(result.message).toContain('Attendance: $5');
      expect(result.message).toContain('Payments: $1');
      
      // Verify holiday was added
      expect(mockHolidayService.addSpecificHoliday).toHaveBeenCalledWith(
        2025, 4, 2, 'Complete Holiday Test'
      );
    });

    test('should handle case with no payments on holiday date', async () => {
      mockPaymentService.getPaymentsByDateRange.mockResolvedValue([]);
      mockPaymentService.getAllPayments.mockResolvedValue([]);
      
      const paymentImpact = await attendanceDashboardService.analyzeHolidayPaymentImpact(testDate);
      
      expect(paymentImpact.hasPaymentImpact).toBe(false);
      expect(paymentImpact.affectedPayments).toHaveLength(0);
      expect(paymentImpact.totalPaymentAdjustment).toBe(0);
    });
  });
});