import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import OptimizedStudentList from '../components/OptimizedStudentList';

// Mock data for testing
const mockStudents = [
  { id: '1', firstName: 'John', lastName: 'Doe', enrollmentStatus: 'Enrolled', balance: 0 },
  { id: '2', firstName: 'Jane', lastName: 'Smith', enrollmentStatus: 'Enrolled', balance: 100 },
  { id: '3', firstName: 'Bob', lastName: 'Johnson', enrollmentStatus: 'Inactive', balance: 50 }
];

describe('OptimizedStudentList', () => {
  const mockOnStudentClick = jest.fn();
  const mockOnPageChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders a list of students', () => {
    render(
      <OptimizedStudentList 
        students={mockStudents}
        currentPage={1}
        totalPages={1}
        onStudentClick={mockOnStudentClick}
        onPageChange={mockOnPageChange}
      />
    );
    
    // Check if student names are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });
  
  it('calls onStudentClick when a student row is clicked', () => {
    render(
      <OptimizedStudentList 
        students={mockStudents}
        currentPage={1}
        totalPages={1}
        onStudentClick={mockOnStudentClick}
        onPageChange={mockOnPageChange}
      />
    );
    
    // Click on the first student row
    fireEvent.click(screen.getByText('John Doe'));
    
    // Check if the onStudentClick callback was called with the correct student
    expect(mockOnStudentClick).toHaveBeenCalledWith(mockStudents[0]);
  });
  
  it('renders pagination controls when there are multiple pages', () => {
    render(
      <OptimizedStudentList 
        students={mockStudents}
        currentPage={1}
        totalPages={3}
        onStudentClick={mockOnStudentClick}
        onPageChange={mockOnPageChange}
      />
    );
    
    // Check if pagination controls are displayed
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });
  
  it('disables Previous button on first page', () => {
    render(
      <OptimizedStudentList 
        students={mockStudents}
        currentPage={1}
        totalPages={3}
        onStudentClick={mockOnStudentClick}
        onPageChange={mockOnPageChange}
      />
    );
    
    // Check if Previous button is disabled
    expect(screen.getByText('Previous').closest('button')).toBeDisabled();
    // Next button should be enabled
    expect(screen.getByText('Next').closest('button')).not.toBeDisabled();
  });
  
  it('disables Next button on last page', () => {
    render(
      <OptimizedStudentList 
        students={mockStudents}
        currentPage={3}
        totalPages={3}
        onStudentClick={mockOnStudentClick}
        onPageChange={mockOnPageChange}
      />
    );
    
    // Check if Next button is disabled
    expect(screen.getByText('Next').closest('button')).toBeDisabled();
    // Previous button should be enabled
    expect(screen.getByText('Previous').closest('button')).not.toBeDisabled();
  });
  
  it('calls onPageChange when Next button is clicked', () => {
    render(
      <OptimizedStudentList 
        students={mockStudents}
        currentPage={1}
        totalPages={3}
        onStudentClick={mockOnStudentClick}
        onPageChange={mockOnPageChange}
      />
    );
    
    // Click on the Next button
    fireEvent.click(screen.getByText('Next'));
    
    // Check if onPageChange was called with the next page number
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });
  
  it('calls onPageChange when Previous button is clicked', () => {
    render(
      <OptimizedStudentList 
        students={mockStudents}
        currentPage={2}
        totalPages={3}
        onStudentClick={mockOnStudentClick}
        onPageChange={mockOnPageChange}
      />
    );
    
    // Click on the Previous button
    fireEvent.click(screen.getByText('Previous'));
    
    // Check if onPageChange was called with the previous page number
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });
  
  it('displays a message when no students are available', () => {
    render(
      <OptimizedStudentList 
        students={[]}
        currentPage={1}
        totalPages={0}
        onStudentClick={mockOnStudentClick}
        onPageChange={mockOnPageChange}
      />
    );
    
    // Check if the empty message is displayed
    expect(screen.getByText('No students found.')).toBeInTheDocument();
  });
});