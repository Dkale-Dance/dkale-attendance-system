// SessionPersistence.test.js
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Mock services
jest.mock('../services/AuthService', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    userRepository: {
      getRole: jest.fn()
    },
    authRepository: {
      onAuthStateChanged: jest.fn((callback) => {
        return jest.fn(); // Return unsubscribe function
      }),
      getCurrentUser: jest.fn()
    }
  },
}));

jest.mock('../services/StudentService', () => ({
  studentService: {
    getStudentById: jest.fn(),
    updateStudent: jest.fn()
  }
}));

// Mock the AttendanceService
jest.mock('../services/AttendanceService', () => ({
  attendanceService: {
    getAttendanceSummaryWithStudents: jest.fn(),
    markAttendance: jest.fn(),
    bulkMarkAttendance: jest.fn()
  }
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore');
jest.mock('../lib/firebase/config/config', () => ({
  auth: {},
  default: {}
}));

// Mock Firebase functions
jest.mock('firebase/auth', () => ({
  setPersistence: jest.fn(),
  browserLocalPersistence: 'local',
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  createUserWithEmailAndPassword: jest.fn()
}));

describe('Session Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows login form when no user is authenticated', async () => {
    // Setup auth state to return null (no user)
    const { authService } = require('../services/AuthService');
    authService.authRepository.onAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      return jest.fn(); // Return unsubscribe function
    });

    await act(async () => {
      render(<App />);
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
    
    // Login form should be visible
    expect(screen.getByTestId('form-title')).toBeInTheDocument();
  });

  it('restores user session on refresh for student', async () => {
    // Mock authenticated user
    const mockUser = { 
      uid: 'user123', 
      email: 'test@example.com' 
    };
    
    const { authService } = require('../services/AuthService');
    const { studentService } = require('../services/StudentService');
    
    // Mock auth state change
    authService.authRepository.onAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn(); // Return unsubscribe function
    });

    // Mock role fetch response
    authService.userRepository.getRole.mockResolvedValue('student');
    
    // Mock student profile
    const mockStudentProfile = {
      id: 'user123',
      firstName: 'John',
      lastName: 'Doe',
      enrollmentStatus: 'Enrolled',
      balance: 0
    };
    studentService.getStudentById.mockResolvedValue(mockStudentProfile);

    await act(async () => {
      render(<App />);
    });

    // Wait for auth state to be processed
    await waitFor(() => {
      // Should show welcome message instead of login form
      expect(screen.getByTestId('welcome-message')).toBeInTheDocument();
      expect(screen.getByText('Welcome, test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Your Student Profile')).toBeInTheDocument();
    });
  });

  it('restores user session on refresh for admin', async () => {
    // Mock authenticated user
    const mockUser = { 
      uid: 'admin123', 
      email: 'admin@example.com' 
    };
    
    const { authService } = require('../services/AuthService');
    
    // Mock auth state change
    authService.authRepository.onAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn(); // Return unsubscribe function
    });

    // Mock role fetch response
    authService.userRepository.getRole.mockResolvedValue('admin');

    await act(async () => {
      render(<App />);
    });

    // Wait for auth state to be processed
    await waitFor(() => {
      // Should show welcome message instead of login form
      expect(screen.getByTestId('welcome-message')).toBeInTheDocument();
      expect(screen.getByText('Welcome, admin@example.com')).toBeInTheDocument();
      expect(screen.getByText('Manage Students')).toBeInTheDocument();
    });
  });
});