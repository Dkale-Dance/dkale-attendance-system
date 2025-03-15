import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FinancialReports from '../components/FinancialReports';
import { reportService } from '../services/ReportService';

// Mock the ReportService
jest.mock('../services/ReportService', () => ({
  reportService: {
    generateCumulativeFinancialReport: jest.fn()
  }
}));

describe('FinancialReports Component', () => {
  const mockStudentBalances = [
    { 
      id: 'student1', 
      name: 'John Doe', 
      email: 'john@example.com',
      balance: 150.50
    },
    { 
      id: 'student2', 
      name: 'Jane Smith', 
      email: 'jane@example.com',
      balance: 0
    }
  ];
  
  const mockCumulativeReport = {
    title: 'Cumulative Financial Report',
    summary: {
      totalFeesCharged: 1000,
      totalPaymentsReceived: 800,
      outstandingBalance: 200
    },
    studentBalances: mockStudentBalances
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows unauthorized message for non-admin users', () => {
    render(<FinancialReports userRole="student" />);
    
    expect(screen.getByTestId('unauthorized-message')).toBeInTheDocument();
    expect(screen.getByText(/You don't have permission to access financial reports/i)).toBeInTheDocument();
  });

  test('shows loading indicator while fetching data', () => {
    // Mock the report service to return a promise that doesn't resolve immediately
    reportService.generateCumulativeFinancialReport.mockImplementation(() => new Promise(() => {}));
    
    render(<FinancialReports userRole="admin" />);
    
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  test('displays outstanding student balances', async () => {
    // Mock the report service to return the mock report
    reportService.generateCumulativeFinancialReport.mockResolvedValue(mockCumulativeReport);
    
    render(<FinancialReports userRole="admin" />);
    
    // Wait for the data to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
    
    // Check that the component title is correct
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Outstanding Student Balances');
    
    // Check that the table is rendered
    expect(screen.getByRole('table')).toBeInTheDocument();
    
    // Check table headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Outstanding Balance')).toBeInTheDocument();
    
    // Check student data is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('$150.50')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });

  test('displays error message when API call fails', async () => {
    // Mock the report service to throw an error
    const errorMessage = 'Failed to fetch financial data';
    reportService.generateCumulativeFinancialReport.mockRejectedValue(new Error(errorMessage));
    
    render(<FinancialReports userRole="admin" />);
    
    // Wait for the error to be displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});