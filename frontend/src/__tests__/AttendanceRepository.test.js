import { AttendanceRepository } from '../repository/AttendanceRepository';
import { getFirestore, collection, doc, setDoc, getDoc, query, where, getDocs } from 'firebase/firestore';
import * as DateUtils from '../utils/DateUtils';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((date) => date),
  },
}));

describe('AttendanceRepository', () => {
  let attendanceRepository;
  const mockDb = {};
  const mockDoc = { exists: jest.fn(), data: jest.fn() };
  const mockDocRef = {};
  const mockCollectionRef = {};
  const mockQuery = {};
  const mockQuerySnapshot = { docs: [] };
  const mockDate = new Date('2025-03-08');

  beforeEach(() => {
    jest.clearAllMocks();
    getFirestore.mockReturnValue(mockDb);
    collection.mockReturnValue(mockCollectionRef);
    doc.mockReturnValue(mockDocRef);
    getDoc.mockResolvedValue(mockDoc);
    query.mockReturnValue(mockQuery);
    getDocs.mockResolvedValue(mockQuerySnapshot);
    setDoc.mockResolvedValue();
    
    // Mock the formatDateForDocId function
    jest.spyOn(DateUtils, 'formatDateForDocId').mockImplementation(date => {
      return '2025-03-08'; // Return a fixed date string for tests
    });

    attendanceRepository = new AttendanceRepository();
  });

  describe('getAttendanceByDate', () => {
    it('should fetch attendance records for a specific date', async () => {
      // Setup
      const date = mockDate;
      const studentId1 = 'student1';
      const studentId2 = 'student2';
      const mockAttendanceData = {
        [studentId1]: { status: 'present', timestamp: mockDate },
        [studentId2]: { status: 'absent', timestamp: mockDate }
      };
      
      mockDoc.exists.mockReturnValue(true);
      mockDoc.data.mockReturnValue(mockAttendanceData);
      
      // Exercise
      const result = await attendanceRepository.getAttendanceByDate(date);
      
      // Verify
      expect(doc).toHaveBeenCalledWith(
        mockDb, 
        'attendance', 
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
      );
      expect(getDoc).toHaveBeenCalledWith(mockDocRef);
      expect(result).toEqual(mockAttendanceData);
    });
    
    it('should return empty object if no attendance records exist for the date', async () => {
      // Setup
      const date = mockDate;
      mockDoc.exists.mockReturnValue(false);
      
      // Exercise
      const result = await attendanceRepository.getAttendanceByDate(date);
      
      // Verify
      expect(result).toEqual({});
    });
  });

  describe('updateAttendance', () => {
    it('should update attendance for a student on a specific date', async () => {
      // Setup
      const date = mockDate;
      const studentId = 'student1';
      const status = 'present';
      
      // Exercise
      await attendanceRepository.updateAttendance(date, studentId, status);
      
      // Verify
      expect(doc).toHaveBeenCalledWith(
        mockDb, 
        'attendance', 
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
      );
      expect(setDoc).toHaveBeenCalledWith(
        mockDocRef,
        {
          [studentId]: { 
            status,
            timestamp: undefined, // In the test, Timestamp.fromDate returns undefined due to our mock
            attributes: {}
          }
        },
        { merge: true }
      );
    });
  });

  describe('bulkUpdateAttendance', () => {
    it('should update attendance for multiple students on a specific date', async () => {
      // Setup
      const date = mockDate;
      const studentIds = ['student1', 'student2'];
      const status = 'present';
      const expectedUpdateData = {
        student1: { 
          status, 
          timestamp: undefined, // In the test, Timestamp.fromDate returns undefined
          attributes: {}
        },
        student2: { 
          status, 
          timestamp: undefined,
          attributes: {}
        },
      };
      
      // Exercise
      await attendanceRepository.bulkUpdateAttendance(date, studentIds, status);
      
      // Verify
      expect(doc).toHaveBeenCalledWith(
        mockDb, 
        'attendance', 
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
      );
      expect(setDoc).toHaveBeenCalledWith(
        mockDocRef,
        expectedUpdateData,
        { merge: true }
      );
    });
  });
  
  describe('updateAttendanceWithAttributes', () => {
    it('should update attendance with specific attributes', async () => {
      // Setup
      const date = mockDate;
      const studentId = 'student1';
      const status = 'present';
      const attributes = { noShoes: true, notInUniform: true };
      
      // Exercise
      await attendanceRepository.updateAttendanceWithAttributes(date, studentId, status, attributes);
      
      // Verify
      expect(doc).toHaveBeenCalledWith(
        mockDb, 
        'attendance', 
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
      );
      expect(setDoc).toHaveBeenCalledWith(
        mockDocRef,
        {
          [studentId]: { 
            status,
            timestamp: undefined, // In the test, Timestamp.fromDate returns undefined due to our mock
            attributes
          }
        },
        { merge: true }
      );
    });
  });
  
  describe('bulkUpdateAttendanceWithAttributes', () => {
    it('should update attendance with attributes for multiple students', async () => {
      // Setup
      const date = mockDate;
      const studentIds = ['student1', 'student2'];
      const status = 'late';
      const attributes = { noShoes: true };
      const expectedUpdateData = {
        student1: { 
          status, 
          timestamp: undefined,
          attributes
        },
        student2: { 
          status, 
          timestamp: undefined,
          attributes
        },
      };
      
      // Exercise
      await attendanceRepository.bulkUpdateAttendanceWithAttributes(date, studentIds, status, attributes);
      
      // Verify
      expect(doc).toHaveBeenCalledWith(
        mockDb, 
        'attendance', 
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
      );
      expect(setDoc).toHaveBeenCalledWith(
        mockDocRef,
        expectedUpdateData,
        { merge: true }
      );
    });
  });
  
  describe('removeAttendance', () => {
    it('should remove a specific student attendance record', async () => {
      // Setup
      const date = mockDate;
      const studentId = 'student1';
      const mockAttendanceData = {
        student1: { status: 'present', timestamp: mockDate, attributes: {} },
        student2: { status: 'absent', timestamp: mockDate, attributes: {} }
      };
      
      mockDoc.exists.mockReturnValue(true);
      mockDoc.data.mockReturnValue(mockAttendanceData);
      
      // Exercise
      const result = await attendanceRepository.removeAttendance(date, studentId);
      
      // Verify
      expect(doc).toHaveBeenCalledWith(mockDb, 'attendance', expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
      expect(getDoc).toHaveBeenCalledWith(mockDocRef);
      expect(setDoc).toHaveBeenCalledWith(
        mockDocRef, 
        { student2: { status: 'absent', timestamp: mockDate, attributes: {} } }
      );
      expect(result).toEqual({ status: 'present', timestamp: mockDate, attributes: {} });
    });
    
    it('should handle non-existent document', async () => {
      // Setup
      const date = mockDate;
      const studentId = 'student1';
      
      mockDoc.exists.mockReturnValue(false);
      
      // Exercise
      const result = await attendanceRepository.removeAttendance(date, studentId);
      
      // Verify
      expect(getDoc).toHaveBeenCalledWith(mockDocRef);
      expect(setDoc).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
    
    it('should handle non-existent student record', async () => {
      // Setup
      const date = mockDate;
      const studentId = 'student1';
      const mockAttendanceData = {
        student2: { status: 'absent', timestamp: mockDate, attributes: {} }
      };
      
      mockDoc.exists.mockReturnValue(true);
      mockDoc.data.mockReturnValue(mockAttendanceData);
      
      // Exercise
      const result = await attendanceRepository.removeAttendance(date, studentId);
      
      // Verify
      expect(getDoc).toHaveBeenCalledWith(mockDocRef);
      expect(setDoc).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });
});