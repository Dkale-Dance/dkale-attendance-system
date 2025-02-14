import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Mock all dependencies
const mockLogin = jest.fn();
const mockRegister = jest.fn();
const mockLogout = jest.fn();

jest.mock('../services/AuthServiceFactory', () => ({
  createAuthService: () => ({
    login: mockLogin,
    register: mockRegister,
    logout: mockLogout
  })
}));

jest.mock('../services/StudentServiceFactory', () => ({
  createStudentService: () => ({
    loadStudents: jest.fn(),
    deleteStudent: jest.fn(),
    updateStudent: jest.fn(),
    createStudent: jest.fn()
  })
}));

// Mock firebase functions to prevent initialization errors
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn()
}));



describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders LoginForm by default', () => {
    render(<App />);
    expect(screen.getByTestId('form-title')).toHaveTextContent('Login');
  });

  it('handles successful login for admin', async () => {
    const mockUser = { email: 'admin@example.com', role: 'admin' };
    mockLogin.mockResolvedValueOnce(mockUser);

    render(<App />);

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'admin@example.com' }
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' }
    });
    fireEvent.submit(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@example.com', 'password123');
    });

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
  });

  it('handles successful login for student', async () => {
    const mockUser = { email: 'test@example.com', role: 'student' };
    mockLogin.mockResolvedValueOnce(mockUser);

    render(<App />);

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' }
    });
    fireEvent.submit(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    await waitFor(() => {
      expect(screen.getByTestId('welcome-message')).toHaveTextContent('Welcome, test@example.com');
    });
  });

  it('handles login errors', async () => {
    const errorMessage = 'Invalid credentials';
    mockLogin.mockRejectedValueOnce(new Error(errorMessage));

    render(<App />);

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'wrong-password' }
    });
    fireEvent.submit(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles registration', async () => {
    const mockUser = { email: 'newuser@example.com', role: 'student' };
    mockRegister.mockResolvedValueOnce(mockUser);

    render(<App />);
    
    fireEvent.click(screen.getByTestId('switch-mode-button'));
    expect(screen.getByTestId('form-title')).toHaveTextContent('Register');
    
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'newuser@example.com' }
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'newpassword123' }
    });
    fireEvent.submit(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('newuser@example.com', 'newpassword123');
    });

    await waitFor(() => {
      expect(screen.getByTestId('welcome-message')).toHaveTextContent('Welcome, newuser@example.com');
    });
  });

  it('handles logout', async () => {
    const mockUser = { email: 'test@example.com', role: 'student' };
    mockLogin.mockResolvedValueOnce(mockUser);
    mockLogout.mockResolvedValueOnce();

    render(<App />);

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' }
    });
    fireEvent.submit(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('welcome-section')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('logout-button'));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('form-title')).toBeInTheDocument();
    });
  });
});