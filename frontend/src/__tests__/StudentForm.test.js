// StudentForm.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StudentForm from '../components/StudentForm';

describe('StudentForm', () => {
  const mockOnSubmit = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty form for new student', () => {
    render(<StudentForm onSubmit={mockOnSubmit} />);
    
    // Check if form fields are present and empty
    expect(screen.getByTestId('student-firstname-input')).toHaveValue('');
    expect(screen.getByTestId('student-lastname-input')).toHaveValue('');
    expect(screen.getByTestId('student-email-input')).toBeInTheDocument();
    
    // Admin view fields should not be present by default
    expect(screen.queryByTestId('student-status-select')).not.toBeInTheDocument();
    expect(screen.queryByTestId('student-balance-input')).not.toBeInTheDocument();
  });

  it('renders form with existing student data', () => {
    const mockStudent = {
      id: 'student123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      enrollmentStatus: 'Enrolled',
      balance: 100,
      danceRole: 'Follow'
    };
    
    render(<StudentForm student={mockStudent} onSubmit={mockOnSubmit} isAdminView={true} />);
    
    // Check if form fields have the student data
    expect(screen.getByTestId('student-firstname-input')).toHaveValue('John');
    expect(screen.getByTestId('student-lastname-input')).toHaveValue('Doe');
    expect(screen.queryByTestId('student-email-input')).not.toBeInTheDocument(); // Email not editable for existing students
    
    // Admin view fields should be present
    expect(screen.getByTestId('student-status-select')).toHaveValue('Enrolled');
    expect(screen.getByTestId('student-dance-role-select')).toHaveValue('Follow');
    expect(screen.getByTestId('student-balance-input')).toHaveValue(100);
  });

  it('shows admin fields when isAdminView is true', () => {
    render(<StudentForm onSubmit={mockOnSubmit} isAdminView={true} />);
    
    // Admin fields should be present
    expect(screen.getByTestId('student-status-select')).toBeInTheDocument();
    expect(screen.getByTestId('student-dance-role-select')).toBeInTheDocument();
    expect(screen.getByTestId('student-balance-input')).toBeInTheDocument();
  });

  it('submits form with correct data', async () => {
    render(<StudentForm onSubmit={mockOnSubmit} />);
    
    // Fill the form
    fireEvent.change(screen.getByTestId('student-firstname-input'), {
      target: { value: 'Jane' }
    });
    fireEvent.change(screen.getByTestId('student-lastname-input'), {
      target: { value: 'Smith' }
    });
    fireEvent.change(screen.getByTestId('student-email-input'), {
      target: { value: 'jane.smith@example.com' }
    });
    
    // Submit the form
    fireEvent.submit(screen.getByTestId('student-submit-button'));
    
    // Check if onSubmit was called with correct data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        enrollmentStatus: 'Pending Payment',
        balance: 0,
        danceRole: 'Lead'
      });
    });
  });

  it('handles form submission errors', async () => {
    const mockError = new Error('Test error message');
    mockOnSubmit.mockRejectedValueOnce(mockError);
    
    render(<StudentForm onSubmit={mockOnSubmit} />);
    
    // Fill the form
    fireEvent.change(screen.getByTestId('student-firstname-input'), {
      target: { value: 'Jane' }
    });
    fireEvent.change(screen.getByTestId('student-lastname-input'), {
      target: { value: 'Smith' }
    });
    fireEvent.change(screen.getByTestId('student-email-input'), {
      target: { value: 'jane.smith@example.com' }
    });
    
    // Submit the form
    fireEvent.submit(screen.getByTestId('student-submit-button'));
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });
});