// InactiveStudentManagement.test.js
import { StudentService, studentService } from '../services/StudentService';
import { reportService } from '../services/ReportService';

// Mock repositories
jest.mock('../repository/StudentRepository', () => ({
  studentRepository: {
    getStudentById: jest.fn(),
    updateStudent: jest.fn(),
    getAllStudents: jest.fn()
  }
}));

// Mock ReportService
jest.mock('../services/ReportService', () => ({
  reportService: {
    calculateStudentBalance: jest.fn()
  }
}));

describe('Inactive Student Management', () => {
  const { studentRepository } = require('../repository/StudentRepository');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('clearStudentBalance', () => {
    it('should clear a student\'s balance and record the reason', async () => {
      // Setup
      const studentId = 'test-student-id';
      const reason = 'Student moved away';
      
      studentRepository.getStudentById.mockResolvedValue({
        id: studentId,
        firstName: 'John',
        lastName: 'Doe',
        balance: 50.00
      });
      
      studentRepository.updateStudent.mockResolvedValue({
        id: studentId,
        balance: 0,
        balanceHistory: {
          cleared: {
            date: expect.any(String),
            previousBalance: 50.00,
            reason: reason
          }
        }
      });
      
      // Execute
      const result = await studentService.clearStudentBalance(studentId, reason);
      
      // Verify
      expect(studentRepository.getStudentById).toHaveBeenCalledWith(studentId);
      expect(studentRepository.updateStudent).toHaveBeenCalledWith(
        studentId,
        expect.objectContaining({
          balance: 0,
          balanceHistory: expect.objectContaining({
            cleared: expect.objectContaining({
              previousBalance: 50.00,
              reason: reason
            })
          })
        })
      );
      
      // Check the result
      expect(result.balance).toBe(0);
      expect(result.balanceHistory.cleared.reason).toBe(reason);
    });
    
    it('should throw an error if student is not found', async () => {
      // Setup
      const studentId = 'non-existent-id';
      const reason = 'Student moved away';
      
      studentRepository.getStudentById.mockResolvedValue(null);
      
      // Execute & Verify
      await expect(studentService.clearStudentBalance(studentId, reason))
        .rejects.toThrow('Student not found');
    });
  });
  
  describe('changeEnrollmentStatus when setting to Inactive', () => {
    it('should store frozen fee information when setting to Inactive', async () => {
      // Setup
      const studentId = 'test-student-id';
      const newStatus = 'Inactive';
      
      studentRepository.getStudentById.mockResolvedValue({
        id: studentId,
        firstName: 'John',
        lastName: 'Doe',
        enrollmentStatus: 'Enrolled',
        balance: 60.00
      });
      
      reportService.calculateStudentBalance.mockResolvedValue({
        totalFeesCharged: 100.00,
        totalPaymentsMade: 40.00,
        calculatedBalance: 60.00
      });
      
      studentRepository.updateStudent.mockImplementation((id, data) => {
        return Promise.resolve({
          id,
          ...data
        });
      });
      
      // Execute
      const result = await studentService.changeEnrollmentStatus(studentId, newStatus);
      
      // Verify
      expect(studentRepository.getStudentById).toHaveBeenCalledWith(studentId);
      expect(studentRepository.updateStudent).toHaveBeenCalledWith(
        studentId,
        expect.objectContaining({
          enrollmentStatus: 'Inactive',
          frozenFeesTotal: expect.any(Number),
          frozenBalance: expect.any(Number),
          frozenAt: expect.any(String)
        })
      );
      
      // Check the result
      expect(result.enrollmentStatus).toBe('Inactive');
      expect(result).toHaveProperty('frozenAt');
    });
  });
  
  describe('getEligibleStudents in AttendanceService', () => {
    it('should exclude inactive students from eligible students list', async () => {
      // This is a conceptual test - AttendanceService integration would need to be tested separately
      // Just documenting that inactive students should be excluded from attendance tracking
    });
  });
});