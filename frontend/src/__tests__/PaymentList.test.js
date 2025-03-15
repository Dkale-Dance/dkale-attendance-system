// PaymentList.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaymentList from '../components/PaymentList';
import { paymentService } from '../services/PaymentService';

// Mock the payment service
jest.mock('../services/PaymentService', () => ({
  paymentService: {
    getAllPayments: jest.fn(),
    getPaymentsByStudent: jest.fn(),
    getPaymentsByDateRange: jest.fn()
  }
}));

describe('PaymentList Component', () => {
  const mockPayments = [
    {
      id: 'payment1',
      studentId: 'student1',
      studentName: 'John Doe',
      amount: 100,
      date: new Date('2023-01-15'),
      paymentMethod: 'cash',
      notes: 'Monthly fee'
    },
    {
      id: 'payment2',
      studentId: 'student2',
      studentName: 'Jane Smith',
      amount: 150,
      date: new Date('2023-01-20'),
      paymentMethod: 'card',
      notes: 'Registration fee'
    }
  ];

  const mockStudentPayments = [
    {
      id: 'payment1',
      studentId: 'student1',
      amount: 100,
      date: new Date('2023-01-15'),
      paymentMethod: 'cash',
      notes: 'Monthly fee'
    },
    {
      id: 'payment3',
      studentId: 'student1',
      amount: 50,
      date: new Date('2023-01-25'),
      paymentMethod: 'cash',
      notes: 'Late fee'
    }
  ];

  const mockStudentData = {
    student: {
      id: 'student1',
      firstName: 'John',
      lastName: 'Doe',
      balance: 350
    },
    payments: mockStudentPayments
  };

  beforeEach(() => {
    // Set up mocks
    paymentService.getAllPayments.mockResolvedValue(mockPayments);
    paymentService.getPaymentsByStudent.mockResolvedValue(mockStudentData);
    paymentService.getPaymentsByDateRange.mockResolvedValue(mockPayments);
  });

  afterEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  test('renders payment list with all payments', async () => {
    render(<PaymentList />);
    
    // Initial loading state
    expect(screen.getByText(/Loading payments/i)).toBeInTheDocument();
    
    // Wait for payments to load
    await waitFor(() => {
      expect(screen.getByTestId('payments-table')).toBeInTheDocument();
    });
    
    // Check if payments are rendered
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
    expect(screen.getByText(/100\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/150\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/Cash/i)).toBeInTheDocument();
    expect(screen.getByText(/Card/i)).toBeInTheDocument();
    expect(screen.getByText(/Monthly fee/i)).toBeInTheDocument();
    expect(screen.getByText(/Registration fee/i)).toBeInTheDocument();
    
    // Check if date filter controls are rendered
    expect(screen.getByTestId('payment-start-date')).toBeInTheDocument();
    expect(screen.getByTestId('payment-end-date')).toBeInTheDocument();
    expect(screen.getByTestId('payment-filter-button')).toBeInTheDocument();
  });

  test('renders student-specific payment list', async () => {
    render(<PaymentList studentId="student1" />);
    
    // Initial loading state
    expect(screen.getByText(/Loading payments/i)).toBeInTheDocument();
    
    // Wait for payments to load
    await waitFor(() => {
      expect(screen.getByTestId('payments-table')).toBeInTheDocument();
    });
    
    // Check if student payments are rendered
    expect(screen.getByText(/Monthly fee/i)).toBeInTheDocument();
    expect(screen.getByText(/Late fee/i)).toBeInTheDocument();
    expect(screen.getByText(/50\.00/i)).toBeInTheDocument();
    
    // Check if title is specific for student
    expect(screen.getByText(/Student Payment History/i)).toBeInTheDocument();
    
    // Date filters should not be shown for student-specific view
    expect(screen.queryByTestId('payment-start-date')).not.toBeInTheDocument();
  });

  test('filters payments by date range', async () => {
    render(<PaymentList />);
    
    // Wait for payments to load
    await waitFor(() => {
      expect(screen.getByTestId('payments-table')).toBeInTheDocument();
    });
    
    // Set date range
    fireEvent.change(screen.getByTestId('payment-start-date'), { target: { value: '2023-01-01' } });
    fireEvent.change(screen.getByTestId('payment-end-date'), { target: { value: '2023-01-31' } });
    
    // Apply filter
    fireEvent.click(screen.getByTestId('payment-filter-button'));
    
    // Wait for filtered payments to load
    await waitFor(() => {
      expect(paymentService.getPaymentsByDateRange).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date)
      );
    });
    
    // Check if filter can be cleared
    expect(screen.getByTestId('payment-clear-filter-button')).toBeInTheDocument();
    
    // Clear filter
    fireEvent.click(screen.getByTestId('payment-clear-filter-button'));
    
    // Should load all payments again
    await waitFor(() => {
      expect(paymentService.getAllPayments).toHaveBeenCalled();
    });
  });

  test('shows empty state when no payments exist', async () => {
    // Mock empty payments
    paymentService.getAllPayments.mockResolvedValue([]);
    
    render(<PaymentList />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Loading payments/i)).not.toBeInTheDocument();
    });
    
    // Check if empty state message is shown
    expect(screen.getByText(/No payments found/i)).toBeInTheDocument();
    
    // Table should not be rendered
    expect(screen.queryByTestId('payments-table')).not.toBeInTheDocument();
  });
});