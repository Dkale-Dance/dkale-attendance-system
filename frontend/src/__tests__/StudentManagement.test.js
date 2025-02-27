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

jest.mock('../components/StudentFormView', () => {
  return function MockStudentFormView({ onSuccess, onCancel, selectedStudent }) {
    return (
      <div data-testid="student-form-view">
        <h2>{selectedStudent ? 'Edit Student' : 'Add New Student'}</h2>
        <form
          data-testid="student-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSuccess({ firstName: 'Test', lastName: 'User', email: 'test@example.com' });
          }}
        >
          <button type="submit" data-testid="student-submit-button">Submit</button>
        </form>
        <button data-testid="cancel-button" onClick={onCancel}>Cancel</button>
      </div>
    );
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

  test('switches to student form view when add button clicked', () => {
    render(<StudentManagement userRole="admin" />);
    
    fireEvent.click(screen.getByTestId('add-student-button'));
    
    // Should show form view component and hide the student list
    expect(screen.getByTestId('student-form-view')).toBeInTheDocument();
    expect(screen.queryByTestId('student-list')).not.toBeInTheDocument();
  });

  test('returns to list view after successful form submission', async () => {
    render(<StudentManagement userRole="admin" />);
    
    // Open add form
    fireEvent.click(screen.getByTestId('add-student-button'));
    
    // Verify we're in form view
    expect(screen.getByTestId('student-form-view')).toBeInTheDocument();
    
    // Submit the form (the mock will call onSuccess directly)
    await act(async () => {
      fireEvent.submit(screen.getByTestId('student-form'));
    });
    
    // Verify we've returned to list view
    await waitFor(() => {
      expect(screen.queryByTestId('student-form-view')).not.toBeInTheDocument();
      expect(screen.getByTestId('student-list')).toBeInTheDocument();
    });
  });

  test('returns to list view when cancel button is clicked', () => {
    render(<StudentManagement userRole="admin" />);
    
    // Open add form
    fireEvent.click(screen.getByTestId('add-student-button'));
    expect(screen.getByTestId('student-form-view')).toBeInTheDocument();
    
    // Cancel editing
    fireEvent.click(screen.getByTestId('cancel-button'));
    
    // Should return to list view
    expect(screen.queryByTestId('student-form-view')).not.toBeInTheDocument();
    expect(screen.getByTestId('student-list')).toBeInTheDocument();
  });
});