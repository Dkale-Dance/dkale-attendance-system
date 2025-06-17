import React, { useState } from 'react';
import { expenseService } from '../services/ExpenseService';
import ErrorMessage from './ErrorMessage';
import styles from './StudentForm.module.css';
import { EXPENSE_CATEGORIES, EXPENSE_LABELS } from '../constants/expenseConstants';
import { BUDGET_TYPE_OPTIONS, BUDGET_LABELS } from '../constants/budgetConstants';
import { BUDGET_TYPES } from '../models/BudgetModels';

const ExpenseForm = ({ onExpenseCreated, onCancel, currentUser }) => {
  const [formData, setFormData] = useState({
    category: 'supplies',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    budgetType: BUDGET_TYPES.EXPENSE // Default to general expense
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = EXPENSE_CATEGORIES.filter(cat => cat.value !== 'all');
  const budgetTypeOptions = BUDGET_TYPE_OPTIONS.filter(option => 
    option.value !== 'all' && option.value !== BUDGET_TYPES.CONTRIBUTION_REVENUE
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      
      const expenseData = {
        ...formData,
        amount: amount,
        date: new Date(formData.date),
        budgetType: formData.budgetType,
        adminId: currentUser?.uid || 'unknown-admin'
      };

      const newExpense = await expenseService.createExpense(expenseData);
      
      if (onExpenseCreated) {
        onExpenseCreated(newExpense);
      }

      setFormData({
        category: 'supplies',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        budgetType: BUDGET_TYPES.EXPENSE
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h3>{EXPENSE_LABELS.FORM_TITLE}</h3>
      
      {error && <ErrorMessage message={error} />}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="category">Category:</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            className={styles.input}
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Description:</label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            className={styles.input}
            placeholder="Enter expense description"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="amount">Amount:</label>
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
          <label htmlFor="date">Date:</label>
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
          <label htmlFor="budgetType">Budget Source:</label>
          <select
            id="budgetType"
            name="budgetType"
            value={formData.budgetType}
            onChange={handleInputChange}
            required
            className={styles.input}
          >
            {budgetTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <small>
            Select which budget this expense should be charged to:
            <br />• <strong>Fee Revenue</strong>: Funded by late fees, absent fees, etc.
            <br />• <strong>Expenses</strong>: General operational expenses
          </small>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="notes">Notes (optional):</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            className={styles.input}
            rows="3"
            placeholder="Additional notes about this expense"
          />
        </div>

        <div className={styles.buttonGroup}>
          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Adding...' : 'Add Expense'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;