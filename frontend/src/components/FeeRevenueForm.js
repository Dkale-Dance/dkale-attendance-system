import React, { useState } from 'react';
import { budgetService } from '../services/BudgetService';
import ErrorMessage from './ErrorMessage';
import styles from './StudentForm.module.css';
import { BUDGET_LABELS, FEE_TYPES } from '../constants/budgetConstants';

const FeeRevenueForm = ({ onEntryCreated, currentUser }) => {
  const [formData, setFormData] = useState({
    feeType: 'late',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    studentId: '',
    studentName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate description when fee type or student changes
    if (name === 'feeType' || name === 'studentName') {
      const updatedData = { ...formData, [name]: value };
      if (updatedData.feeType && updatedData.studentName) {
        const feeTypeLabel = FEE_TYPES.find(type => type.value === updatedData.feeType)?.label || updatedData.feeType;
        setFormData(prev => ({
          ...prev,
          [name]: value,
          description: `${feeTypeLabel} for ${updatedData.studentName}`
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const amount = parseFloat(formData.amount);
      
      // Validate amount with explicit NaN and finite checks
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Amount must be a valid positive number');
      }
      
      const feeData = {
        feeType: formData.feeType,
        amount: amount,
        date: new Date(formData.date),
        description: formData.description || `${formData.feeType} fee for ${formData.studentName}`,
        adminId: currentUser?.uid || 'unknown-admin',
        studentId: formData.studentId || formData.studentName, // Use studentId if available, otherwise use name
      };

      const newEntry = await budgetService.createFeeRevenue(feeData);
      
      if (onEntryCreated) {
        onEntryCreated(newEntry);
      }

      // Reset form
      setFormData({
        feeType: 'late',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        studentId: '',
        studentName: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h3>{BUDGET_LABELS.ADD_FEE_REVENUE}</h3>
      
      {error && <ErrorMessage message={error} />}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="feeType">{BUDGET_LABELS.FEE_TYPE_LABEL}</label>
          <select
            id="feeType"
            name="feeType"
            value={formData.feeType}
            onChange={handleInputChange}
            required
            className={styles.input}
          >
            {FEE_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="studentName">{BUDGET_LABELS.STUDENT_LABEL}</label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            required
            className={styles.input}
            placeholder="Enter student name"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="amount">{BUDGET_LABELS.AMOUNT_LABEL}</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            required
            min="0"
            step="0.01"
            className={styles.input}
            placeholder="0.00"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="date">{BUDGET_LABELS.DATE_LABEL}</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">{BUDGET_LABELS.DESCRIPTION_LABEL}</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className={styles.input}
            rows="3"
            placeholder="Description will be auto-generated or you can customize it"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="studentId">Student ID (optional):</label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleInputChange}
            className={styles.input}
            placeholder="Student ID if available"
          />
        </div>

        <div className={styles.buttonGroup}>
          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Adding...' : BUDGET_LABELS.CREATE}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeeRevenueForm;