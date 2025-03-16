import { AuditLogService } from '../services/AuditLogService';
import { auditLogRepository } from '../repository/AuditLogRepository';

// Mock the repository
jest.mock('../repository/AuditLogRepository', () => ({
  auditLogRepository: {
    logEvent: jest.fn(),
    getLogsByEntityId: jest.fn(),
    getLogsByUserId: jest.fn(),
    getLogsByType: jest.fn(),
  }
}));

describe('AuditLogService', () => {
  let auditLogService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    auditLogService = new AuditLogService(auditLogRepository);
  });

  describe('logAttendanceChange', () => {
    it('should log attendance change event', async () => {
      // Arrange
      const payload = {
        userId: 'admin123',
        studentId: 'student123',
        date: new Date('2025-03-15'),
        oldStatus: 'absent',
        newStatus: 'present',
      };

      auditLogRepository.logEvent.mockResolvedValue({ id: 'log123' });

      // Act
      const result = await auditLogService.logAttendanceChange(
        payload.userId,
        payload.studentId,
        payload.date,
        payload.oldStatus,
        payload.newStatus
      );

      // Assert
      expect(auditLogRepository.logEvent).toHaveBeenCalledWith({
        type: 'ATTENDANCE_CHANGE',
        userId: payload.userId,
        entityId: payload.studentId,
        timestamp: expect.any(Date),
        details: {
          date: expect.any(String),
          oldStatus: payload.oldStatus,
          newStatus: payload.newStatus,
        }
      });
      
      expect(result).toEqual({ id: 'log123' });
    });
  });

  describe('logPaymentChange', () => {
    it('should log payment change event', async () => {
      // Arrange
      const payload = {
        userId: 'admin123',
        studentId: 'student123',
        paymentId: 'payment123',
        amount: 100,
        operation: 'CREATE',
      };

      auditLogRepository.logEvent.mockResolvedValue({ id: 'log456' });

      // Act
      const result = await auditLogService.logPaymentChange(
        payload.userId,
        payload.studentId,
        payload.paymentId,
        payload.amount,
        payload.operation
      );

      // Assert
      expect(auditLogRepository.logEvent).toHaveBeenCalledWith({
        type: 'PAYMENT_CHANGE',
        userId: payload.userId,
        entityId: payload.studentId,
        timestamp: expect.any(Date),
        details: {
          paymentId: payload.paymentId,
          amount: payload.amount,
          operation: payload.operation,
        }
      });
      
      expect(result).toEqual({ id: 'log456' });
    });
  });

  describe('logFeeChange', () => {
    it('should log fee change event', async () => {
      // Arrange
      const payload = {
        userId: 'admin123',
        studentId: 'student123',
        oldBalance: 150,
        newBalance: 250,
        reason: 'Monthly fee',
      };

      auditLogRepository.logEvent.mockResolvedValue({ id: 'log789' });

      // Act
      const result = await auditLogService.logFeeChange(
        payload.userId,
        payload.studentId,
        payload.oldBalance,
        payload.newBalance,
        payload.reason
      );

      // Assert
      expect(auditLogRepository.logEvent).toHaveBeenCalledWith({
        type: 'FEE_CHANGE',
        userId: payload.userId,
        entityId: payload.studentId,
        timestamp: expect.any(Date),
        details: {
          oldBalance: payload.oldBalance,
          newBalance: payload.newBalance,
          difference: payload.newBalance - payload.oldBalance,
          reason: payload.reason,
        }
      });
      
      expect(result).toEqual({ id: 'log789' });
    });
  });

  describe('getLogsByEntityId', () => {
    it('should fetch logs by entity ID with pagination', async () => {
      // Arrange
      const entityId = 'student123';
      const page = 1;
      const limit = 10;
      const mockLogs = [{ id: 'log1' }, { id: 'log2' }];
      
      auditLogRepository.getLogsByEntityId.mockResolvedValue({
        logs: mockLogs,
        totalCount: 2,
        hasMore: false
      });

      // Act
      const result = await auditLogService.getLogsByEntityId(entityId, page, limit);

      // Assert
      expect(auditLogRepository.getLogsByEntityId).toHaveBeenCalledWith(entityId, page, limit);
      expect(result).toEqual({
        logs: mockLogs,
        totalCount: 2,
        hasMore: false
      });
    });
  });

  describe('getLogsByUserId', () => {
    it('should fetch logs by user ID with pagination', async () => {
      // Arrange
      const userId = 'admin123';
      const page = 1;
      const limit = 10;
      const mockLogs = [{ id: 'log1' }, { id: 'log2' }];
      
      auditLogRepository.getLogsByUserId.mockResolvedValue({
        logs: mockLogs,
        totalCount: 2,
        hasMore: false
      });

      // Act
      const result = await auditLogService.getLogsByUserId(userId, page, limit);

      // Assert
      expect(auditLogRepository.getLogsByUserId).toHaveBeenCalledWith(userId, page, limit);
      expect(result).toEqual({
        logs: mockLogs,
        totalCount: 2,
        hasMore: false
      });
    });
  });
});