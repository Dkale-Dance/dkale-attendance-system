// App.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { authService } from '../services/AuthService';
import { studentService } from '../services/StudentService';
import { reportService } from '../services/ReportService';

// Mock components
jest.mock('../components/StudentManagement', () => {
  return function MockStudentManagement() {
    return <div data-testid="student-management-component">Student Management</div>;
  };
});

jest.mock('../components/AttendanceDashboard', () => {
  return function MockAttendanceDashboard() {
    return <div data-testid="attendance-dashboard-component">Attendance Dashboard</div>;
  };
});

jest.mock('../components/PaymentDashboard', () => {
  return function MockPaymentDashboard() {
    return <div data-testid="payment-dashboard-component">Payment Dashboard</div>;
  };
});

jest.mock('../components/FinancialReports', () => {
  return function MockFinancialReports() {
    return <div data-testid="financial-reports-component">Financial Reports</div>;
  };
});

jest.mock('../components/AttendanceReports', () => {
  return function MockAttendanceReports() {
    return <div data-testid="attendance-reports-component">Attendance Reports</div>;
  };
});

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div data-testid="browser-router">{children}</div>,
  Routes: ({ children }) => <div data-testid="routes">{children}</div>,
  Route: ({ path, element }) => <div data-testid={`route-${path || 'default'}`}>{element}</div>,
  Link: ({ children, to, className }) => (
    <a href={to} className={className} data-testid={`link-${to}`}>
      {children}
    </a>
  ),
  Navigate: ({ to }) => <div data-testid={`navigate-to-${to}`}>Navigate to {to}</div>,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' })
}));

// Mock PublicDashboard component to avoid rendering issues
jest.mock('../components/PublicDashboard', () => {
  return function MockPublicDashboard() {
    return <div data-testid="public-dashboard-mock">Public Dashboard Mock</div>;
  };
});

// Mock the auth service
jest.mock('../services/AuthService', () => {
  // Create a mock implementation for onAuthStateChanged that can be customized per test
  const onAuthStateChangedMock = jest.fn((callback) => {
    // Default implementation - simulate no user
    callback(null);
    return jest.fn(); // Return dummy unsubscribe function
  });
  
  return {
    authService: {
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      registerStudent: jest.fn(),
      userRepository: {
        getRole: jest.fn(),
        assignRole: jest.fn()
      },
      authRepository: {
        onAuthStateChanged: onAuthStateChangedMock,
        getCurrentUser: jest.fn(),
        saveAdminCredentials: jest.fn(),
        getAdminCredentials: jest.fn().mockReturnValue({
          email: "admin@example.com",
          password: "admin123"
        }),
        createUserAndRestoreAdmin: jest.fn()
      }
    }
  };
});

// Mock the student service
jest.mock('../services/StudentService', () => ({
  studentService: {
    getStudentById: jest.fn(),
    updateStudent: jest.fn(),
    initializeStudentProfile: jest.fn()
  }
}));

// Mock report service
jest.mock('../services/ReportService', () => ({
  reportService: {
    getPublicDashboardData: jest.fn().mockResolvedValue([]),
    getStudentFinancialDetails: jest.fn().mockResolvedValue({})
  }
}));

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.location.pathname
    Object.defineProperty(window, 'location', {
      value: { pathname: '/' },
      writable: true
    });
  });

  it('renders LoginForm by default', async () => {
    // Set auth state to null (not logged in)
    authService.authRepository.onAuthStateChanged.mockImplementation(callback => {
      callback(null);
      return jest.fn();
    });
    
    render(<App />);
    
    // Wait for loading state to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
    
    expect(screen.getByTestId('form-title')).toHaveTextContent('Login');
  });

  it('handles successful login', async () => {
    const mockUser = { uid: 'test123', email: 'test@example.com' };
    authService.login.mockResolvedValueOnce(mockUser);
    authService.userRepository.getRole.mockResolvedValueOnce('student');
    studentService.getStudentById.mockResolvedValueOnce(null);
    
    // Set auth state to null to begin with
    authService.authRepository.onAuthStateChanged.mockImplementation(callback => {
      callback(null);
      return jest.fn();
    });

    render(<App />);
    
    // Wait for loading state to finish and login form to appear
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    // Fill in the form
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' }
    });

    // Submit the form
    fireEvent.submit(screen.getByTestId('submit-button'));

    // Simulate auth state changing after successful login
    authService.authRepository.onAuthStateChanged.mock.calls[0][0](mockUser);

    // Wait for the welcome message
    await waitFor(() => {
      expect(screen.getByTestId('welcome-section')).toBeInTheDocument();
    });
  });

  it('handles login errors', async () => {
    const errorMessage = 'Invalid credentials';
    authService.login.mockRejectedValueOnce(new Error(errorMessage));
    
    // Set auth state to null to begin with
    authService.authRepository.onAuthStateChanged.mockImplementation(callback => {
      callback(null);
      return jest.fn();
    });

    render(<App />);
    
    // Wait for loading state to finish and login form to appear
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    // Fill in the form
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'wrong-password' }
    });

    // Submit the form
    fireEvent.submit(screen.getByTestId('submit-button'));

    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  // Test that navigation links are shown based on user role
  it('shows student-specific navigation options for student users', async () => {
    // Mock authenticated student user
    const mockUser = { uid: 'student123', email: 'student@example.com' };
    
    // Set auth state to authenticated user
    authService.authRepository.onAuthStateChanged.mockImplementation(callback => {
      callback(mockUser);
      return jest.fn();
    });
    
    authService.userRepository.getRole.mockResolvedValueOnce('student');
    studentService.getStudentById.mockResolvedValueOnce({
      id: 'student123',
      firstName: 'Student',
      lastName: 'User'
    });
    
    render(<App />);
    
    // Wait for user data to load and navbar to appear with student options
    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.queryByText('Manage Students')).not.toBeInTheDocument();
    });
  });

  it('shows admin-specific navigation options for admin users', async () => {
    // Mock authenticated admin user
    const mockUser = { uid: 'admin123', email: 'admin@example.com' };
    
    // Set auth state to authenticated user
    authService.authRepository.onAuthStateChanged.mockImplementation(callback => {
      callback(mockUser);
      return jest.fn();
    });
    
    authService.userRepository.getRole.mockResolvedValueOnce('admin');
    
    render(<App />);
    
    // Wait for user data to load and navbar to appear with admin options
    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Manage Students')).toBeInTheDocument();
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    });
  });
});