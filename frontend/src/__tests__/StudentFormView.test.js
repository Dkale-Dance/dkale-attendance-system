// StudentFormView.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import StudentFormView from '../components/StudentFormView';
import { studentService } from '../services/StudentService';
import { authService } from '../services/AuthService';

// Mock the services
jest.mock('../services/StudentService', () => ({
  studentService: {
    initializeStudentProfile: jest.fn(),
    updateStudent: jest.fn()
  }
}));

jest.mock('../services/AuthService', () => ({
  authService: {
    register: jest.fn(),
    registerStudent: jest.fn() // add mock for new method
  }
}));

// Mock child components
jest.mock('../components/StudentForm', () => {
  return function MockStudentForm({ onSubmit }) {
    return (
      <form
        data-testid="student-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ firstName: 'Test', lastName: 'User', email: 'test@example.com' });
        }}
      >
        <button type="submit" data-testid="submit-button">Submit</button>
      </form>
    );
  };
});

jest.mock('../components/ErrorMessage', () => {
  return function MockErrorMessage({ message }) {
    return <div data-testid="error-message">{message}</div>;
  };
});

describe('StudentFormView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders form for adding new student', () => {
    render(
      <StudentFormView 
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('Add New Student')).toBeInTheDocument();
    expect(screen.getByTestId('student-form')).toBeInTheDocument();
    expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
  });

  test('renders form for editing student', () => {
    const mockStudent = {
      id: 'student123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    };

    render(
      <StudentFormView 
        selectedStudent={mockStudent}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('Edit Student')).toBeInTheDocument();
  });

  test('handles cancel button click', () => {
    const mockOnCancel = jest.fn();
    
    render(
      <StudentFormView 
        onSuccess={jest.fn()}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByTestId('cancel-button'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('uses registerStudent instead of register when adding a new student as admin', async () => {
    const mockOnSuccess = jest.fn();
    const mockUser = { uid: 'user123', email: 'test@example.com' };
    
    authService.registerStudent.mockResolvedValueOnce(mockUser);
    studentService.initializeStudentProfile.mockResolvedValueOnce({});
    
    render(
      <StudentFormView 
        onSuccess={mockOnSuccess}
        onCancel={jest.fn()}
      />
    );

    await act(async () => {
      fireEvent.submit(screen.getByTestId('student-form'));
    });

    await waitFor(() => {
      // Should use registerStudent instead of register
      expect(authService.registerStudent).toHaveBeenCalledWith(
        'test@example.com', 
        'tempPassword123'
      );
      expect(authService.register).not.toHaveBeenCalled();
      expect(studentService.initializeStudentProfile).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          firstName: 'Test',
          lastName: 'User'
        })
      );
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
  
  test('preserves admin session when adding a new student', async () => {
    // Mock admin user in auth state
    const mockAdminUser = { uid: 'admin123', email: 'admin@example.com' };
    
    // Mock admin check functionality
    const mockAuthRepository = {
      getCurrentUser: jest.fn().mockReturnValue(mockAdminUser)
    };
    
    // Mock the student user that will be created
    const mockStudentUser = { uid: 'student123', email: 'student@example.com', role: 'student' };
    
    // Mock the service calls
    authService.registerStudent.mockResolvedValueOnce(mockStudentUser);
    studentService.initializeStudentProfile.mockResolvedValueOnce({
      uid: mockStudentUser.uid,
      firstName: 'Test',
      lastName: 'Student'
    });
    
    // Set up auth repository for later verification
    authService.authRepository = mockAuthRepository;
    
    // Mock success callback
    const mockOnSuccess = jest.fn();
    
    render(
      <StudentFormView 
        onSuccess={mockOnSuccess}
        onCancel={jest.fn()}
      />
    );
    
    // Submit the form
    await act(async () => {
      fireEvent.submit(screen.getByTestId('student-form'));
    });
    
    await waitFor(() => {
      // Verify student was registered properly
      expect(authService.registerStudent).toHaveBeenCalledWith(
        'test@example.com', 
        'tempPassword123'
      );
      
      // Verify admin user is still the current user
      expect(mockAuthRepository.getCurrentUser()).toEqual(mockAdminUser);
      
      // Verify student profile was initialized
      expect(studentService.initializeStudentProfile).toHaveBeenCalledWith(
        mockStudentUser.uid,
        expect.objectContaining({
          firstName: 'Test',
          lastName: 'User'
        })
      );
      
      // Verify success callback was called
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  test('submits form to update student', async () => {
    const mockOnSuccess = jest.fn();
    const mockStudent = {
      id: 'student123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    };
    
    studentService.updateStudent.mockResolvedValueOnce({});
    
    render(
      <StudentFormView 
        selectedStudent={mockStudent}
        onSuccess={mockOnSuccess}
        onCancel={jest.fn()}
      />
    );

    await act(async () => {
      fireEvent.submit(screen.getByTestId('student-form'));
    });

    await waitFor(() => {
      expect(studentService.updateStudent).toHaveBeenCalledWith(
        'student123',
        expect.objectContaining({
          firstName: 'Test',
          lastName: 'User'
        })
      );
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  test('handles form submission errors', async () => {
    const errorMessage = 'Registration failed';
    authService.registerStudent.mockRejectedValueOnce(new Error(errorMessage));
    
    render(
      <StudentFormView 
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    await act(async () => {
      fireEvent.submit(screen.getByTestId('student-form'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(errorMessage);
    });
  });
});