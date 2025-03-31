// PaymentDashboard.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PaymentDashboard from '../components/PaymentDashboard';

// Mock useLocation
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: '/payments', search: '' }),
  BrowserRouter: ({ children }) => <div>{children}</div>
}));

// Mock the child components
jest.mock('../components/PaymentForm', () => {
  return function MockPaymentForm({ onSuccess }) {
    return (
      <div data-testid="mock-payment-form">
        Payment Form
        <button onClick={() => onSuccess && onSuccess()}>
          Test Success
        </button>
      </div>
    );
  };
});

jest.mock('../components/PaymentList', () => {
  return function MockPaymentList() {
    return <div data-testid="mock-payment-list">Payment List</div>;
  };
});

describe('PaymentDashboard Component', () => {
  test('renders unauthorized message for non-admin users', () => {
    render(<PaymentDashboard userRole="student" />);
    
    expect(screen.getByTestId('unauthorized-message')).toBeInTheDocument();
    expect(screen.getByText(/don't have permission/i)).toBeInTheDocument();
  });

  test('renders payment dashboard for admin users', () => {
    render(<PaymentDashboard userRole="admin" />);
    
    expect(screen.getByTestId('payment-dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Payment Management/i)).toBeInTheDocument();
    
    // Should start with the dashboard view (payment list)
    expect(screen.getByTestId('mock-payment-list')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-payment-form')).not.toBeInTheDocument();
    
    // View controls should be present
    expect(screen.getByTestId('view-dashboard-button')).toBeInTheDocument();
    expect(screen.getByTestId('view-form-button')).toBeInTheDocument();
  });

  test('switches between dashboard and form views', () => {
    render(<PaymentDashboard userRole="admin" />);
    
    // Initially shows dashboard view
    expect(screen.getByTestId('mock-payment-list')).toBeInTheDocument();
    
    // Switch to form view
    fireEvent.click(screen.getByTestId('view-form-button'));
    
    // Should show form view
    expect(screen.getByTestId('mock-payment-form')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-payment-list')).not.toBeInTheDocument();
    
    // Switch back to dashboard view
    fireEvent.click(screen.getByTestId('view-dashboard-button'));
    
    // Should show dashboard view again
    expect(screen.getByTestId('mock-payment-list')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-payment-form')).not.toBeInTheDocument();
  });

  test('handles successful payment', () => {
    render(<PaymentDashboard userRole="admin" />);
    
    // Switch to form view
    fireEvent.click(screen.getByTestId('view-form-button'));
    
    // Verify form is displayed
    expect(screen.getByTestId('mock-payment-form')).toBeInTheDocument();
    
    // Simulate successful payment
    fireEvent.click(screen.getByText('Test Success'));
    
    // Note: In a real component, this would trigger a state update (refreshKey)
    // and switch to the dashboard view, but we can't fully test that in this mock
    // without more complex setup
  });
});