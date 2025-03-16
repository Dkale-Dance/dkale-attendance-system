import { ErrorHandlerService, ErrorTypes } from '../services/ErrorHandlerService';

describe('ErrorHandlerService', () => {
  let errorHandlerService;
  
  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();
    
    // Mock console methods
    global.console.error = jest.fn();
    global.console.warn = jest.fn();
    
    // Create a new instance of the service
    errorHandlerService = new ErrorHandlerService();
    
    // Add a test error handler
    errorHandlerService.registerErrorHandler('testHandler', (error, context) => {
      return {
        message: `Handler received: ${error.message}`,
        handled: true,
        data: context
      };
    });
  });
  
  describe('handleError', () => {
    it('should handle a validation error', () => {
      // Arrange
      const error = {
        type: ErrorTypes.VALIDATION_ERROR,
        message: 'Invalid data',
        details: ['Field is required']
      };
      const context = { component: 'StudentForm' };
      
      // Act
      const result = errorHandlerService.handleError(error, context);
      
      // Assert
      expect(result.message).toBe('Invalid data');
      expect(result.type).toBe(ErrorTypes.VALIDATION_ERROR);
      expect(result.details).toEqual(['Field is required']);
      expect(result.handled).toBe(true);
      expect(console.warn).toHaveBeenCalled();
    });
    
    it('should handle an auth error', () => {
      // Arrange
      const error = {
        type: ErrorTypes.AUTH_ERROR,
        message: 'Not authorized',
        code: 'permission-denied'
      };
      const context = { component: 'StudentManagement' };
      
      // Act
      const result = errorHandlerService.handleError(error, context);
      
      // Assert
      expect(result.message).toBe('Not authorized');
      expect(result.type).toBe(ErrorTypes.AUTH_ERROR);
      expect(result.handled).toBe(true);
      expect(console.error).toHaveBeenCalled();
    });
    
    it('should handle a network error', () => {
      // Arrange
      const error = {
        type: ErrorTypes.NETWORK_ERROR,
        message: 'Network issue',
        statusCode: 500
      };
      const context = { component: 'AttendanceDashboard' };
      
      // Act
      const result = errorHandlerService.handleError(error, context);
      
      // Assert
      expect(result.message).toBe('Network issue');
      expect(result.type).toBe(ErrorTypes.NETWORK_ERROR);
      expect(result.handled).toBe(true);
      expect(console.error).toHaveBeenCalled();
    });
    
    it('should handle an unknown error', () => {
      // Arrange
      const error = new Error('Something went wrong');
      const context = { component: 'PaymentDashboard' };
      
      // Act
      const result = errorHandlerService.handleError(error, context);
      
      // Assert
      expect(result.message).toBe('Something went wrong');
      expect(result.type).toBe(ErrorTypes.UNKNOWN_ERROR);
      expect(result.handled).toBe(true);
      expect(console.error).toHaveBeenCalled();
    });
    
    it('should use a registered custom handler', () => {
      // Arrange
      const error = {
        type: 'CUSTOM_ERROR',
        message: 'Custom error',
        handlerName: 'testHandler'
      };
      const context = { component: 'Reports' };
      
      // Act
      const result = errorHandlerService.handleError(error, context);
      
      // Assert
      expect(result.message).toBe('Handler received: Custom error');
      expect(result.handled).toBe(true);
      expect(result.data).toEqual(context);
    });
  });
  
  describe('registerErrorHandler', () => {
    it('should register a new error handler', () => {
      // Arrange
      const handlerName = 'newHandler';
      const handler = jest.fn();
      
      // Act
      errorHandlerService.registerErrorHandler(handlerName, handler);
      
      // Assert
      expect(errorHandlerService.hasHandler(handlerName)).toBe(true);
    });
    
    it('should not register a handler with the same name', () => {
      // Arrange - registering the same handler twice
      const handlerName = 'duplicateHandler';
      const handler = jest.fn();
      
      // Act
      errorHandlerService.registerErrorHandler(handlerName, handler);
      const result = errorHandlerService.registerErrorHandler(handlerName, handler);
      
      // Assert
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalled();
    });
  });
  
  describe('createError', () => {
    it('should create a validation error', () => {
      // Act
      const error = errorHandlerService.createError(
        ErrorTypes.VALIDATION_ERROR,
        'Invalid data',
        { details: ['Field is required'] }
      );
      
      // Assert
      expect(error.type).toBe(ErrorTypes.VALIDATION_ERROR);
      expect(error.message).toBe('Invalid data');
      expect(error.details).toEqual(['Field is required']);
    });
    
    it('should create an auth error', () => {
      // Act
      const error = errorHandlerService.createError(
        ErrorTypes.AUTH_ERROR,
        'Not authorized',
        { code: 'permission-denied' }
      );
      
      // Assert
      expect(error.type).toBe(ErrorTypes.AUTH_ERROR);
      expect(error.message).toBe('Not authorized');
      expect(error.code).toBe('permission-denied');
    });
  });
});