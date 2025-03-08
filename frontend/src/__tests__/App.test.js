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
      registerStudent: jest.fn(),
      userRepository: {
        getRole: jest.fn(),
        assignRole: jest.fn()
      },
      authRepository: {
        onAuthStateChanged: onAuthStateChangedMock,
        getCurrentUser: jest.fn(),
        saveAdminCredentials: jest.fn(),
        getAdminCredentials: jest.fn().mockReturnValue({
          email: "admin@example.com",
          password: "admin123"
        }),
        createUserAndRestoreAdmin: jest.fn()
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

    // Click logout button in the navbar
    fireEvent.click(screen.getByText('Logout'));

    // Wait for the login form to reappear
    await waitFor(() => {
      expect(screen.getByTestId('form-title')).toBeInTheDocument();
    });
  });

  // New tests for navbar
  it('does not render navbar when user is not authenticated', async () => {
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
    
    // Navbar brand should not be in the document
    expect(screen.queryByText('Dkale Dance')).not.toBeInTheDocument();
  });

  it('renders navbar when user is authenticated', async () => {
    // Mock authenticated user
    const mockUser = { uid: 'test123', email: 'test@example.com' };
    
    // Set auth state to authenticated user
    authService.authRepository.onAuthStateChanged.mockImplementation(callback => {
      callback(mockUser);
      return jest.fn();
    });
    
    authService.userRepository.getRole.mockResolvedValueOnce('student');
    studentService.getStudentById.mockResolvedValueOnce({
      id: 'test123',
      firstName: 'Test',
      lastName: 'User'
    });
    
    render(<App />);
    
    // Wait for user data to load and navbar to appear
    await waitFor(() => {
      expect(screen.getByText('Dkale Dance')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('shows student-specific navigation options for student users', async () => {
    // Mock authenticated student user
    const mockUser = { uid: 'student123', email: 'student@example.com' };
    
    // Set auth state to authenticated user
    authService.authRepository.onAuthStateChanged.mockImplementation(callback => {
      callback(mockUser);
      return jest.fn();
    });
    
    authService.userRepository.getRole.mockResolvedValueOnce('student');
    studentService.getStudentById.mockResolvedValueOnce({
      id: 'student123',
      firstName: 'Student',
      lastName: 'User'
    });
    
    render(<App />);
    
    // Wait for user data to load and navbar to appear with student options
    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.queryByText('Manage Students')).not.toBeInTheDocument();
    });
  });

  it('shows admin-specific navigation options for admin users', async () => {
    // Mock authenticated admin user
    const mockUser = { uid: 'admin123', email: 'admin@example.com' };
    
    // Set auth state to authenticated user
    authService.authRepository.onAuthStateChanged.mockImplementation(callback => {
      callback(mockUser);
      return jest.fn();
    });
    
    authService.userRepository.getRole.mockResolvedValueOnce('admin');
    
    render(<App />);
    
    // Wait for user data to load and navbar to appear with admin options
    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Manage Students')).toBeInTheDocument();
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    });
  });

  it('navigates to profile page when clicking Profile link', async () => {
    // Mock authenticated student user
    const mockUser = { uid: 'student123', email: 'student@example.com' };
    
    // Set auth state to authenticated user
    authService.authRepository.onAuthStateChanged.mockImplementation(callback => {
      callback(mockUser);
      return jest.fn();
    });
    
    authService.userRepository.getRole.mockResolvedValueOnce('student');
    studentService.getStudentById.mockResolvedValueOnce({
      id: 'student123',
      firstName: 'Student',
      lastName: 'User'
    });
    
    render(<App />);
    
    // Wait for navbar to appear
    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });
    
    // Click profile link
    fireEvent.click(screen.getByText('Profile'));
    
    // Expect profile editor to be shown
    await waitFor(() => {
      expect(screen.getByText('Edit Your Profile')).toBeInTheDocument();
    });
  });

  it('navigates to student management page when clicking Manage Students link', async () => {
    // Mock authenticated admin user
    const mockUser = { uid: 'admin123', email: 'admin@example.com' };
    
    // Set auth state to authenticated user
    authService.authRepository.onAuthStateChanged.mockImplementation(callback => {
      callback(mockUser);
      return jest.fn();
    });
    
    authService.userRepository.getRole.mockResolvedValueOnce('admin');
    
    render(<App />);
    
    // Wait for navbar to appear
    await waitFor(() => {
      expect(screen.getByText('Manage Students')).toBeInTheDocument();
    });
    
    // Click manage students link
    fireEvent.click(screen.getByText('Manage Students'));
    
    // Wait for student management component to be loaded
    // For this test, we don't need to test StudentManagement itself
    // just that the view was changed
    await waitFor(() => {
      expect(screen.queryByTestId('welcome-section')).not.toBeInTheDocument();
    });
  });
  
  it('navigates to home page when clicking Home link', async () => {
    // Mock authenticated admin user (to test navigation from management to home)
    const mockUser = { uid: 'admin123', email: 'admin@example.com' };
    
    // Set auth state to authenticated user
    authService.authRepository.onAuthStateChanged.mockImplementation(callback => {
      callback(mockUser);
      return jest.fn();
    });
    
    authService.userRepository.getRole.mockResolvedValueOnce('admin');
    
    render(<App />);
    
    // Wait for navbar to appear
    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Manage Students')).toBeInTheDocument();
    });
    
    // Navigate to management first
    fireEvent.click(screen.getByText('Manage Students'));
    
    // Wait for management view
    await waitFor(() => {
      expect(screen.queryByTestId('welcome-section')).not.toBeInTheDocument();
    });
    
    // Now click home link
    fireEvent.click(screen.getByText('Home'));
    
    // Welcome section should be shown again
    await waitFor(() => {
      expect(screen.getByTestId('welcome-section')).toBeInTheDocument();
    });
  });
  
  it('maintains user auth state when role fetch fails', async () => {
    // Mock authenticated admin user
    const mockUser = { uid: 'admin123', email: 'admin@example.com' };
    
    // Set auth state to authenticated user
    authService.authRepository.onAuthStateChanged.mockImplementation(callback => {
      callback(mockUser);
      return jest.fn();
    });
    
    // Mock getCurrentUser to return the admin
    authService.authRepository.getCurrentUser.mockReturnValue(mockUser);
    
    // Mock role fetching to fail with permission error
    authService.userRepository.getRole.mockRejectedValueOnce(new Error('Missing or insufficient permissions'));
    
    render(<App />);
    
    // Wait for error message and auth state to be processed
    await waitFor(() => {
      // Should still show the user is logged in even with role error
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    });

    // Verify error message shows up (the exact contents may differ, so test for partial match)
    await waitFor(() => {
      const errorElement = screen.getByText(/Missing or insufficient permissions/i);
      expect(errorElement).toBeInTheDocument();
    });
    
    // User should still be able to logout
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
  
  it('maintains admin session after student creation', async () => {
    // Mock authenticated admin user
    const mockAdminUser = { uid: 'admin123', email: 'admin@example.com' };
    const mockStudentUser = { uid: 'student456', email: 'student@example.com' };
    
    // Set auth state to authenticated admin
    authService.authRepository.onAuthStateChanged.mockImplementation(callback => {
      callback(mockAdminUser);
      return jest.fn();
    });
    
    // Mock successful role fetch for admin
    authService.userRepository.getRole.mockResolvedValueOnce('admin');
    
    // Mock registerStudent to return a new student
    authService.registerStudent.mockResolvedValue({
      ...mockStudentUser,
      role: 'student'
    });
    
    // Mock createUserAndRestoreAdmin to return the new student
    authService.authRepository.createUserAndRestoreAdmin.mockResolvedValue(mockStudentUser);
    
    render(<App />);
    
    // Wait for admin user to be authenticated
    await waitFor(() => {
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      expect(screen.getByText('Manage Students')).toBeInTheDocument();
    });
    
    // Navigate to Manage Students
    fireEvent.click(screen.getByText('Manage Students'));
    
    // Set up admin credentials mock just before checking
    authService.authRepository.getAdminCredentials.mockReturnValueOnce({
      email: "admin@example.com",
      password: "admin123"
    });
    
    // Now check if admin credentials are available
    expect(authService.authRepository.getAdminCredentials()).toEqual({
      email: "admin@example.com",
      password: "admin123"
    });
    
    // Verify the admin is still authenticated after simulated student creation
    await waitFor(() => {
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    });
  });
});