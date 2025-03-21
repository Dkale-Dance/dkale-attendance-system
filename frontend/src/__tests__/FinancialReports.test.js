import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FinancialReports from '../components/FinancialReports';
import { reportService } from '../services/ReportService';

// Mock the ReportService
jest.mock('../services/ReportService', () => ({
  reportService: {
    generateCumulativeFinancialReport: jest.fn(),
    generateDetailedMonthlyFinancialReport: jest.fn(),
    formatReportForExport: jest.fn(),
    getDataForVisualization: jest.fn()
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

  // Skip test if there's no loading indicator in the implementation
  test('shows loading indicator while fetching data', () => {
    // Mock the report service to return a promise that doesn't resolve immediately
    reportService.generateCumulativeFinancialReport.mockImplementation(() => new Promise(() => {}));
    
    render(<FinancialReports userRole="admin" />);
    
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  test('displays outstanding student balances', async () => {
    // Mock the required reports
    reportService.generateCumulativeFinancialReport.mockResolvedValue(mockCumulativeReport);
    reportService.generateDetailedMonthlyFinancialReport.mockResolvedValue({
      title: "Financial Report: January 2023",
      period: {
        month: 0,
        year: 2023,
        displayName: "January 2023"
      },
      summary: {
        totalFeesCharged: 1000,
        totalPaymentsReceived: 800,
        feesCollected: 800,
        pendingFees: 150,
        feesInPaymentProcess: 50
      },
      feeBreakdown: {
        byType: {
          absence: 500,
          late: 200,
          noShoes: 150,
          notInUniform: 150
        }
      },
      studentDetails: mockStudentBalances
    });
    
    render(<FinancialReports userRole="admin" />);
    
    // Wait for the data to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
    
    // Check that the component title is correct
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Financial Reports');
    
    // Since we're using the monthly report by default, check for student data
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  test('displays error message when API call fails', async () => {
    // Mock the service to throw an error
    reportService.generateDetailedMonthlyFinancialReport.mockRejectedValue(new Error('Some error'));
    
    render(<FinancialReports userRole="admin" />);
    
    // Wait for any error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Some error')).toBeInTheDocument();
    });
  });
});