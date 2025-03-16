/**
 * Service for validating data throughout the application
 */
export default class DataValidationService {
  /**
   * Validates student data
   * @param {Object} studentData - Student data to validate
   * @returns {Object} Object with valid flag and any errors
   */
  validateStudentData(studentData) {
    const errors = [];
    
    // Required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'role'];
    requiredFields.forEach(field => {
      if (!studentData[field]) {
        errors.push(`${field} is required`);
      }
    });
    
    // Email format validation
    if (studentData.email && !this.isValidEmail(studentData.email)) {
      errors.push('email format is invalid');
    }
    
    // If role is student, validate student-specific fields
    if (studentData.role === 'student') {
      // Required for students
      if (!studentData.enrollmentStatus) {
        errors.push('enrollmentStatus is required for students');
      }
      
      // Check valid enrollment status values
      const validStatuses = ['Enrolled', 'Inactive', 'Pending Payment', 'Removed'];
      if (studentData.enrollmentStatus && !validStatuses.includes(studentData.enrollmentStatus)) {
        errors.push(`enrollmentStatus must be one of: ${validStatuses.join(', ')}`);
      }
    }
    
    // Role validation
    const validRoles = ['student', 'admin', 'superadmin'];
    if (studentData.role && !validRoles.includes(studentData.role)) {
      errors.push(`role must be one of: ${validRoles.join(', ')}`);
    }
    
    // Balance should be a number
    if (studentData.balance !== undefined && typeof studentData.balance !== 'number') {
      errors.push('balance must be a number');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validates attendance data for a specific student
   * @param {string} studentId - ID of the student
   * @param {Object} attendanceData - Attendance data to validate
   * @returns {Object} Object with valid flag and any errors
   */
  validateAttendanceData(studentId, attendanceData) {
    const errors = [];
    
    // Required fields
    if (!studentId) {
      errors.push('studentId is required');
    }
    
    if (!attendanceData.status) {
      errors.push('status is required');
    }
    
    if (!attendanceData.timestamp) {
      errors.push('timestamp is required');
    }
    
    // Validate status values
    const validStatuses = ['present', 'absent', 'late', 'medicalAbsence', 'holiday'];
    if (attendanceData.status && !validStatuses.includes(attendanceData.status)) {
      errors.push(`status must be one of: ${validStatuses.join(', ')}`);
    }
    
    // Validate attributes is an object if provided
    if (attendanceData.attributes !== undefined && 
        (typeof attendanceData.attributes !== 'object' || attendanceData.attributes === null)) {
      errors.push('attributes must be an object');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validates payment data
   * @param {Object} paymentData - Payment data to validate
   * @returns {Object} Object with valid flag and any errors
   */
  validatePaymentData(paymentData) {
    const errors = [];
    
    // Required fields
    const requiredFields = ['studentId', 'amount', 'timestamp'];
    requiredFields.forEach(field => {
      if (!paymentData[field]) {
        errors.push(`${field} is required`);
      }
    });
    
    // Amount should be a positive number
    if (paymentData.amount !== undefined) {
      if (typeof paymentData.amount !== 'number') {
        errors.push('amount must be a number');
      } else if (paymentData.amount <= 0) {
        errors.push('amount must be a positive number');
      }
    }
    
    // Payment method validation
    const validPaymentMethods = ['cash', 'credit', 'bank_transfer', 'check', 'other'];
    if (paymentData.paymentMethod && !validPaymentMethods.includes(paymentData.paymentMethod)) {
      errors.push(`paymentMethod must be one of: ${validPaymentMethods.join(', ')}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validates a query for pagination
   * @param {Object} paginationQuery - Query parameters for pagination
   * @returns {Object} Object with valid flag, any errors, and sanitized query params
   */
  validatePaginationQuery(paginationQuery) {
    const errors = [];
    const sanitized = {};
    
    // Page number - default to 1 if invalid
    if (paginationQuery.page !== undefined) {
      const pageNum = parseInt(paginationQuery.page, 10);
      if (isNaN(pageNum) || pageNum < 1) {
        errors.push('page must be a positive integer');
        sanitized.page = 1;
      } else {
        sanitized.page = pageNum;
      }
    } else {
      sanitized.page = 1; // Default
    }
    
    // Limit - default to 10 if invalid
    if (paginationQuery.limit !== undefined) {
      const limitNum = parseInt(paginationQuery.limit, 10);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        errors.push('limit must be a positive integer between 1 and 100');
        sanitized.limit = 10;
      } else {
        sanitized.limit = limitNum;
      }
    } else {
      sanitized.limit = 10; // Default
    }
    
    return {
      valid: errors.length === 0,
      errors,
      sanitized
    };
  }
  
  /**
   * Checks if a string is a valid email format
   * @param {string} email - Email to validate
   * @returns {boolean} Whether the email is valid
   */
  isValidEmail(email) {
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export a singleton instance
export const dataValidationService = new DataValidationService();