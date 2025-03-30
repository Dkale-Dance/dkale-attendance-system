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
    getAllStudentsWithBalances: jest.fn(), // Add the new method
    getStudentsByStatus: jest.fn(),
    changeEnrollmentStatus: jest.fn(),
    removeStudent: jest.fn()
  }
}));

// Mock the report service import
jest.mock('../services/ReportService', () => ({
  reportService: {
    calculateStudentBalance: jest.fn().mockResolvedValue({
      totalFeesCharged: 0,
      totalPaymentsMade: 0,
      calculatedBalance: 0
    })
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
    
    // Mock implementation for the new method
    studentService.getAllStudentsWithBalances.mockResolvedValue(
      mockStudents.map(student => ({
        ...student,
        calculatedBalance: student.balance,
        totalFees: student.balance,
        totalPayments: 0
      }))
    );
    
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
    // Mock both methods to return empty arrays
    studentService.getAllStudents.mockResolvedValueOnce([]);
    studentService.getAllStudentsWithBalances.mockResolvedValueOnce([]);
    
    render(<StudentList />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-message')).not.toBeInTheDocument();
    });
    
    // We also need to wait for error to be displayed due to async imports
    await waitFor(() => {
      expect(screen.getByTestId('no-students-message')).toBeInTheDocument();
      expect(screen.queryByTestId('students-table')).not.toBeInTheDocument();
    });
  });

  it('filters students by status', async () => {
    // Mock successful retrieval of filtered students
    studentService.getStudentsByStatus.mockResolvedValue([mockStudents[0]]);
    
    render(<StudentList />);
    
    // Wait for the initial loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading-message')).not.toBeInTheDocument();
    });
    
    // Change filter to "Enrolled"
    fireEvent.change(screen.getByTestId('status-filter'), {
      target: { value: 'Enrolled' }
    });
    
    // Wait for service call
    await waitFor(() => {
      expect(studentService.getStudentsByStatus).toHaveBeenCalledWith('Enrolled');
    });
    
    // Wait for loading to finish after the filter change and ensure state has updated
    await waitFor(() => {
      expect(screen.queryByTestId('loading-message')).not.toBeInTheDocument();
      // Should only show the enrolled student
      expect(screen.getByTestId('student-row-student1')).toBeInTheDocument();
      expect(screen.queryByTestId('student-row-student2')).not.toBeInTheDocument();
    });
  });

  it('changes student status', async () => {
    render(<StudentList />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-message')).not.toBeInTheDocument();
    });
    
    // Mock successful status change
    studentService.changeEnrollmentStatus.mockResolvedValue({
      id: 'student1',
      enrollmentStatus: 'Inactive'
    });
    
    // Change status for the first student
    fireEvent.change(screen.getByTestId('status-select-student1'), {
      target: { value: 'Inactive' }
    });
    
    // Wait for both the service call and the state update
    await waitFor(() => {
      expect(studentService.changeEnrollmentStatus).toHaveBeenCalledWith('student1', 'Inactive');
    });
    
    // Wait for component to fully update after state changes
    await waitFor(() => {
      expect(screen.getByTestId('status-select-student1').value).toBe('Inactive');
    });
  });

  it('removes student with zero balance', async () => {
    render(<StudentList />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-message')).not.toBeInTheDocument();
    });
    
    // Mock successful removal
    studentService.removeStudent.mockResolvedValue(true);
    
    // Mock successful fetchStudents after removal with the new method
    studentService.getAllStudentsWithBalances.mockResolvedValue([
      {
        ...mockStudents[1],
        calculatedBalance: mockStudents[1].balance,
        totalFees: mockStudents[1].balance,
        totalPayments: 0
      }
    ]);
    
    // Click remove button for first student (zero balance)
    fireEvent.click(screen.getByTestId('remove-button-student1'));
    
    // Wait for service call
    await waitFor(() => {
      expect(studentService.removeStudent).toHaveBeenCalledWith('student1');
    });
    
    // Wait for component update after student removal
    await waitFor(() => {
      // Check that the student1 row is no longer present
      expect(screen.queryByTestId('student-row-student1')).not.toBeInTheDocument();
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
    
    // Wait for both the service call and error state update
    await waitFor(() => {
      expect(studentService.changeEnrollmentStatus).toHaveBeenCalledWith('student1', 'Inactive');
    });
    
    // Check if the error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Operation failed')).toBeInTheDocument();
    });
  });
});
