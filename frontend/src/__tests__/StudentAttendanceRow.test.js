import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentAttendanceRow from '../components/StudentAttendanceRow';

// Mock AttendanceService
jest.mock('../services/AttendanceService', () => ({
  attendanceService: {
    calculateAttendanceFee: jest.fn((status, attributes) => {
      // Fixed $5 fee for absent
      if (status === 'absent') {
        return 5;
      }
      
      // No fee for medical absence or holiday
      if (status === 'medicalAbsence' || status === 'holiday') {
        return 0;
      }
      
      // For present, accumulate fees from attributes
      let fee = 0;
      
      if (attributes.late) fee += 1;
      if (attributes.noShoes) fee += 1;
      if (attributes.notInUniform) fee += 1;
      
      return fee;
    })
  }
}));

describe('StudentAttendanceRow', () => {
  const mockStudent = {
    id: 'student1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    attendance: {
      status: 'present',
      timestamp: new Date(),
      attributes: {}
    }
  };

  const mockDate = new Date('2025-03-08');
  const mockOnStatusChange = jest.fn();
  const mockOnAttributeChange = jest.fn();
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render student information correctly', () => {
    render(
      <table>
        <tbody>
          <StudentAttendanceRow 
            student={mockStudent}
            date={mockDate}
            onStatusChange={mockOnStatusChange}
            onAttributeChange={mockOnAttributeChange}
            onSelect={mockOnSelect}
            isSelected={false}
            recentlyUpdated={false}
          />
        </tbody>
      </table>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    
    // Verify attendance status dropdown
    const statusSelect = screen.getByTestId(`attendance-select-${mockStudent.id}`);
    expect(statusSelect).toHaveValue('present');
  });

  it('should handle status change correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <table>
        <tbody>
          <StudentAttendanceRow 
            student={mockStudent}
            date={mockDate}
            onStatusChange={mockOnStatusChange}
            onAttributeChange={mockOnAttributeChange}
            onSelect={mockOnSelect}
            isSelected={false}
            recentlyUpdated={false}
          />
        </tbody>
      </table>
    );
    
    // Change attendance status to 'absent'
    const statusSelect = screen.getByTestId(`attendance-select-${mockStudent.id}`);
    await user.selectOptions(statusSelect, 'absent');
    
    // Verify onStatusChange was called
    expect(mockOnStatusChange).toHaveBeenCalledWith(
      mockStudent.id, 
      'absent',
      {} // Empty attributes since the status changed
    );
  });

  it('should handle attribute changes correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <table>
        <tbody>
          <StudentAttendanceRow 
            student={mockStudent}
            date={mockDate}
            onStatusChange={mockOnStatusChange}
            onAttributeChange={mockOnAttributeChange}
            onSelect={mockOnSelect}
            isSelected={false}
            recentlyUpdated={false}
          />
        </tbody>
      </table>
    );
    
    // Find and check the "No Shoes" checkbox
    const noShoesCheckbox = screen.getByTestId(`noShoes-checkbox-${mockStudent.id}`);
    await user.click(noShoesCheckbox);
    
    // Verify onAttributeChange was called with correct parameters
    expect(mockOnAttributeChange).toHaveBeenCalledWith(
      mockStudent.id,
      'present', // Current status
      { noShoes: true } // New attributes
    );
    
    // Now check the "Not in Uniform" checkbox
    const notInUniformCheckbox = screen.getByTestId(`notInUniform-checkbox-${mockStudent.id}`);
    await user.click(notInUniformCheckbox);
    
    // Verify onAttributeChange was called again with both attributes
    expect(mockOnAttributeChange).toHaveBeenCalledWith(
      mockStudent.id,
      'present',
      { noShoes: true, notInUniform: true }
    );
  });

  it('should enable attributes for present status only', async () => {
    const user = userEvent.setup();
    
    // Create a student with a "present" status
    const presentStudent = {
      ...mockStudent,
      attendance: {
        ...mockStudent.attendance,
        status: 'present'
      }
    };
    
    render(
      <table>
        <tbody>
          <StudentAttendanceRow 
            student={presentStudent}
            date={mockDate}
            onStatusChange={mockOnStatusChange}
            onAttributeChange={mockOnAttributeChange}
            onSelect={mockOnSelect}
            isSelected={false}
            recentlyUpdated={false}
          />
        </tbody>
      </table>
    );
    
    // Find attribute checkboxes - they should be enabled for present status
    const lateCheckbox = screen.getByTestId(`late-checkbox-${presentStudent.id}`);
    const noShoesCheckbox = screen.getByTestId(`noShoes-checkbox-${presentStudent.id}`);
    const notInUniformCheckbox = screen.getByTestId(`notInUniform-checkbox-${presentStudent.id}`);
    
    // Verify checkboxes are enabled for present status
    expect(lateCheckbox).not.toBeDisabled();
    expect(noShoesCheckbox).not.toBeDisabled();
    expect(notInUniformCheckbox).not.toBeDisabled();
    
    // Check the "Late" checkbox
    await user.click(lateCheckbox);
    
    // Verify onAttributeChange was called
    expect(mockOnAttributeChange).toHaveBeenCalledWith(
      presentStudent.id,
      'present',
      { late: true }
    );
  });

  it('should calculate and display fees correctly for present status with attributes', async () => {
    const user = userEvent.setup();
    
    // Modify the mock implementation to display the fee after selecting status
    const { attendanceService } = require('../services/AttendanceService');
    attendanceService.calculateAttendanceFee.mockImplementation((status, attributes) => {
      // For present status, add up fees from attributes
      if (status === 'present') {
        let fee = 0;
        if (attributes.late) fee += 1;
        if (attributes.noShoes) fee += 1;
        if (attributes.notInUniform) fee += 1;
        return fee;
      }
      
      // For absent, always $5
      if (status === 'absent') {
        return 5;
      }
      
      // For medical/holiday, always $0
      return 0;
    });
    
    render(
      <table>
        <tbody>
          <StudentAttendanceRow 
            student={{
              ...mockStudent,
              attendance: {
                ...mockStudent.attendance,
                status: 'present'
              }
            }}
            date={mockDate}
            onStatusChange={mockOnStatusChange}
            onAttributeChange={mockOnAttributeChange}
            onSelect={mockOnSelect}
            isSelected={false}
            recentlyUpdated={false}
          />
        </tbody>
      </table>
    );
    
    // Check the 'Late' checkbox ($1 fee)
    const lateCheckbox = screen.getByTestId(`late-checkbox-${mockStudent.id}`);
    await user.click(lateCheckbox);
    
    // Wait for the fee to be calculated and displayed
    await screen.findByText('Fee: $1.00');
    
    // Add 'No Shoes' attribute ($1 fee)
    const noShoesCheckbox = screen.getByTestId(`noShoes-checkbox-${mockStudent.id}`);
    await user.click(noShoesCheckbox);
    
    // Fee should now be $2 (late $1 + no shoes $1)
    await screen.findByText('Fee: $2.00');
    
    // Add 'Not in Uniform' attribute ($1 fee)
    const notInUniformCheckbox = screen.getByTestId(`notInUniform-checkbox-${mockStudent.id}`);
    await user.click(notInUniformCheckbox);
    
    // Fee should now be $3 (late $1 + no shoes $1 + not in uniform $1)
    await screen.findByText('Fee: $3.00');
  });
  
  it('should display fixed $5 fee for absent status and disable attributes', async () => {
    const user = userEvent.setup();
    
    const { attendanceService } = require('../services/AttendanceService');
    attendanceService.calculateAttendanceFee.mockClear();
    attendanceService.calculateAttendanceFee.mockReturnValue(5); // Fixed fee for absent status
    
    // First render with absent status
    render(
      <table>
        <tbody>
          <StudentAttendanceRow 
            student={{
              ...mockStudent,
              attendance: {
                ...mockStudent.attendance,
                status: 'absent'
              }
            }}
            date={mockDate}
            onStatusChange={mockOnStatusChange}
            onAttributeChange={mockOnAttributeChange}
            onSelect={mockOnSelect}
            isSelected={false}
            recentlyUpdated={false}
          />
        </tbody>
      </table>
    );
    
    // Attributes should be disabled
    const lateCheckbox = screen.getByTestId(`late-checkbox-${mockStudent.id}`);
    expect(lateCheckbox).toBeDisabled();
    
    // Should show fee
    expect(screen.getByText('Fee: $5.00')).toBeInTheDocument();
    
    // Should show note about fixed $5 fee
    expect(screen.getByText('Absent: Fixed $5 fee (attributes ignored)')).toBeInTheDocument();
  });
  
  it('should display the "Fee Attributes" heading', () => {
    render(
      <table>
        <tbody>
          <StudentAttendanceRow 
            student={mockStudent}
            date={mockDate}
            onStatusChange={mockOnStatusChange}
            onAttributeChange={mockOnAttributeChange}
            onSelect={mockOnSelect}
            isSelected={false}
            recentlyUpdated={false}
          />
        </tbody>
      </table>
    );
    
    // The heading should be present
    expect(screen.getByText('Fee Attributes:')).toBeInTheDocument();
  });
  
  it('should disable fee attributes for Absent, Medical Absence, and Holiday statuses', async () => {
    const user = userEvent.setup();
    
    render(
      <table>
        <tbody>
          <StudentAttendanceRow 
            student={mockStudent}
            date={mockDate}
            onStatusChange={mockOnStatusChange}
            onAttributeChange={mockOnAttributeChange}
            onSelect={mockOnSelect}
            isSelected={false}
            recentlyUpdated={false}
          />
        </tbody>
      </table>
    );
    
    // Check that attributes are enabled for Present
    const lateCheckbox = screen.getByTestId(`late-checkbox-${mockStudent.id}`);
    const noShoesCheckbox = screen.getByTestId(`noShoes-checkbox-${mockStudent.id}`);
    expect(lateCheckbox).not.toBeDisabled();
    expect(noShoesCheckbox).not.toBeDisabled();
    
    // Change to Absent
    const statusSelect = screen.getByTestId(`attendance-select-${mockStudent.id}`);
    await user.selectOptions(statusSelect, 'absent');
    
    // Check that attributes are now disabled
    expect(lateCheckbox).toBeDisabled();
    expect(noShoesCheckbox).toBeDisabled();
    
    // Should show fee note for absent
    expect(screen.getByText('Absent: Fixed $5 fee (attributes ignored)')).toBeInTheDocument();
    
    // Change to Medical Absence
    await user.selectOptions(statusSelect, 'medicalAbsence');
    
    // Check that fee note for medical/holiday is shown
    expect(screen.getByText('No fees for this status (attributes ignored)')).toBeInTheDocument();
  });
});