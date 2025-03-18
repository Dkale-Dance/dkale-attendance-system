import AttendanceService from '../services/AttendanceService';

// Mock Firebase's Firestore
jest.mock('firebase/firestore');
jest.mock('../lib/firebase/config/config', () => ({}));

describe('AttendanceService - Medical Absence Fee Correction', () => {
  let attendanceService;
  let mockAttendanceRepository;
  let mockStudentRepository;
  let mockStudentService;
  let mockDate;

  beforeEach(() => {
    mockDate = new Date('2025-03-08');
    
    mockAttendanceRepository = {
      getAttendanceByDate: jest.fn(),
      updateAttendance: jest.fn(),
      updateAttendanceWithAttributes: jest.fn(),
      getAttendanceRecord: jest.fn(),
      bulkUpdateAttendanceWithAttributes: jest.fn()
    };
    
    mockStudentRepository = {
      getStudentsByStatus: jest.fn()
    };
    
    mockStudentService = {
      addBalance: jest.fn(),
      reduceBalance: jest.fn()
    };
    
    attendanceService = new AttendanceService(
      mockAttendanceRepository, 
      mockStudentRepository, 
      mockStudentService
    );
  });
  
  describe('calculateFeeDifference', () => {
    it('should calculate positive fee difference when new status has higher fee', () => {
      // From present with no attributes ($0) to absent ($5)
      expect(attendanceService.calculateFeeDifference('present', {}, 'absent', {})).toBe(5);
      
      // From present with one attribute ($1) to absent ($5)
      expect(attendanceService.calculateFeeDifference('present', { late: true }, 'absent', {})).toBe(4);
      
      // From present with one attribute ($1) to present with two attributes ($2)
      expect(attendanceService.calculateFeeDifference(
        'present', { late: true }, 
        'present', { late: true, noShoes: true }
      )).toBe(1);
      
      // From medical absence ($0) to absent ($5)
      expect(attendanceService.calculateFeeDifference('medicalAbsence', {}, 'absent', {})).toBe(5);
    });
    
    it('should calculate negative fee difference when new status has lower fee', () => {
      // From absent ($5) to present with no attributes ($0)
      expect(attendanceService.calculateFeeDifference('absent', {}, 'present', {})).toBe(-5);
      
      // From absent ($5) to present with one attribute ($1)
      expect(attendanceService.calculateFeeDifference('absent', {}, 'present', { late: true })).toBe(-4);
      
      // From present with three attributes ($3) to present with one attribute ($1)
      expect(attendanceService.calculateFeeDifference(
        'present', { late: true, noShoes: true, notInUniform: true }, 
        'present', { late: true }
      )).toBe(-2);
      
      // From absent ($5) to medical absence ($0)
      expect(attendanceService.calculateFeeDifference('absent', {}, 'medicalAbsence', {})).toBe(-5);
    });
    
    it('should calculate zero fee difference when fees are the same', () => {
      // Same status and attributes
      expect(attendanceService.calculateFeeDifference('present', { late: true }, 'present', { late: true })).toBe(0);
      
      // Different statuses with same fee
      expect(attendanceService.calculateFeeDifference(
        'present', { late: true, noShoes: true, notInUniform: true }, 
        'absent', {}
      )).toBe(2); // Present with all attributes ($3) to absent ($5) = +$2
      
      // Both medical absence
      expect(attendanceService.calculateFeeDifference('medicalAbsence', {}, 'medicalAbsence', {})).toBe(0);
      
      // Both holiday
      expect(attendanceService.calculateFeeDifference('holiday', {}, 'holiday', {})).toBe(0);
    });
    
    it('should handle null or undefined attributes', () => {
      expect(attendanceService.calculateFeeDifference('present', null, 'absent', {})).toBe(5);
      expect(attendanceService.calculateFeeDifference('present', undefined, 'absent', {})).toBe(5);
      expect(attendanceService.calculateFeeDifference('absent', {}, 'present', null)).toBe(-5);
      expect(attendanceService.calculateFeeDifference('absent', {}, 'present', undefined)).toBe(-5);
    });
  });

  describe('updateAttendanceWithFeeAdjustment', () => {
    it('should fetch previous attendance record before updating', async () => {
      // Setup
      const studentId = 'student1';
      const status = 'present';
      const attributes = {};
      mockAttendanceRepository.getAttendanceRecord.mockResolvedValue(null);
      
      // Exercise
      await attendanceService.updateAttendanceWithFeeAdjustment(mockDate, studentId, status, attributes);
      
      // Verify
      expect(mockAttendanceRepository.getAttendanceRecord).toHaveBeenCalledWith(mockDate, studentId);
    });

    it('should not adjust balance when creating a new attendance record', async () => {
      // Setup
      const studentId = 'student1';
      const status = 'absent';
      const attributes = {};
      mockAttendanceRepository.getAttendanceRecord.mockResolvedValue(null);
      
      // Exercise
      await attendanceService.updateAttendanceWithFeeAdjustment(mockDate, studentId, status, attributes);
      
      // Verify
      expect(mockAttendanceRepository.updateAttendanceWithAttributes).toHaveBeenCalledWith(
        mockDate, studentId, status, attributes
      );
      expect(mockStudentService.reduceBalance).not.toHaveBeenCalled();
      expect(mockStudentService.addBalance).toHaveBeenCalledWith(studentId, 5);
    });

    it('should adjust balance when changing from absent to medical absence', async () => {
      // Setup
      const studentId = 'student1';
      const previousStatus = 'absent';
      const newStatus = 'medicalAbsence';
      const attributes = {};
      
      mockAttendanceRepository.getAttendanceRecord.mockResolvedValue({
        status: previousStatus,
        attributes: {}
      });
      
      // Exercise
      await attendanceService.updateAttendanceWithFeeAdjustment(mockDate, studentId, newStatus, attributes);
      
      // Verify
      expect(mockAttendanceRepository.updateAttendanceWithAttributes).toHaveBeenCalledWith(
        mockDate, studentId, newStatus, attributes
      );
      expect(mockStudentService.reduceBalance).toHaveBeenCalledWith(studentId, 5);
      expect(mockStudentService.addBalance).not.toHaveBeenCalled();
    });

    it('should adjust balance when changing from medical absence to absent', async () => {
      // Setup
      const studentId = 'student1';
      const previousStatus = 'medicalAbsence';
      const newStatus = 'absent';
      const attributes = {};
      
      mockAttendanceRepository.getAttendanceRecord.mockResolvedValue({
        status: previousStatus,
        attributes: {}
      });
      
      // Exercise
      await attendanceService.updateAttendanceWithFeeAdjustment(mockDate, studentId, newStatus, attributes);
      
      // Verify
      expect(mockAttendanceRepository.updateAttendanceWithAttributes).toHaveBeenCalledWith(
        mockDate, studentId, newStatus, attributes
      );
      expect(mockStudentService.reduceBalance).not.toHaveBeenCalled();
      expect(mockStudentService.addBalance).toHaveBeenCalledWith(studentId, 5);
    });

    it('should adjust balance when changing from present with fees to medical absence', async () => {
      // Setup
      const studentId = 'student1';
      const previousStatus = 'present';
      const newStatus = 'medicalAbsence';
      const previousAttributes = { late: true, noShoes: true }; // $2 fee
      const newAttributes = {};
      
      mockAttendanceRepository.getAttendanceRecord.mockResolvedValue({
        status: previousStatus,
        attributes: previousAttributes
      });
      
      // Exercise
      await attendanceService.updateAttendanceWithFeeAdjustment(mockDate, studentId, newStatus, newAttributes);
      
      // Verify
      expect(mockAttendanceRepository.updateAttendanceWithAttributes).toHaveBeenCalledWith(
        mockDate, studentId, newStatus, newAttributes
      );
      expect(mockStudentService.reduceBalance).toHaveBeenCalledWith(studentId, 2);
      expect(mockStudentService.addBalance).not.toHaveBeenCalled();
    });

    it('should handle multiple attribute changes correctly', async () => {
      // Setup
      const studentId = 'student1';
      const previousStatus = 'present';
      const newStatus = 'present';
      const previousAttributes = { late: true }; // $1 fee
      const newAttributes = { late: true, noShoes: true }; // $2 fee
      
      mockAttendanceRepository.getAttendanceRecord.mockResolvedValue({
        status: previousStatus,
        attributes: previousAttributes
      });
      
      // Exercise
      await attendanceService.updateAttendanceWithFeeAdjustment(mockDate, studentId, newStatus, newAttributes);
      
      // Verify
      expect(mockAttendanceRepository.updateAttendanceWithAttributes).toHaveBeenCalledWith(
        mockDate, studentId, newStatus, newAttributes
      );
      // Only add the difference of $1
      expect(mockStudentService.reduceBalance).not.toHaveBeenCalled();
      expect(mockStudentService.addBalance).toHaveBeenCalledWith(studentId, 1);
    });

    it('should not adjust balance when fees remain the same', async () => {
      // Setup
      const studentId = 'student1';
      const previousStatus = 'present';
      const newStatus = 'present';
      const attributes = { late: true }; // $1 fee
      
      mockAttendanceRepository.getAttendanceRecord.mockResolvedValue({
        status: previousStatus,
        attributes: attributes
      });
      
      // Exercise
      await attendanceService.updateAttendanceWithFeeAdjustment(mockDate, studentId, newStatus, attributes);
      
      // Verify
      expect(mockAttendanceRepository.updateAttendanceWithAttributes).toHaveBeenCalledWith(
        mockDate, studentId, newStatus, attributes
      );
      expect(mockStudentService.reduceBalance).not.toHaveBeenCalled();
      expect(mockStudentService.addBalance).not.toHaveBeenCalled();
    });
  });

  describe('bulkUpdateAttendanceWithFeeAdjustment', () => {
    it('should adjust balances for all students when changing attendance status', async () => {
      // Setup
      const studentIds = ['student1', 'student2'];
      const newStatus = 'medicalAbsence';
      const attributes = {};
      
      // Set up mock to return different values for each student
      mockAttendanceRepository.getAttendanceRecord.mockImplementation((date, studentId) => {
        if (studentId === 'student1') {
          return Promise.resolve({ status: 'absent', attributes: {} }); // $5 fee previously
        } else {
          return Promise.resolve({ status: 'present', attributes: { late: true } }); // $1 fee previously
        }
      });
      
      // Exercise
      await attendanceService.bulkUpdateAttendanceWithFeeAdjustment(mockDate, studentIds, newStatus, attributes);
      
      // Verify
      expect(mockAttendanceRepository.getAttendanceRecord).toHaveBeenCalledTimes(2);
      expect(mockAttendanceRepository.bulkUpdateAttendanceWithAttributes).toHaveBeenCalledWith(
        mockDate, studentIds, newStatus, attributes
      );
      
      // Should reduce $5 for student1 (absent -> medical = remove $5)
      expect(mockStudentService.reduceBalance).toHaveBeenCalledWith('student1', 5);
      
      // Should reduce $1 for student2 (present with late -> medical = remove $1)
      expect(mockStudentService.reduceBalance).toHaveBeenCalledWith('student2', 1);
      
      // No new fees should be added since medicalAbsence has no fee
      expect(mockStudentService.addBalance).not.toHaveBeenCalled();
    });
  });

  describe('Bug: Absence fee adjustments for status changes', () => {
    it('should properly remove the fee when changing from absent to medicalAbsence', async () => {
      // This test simulates the reported bug - student Angy Moreno changing from absent ($5) to medicalAbsence ($0)
      const studentId = 'angy-moreno';
      const date = new Date('2025-03-10');
      const oldStatus = 'absent';
      const newStatus = 'medicalAbsence';
      const attributes = {};
      
      // Mock the previous record with 'absent' status ($5 fee)
      mockAttendanceRepository.getAttendanceRecord.mockResolvedValue({
        status: oldStatus,
        attributes: {}
      });
      
      // Exercise - update status from absent to medicalAbsence
      await attendanceService.updateAttendanceWithFeeAdjustment(date, studentId, newStatus, attributes);
      
      // Verify - the $5 fee should be removed when changing from absent to medicalAbsence
      expect(mockAttendanceRepository.getAttendanceRecord).toHaveBeenCalledWith(date, studentId);
      expect(mockAttendanceRepository.updateAttendanceWithAttributes).toHaveBeenCalledWith(
        date, studentId, newStatus, attributes
      );
      expect(mockStudentService.reduceBalance).toHaveBeenCalledWith(studentId, 5);
      expect(mockStudentService.addBalance).not.toHaveBeenCalled();
    });
    
    it('should properly remove the fee when changing from absent to holiday', async () => {
      // This test simulates the reported bug - student changing from absent ($5) to holiday ($0)
      const studentId = 'angy-moreno';
      const date = new Date('2025-03-10');
      const oldStatus = 'absent';
      const newStatus = 'holiday';
      const attributes = {};
      
      // Mock the previous record with 'absent' status ($5 fee)
      mockAttendanceRepository.getAttendanceRecord.mockResolvedValue({
        status: oldStatus,
        attributes: {}
      });
      
      // Exercise - update status from absent to holiday
      await attendanceService.updateAttendanceWithFeeAdjustment(date, studentId, newStatus, attributes);
      
      // Verify - the $5 fee should be removed when changing from absent to holiday
      expect(mockAttendanceRepository.getAttendanceRecord).toHaveBeenCalledWith(date, studentId);
      expect(mockAttendanceRepository.updateAttendanceWithAttributes).toHaveBeenCalledWith(
        date, studentId, newStatus, attributes
      );
      expect(mockStudentService.reduceBalance).toHaveBeenCalledWith(studentId, 5);
      expect(mockStudentService.addBalance).not.toHaveBeenCalled();
    });
    
    it('should handle the complete cycle: present -> absent -> medicalAbsence -> absent', async () => {
      const studentId = 'angy-moreno';
      const date = new Date('2025-03-10');
      const attributes = {};
      
      // Step 1: Start with present status
      mockAttendanceRepository.getAttendanceRecord.mockResolvedValue(null);
      await attendanceService.updateAttendanceWithFeeAdjustment(date, studentId, 'present', attributes);
      expect(mockStudentService.addBalance).not.toHaveBeenCalled();
      
      // Step 2: Change to absent (add $5 fee)
      mockAttendanceRepository.getAttendanceRecord.mockResolvedValue({
        status: 'present',
        attributes: {}
      });
      await attendanceService.updateAttendanceWithFeeAdjustment(date, studentId, 'absent', attributes);
      expect(mockStudentService.addBalance).toHaveBeenCalledWith(studentId, 5);
      
      // Step 3: Change to medicalAbsence (remove $5 fee)
      mockStudentService.addBalance.mockClear();
      mockAttendanceRepository.getAttendanceRecord.mockResolvedValue({
        status: 'absent',
        attributes: {}
      });
      await attendanceService.updateAttendanceWithFeeAdjustment(date, studentId, 'medicalAbsence', attributes);
      expect(mockStudentService.reduceBalance).toHaveBeenCalledWith(studentId, 5);
      
      // Step 4: Change back to absent (add $5 fee again)
      mockStudentService.reduceBalance.mockClear();
      mockAttendanceRepository.getAttendanceRecord.mockResolvedValue({
        status: 'medicalAbsence',
        attributes: {}
      });
      await attendanceService.updateAttendanceWithFeeAdjustment(date, studentId, 'absent', attributes);
      expect(mockStudentService.addBalance).toHaveBeenCalledWith(studentId, 5);
    });
  });
});