import DataValidationService from '../services/DataValidationService';

describe('DataValidationService', () => {
  let dataValidationService;
  
  beforeEach(() => {
    dataValidationService = new DataValidationService();
  });
  
  describe('validateStudentData', () => {
    it('should validate complete student data', () => {
      const validStudentData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        enrollmentStatus: 'Enrolled',
        balance: 0,
        role: 'student'
      };
      
      const result = dataValidationService.validateStudentData(validStudentData);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    it('should report missing required fields', () => {
      const invalidStudentData = {
        firstName: 'John',
        // lastName is missing
        email: 'john.doe@example.com',
        enrollmentStatus: 'Enrolled',
        balance: 0,
        role: 'student'
      };
      
      const result = dataValidationService.validateStudentData(invalidStudentData);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('lastName is required');
    });
    
    it('should validate email format', () => {
      const invalidStudentData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        enrollmentStatus: 'Enrolled',
        balance: 0,
        role: 'student'
      };
      
      const result = dataValidationService.validateStudentData(invalidStudentData);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('email format is invalid');
    });
    
    it('should validate enrollment status', () => {
      const invalidStudentData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        enrollmentStatus: 'InvalidStatus',
        balance: 0,
        role: 'student'
      };
      
      const result = dataValidationService.validateStudentData(invalidStudentData);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('enrollmentStatus must be one of: Enrolled, Inactive, Pending Payment, Removed');
    });
    
    it('should validate balance is a number', () => {
      const invalidStudentData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        enrollmentStatus: 'Enrolled',
        balance: 'not-a-number',
        role: 'student'
      };
      
      const result = dataValidationService.validateStudentData(invalidStudentData);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('balance must be a number');
    });
  });
  
  describe('validateAttendanceData', () => {
    it('should validate complete attendance record', () => {
      const validAttendanceData = {
        status: 'present',
        timestamp: new Date(),
        attributes: {}
      };
      
      const result = dataValidationService.validateAttendanceData('student1', validAttendanceData);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    it('should validate attendance status value', () => {
      const invalidAttendanceData = {
        status: 'invalid-status',
        timestamp: new Date(),
        attributes: {}
      };
      
      const result = dataValidationService.validateAttendanceData('student1', invalidAttendanceData);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('status must be one of: present, absent, late, medicalAbsence, holiday');
    });
    
    it('should require timestamp', () => {
      const invalidAttendanceData = {
        status: 'present',
        // timestamp is missing
        attributes: {}
      };
      
      const result = dataValidationService.validateAttendanceData('student1', invalidAttendanceData);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('timestamp is required');
    });
    
    it('should validate attributes is an object', () => {
      const invalidAttendanceData = {
        status: 'present',
        timestamp: new Date(),
        attributes: 'not-an-object'
      };
      
      const result = dataValidationService.validateAttendanceData('student1', invalidAttendanceData);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('attributes must be an object');
    });
  });
  
  describe('validatePaymentData', () => {
    it('should validate complete payment data', () => {
      const validPaymentData = {
        studentId: 'student1',
        amount: 100,
        description: 'Monthly fee',
        paymentMethod: 'credit',
        timestamp: new Date()
      };
      
      const result = dataValidationService.validatePaymentData(validPaymentData);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    it('should require studentId', () => {
      const invalidPaymentData = {
        // studentId is missing
        amount: 100,
        description: 'Monthly fee',
        paymentMethod: 'credit',
        timestamp: new Date()
      };
      
      const result = dataValidationService.validatePaymentData(invalidPaymentData);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('studentId is required');
    });
    
    it('should validate amount is positive', () => {
      const invalidPaymentData = {
        studentId: 'student1',
        amount: -50,
        description: 'Monthly fee',
        paymentMethod: 'credit',
        timestamp: new Date()
      };
      
      const result = dataValidationService.validatePaymentData(invalidPaymentData);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('amount must be a positive number');
    });
    
    it('should validate paymentMethod', () => {
      const invalidPaymentData = {
        studentId: 'student1',
        amount: 100,
        description: 'Monthly fee',
        paymentMethod: 'invalid-method',
        timestamp: new Date()
      };
      
      const result = dataValidationService.validatePaymentData(invalidPaymentData);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('paymentMethod must be one of: cash, credit, bank_transfer, check, other');
    });
    
    it('should require timestamp', () => {
      const invalidPaymentData = {
        studentId: 'student1',
        amount: 100,
        description: 'Monthly fee',
        paymentMethod: 'credit',
        // timestamp is missing
      };
      
      const result = dataValidationService.validatePaymentData(invalidPaymentData);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('timestamp is required');
    });
  });
});