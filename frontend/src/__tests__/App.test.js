// App.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { authService } from '../services/AuthService';
import { studentService } from '../services/StudentService';

// Mock the auth service
jest.mock('../services/AuthService', () => {
  // Create a mock implementation for onAuthStateChanged that can be customized per test
  const onAuthStateChangedMock = jest.fn((callback) => {
    // Default implementation - simulate no user
    callback(null);
    return jest.fn(); // Return dummy unsubscribe function
  });
  
  return {
    authService: {
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      userRepository: {
        getRole: jest.fn()
      },
      authRepository: {
        onAuthStateChanged: onAuthStateChangedMock,
        getCurrentUser: jest.fn()
      }
    }
  };
});

// Mock the student service
jest.mock('../services/StudentService', () => ({
  studentService: {
    getStudentById: jest.fn(),
    updateStudent: jest.fn(),
    initializeStudentProfile: jest.fn()
  }
}));

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders LoginForm by default', async () => {
    // Set auth state to null (not logged in)
    authService.authRepository.onAuthStateChanged.mockImplementation(callback => {
      callback(null);
      return jest.fn();
    });
    
    render(<App />);
    
    // Wait for loading state to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
    
    expect(screen.getByTestId('form-title')).toHaveTextContent('Login');
  });

  it('handles successful login', async () => {
    const mockUser = { uid: 'test123', email: 'test@example.com' };
    authService.login.mockResolvedValueOnce(mockUser);
    authService.userRepository.getRole.mockResolvedValueOnce('student');
    studentService.getStudentById.mockResolvedValueOnce(null);
    
    // Set auth state to null to begin with
    authService.authRepository.onAuthStateChanged.mockImplementation(callback => {
      callback(null);
      return jest.fn();
    });

    render(<App />);
    
    // Wait for loading state to finish and login form to appear
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    // Fill in the form
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' }
    });

    // Submit the form
    fireEvent.submit(screen.getByTestId('submit-button'));

    // Wait for the welcome message
    await waitFor(() => {
      expect(screen.getByTestId('welcome-message')).toHaveTextContent('Welcome, test@example.com');
    });
  });

  it('handles successful student login and shows welcome message', async () => {
    const mockUser = { uid: 'user123', email: 'student@example.com' };
    const mockStudentProfile = {
      id: 'user123',
      firstName: 'John',
      lastName: 'Doe',
      enrollmentStatus: 'Enrolled',
      balance: 0
    };

    authService.login.mockResolvedValueOnce(mockUser);
    authService.userRepository.getRole.mockResolvedValueOnce('student');
    studentService.getStudentById.mockResolvedValueOnce(mockStudentProfile);
    
    // Set auth state to null to begin with
    authService.authRepository.onAuthStateChanged.mockImplementation(callback => {
      callback(null);
      return jest.fn();
    });

    render(<App />);
    
    // Wait for loading state to finish and login form to appear
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    // Fill in the form
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'student@example.com' }
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' }
    });

    // Submit the form
    fireEvent.submit(screen.getByTestId('submit-button'));

    // Wait for the welcome message
    await waitFor(() => {
      expect(screen.getByTestId('welcome-message')).toHaveTextContent('Welcome, student@example.com');
    });
  });

  it('handles successful admin login and shows welcome message', async () => {
    const mockUser = { uid: 'admin123', email: 'admin@example.com' };

    authService.login.mockResolvedValueOnce(mockUser);
    authService.userRepository.getRole.mockResolvedValueOnce('admin');
    
    // Set auth state to null to begin with
    authService.authRepository.onAuthStateChanged.mockImplementation(callback => {
      callback(null);
      return jest.fn();
    });

    render(<App />);
    
    // Wait for loading state to finish and login form to appear
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    // Fill in the form
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'admin@example.com' }
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' }
    });

    // Submit the form
    fireEvent.submit(screen.getByTestId('submit-button'));

    // Wait for the welcome message
    await waitFor(() => {
      expect(screen.getByTestId('welcome-message')).toHaveTextContent('Welcome, admin@example.com');
    });
  });

  it('handles login errors', async () => {
    const errorMessage = 'Invalid credentials';
    authService.login.mockRejectedValueOnce(new Error(errorMessage));
    
    // Set auth state to null to begin with
    authService.authRepository.onAuthStateChanged.mockImplementation(callback => {
      callback(null);
      return jest.fn();
    });

    render(<App />);
    
    // Wait for loading state to finish and login form to appear
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    // Fill in the form
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'wrong-password' }
    });

    // Submit the form
    fireEvent.submit(screen.getByTestId('submit-button'));

    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles logout', async () => {
    // Start with a logged-in user
    const mockUser = { uid: 'test123', email: 'test@example.com' };
    authService.login.mockResolvedValueOnce(mockUser);
    authService.userRepository.getRole.mockResolvedValueOnce('student');
    studentService.getStudentById.mockResolvedValueOnce(null);
    
    // Set auth state to null to begin with
    authService.authRepository.onAuthStateChanged.mockImplementation(callback => {
      callback(null);
      return jest.fn();
    });

    render(<App />);
    
    // Wait for loading state to finish and login form to appear
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    // Log in first
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' }
    });
    fireEvent.submit(screen.getByTestId('submit-button'));

    // Wait for the welcome section
    await waitFor(() => {
      expect(screen.getByTestId('welcome-section')).toBeInTheDocument();
    });

    // Click logout
    fireEvent.click(screen.getByTestId('logout-button'));

    // Wait for the login form to reappear
    await waitFor(() => {
      expect(screen.getByTestId('form-title')).toBeInTheDocument();
    });
  });
});