// LoginForm.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginForm from '../components/LoginForm';

describe('LoginForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnSwitchMode = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form by default', () => {
    render(
      <LoginForm 
        onSubmit={mockOnSubmit}
        isRegister={false}
        onSwitchMode={mockOnSwitchMode}
      />
    );
    
    // Use more specific queries with test-ids
    expect(screen.getByTestId('form-title')).toHaveTextContent('Login');
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toHaveTextContent('Login');
    expect(screen.getByTestId('switch-mode-button')).toHaveTextContent('Switch to Register');
  });

  it('switches between login and register modes', () => {
    const { rerender } = render(
      <LoginForm 
        onSubmit={mockOnSubmit}
        isRegister={false}
        onSwitchMode={mockOnSwitchMode}
      />
    );

    fireEvent.click(screen.getByTestId('switch-mode-button'));
    expect(mockOnSwitchMode).toHaveBeenCalled();

    // Test register mode
    rerender(
      <LoginForm 
        onSubmit={mockOnSubmit}
        isRegister={true}
        onSwitchMode={mockOnSwitchMode}
      />
    );
    
    expect(screen.getByTestId('form-title')).toHaveTextContent('Register');
    expect(screen.getByTestId('submit-button')).toHaveTextContent('Register');
    expect(screen.getByTestId('switch-mode-button')).toHaveTextContent('Switch to Login');
  });

  it('handles form submission', async () => {
    render(
      <LoginForm 
        onSubmit={mockOnSubmit}
        isRegister={false}
        onSwitchMode={mockOnSwitchMode}
      />
    );

    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' }
    });
    
    fireEvent.submit(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });
});