import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import StudentList from '../../components/admin/StudentList';

describe('StudentList', () => {
  let mockPresenter;
  const mockStudents = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      enrollmentStatus: 'active',
      balance: 0
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      enrollmentStatus: 'pending',
      balance: 100
    }
  ];

  beforeEach(() => {
    mockPresenter = {
      loadStudents: jest.fn(),
      deleteStudent: jest.fn(),
      updateStudentStatus: jest.fn()
    };
  });

  it('should render loading state', () => {
    render(
      <StudentList
        presenter={mockPresenter}
        students={[]}
        isLoading={true}
      />
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render student list', () => {
    render(
      <StudentList
        presenter={mockPresenter}
        students={mockStudents}
        isLoading={false}
      />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('should disable delete button for students with balance', () => {
    render(
      <StudentList
        presenter={mockPresenter}
        students={mockStudents}
        isLoading={false}
      />
    );
    
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons[0]).toBeEnabled();
    expect(deleteButtons[1]).toBeDisabled();
  });

  it('should call presenter methods on user actions', () => {
    render(
      <StudentList
        presenter={mockPresenter}
        students={mockStudents}
        isLoading={false}
      />
    );

    // Test status update
    const statusSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(statusSelect, { target: { value: 'inactive' } });
    expect(mockPresenter.updateStudentStatus).toHaveBeenCalledWith('1', 'inactive');

    // Test delete
    const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
    fireEvent.click(deleteButton);
    expect(mockPresenter.deleteStudent).toHaveBeenCalledWith(mockStudents[0]);
  });

  it('should display error message when provided', () => {
    const errorMessage = 'Failed to load students';
    render(
      <StudentList
        presenter={mockPresenter}
        error={errorMessage}
        students={[]}
        isLoading={false}
      />
    );
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should call loadStudents on mount', () => {
    render(
      <StudentList
        presenter={mockPresenter}
        students={[]}
        isLoading={false}
      />
    );
    
    expect(mockPresenter.loadStudents).toHaveBeenCalledTimes(1);
  });
});