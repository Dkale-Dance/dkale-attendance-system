// StudentManagement.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import StudentManagement from '../components/StudentManagement';
import { studentService } from '../services/StudentService';
import { authService } from '../services/AuthService';

// Mock the CSS module
jest.mock('../components/StudentManagement.module.css', () => ({
  'student-management': 'student-management',
  'unauthorized': 'unauthorized',
  'cancel-button': 'cancel-button'
}));

// Mock the services
jest.mock('../services/StudentService', () => ({
  studentService: {
    initializeStudentProfile: jest.fn(),
    updateStudent: jest.fn(),
    getAllStudents: jest.fn().mockResolvedValue([]),
    getStudentsByStatus: jest.fn().mockResolvedValue([])
  }
}));

jest.mock('../services/AuthService', () => ({
  authService: {
    register: jest.fn()
  }
}));

// Mock child components
jest.mock('../components/StudentList', () => {
  return function MockStudentList() {
    return <div data-testid="student-list">Student List Mock</div>;
  };
});

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
        <button type="submit" data-testid="student-submit-button">Submit</button>
      </form>
    );
  };
});

jest.mock('../components/ErrorMessage', () => {
  return function MockErrorMessage({ message }) {
    return <div data-testid="error-message">{message}</div>;
  };
});

describe('StudentManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock event listener for custom event
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
    window.dispatchEvent = jest.fn();

    // Reset mocks
    studentService.getAllStudents.mockResolvedValue([]);
    studentService.getStudentsByStatus.mockResolvedValue([]);
  });

  test('displays unauthorized message for non-admin users', () => {
    render(<StudentManagement userRole="student" />);
    expect(screen.getByTestId('unauthorized-message')).toBeInTheDocument();
  });

  test('renders student management for admin users', () => {
    render(<StudentManagement userRole="admin" />);
    expect(screen.getByText('Student Management')).toBeInTheDocument();
    expect(screen.getByTestId('add-student-button')).toBeInTheDocument();
  });

  test('shows add student form when add button clicked', () => {
    render(<StudentManagement userRole="admin" />);
    
    fireEvent.click(screen.getByTestId('add-student-button'));
    
    expect(screen.getByTestId('edit-student-form')).toBeInTheDocument();
    expect(screen.getByText('Add New Student')).toBeInTheDocument();
  });

  test('submits new student form correctly', async () => {
    const mockUser = { uid: 'user123', email: 'test@example.com' };
    authService.register.mockResolvedValueOnce(mockUser);
    studentService.initializeStudentProfile.mockResolvedValueOnce({});
    
    render(<StudentManagement userRole="admin" />);
    
    // Open add form
    fireEvent.click(screen.getByTestId('add-student-button'));
    
    // Submit the form
    await act(async () => {
      fireEvent.submit(screen.getByTestId('student-form'));
    });
    
    // Check if services were called correctly
    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith(
        'test@example.com', 
        'tempPassword123'
      );
      expect(studentService.initializeStudentProfile).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          firstName: 'Test',
          lastName: 'User'
        })
      );
      expect(window.dispatchEvent).toHaveBeenCalled();
    });
  });

  test('handles form submission errors', async () => {
    const errorMessage = 'Registration failed';
    authService.register.mockRejectedValueOnce(new Error(errorMessage));
    
    render(<StudentManagement userRole="admin" />);
    
    // Open add form
    fireEvent.click(screen.getByTestId('add-student-button'));
    
    // Submit the form
    await act(async () => {
      fireEvent.submit(screen.getByTestId('student-form'));
    });
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(errorMessage);
    });
  });

  test('cancels form editing', () => {
    render(<StudentManagement userRole="admin" />);
    
    // Open add form
    fireEvent.click(screen.getByTestId('add-student-button'));
    expect(screen.getByTestId('edit-student-form')).toBeInTheDocument();
    
    // Cancel editing
    fireEvent.click(screen.getByTestId('cancel-button'));
    expect(screen.queryByTestId('edit-student-form')).not.toBeInTheDocument();
    expect(screen.getByTestId('add-student-button')).toBeInTheDocument();
  });
});