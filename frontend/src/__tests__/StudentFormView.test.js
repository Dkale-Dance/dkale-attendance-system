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
    register: jest.fn()
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

  test('submits form to create new student', async () => {
    const mockOnSuccess = jest.fn();
    const mockUser = { uid: 'user123', email: 'test@example.com' };
    
    authService.register.mockResolvedValueOnce(mockUser);
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
    authService.register.mockRejectedValueOnce(new Error(errorMessage));
    
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