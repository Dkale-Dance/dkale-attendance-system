import { createAuthService } from '../services/AuthServiceFactory';
import { AuthService } from '../services/AuthService';
import { AuthRepository } from '../repository/AuthRepository';
import { UserRepository } from '../repository/UserRepository';


// Mocks for firebase and dependencies
jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn(() => ({}))
  }));
  
  jest.mock('../repository/AuthRepository', () => ({
    AuthRepository: jest.fn().mockImplementation(() => ({
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn()
    }))
  }));
  
  jest.mock('../repository/UserRepository', () => ({
    UserRepository: jest.fn().mockImplementation(() => ({
      updateRole: jest.fn(),
      getRole: jest.fn()
    }))
  }));
  
  jest.mock('../services/AuthService', () => {
    const mockAuthService = jest.fn().mockImplementation(() => ({
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn()
    }));
    return { AuthService: mockAuthService };
  });
  
  describe('AuthServiceFactory', () => {
    let createAuthService;
    let AuthService, AuthRepository, UserRepository;
  
    beforeEach(() => {
      // Reset modules and clear mocks to ensure a fresh state for each test
      jest.resetModules();
      jest.clearAllMocks();
  
      // Re-require the module to reset its singleton instance
      ({ createAuthService } = require('../services/AuthServiceFactory'));
      ({ AuthService } = require('../services/AuthService'));
      ({ AuthRepository } = require('../repository/AuthRepository'));
      ({ UserRepository } = require('../repository/UserRepository'));
    });
  
    it('creates an instance of AuthService with correct dependencies', () => {
      const service = createAuthService();
      expect(AuthService).toHaveBeenCalledTimes(1);
      expect(AuthRepository).toHaveBeenCalledTimes(1);
      expect(UserRepository).toHaveBeenCalledTimes(1);
    });
  
    it('returns the same instance on multiple calls', () => {
      const service1 = createAuthService();
      const service2 = createAuthService();
      expect(service1).toBe(service2);
      expect(AuthService).toHaveBeenCalledTimes(1);
    });
  });
  