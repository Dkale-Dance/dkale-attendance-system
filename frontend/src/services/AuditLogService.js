import { auditLogRepository } from "../repository/AuditLogRepository";

export class AuditLogService {
  constructor(auditLogRepository) {
    this.auditLogRepository = auditLogRepository;
  }
  
  /**
   * Logs a change in attendance status for a student
   * @param {string} userId - ID of the user who made the change
   * @param {string} studentId - ID of the student whose attendance was changed
   * @param {Date} date - Date of the attendance record
   * @param {string} oldStatus - Previous attendance status
   * @param {string} newStatus - New attendance status
   * @returns {Promise<Object>} Result of the logging operation
   */
  async logAttendanceChange(userId, studentId, date, oldStatus, newStatus) {
    try {
      return await this.auditLogRepository.logEvent({
        type: 'ATTENDANCE_CHANGE',
        userId,
        entityId: studentId,
        timestamp: new Date(),
        details: {
          date: date.toISOString().split('T')[0], // YYYY-MM-DD format
          oldStatus,
          newStatus,
        }
      });
    } catch (error) {
      console.error("Error logging attendance change:", error);
      throw new Error(`Failed to log attendance change: ${error.message}`);
    }
  }
  
  /**
   * Logs a payment operation for a student
   * @param {string} userId - ID of the user who made the payment operation
   * @param {string} studentId - ID of the student related to the payment
   * @param {string} paymentId - ID of the payment record
   * @param {number} amount - Amount of the payment
   * @param {string} operation - Operation type (CREATE, UPDATE, DELETE)
   * @returns {Promise<Object>} Result of the logging operation
   */
  async logPaymentChange(userId, studentId, paymentId, amount, operation) {
    try {
      return await this.auditLogRepository.logEvent({
        type: 'PAYMENT_CHANGE',
        userId,
        entityId: studentId,
        timestamp: new Date(),
        details: {
          paymentId,
          amount,
          operation,
        }
      });
    } catch (error) {
      console.error("Error logging payment change:", error);
      throw new Error(`Failed to log payment change: ${error.message}`);
    }
  }
  
  /**
   * Logs a change in fee/balance for a student
   * @param {string} userId - ID of the user who made the fee change
   * @param {string} studentId - ID of the student whose balance was changed
   * @param {number} oldBalance - Previous balance amount
   * @param {number} newBalance - New balance amount
   * @param {string} reason - Reason for the fee change
   * @returns {Promise<Object>} Result of the logging operation
   */
  async logFeeChange(userId, studentId, oldBalance, newBalance, reason) {
    try {
      return await this.auditLogRepository.logEvent({
        type: 'FEE_CHANGE',
        userId,
        entityId: studentId,
        timestamp: new Date(),
        details: {
          oldBalance,
          newBalance,
          difference: newBalance - oldBalance,
          reason,
        }
      });
    } catch (error) {
      console.error("Error logging fee change:", error);
      throw new Error(`Failed to log fee change: ${error.message}`);
    }
  }
  
  /**
   * Retrieves all logs for a specific entity (student) with pagination
   * @param {string} entityId - ID of the entity to fetch logs for
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of logs per page
   * @returns {Promise<Object>} Paginated logs and metadata
   */
  async getLogsByEntityId(entityId, page = 1, limit = 10) {
    try {
      return await this.auditLogRepository.getLogsByEntityId(entityId, page, limit);
    } catch (error) {
      console.error("Error fetching logs by entity ID:", error);
      throw new Error(`Failed to fetch logs by entity ID: ${error.message}`);
    }
  }
  
  /**
   * Retrieves all logs for a specific user with pagination
   * @param {string} userId - ID of the user who performed the actions
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of logs per page
   * @returns {Promise<Object>} Paginated logs and metadata
   */
  async getLogsByUserId(userId, page = 1, limit = 10) {
    try {
      return await this.auditLogRepository.getLogsByUserId(userId, page, limit);
    } catch (error) {
      console.error("Error fetching logs by user ID:", error);
      throw new Error(`Failed to fetch logs by user ID: ${error.message}`);
    }
  }
  
  /**
   * Retrieves all logs of a specific type with pagination
   * @param {string} logType - Type of logs to fetch
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of logs per page
   * @returns {Promise<Object>} Paginated logs and metadata
   */
  async getLogsByType(logType, page = 1, limit = 10) {
    try {
      return await this.auditLogRepository.getLogsByType(logType, page, limit);
    } catch (error) {
      console.error("Error fetching logs by type:", error);
      throw new Error(`Failed to fetch logs by type: ${error.message}`);
    }
  }
}

// Export a singleton instance
export const auditLogService = new AuditLogService(auditLogRepository);