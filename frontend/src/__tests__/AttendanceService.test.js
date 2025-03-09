import AttendanceService from '../services/AttendanceService';

// Mock Firebase's Firestore
jest.mock('firebase/firestore');
jest.mock('../lib/firebase/config/config', () => ({}));

describe('AttendanceService', () => {
  let attendanceService;
  let mockAttendanceRepository;
  let mockStudentRepository;
  let mockDate;

  beforeEach(() => {
    mockDate = new Date('2025-03-08');
    
    mockAttendanceRepository = {
      getAttendanceByDate: jest.fn(),
      updateAttendance: jest.fn(),
      bulkUpdateAttendance: jest.fn()
    };
    
    mockStudentRepository = {
      getAllStudents: jest.fn(),
      getStudentsByStatus: jest.fn()
    };
    
    attendanceService = new AttendanceService(mockAttendanceRepository, mockStudentRepository);
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
        'student1': { status: 'present', timestamp: mockDate }
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
          attendance: { status: 'present', timestamp: mockDate }
        },
        {
          ...mockStudents[1],
          attendance: null // No attendance record
        }
      ]);
    });
  });
});