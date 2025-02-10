// App.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { authService } from '../services/AuthService';

// Mock the auth service
jest.mock('../services/AuthService', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
}));


describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders LoginForm by default', () => {
    render(<App />);
    expect(screen.getByTestId('form-title')).toHaveTextContent('Login');
  });

  it('handles successful login', async () => {
    const mockUser = { email: 'test@example.com' };
    authService.login.mockResolvedValueOnce(mockUser);

    render(<App />);

    // Fill in the form
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' }
    });

    // Submit the form
    fireEvent.submit(screen.getByTestId('submit-button'));

    // Wait for the welcome message
    await waitFor(() => {
      expect(screen.getByTestId('welcome-message')).toHaveTextContent('Welcome, test@example.com');
    });
  });

  it('handles login errors', async () => {
    const errorMessage = 'Invalid credentials';
    authService.login.mockRejectedValueOnce(new Error(errorMessage));

    render(<App />);

    // Fill in the form
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'wrong-password' }
    });

    // Submit the form
    fireEvent.submit(screen.getByTestId('submit-button'));

    // Wait for the error message using text content instead of test-id
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles logout', async () => {
    // Start with a logged-in user
    const mockUser = { email: 'test@example.com' };
    authService.login.mockResolvedValueOnce(mockUser);

    render(<App />);

    // Log in first
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' }
    });
    fireEvent.submit(screen.getByTestId('submit-button'));

    // Wait for the welcome section
    await waitFor(() => {
      expect(screen.getByTestId('welcome-section')).toBeInTheDocument();
    });

    // Click logout
    fireEvent.click(screen.getByTestId('logout-button'));

    // Wait for the login form to reappear
    await waitFor(() => {
      expect(screen.getByTestId('form-title')).toBeInTheDocument();
    });
  });

  it('handles registration mode', async () => {
    render(<App />);
    
    // Switch to register mode
    fireEvent.click(screen.getByTestId('switch-mode-button'));
    
    expect(screen.getByTestId('form-title')).toHaveTextContent('Register');
    
    // Mock successful registration
    const mockUser = { email: 'newuser@example.com' };
    authService.register.mockResolvedValueOnce(mockUser);

    // Fill and submit registration form
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'newuser@example.com' }
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'newpassword123' }
    });
    fireEvent.submit(screen.getByTestId('submit-button'));

    // Verify registration successful
    await waitFor(() => {
      expect(screen.getByTestId('welcome-message')).toHaveTextContent('Welcome, newuser@example.com');
    });
  });
});