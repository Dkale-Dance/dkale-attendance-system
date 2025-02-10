// LoginForm.js
import React, { useState } from 'react';
import ErrorMessage from './ErrorMessage';

const LoginForm = ({ onSubmit, isRegister, onSwitchMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await onSubmit(email, password);
      // Clear form after successful submission
      setEmail('');
      setPassword('');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="login-form">
      <h1 data-testid="form-title">{isRegister ? 'Register' : 'Login'}</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          data-testid="email-input"
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          data-testid="password-input"
        />

        <button type="submit" data-testid="submit-button">
          {isRegister ? 'Register' : 'Login'}
        </button>
        
        <ErrorMessage message={error} />
      </form>
      
      <button 
        onClick={onSwitchMode}
        data-testid="switch-mode-button"
      >
        {isRegister ? 'Switch to Login' : 'Switch to Register'}
      </button>
    </div>
  );
};

export default LoginForm;