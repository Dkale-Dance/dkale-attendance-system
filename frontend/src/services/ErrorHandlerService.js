/**
 * Error types used throughout the application
 */
export const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  FIRESTORE_ERROR: 'FIRESTORE_ERROR',
  BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * Service for handling errors throughout the application
 */
export class ErrorHandlerService {
  constructor() {
    // Map of custom error handlers
    this.errorHandlers = new Map();
    
    // Set up default error handlers
    this.setupDefaultHandlers();
  }
  
  /**
   * Set up default error handlers for common error types
   */
  setupDefaultHandlers() {
    // VALIDATION_ERROR handler
    this.registerErrorHandler('validation', (error, context) => {
      console.warn(`Validation error in ${context?.component || 'unknown component'}:`, error.message, error.details);
      
      return {
        type: ErrorTypes.VALIDATION_ERROR,
        message: error.message,
        details: error.details || [],
        userMessage: 'Please check the form for errors.',
        handled: true
      };
    });
    
    // AUTH_ERROR handler
    this.registerErrorHandler('auth', (error, context) => {
      console.error(`Auth error in ${context?.component || 'unknown component'}:`, error.message, error.code);
      
      // Map common Firebase auth errors to user-friendly messages
      let userMessage = 'Authentication error. Please try again.';
      
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        userMessage = 'Invalid email or password. Please try again.';
      } else if (error.code === 'auth/email-already-in-use') {
        userMessage = 'This email is already in use. Please use a different email.';
      } else if (error.code === 'auth/weak-password') {
        userMessage = 'Password is too weak. Please use a stronger password.';
      } else if (error.code === 'permission-denied') {
        userMessage = 'You do not have permission to perform this action.';
      }
      
      return {
        type: ErrorTypes.AUTH_ERROR,
        message: error.message,
        code: error.code,
        userMessage,
        handled: true
      };
    });
    
    // NETWORK_ERROR handler
    this.registerErrorHandler('network', (error, context) => {
      console.error(`Network error in ${context?.component || 'unknown component'}:`, error.message, error.statusCode);
      
      return {
        type: ErrorTypes.NETWORK_ERROR,
        message: error.message,
        statusCode: error.statusCode,
        userMessage: 'Network error. Please check your connection and try again.',
        handled: true
      };
    });
    
    // FIRESTORE_ERROR handler
    this.registerErrorHandler('firestore', (error, context) => {
      console.error(`Firestore error in ${context?.component || 'unknown component'}:`, error.message, error.code);
      
      let userMessage = 'Database error. Please try again later.';
      
      if (error.code === 'permission-denied') {
        userMessage = 'You do not have permission to access this data.';
      } else if (error.code === 'not-found') {
        userMessage = 'The requested data could not be found.';
      }
      
      return {
        type: ErrorTypes.FIRESTORE_ERROR,
        message: error.message,
        code: error.code,
        userMessage,
        handled: true
      };
    });
    
    // Generic error handler (fallback)
    this.registerErrorHandler('generic', (error, context) => {
      console.error(`Error in ${context?.component || 'unknown component'}:`, error);
      
      // Get error message from various types of errors
      let message = 'An unknown error occurred';
      
      if (typeof error === 'string') {
        message = error;
      } else if (error instanceof Error) {
        message = error.message;
      } else if (error?.message) {
        message = error.message;
      }
      
      return {
        type: ErrorTypes.UNKNOWN_ERROR,
        message,
        userMessage: 'Something went wrong. Please try again.',
        handled: true,
        originalError: error
      };
    });
  }
  
  /**
   * Register a custom error handler
   * @param {string} name - Name of the handler
   * @param {Function} handler - Handler function
   * @returns {boolean} Whether the handler was registered successfully
   */
  registerErrorHandler(name, handler) {
    if (this.errorHandlers.has(name)) {
      console.warn(`Error handler with name "${name}" already exists`);
      return false;
    }
    
    this.errorHandlers.set(name, handler);
    return true;
  }
  
  /**
   * Check if a handler exists
   * @param {string} name - Name of the handler
   * @returns {boolean} Whether the handler exists
   */
  hasHandler(name) {
    return this.errorHandlers.has(name);
  }
  
  /**
   * Handle an error using the appropriate handler
   * @param {Error|Object} error - Error to handle
   * @param {Object} context - Context information about where the error occurred
   * @returns {Object} Processed error with additional information
   */
  handleError(error, context = {}) {
    try {
      // If the error specifies a custom handler, use it
      if (error.handlerName && this.errorHandlers.has(error.handlerName)) {
        return this.errorHandlers.get(error.handlerName)(error, context);
      }
      
      // Otherwise, choose a handler based on error type
      switch (error.type) {
        case ErrorTypes.VALIDATION_ERROR:
          return this.errorHandlers.get('validation')(error, context);
        
        case ErrorTypes.AUTH_ERROR:
          return this.errorHandlers.get('auth')(error, context);
        
        case ErrorTypes.NETWORK_ERROR:
          return this.errorHandlers.get('network')(error, context);
        
        case ErrorTypes.FIRESTORE_ERROR:
          return this.errorHandlers.get('firestore')(error, context);
        
        default:
          // Use the generic handler as a fallback
          return this.errorHandlers.get('generic')(error, context);
      }
    } catch (handlerError) {
      // If the error handler itself fails, use a basic fallback
      console.error('Error in error handler:', handlerError);
      
      return {
        type: ErrorTypes.UNKNOWN_ERROR,
        message: error?.message || 'An unknown error occurred',
        userMessage: 'Something went wrong. Please try again.',
        handled: true,
        originalError: error
      };
    }
  }
  
  /**
   * Create a formatted error object
   * @param {string} type - Error type from ErrorTypes
   * @param {string} message - Error message
   * @param {Object} additionalInfo - Additional error information
   * @returns {Object} Formatted error object
   */
  createError(type, message, additionalInfo = {}) {
    return {
      type,
      message,
      ...additionalInfo
    };
  }
}

// Export a singleton instance
export const errorHandlerService = new ErrorHandlerService();