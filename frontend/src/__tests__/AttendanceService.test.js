import AttendanceService from '../services/AttendanceService';

// Mock Firebase's Firestore
jest.mock('firebase/firestore');
jest.mock('../lib/firebase/config/config', () => ({}));
jest.mock('../services/StudentService', () => ({
  studentService: {
    addBalance: jest.fn(),
  }
}));

describe('AttendanceService', () => {
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
      bulkUpdateAttendance: jest.fn(),
      updateAttendanceWithAttributes: jest.fn(),
      bulkUpdateAttendanceWithAttributes: jest.fn()
    };
    
    mockStudentRepository = {
      getAllStudents: jest.fn(),
      getStudentsByStatus: jest.fn()
    };
    
    mockStudentService = {
      addBalance: jest.fn()
    };
    
    // Reset the mock implementation
    const { studentService } = require('../services/StudentService');
    studentService.addBalance.mockImplementation(mockStudentService.addBalance);
    
    attendanceService = new AttendanceService(mockAttendanceRepository, mockStudentRepository, studentService);
  });

  describe('getAttendanceByDate', () => {
    it('should fetch attendance for a given date', async () => {
      // Setup
      const mockAttendanceData = {
        'student1': { status: 'present', timestamp: mockDate },
        'student2': { status: 'absent', timestamp: mockDate }
      };
      mockAttendanceRepository.getAttendanceByDate.mockResolvedValue(mockAttendanceData);
      
      // Exercise
      const result = await attendanceService.getAttendanceByDate(mockDate);
      
      // Verify
      expect(mockAttendanceRepository.getAttendanceByDate).toHaveBeenCalledWith(mockDate);
      expect(result).toEqual(mockAttendanceData);
    });
  });

  describe('markAttendance', () => {
    it('should update attendance for a student', async () => {
      // Setup
      const studentId = 'student1';
      const status = 'present';
      mockAttendanceRepository.updateAttendance.mockResolvedValue();
      
      // Exercise
      await attendanceService.markAttendance(mockDate, studentId, status);
      
      // Verify
      expect(mockAttendanceRepository.updateAttendance).toHaveBeenCalledWith(
        mockDate,
        studentId,
        status
      );
    });
    
    it('should throw error for invalid status', async () => {
      // Setup
      const studentId = 'student1';
      const invalidStatus = 'invalid';
      
      // Exercise & Verify
      await expect(
        attendanceService.markAttendance(mockDate, studentId, invalidStatus)
      ).rejects.toThrow('Invalid attendance status');
    });
  });

  describe('bulkMarkAttendance', () => {
    it('should update attendance for multiple students', async () => {
      // Setup
      const studentIds = ['student1', 'student2'];
      const status = 'present';
      mockAttendanceRepository.bulkUpdateAttendance.mockResolvedValue();
      
      // Exercise
      await attendanceService.bulkMarkAttendance(mockDate, studentIds, status);
      
      // Verify
      expect(mockAttendanceRepository.bulkUpdateAttendance).toHaveBeenCalledWith(
        mockDate,
        studentIds,
        status
      );
    });
    
    it('should throw error for invalid status', async () => {
      // Setup
      const studentIds = ['student1', 'student2'];
      const invalidStatus = 'invalid';
      
      // Exercise & Verify
      await expect(
        attendanceService.bulkMarkAttendance(mockDate, studentIds, invalidStatus)
      ).rejects.toThrow('Invalid attendance status');
    });
    
    it('should throw error for empty student IDs array', async () => {
      // Setup
      const emptyStudentIds = [];
      const status = 'present';
      
      // Exercise & Verify
      await expect(
        attendanceService.bulkMarkAttendance(mockDate, emptyStudentIds, status)
      ).rejects.toThrow('No students selected');
    });
  });

  describe('getEligibleStudents', () => {
    it('should fetch students with eligible enrollment statuses', async () => {
      // Setup
      const enrolledStudents = [
        { id: 'student1', firstName: 'John', lastName: 'Doe', enrollmentStatus: 'Enrolled' }
      ];
      const pendingPaymentStudents = [
        { id: 'student2', firstName: 'Jane', lastName: 'Doe', enrollmentStatus: 'Pending Payment' }
      ];
      
      mockStudentRepository.getStudentsByStatus.mockImplementation((status) => {
        if (status === 'Enrolled') return Promise.resolve(enrolledStudents);
        if (status === 'Pending Payment') return Promise.resolve(pendingPaymentStudents);
        return Promise.resolve([]);
      });
      
      // Exercise
      const result = await attendanceService.getEligibleStudents();
      
      // Verify
      expect(mockStudentRepository.getStudentsByStatus).toHaveBeenCalledWith('Enrolled');
      expect(mockStudentRepository.getStudentsByStatus).toHaveBeenCalledWith('Pending Payment');
      expect(result).toEqual([...enrolledStudents, ...pendingPaymentStudents]);
    });
  });

  describe('getAttendanceSummaryWithStudents', () => {
    it('should combine attendance data with student info', async () => {
      // Setup
      const mockStudents = [
        { id: 'student1', firstName: 'John', lastName: 'Doe', enrollmentStatus: 'Enrolled' },
        { id: 'student2', firstName: 'Jane', lastName: 'Doe', enrollmentStatus: 'Pending Payment' }
      ];
      
      const mockAttendanceData = {
        'student1': { 
          status: 'present', 
          timestamp: mockDate,
          attributes: {} 
        }
        // student2 has no attendance record
      };
      
      attendanceService.getEligibleStudents = jest.fn().mockResolvedValue(mockStudents);
      mockAttendanceRepository.getAttendanceByDate.mockResolvedValue(mockAttendanceData);
      
      // Exercise
      const result = await attendanceService.getAttendanceSummaryWithStudents(mockDate);
      
      // Verify
      expect(attendanceService.getEligibleStudents).toHaveBeenCalled();
      expect(mockAttendanceRepository.getAttendanceByDate).toHaveBeenCalledWith(mockDate);
      
      // Check the merged data
      expect(result).toEqual([
        {
          ...mockStudents[0],
          attendance: { 
            status: 'present', 
            timestamp: mockDate,
            attributes: {} 
          }
        },
        {
          ...mockStudents[1],
          attendance: null // No attendance record
        }
      ]);
    });
  });

  describe('validateStatus', () => {
    it('should accept all valid statuses', () => {
      // Exercise & Verify
      expect(() => {
        attendanceService.validateStatus('present');
        attendanceService.validateStatus('absent');
        attendanceService.validateStatus('medicalAbsence');
        attendanceService.validateStatus('holiday');
      }).not.toThrow();
    });

    it('should throw error for invalid status', () => {
      // Exercise & Verify
      expect(() => {
        attendanceService.validateStatus('invalid');
      }).toThrow('Invalid attendance status');
    });
    
    it('should reject late as a primary status', () => {
      // Exercise & Verify
      expect(() => {
        attendanceService.validateStatus('late');
      }).toThrow('Invalid attendance status');
    });
  });

  describe('markAttendanceWithAttributes', () => {
    it('should update attendance with attributes for a student', async () => {
      // Setup
      const studentId = 'student1';
      const status = 'present';
      const attributes = { noShoes: true, notInUniform: false };
      mockAttendanceRepository.updateAttendanceWithAttributes.mockResolvedValue();
      
      // Exercise
      await attendanceService.markAttendanceWithAttributes(mockDate, studentId, status, attributes);
      
      // Verify
      expect(mockAttendanceRepository.updateAttendanceWithAttributes).toHaveBeenCalledWith(
        mockDate,
        studentId,
        status,
        attributes
      );
    });
    
    it('should throw error for invalid status', async () => {
      // Setup
      const studentId = 'student1';
      const invalidStatus = 'invalid';
      const attributes = { noShoes: true };
      
      // Exercise & Verify
      await expect(
        attendanceService.markAttendanceWithAttributes(mockDate, studentId, invalidStatus, attributes)
      ).rejects.toThrow('Invalid attendance status');
    });
    
    it('should allow attributes with any attendance status', async () => {
      // Setup
      const studentId = 'student1';
      const status = 'absent';
      const attributes = { noShoes: true };
      mockAttendanceRepository.updateAttendanceWithAttributes.mockResolvedValue();
      
      // Exercise
      await attendanceService.markAttendanceWithAttributes(mockDate, studentId, status, attributes);
      
      // Verify that the attributes are passed through regardless of status
      expect(mockAttendanceRepository.updateAttendanceWithAttributes).toHaveBeenCalledWith(
        mockDate,
        studentId,
        status,
        attributes
      );
    });
  });

  describe('bulkMarkAttendanceWithAttributes', () => {
    it('should update attendance with attributes for multiple students', async () => {
      // Setup
      const studentIds = ['student1', 'student2'];
      const status = 'present';
      const attributes = { noShoes: true, notInUniform: true };
      mockAttendanceRepository.bulkUpdateAttendanceWithAttributes.mockResolvedValue();
      
      // Exercise
      await attendanceService.bulkMarkAttendanceWithAttributes(mockDate, studentIds, status, attributes);
      
      // Verify
      expect(mockAttendanceRepository.bulkUpdateAttendanceWithAttributes).toHaveBeenCalledWith(
        mockDate,
        studentIds,
        status,
        attributes
      );
    });
  });

  describe('calculateAttendanceFee', () => {
    it('should calculate no fee for present status with no attributes', () => {
      // Exercise
      const fee = attendanceService.calculateAttendanceFee('present', {});
      
      // Verify
      expect(fee).toBe(0);
    });
    
    it('should calculate fixed $5 fee for absent status regardless of attributes', () => {
      // Exercise
      const fee1 = attendanceService.calculateAttendanceFee('absent', {});
      const fee2 = attendanceService.calculateAttendanceFee('absent', { late: true, noShoes: true, notInUniform: true });
      
      // Verify - always $5 for absent regardless of attributes
      expect(fee1).toBe(5);
      expect(fee2).toBe(5);
    });
    
    it('should calculate fee for present status with fee attributes', () => {
      // Exercise
      const feeLate = attendanceService.calculateAttendanceFee('present', { late: true });
      const feeNoShoes = attendanceService.calculateAttendanceFee('present', { noShoes: true });
      const feeNotInUniform = attendanceService.calculateAttendanceFee('present', { notInUniform: true });
      const feeAll = attendanceService.calculateAttendanceFee('present', { 
        late: true, 
        noShoes: true, 
        notInUniform: true 
      });
      
      // Verify
      expect(feeLate).toBe(1);
      expect(feeNoShoes).toBe(1);
      expect(feeNotInUniform).toBe(1);
      expect(feeAll).toBe(3); // All attributes combined
    });
    
    it('should calculate no fee for medicalAbsence and holiday status regardless of attributes', () => {
      // Exercise
      const feeMedical = attendanceService.calculateAttendanceFee('medicalAbsence', {});
      const feeMedicalWithAttributes = attendanceService.calculateAttendanceFee('medicalAbsence', { 
        late: true, 
        noShoes: true, 
        notInUniform: true 
      });
      const feeHoliday = attendanceService.calculateAttendanceFee('holiday', {});
      const feeHolidayWithAttributes = attendanceService.calculateAttendanceFee('holiday', { 
        late: true, 
        noShoes: true, 
        notInUniform: true 
      });
      
      // Verify - always $0 for medical and holiday
      expect(feeMedical).toBe(0);
      expect(feeMedicalWithAttributes).toBe(0);
      expect(feeHoliday).toBe(0);
      expect(feeHolidayWithAttributes).toBe(0);
    });
  });

  describe('updateAttendanceWithFee', () => {
    it('should update attendance and charge fee for present with attributes', async () => {
      // Setup
      const studentId = 'student1';
      const status = 'present';
      const attributes = { late: true, noShoes: true, notInUniform: true };
      const { studentService } = require('../services/StudentService');
      
      // Exercise
      await attendanceService.updateAttendanceWithFee(mockDate, studentId, status, attributes);
      
      // Verify
      expect(mockAttendanceRepository.updateAttendanceWithAttributes).toHaveBeenCalledWith(
        mockDate, studentId, status, attributes
      );
      expect(studentService.addBalance).toHaveBeenCalledWith(studentId, 3); // $3 fee (all attributes)
    });
    
    it('should update attendance and charge fee for absent status', async () => {
      // Setup
      const studentId = 'student1';
      const status = 'absent';
      const attributes = { late: true, noShoes: true, notInUniform: true }; // These should be ignored for absent
      const { studentService } = require('../services/StudentService');
      
      // Exercise
      await attendanceService.updateAttendanceWithFee(mockDate, studentId, status, attributes);
      
      // Verify
      expect(mockAttendanceRepository.updateAttendanceWithAttributes).toHaveBeenCalledWith(
        mockDate, studentId, status, attributes
      );
      expect(studentService.addBalance).toHaveBeenCalledWith(studentId, 5); // Always $5 fee for absent
    });
    
    it('should update attendance with no fee for medicalAbsence', async () => {
      // Setup
      const studentId = 'student1';
      const status = 'medicalAbsence';
      const attributes = { late: true, noShoes: true, notInUniform: true }; // These should be ignored
      const { studentService } = require('../services/StudentService');
      
      // Exercise
      await attendanceService.updateAttendanceWithFee(mockDate, studentId, status, attributes);
      
      // Verify
      expect(mockAttendanceRepository.updateAttendanceWithAttributes).toHaveBeenCalledWith(
        mockDate, studentId, status, attributes
      );
      expect(studentService.addBalance).not.toHaveBeenCalled(); // No fee for medical absence
    });
  });

  describe('bulkUpdateAttendanceWithFee', () => {
    it('should update attendance and charge fees for multiple students with present status', async () => {
      // Setup
      const studentIds = ['student1', 'student2'];
      const status = 'present';
      const attributes = { late: true, noShoes: true };
      const { studentService } = require('../services/StudentService');
      
      // Exercise
      await attendanceService.bulkUpdateAttendanceWithFee(mockDate, studentIds, status, attributes);
      
      // Verify
      expect(mockAttendanceRepository.bulkUpdateAttendanceWithAttributes).toHaveBeenCalledWith(
        mockDate, studentIds, status, attributes
      );
      // Should charge $2 ($1 late + $1 noShoes) for each student
      expect(studentService.addBalance).toHaveBeenCalledTimes(2);
      expect(studentService.addBalance).toHaveBeenCalledWith('student1', 2);
      expect(studentService.addBalance).toHaveBeenCalledWith('student2', 2);
    });
    
    it('should update attendance and charge fixed $5 fee for multiple students with absent status', async () => {
      // Setup
      const studentIds = ['student1', 'student2'];
      const status = 'absent';
      const attributes = { late: true, noShoes: true, notInUniform: true }; // These should be ignored
      const { studentService } = require('../services/StudentService');
      
      // Exercise
      await attendanceService.bulkUpdateAttendanceWithFee(mockDate, studentIds, status, attributes);
      
      // Verify
      expect(mockAttendanceRepository.bulkUpdateAttendanceWithAttributes).toHaveBeenCalledWith(
        mockDate, studentIds, status, attributes
      );
      // Should charge fixed $5 fee for each student
      expect(studentService.addBalance).toHaveBeenCalledTimes(2);
      expect(studentService.addBalance).toHaveBeenCalledWith('student1', 5);
      expect(studentService.addBalance).toHaveBeenCalledWith('student2', 5);
    });
  });
});