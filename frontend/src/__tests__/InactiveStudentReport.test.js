// InactiveStudentReport.test.js
import { reportService } from '../services/ReportService';

// Mock repositories
jest.mock('../repository/ReportRepository', () => ({
  reportRepository: {
    getStudentAttendanceHistory: jest.fn(),
    getStudentPaymentHistory: jest.fn()
  }
}));

jest.mock('../repository/StudentRepository', () => ({
  studentRepository: {
    getStudentById: jest.fn(),
    getAllStudents: jest.fn()
  }
}));

describe('Report Service with Inactive Students', () => {
  const { reportRepository } = require('../repository/ReportRepository');
  const { studentRepository } = require('../repository/StudentRepository');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('calculateStudentBalance for inactive students', () => {
    it('should return frozen balance information for inactive students', async () => {
      // Setup
      const studentId = 'inactive-student-id';
      const frozenDate = new Date();
      
      // Mock an inactive student with frozen balance
      studentRepository.getStudentById.mockResolvedValue({
        id: studentId,
        firstName: 'John',
        lastName: 'Doe',
        enrollmentStatus: 'Inactive',
        frozenFeesTotal: 80.00,
        frozenBalance: 50.00,
        frozenAt: frozenDate.toISOString()
      });
      
      reportRepository.getStudentPaymentHistory.mockResolvedValue([
        { id: 'payment1', amount: 30.00, date: new Date() }
      ]);
      
      reportRepository.getStudentAttendanceHistory.mockResolvedValue([
        // This should be ignored for inactive students
        { date: '2023-04-15', record: { status: 'absent', attributes: {} } }
      ]);
      
      // Execute
      const result = await reportService.calculateStudentBalance(studentId);
      
      // Verify
      expect(studentRepository.getStudentById).toHaveBeenCalledWith(studentId);
      expect(reportRepository.getStudentPaymentHistory).toHaveBeenCalledWith(studentId);
      
      // For inactive students, we shouldn't calculate new fees
      expect(result.totalFeesCharged).toBe(80.00); // should be frozen total
      expect(result.totalPaymentsMade).toBe(30.00);
      expect(result.calculatedBalance).toBe(50.00);
      expect(result.inactive).toBe(true);
    });
  });
  
  describe('getPublicDashboardData', () => {
    it('should exclude inactive students from public dashboard', async () => {
      // Setup
      studentRepository.getAllStudents.mockResolvedValue([
        { id: 'student1', firstName: 'Alice', lastName: 'Smith', enrollmentStatus: 'Enrolled' },
        { id: 'student2', firstName: 'Bob', lastName: 'Jones', enrollmentStatus: 'Inactive' },
        { id: 'student3', firstName: 'Charlie', lastName: 'Brown', enrollmentStatus: 'Pending Payment' }
      ]);
      
      reportRepository.getStudentPaymentHistory.mockResolvedValue([]);
      
      // Mock balance calculation to return different values for different students
      const mockedBalanceInfo = {
        student1: { totalFeesCharged: 100, totalPaymentsMade: 50, calculatedBalance: 50 },
        student3: { totalFeesCharged: 80, totalPaymentsMade: 20, calculatedBalance: 60 }
      };
      
      reportService.calculateStudentBalance = jest.fn().mockImplementation((studentId) => {
        return Promise.resolve(mockedBalanceInfo[studentId] || { 
          totalFeesCharged: 0, 
          totalPaymentsMade: 0, 
          calculatedBalance: 0 
        });
      });
      
      // Execute 
      const result = await reportService.getPublicDashboardData();
      
      // Verify that inactive students are excluded
      expect(result.length).toBe(2);
      expect(result.some(student => student.id === 'student2')).toBe(false);
      expect(result.some(student => student.id === 'student1')).toBe(true);
      expect(result.some(student => student.id === 'student3')).toBe(true);
    });
  });
});