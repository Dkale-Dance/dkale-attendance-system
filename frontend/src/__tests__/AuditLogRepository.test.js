import { AuditLogRepository } from '../repository/AuditLogRepository';
import { getFirestore, collection, addDoc, doc, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
// getDoc is imported in the mock but not used in tests

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  Timestamp: {
    fromDate: jest.fn(date => date)
  }
}));

describe('AuditLogRepository', () => {
  let auditLogRepository;
  const mockFirestore = {};
  const mockCollectionRef = {};
  const mockDocRef = {};
  const mockLogId = 'log123';
  const mockTimestamp = new Date();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up mock implementations
    getFirestore.mockReturnValue(mockFirestore);
    collection.mockReturnValue(mockCollectionRef);
    doc.mockReturnValue(mockDocRef);
    addDoc.mockResolvedValue({ id: mockLogId });
    
    auditLogRepository = new AuditLogRepository();
  });
  
  describe('logEvent', () => {
    it('should add a new audit log document', async () => {
      // Arrange
      const logData = {
        type: 'ATTENDANCE_CHANGE',
        userId: 'admin123',
        entityId: 'student123',
        timestamp: mockTimestamp,
        details: {
          date: '2025-03-15',
          oldStatus: 'absent',
          newStatus: 'present'
        }
      };
      
      // Act
      const result = await auditLogRepository.logEvent(logData);
      
      // Assert
      expect(collection).toHaveBeenCalledWith(mockFirestore, 'auditLogs');
      expect(addDoc).toHaveBeenCalledWith(mockCollectionRef, {
        ...logData,
        timestamp: mockTimestamp // Normally this would be a Firestore Timestamp
      });
      expect(result).toEqual({ id: mockLogId });
    });
  });
  
  describe('getLogsByEntityId', () => {
    it('should query logs by entity ID with pagination', async () => {
      // Arrange
      const entityId = 'student123';
      const pageNumber = 1;
      const pageSize = 10;
      const mockLogs = [
        { id: 'log1', data: () => ({ type: 'ATTENDANCE_CHANGE' }) },
        { id: 'log2', data: () => ({ type: 'PAYMENT_CHANGE' }) }
      ];
      
      where.mockReturnValue('whereClause');
      orderBy.mockReturnValue('orderByClause');
      limit.mockReturnValue('limitClause');
      query.mockReturnValue('queryObj');
      
      getDocs.mockResolvedValue({
        docs: mockLogs,
        size: 2,
        empty: false
      });
      
      // Act
      const result = await auditLogRepository.getLogsByEntityId(entityId, pageNumber, pageSize);
      
      // Assert
      expect(collection).toHaveBeenCalledWith(mockFirestore, 'auditLogs');
      expect(where).toHaveBeenCalledWith('entityId', '==', entityId);
      expect(orderBy).toHaveBeenCalledWith('timestamp', 'desc');
      expect(limit).toHaveBeenCalledWith(pageSize);
      expect(query).toHaveBeenCalledWith(mockCollectionRef, 'whereClause', 'orderByClause', 'limitClause');
      expect(result.logs.length).toBe(2);
      expect(result.totalCount).toBe(2);
      expect(result.hasMore).toBe(false);
    });
    
    it('should handle pagination with startAfter', async () => {
      // Arrange
      const entityId = 'student123';
      const pageNumber = 2;
      const pageSize = 10;
      const mockLogs = [
        { id: 'log3', data: () => ({ type: 'FEE_CHANGE' }) }
      ];
      
      where.mockReturnValue('whereClause');
      orderBy.mockReturnValue('orderByClause');
      limit.mockReturnValue('limitClause');
      startAfter.mockReturnValue('startAfterClause');
      query.mockReturnValue('queryWithPaginationObj');
      
      const mockLastVisibleDoc = { data: () => ({ timestamp: new Date() }) };
      
      // Mock implementation for the first query to get the last document of the previous page
      const mockFirstQuerySnapshot = {
        docs: Array(pageSize).fill(null).map((_, i) => ({
          id: `log${i}`,
          data: () => ({ type: 'MOCK_LOG' })
        }))
      };
      mockFirstQuerySnapshot.docs[pageSize - 1] = mockLastVisibleDoc;
      
      getDocs.mockResolvedValueOnce(mockFirstQuerySnapshot)
             .mockResolvedValueOnce({
               docs: mockLogs,
               size: 1,
               empty: false
             });
      
      // Act
      const result = await auditLogRepository.getLogsByEntityId(entityId, pageNumber, pageSize);
      
      // Assert
      expect(result.logs.length).toBe(1);
      expect(result.totalCount).toBe(1);
      expect(result.hasMore).toBe(false);
      expect(startAfter).toHaveBeenCalled();
    });
  });
  
  describe('getLogsByUserId', () => {
    it('should query logs by user ID with pagination', async () => {
      // Arrange
      const userId = 'admin123';
      const pageNumber = 1;
      const pageSize = 10;
      const mockLogs = [
        { id: 'log1', data: () => ({ type: 'ATTENDANCE_CHANGE' }) },
        { id: 'log2', data: () => ({ type: 'PAYMENT_CHANGE' }) }
      ];
      
      where.mockReturnValue('whereClause');
      orderBy.mockReturnValue('orderByClause');
      limit.mockReturnValue('limitClause');
      query.mockReturnValue('queryObj');
      
      getDocs.mockResolvedValue({
        docs: mockLogs,
        size: 2,
        empty: false
      });
      
      // Act
      const result = await auditLogRepository.getLogsByUserId(userId, pageNumber, pageSize);
      
      // Assert
      expect(collection).toHaveBeenCalledWith(mockFirestore, 'auditLogs');
      expect(where).toHaveBeenCalledWith('userId', '==', userId);
      expect(orderBy).toHaveBeenCalledWith('timestamp', 'desc');
      expect(limit).toHaveBeenCalledWith(pageSize);
      expect(query).toHaveBeenCalledWith(mockCollectionRef, 'whereClause', 'orderByClause', 'limitClause');
      expect(result.logs.length).toBe(2);
      expect(result.totalCount).toBe(2);
      expect(result.hasMore).toBe(false);
    });
  });
  
  describe('getLogsByType', () => {
    it('should query logs by type with pagination', async () => {
      // Arrange
      const logType = 'ATTENDANCE_CHANGE';
      const pageNumber = 1;
      const pageSize = 10;
      const mockLogs = [
        { id: 'log1', data: () => ({ type: 'ATTENDANCE_CHANGE', entityId: 'student1' }) },
        { id: 'log2', data: () => ({ type: 'ATTENDANCE_CHANGE', entityId: 'student2' }) }
      ];
      
      where.mockReturnValue('whereClause');
      orderBy.mockReturnValue('orderByClause');
      limit.mockReturnValue('limitClause');
      query.mockReturnValue('queryObj');
      
      getDocs.mockResolvedValue({
        docs: mockLogs,
        size: 2,
        empty: false
      });
      
      // Act
      const result = await auditLogRepository.getLogsByType(logType, pageNumber, pageSize);
      
      // Assert
      expect(collection).toHaveBeenCalledWith(mockFirestore, 'auditLogs');
      expect(where).toHaveBeenCalledWith('type', '==', logType);
      expect(orderBy).toHaveBeenCalledWith('timestamp', 'desc');
      expect(limit).toHaveBeenCalledWith(pageSize);
      expect(query).toHaveBeenCalledWith(mockCollectionRef, 'whereClause', 'orderByClause', 'limitClause');
      expect(result.logs.length).toBe(2);
      expect(result.totalCount).toBe(2);
      expect(result.hasMore).toBe(false);
    });
  });
});