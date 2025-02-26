// StudentList.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StudentList from '../components/StudentList';
import { studentService } from '../services/StudentService';

// Mock the student service
jest.mock('../services/StudentService', () => ({
  studentService: {
    getAllStudents: jest.fn(),
    getStudentsByStatus: jest.fn(),
    changeEnrollmentStatus: jest.fn(),
    removeStudent: jest.fn()
  }
}));

describe('StudentList', () => {
  const mockStudents = [
    {
      id: 'student1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      enrollmentStatus: 'Enrolled',
      balance: 0
    },
    {
      id: 'student2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      enrollmentStatus: 'Pending Payment',
      balance: 100
    }
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation
    studentService.getAllStudents.mockResolvedValue(mockStudents);
    studentService.getStudentsByStatus.mockResolvedValue([mockStudents[0]]);
  });

  it('renders loading state initially', () => {
    render(<StudentList />);
    expect(screen.getByTestId('loading-message')).toBeInTheDocument();
  });

  it('renders student list after loading', async () => {
    render(<StudentList />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-message')).not.toBeInTheDocument();
    });
    
    expect(screen.getByTestId('students-table')).toBeInTheDocument();
    expect(screen.getByTestId('student-row-student1')).toBeInTheDocument();
    expect(screen.getByTestId('student-row-student2')).toBeInTheDocument();
  });

  it('renders empty state when no students', async () => {
    studentService.getAllStudents.mockResolvedValueOnce([]);
    
    render(<StudentList />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-message')).not.toBeInTheDocument();
    });
    
    expect(screen.getByTestId('no-students-message')).toBeInTheDocument();
    expect(screen.queryByTestId('students-table')).not.toBeInTheDocument();
  });

  it('filters students by status', async () => {
    render(<StudentList />);
    
    // Wait for the initial loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading-message')).not.toBeInTheDocument();
    });
    
    // Change filter to "Enrolled"
    fireEvent.change(screen.getByTestId('status-filter'), {
      target: { value: 'Enrolled' }
    });
    
    await waitFor(() => {
      expect(studentService.getStudentsByStatus).toHaveBeenCalledWith('Enrolled');
    });
    
    // Wait for loading to finish after the filter change
    await waitFor(() => {
      expect(screen.queryByTestId('loading-message')).not.toBeInTheDocument();
    });
    
    // Should only show the enrolled student
    expect(screen.getByTestId('student-row-student1')).toBeInTheDocument();
    expect(screen.queryByTestId('student-row-student2')).not.toBeInTheDocument();
  });

  it('changes student status', async () => {
    render(<StudentList />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-message')).not.toBeInTheDocument();
    });
    
    // Change status for the first student
    fireEvent.change(screen.getByTestId('status-select-student1'), {
      target: { value: 'Inactive' }
    });
    
    await waitFor(() => {
      expect(studentService.changeEnrollmentStatus).toHaveBeenCalledWith('student1', 'Inactive');
    });
  });

  it('removes student with zero balance', async () => {
    render(<StudentList />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-message')).not.toBeInTheDocument();
    });
    
    // Click remove button for first student (zero balance)
    fireEvent.click(screen.getByTestId('remove-button-student1'));
    
    await waitFor(() => {
      expect(studentService.removeStudent).toHaveBeenCalledWith('student1');
    });
  });

  it('disables remove button for student with positive balance', async () => {
    render(<StudentList />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-message')).not.toBeInTheDocument();
    });
    
    // Check if the remove button is disabled for second student (has balance)
    expect(screen.getByTestId('remove-button-student2')).toBeDisabled();
  });

  it('displays error message when operation fails', async () => {
    // Mock error when changing status
    studentService.changeEnrollmentStatus.mockRejectedValueOnce(new Error('Operation failed'));
    
    render(<StudentList />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-message')).not.toBeInTheDocument();
    });
    
    // Change status for first student
    fireEvent.change(screen.getByTestId('status-select-student1'), {
      target: { value: 'Inactive' }
    });
    
    // Check if the error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Operation failed')).toBeInTheDocument();
    });
  });
});
