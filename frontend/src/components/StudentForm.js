// StudentForm.js
import React, { useState } from 'react';
import ErrorMessage from './ErrorMessage';

const StudentForm = ({ student, onSubmit, buttonText = "Save", isAdminView = false }) => {
  const [formData, setFormData] = useState({
    firstName: student?.firstName || '',
    lastName: student?.lastName || '',
    email: student?.email || '',
    enrollmentStatus: student?.enrollmentStatus || 'Pending Payment',
    balance: student?.balance || 0
  });
  
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'balance' ? parseFloat(value) || 0 : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await onSubmit(formData);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="student-form" data-testid="student-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="firstName">First Name</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            data-testid="student-firstname-input"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="lastName">Last Name</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            data-testid="student-lastname-input"
          />
        </div>
        
        {!student && (
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              data-testid="student-email-input"
            />
          </div>
        )}

        {isAdminView && (
          <>
            <div className="form-group">
              <label htmlFor="enrollmentStatus">Enrollment Status</label>
              <select
                id="enrollmentStatus"
                name="enrollmentStatus"
                value={formData.enrollmentStatus}
                onChange={handleChange}
                data-testid="student-status-select"
              >
                <option value="Enrolled">Enrolled</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending Payment">Pending Payment</option>
                <option value="Removed">Removed</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="balance">Balance ($)</label>
              <input
                type="number"
                id="balance"
                name="balance"
                value={formData.balance}
                onChange={handleChange}
                min="0"
                step="0.01"
                data-testid="student-balance-input"
              />
            </div>
          </>
        )}

        <button 
          type="submit" 
          data-testid="student-submit-button"
        >
          {buttonText}
        </button>
        
        <ErrorMessage message={error} />
      </form>
    </div>
  );
};

export default StudentForm;