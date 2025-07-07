import React, { useState, useEffect } from 'react';
import { expenseService } from '../services/ExpenseService';
import ErrorMessage from './ErrorMessage';
import styles from './StudentForm.module.css';
import { EXPENSE_CATEGORIES, EXPENSE_LABELS } from '../constants/expenseConstants';
import { BUDGET_TYPE_OPTIONS, BUDGET_LABELS } from '../constants/budgetConstants';
import { BUDGET_TYPES } from '../models/BudgetModels';

const ExpenseEditForm = ({ expense, onExpenseUpdated, onCancel, currentUser }) => {
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    date: '',
    notes: '',
    budgetType: BUDGET_TYPES.FEE_REVENUE // Default to fee revenue
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form data when expense prop changes
  useEffect(() => {
    if (expense) {
      setFormData({
        category: expense.category || 'supplies',
        description: expense.description || '',
        amount: expense.amount?.toString() || '',
        date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
        notes: expense.notes || '',
        budgetType: expense.budgetType || BUDGET_TYPES.FEE_REVENUE
      });
    }
  }, [expense]);

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
      const updateData = {
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date),
        notes: formData.notes,
        budgetType: formData.budgetType,
        adminId: currentUser?.uid || expense.adminId || 'unknown-admin'
      };

      const updatedExpense = await expenseService.updateExpense(expense.id, updateData);
      
      if (onExpenseUpdated) {
        onExpenseUpdated(updatedExpense);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!expense) {
    return <div>No expense selected for editing.</div>;
  }

  return (
    <div className={styles.formContainer}>
      <h3>Edit Expense</h3>
      
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
            {loading ? 'Updating...' : BUDGET_LABELS.UPDATE}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
          >
            {BUDGET_LABELS.CANCEL}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseEditForm;