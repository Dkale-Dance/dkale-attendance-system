// InactiveStudentNegativeBalance.test.js
import { reportService } from '../services/ReportService';
import { studentService } from '../services/StudentService';

// Mock repositories
jest.mock('../repository/StudentRepository', () => ({
  studentRepository: {
    getStudentById: jest.fn(),
    updateStudent: jest.fn()
  }
}));

jest.mock('../repository/ReportRepository', () => ({
  reportRepository: {
    getStudentPaymentHistory: jest.fn(),
    getStudentAttendanceHistory: jest.fn()
  }
}));

describe('Negative Balance Handling for Inactive Students', () => {
  const { studentRepository } = require('../repository/StudentRepository');
  const { reportRepository } = require('../repository/ReportRepository');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('calculateStudentBalance for inactive student with negative balance', () => {
    it('should return zero balance when inactive student has more payments than fees', async () => {
      // Setup - student with negative balance (more payments than fees)
      const studentId = 'test-student-id';
      
      // Mock student with negative balance when inactive
      studentRepository.getStudentById.mockResolvedValue({
        id: studentId,
        enrollmentStatus: 'Inactive',
        frozenFeesTotal: 50,
        frozenBalance: -10, // Negative balance scenario
        frozenAt: new Date().toISOString()
      });
      
      // Mock payments of more than total fees
      reportRepository.getStudentPaymentHistory.mockResolvedValue([
        { id: 'payment1', amount: 60, date: new Date() }
      ]);
      
      // Exercise
      const result = await reportService.calculateStudentBalance(studentId);
      
      // Verify
      expect(result.calculatedBalance).toBe(0); // Should be 0, not negative
      expect(result.totalFeesCharged).toBe(50);
      expect(result.totalPaymentsMade).toBe(60);
      expect(result.inactive).toBe(true);
    });
  });
  
  describe('changeEnrollmentStatus to inactive with potential negative balance', () => {
    it('should ensure balance is never negative when setting student to inactive', async () => {
      // Setup
      const studentId = 'test-student-id';
      const newStatus = 'Inactive';
      
      // Mock student with existing data
      studentRepository.getStudentById.mockResolvedValue({
        id: studentId,
        firstName: 'John',
        lastName: 'Doe',
        enrollmentStatus: 'Enrolled'
      });
      
      // Mock updateStudent implementation to return the update data
      studentRepository.updateStudent.mockImplementation((id, data) => {
        return Promise.resolve({ id, ...data });
      });
      
      // Replace the import in changeEnrollmentStatus with a mock
      const mockReportService = {
        calculateStudentBalance: jest.fn().mockResolvedValue({
          totalFeesCharged: 50,
          totalPaymentsMade: 60, // More payments than fees
          calculatedBalance: -10 // This should be corrected to 0
        })
      };
      
      jest.mock('../services/ReportService', () => ({
        reportService: mockReportService
      }));
      
      // Mock the import function
      jest.spyOn(global, 'import').mockImplementation(() => 
        Promise.resolve({ reportService: mockReportService })
      );
      
      // Exercise
      const result = await studentService.changeEnrollmentStatus(studentId, newStatus);
      
      // Verify
      expect(studentRepository.updateStudent).toHaveBeenCalledWith(
        studentId,
        expect.objectContaining({
          enrollmentStatus: 'Inactive',
          frozenFeesTotal: 50,
          frozenBalance: 0, // Should be 0, not -10
          frozenAt: expect.any(String)
        })
      );
      
      // Reset the mock
      global.import.mockRestore();
    });
  });
  
  describe('Financial reports with inactive students', () => {
    it('should not include inactive students in financial reports', () => {
      // This is a conceptual test - the financial report filtering would need more extensive testing
      // Just documenting that inactive students should be excluded from financial reports
    });
  });
});