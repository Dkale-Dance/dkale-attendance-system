import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AttendanceDashboard from '../components/AttendanceDashboard';

// Mock Firebase
jest.mock('firebase/firestore');
jest.mock('../lib/firebase/config/config', () => ({
  auth: {},
  default: {}
}));

// Mock the entire module with a mock object defined directly in the mock
jest.mock('../services/AttendanceService', () => {
  return {
    attendanceService: {
      getAttendanceSummaryWithStudents: jest.fn(),
      markAttendance: jest.fn(),
      bulkMarkAttendance: jest.fn()
    }
  };
});

describe('AttendanceDashboard', () => {
  const mockStudentsWithAttendance = [
    {
      id: 'student1',
      firstName: 'John',
      lastName: 'Doe',
      enrollmentStatus: 'Enrolled',
      attendance: { status: 'present', timestamp: new Date() }
    },
    {
      id: 'student2',
      firstName: 'Jane',
      lastName: 'Smith',
      enrollmentStatus: 'Pending Payment',
      attendance: { status: 'absent', timestamp: new Date() }
    },
    {
      id: 'student3',
      firstName: 'Bob',
      lastName: 'Johnson',
      enrollmentStatus: 'Enrolled',
      attendance: null
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Get a reference to the mock
    const { attendanceService } = require('../services/AttendanceService');
    
    // Default implementation for the mock service
    attendanceService.getAttendanceSummaryWithStudents.mockResolvedValue(mockStudentsWithAttendance);
    attendanceService.markAttendance.mockResolvedValue();
    attendanceService.bulkMarkAttendance.mockResolvedValue();
  });

  it('should render the attendance dashboard correctly', async () => {
    // Get the mock
    const { attendanceService } = require('../services/AttendanceService');
    
    // This test was failing because the component remains in loading state
    // Force the promise to resolve immediately
    attendanceService.getAttendanceSummaryWithStudents.mockResolvedValue(mockStudentsWithAttendance);

    // Render the component
    render(<AttendanceDashboard userRole="admin" />);
    
    // Wait for the data to load and loading indicator to disappear
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
    
    // Check if the date picker is rendered
    expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    
    // Now the table and bulk actions should be visible
    expect(screen.getByTestId('attendance-table')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-actions')).toBeInTheDocument();
  });

  it('should deny access to non-admin users', () => {
    // Render with student role
    render(<AttendanceDashboard userRole="student" />);
    
    // Check for unauthorized message
    expect(screen.getByTestId('unauthorized-message')).toBeInTheDocument();
    
    // Verify attendance service was not called
    const { attendanceService } = require('../services/AttendanceService');
    expect(attendanceService.getAttendanceSummaryWithStudents).not.toHaveBeenCalled();
  });

  it('should load attendance data for the selected date', async () => {
    // Setup
    const user = userEvent.setup();
    render(<AttendanceDashboard userRole="admin" />);
    
    // Wait for initial load
    await waitFor(() => {
      const { attendanceService } = require('../services/AttendanceService');
      expect(attendanceService.getAttendanceSummaryWithStudents).toHaveBeenCalled();
    });
    
    // Change the date
    const datePicker = screen.getByTestId('date-picker');
    fireEvent.change(datePicker, { target: { value: '2025-03-10' } });
    
    // Verify attendance data is fetched again with new date
    await waitFor(() => {
      const { attendanceService } = require('../services/AttendanceService');
      expect(attendanceService.getAttendanceSummaryWithStudents).toHaveBeenCalledTimes(2);
      // Check that it was called with a date object for 2025-03-10
      const lastCallArg = attendanceService.getAttendanceSummaryWithStudents.mock.calls[1][0];
      expect(lastCallArg.toISOString().substring(0, 10)).toBe('2025-03-10');
    });
  });

  it('should update attendance when status is changed for a student', async () => {
    // Setup
    const user = userEvent.setup();
    
    // Get the mock and configure it
    const { attendanceService } = require('../services/AttendanceService');
    attendanceService.getAttendanceSummaryWithStudents.mockResolvedValue(mockStudentsWithAttendance);
    
    // Render the component
    render(<AttendanceDashboard userRole="admin" />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
    
    // Find the status dropdown for the first student
    const statusSelect = screen.getByTestId(`attendance-select-student1`);
    
    // Change attendance status
    await user.selectOptions(statusSelect, 'absent');
    
    // Verify the attendance service was called to update the status
    await waitFor(() => {
      expect(attendanceService.markAttendance).toHaveBeenCalledWith(
        expect.any(Date),
        'student1',
        'absent'
      );
    });
  });

  it('should mark attendance for multiple students with bulk action', async () => {
    // Setup
    const user = userEvent.setup();
    
    // Get the mock and configure it
    const { attendanceService } = require('../services/AttendanceService');
    attendanceService.getAttendanceSummaryWithStudents.mockResolvedValue(mockStudentsWithAttendance);
    
    // Render the component
    render(<AttendanceDashboard userRole="admin" />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
    
    // Select multiple students
    const checkboxes = [
      screen.getByTestId(`student-checkbox-student1`),
      screen.getByTestId(`student-checkbox-student2`)
    ];
    
    // Check checkboxes
    for (const checkbox of checkboxes) {
      await user.click(checkbox);
    }
    
    // Select bulk action status
    const bulkStatusSelect = screen.getByTestId('bulk-status-select');
    await user.selectOptions(bulkStatusSelect, 'present');
    
    // Apply bulk action
    const applyButton = screen.getByTestId('apply-bulk-action');
    await user.click(applyButton);
    
    // Verify the bulk mark attendance was called
    await waitFor(() => {
      expect(attendanceService.bulkMarkAttendance).toHaveBeenCalledWith(
        expect.any(Date),
        ['student1', 'student2'],
        'present'
      );
    });
  });

  it('should show error message when service call fails', async () => {
    // Setup - make the service fail
    const { attendanceService } = require('../services/AttendanceService');
    attendanceService.getAttendanceSummaryWithStudents.mockRejectedValue(new Error('Failed to fetch attendance data'));
    
    // Render the component
    render(<AttendanceDashboard userRole="admin" />);
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch attendance data')).toBeInTheDocument();
    });
  });

  it('should display loading state while fetching data', async () => {
    // Setup - delay the resolution of the promise
    let resolvePromise;
    const { attendanceService } = require('../services/AttendanceService');
    attendanceService.getAttendanceSummaryWithStudents.mockImplementation(() => 
      new Promise(resolve => {
        resolvePromise = () => resolve(mockStudentsWithAttendance);
      })
    );
    
    // Render the component
    render(<AttendanceDashboard userRole="admin" />);
    
    // Check loading indicator is visible
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    
    // Resolve the promise
    resolvePromise();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
  });
});