import React, { useState, useEffect, useCallback } from 'react';
import { expenseService } from '../services/ExpenseService';
import ErrorMessage from './ErrorMessage';
import styles from './StudentList.module.css';
import { EXPENSE_CATEGORIES, EXPENSE_LABELS } from '../constants/expenseConstants';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

const ExpenseList = ({ refreshTrigger, onExpenseDeleted, onExpenseEdit }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      let expenseData;
      if (filter === 'all') {
        expenseData = await expenseService.getAllExpenses();
      } else {
        expenseData = await expenseService.getExpensesByCategory(filter);
      }
      
      setExpenses(expenseData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses, refreshTrigger]);

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm(EXPENSE_LABELS.CONFIRM_DELETE)) {
      return;
    }

    try {
      await expenseService.deleteExpense(expenseId);
      setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== expenseId));
      
      if (onExpenseDeleted) {
        onExpenseDeleted(expenseId);
      }
    } catch (err) {
      setError(`${EXPENSE_LABELS.DELETE_FAILED} ${err.message}`);
    }
  };

  const handleEditExpense = (expense) => {
    if (onExpenseEdit) {
      onExpenseEdit(expense);
    }
  };


  if (loading) {
    return <div className={styles.loading}>{EXPENSE_LABELS.LOADING}</div>;
  }

  return (
    <div className={styles.listContainer}>
      <div className={styles.header}>
        <h3>{EXPENSE_LABELS.LIST_TITLE}</h3>
        <div className={styles.filterContainer}>
          <label htmlFor="categoryFilter">{EXPENSE_LABELS.FILTER_LABEL}</label>
          <select
            id="categoryFilter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={styles.filterSelect}
          >
            {EXPENSE_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {expenses.length === 0 ? (
        <div className={styles.noData}>
          {filter === 'all' ? EXPENSE_LABELS.NO_EXPENSES : EXPENSE_LABELS.NO_CATEGORY_EXPENSES.replace('{category}', filter)}
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Budget Source</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(expense => (
                <tr key={expense.id}>
                  <td>{expense?.date ? new Date(expense.date).toLocaleDateString() : '-'}</td>
                  <td>
                    <span className={`${styles.category} ${styles[expense?.category || 'other']}`}>
                      {expense?.category ? expense.category.charAt(0).toUpperCase() + expense.category.slice(1) : 'Other'}
                    </span>
                  </td>
                  <td>{expense?.description || '-'}</td>
                  <td className={styles.amount}>{formatCurrency(expense?.amount || 0)}</td>
                  <td>
                    <span className={`${styles.budgetType} ${styles[expense?.budgetType || 'fee-revenue']}`}>
                      {expense?.budgetType === 'fee-revenue' ? 'Fee Revenue' : 
                       expense?.budgetType === 'contribution-revenue' ? 'Contribution Revenue' :
                       expense?.budgetType === 'expense' ? 'General Expense' :
                       'Fee Revenue (default)'}
                    </span>
                  </td>
                  <td>{expense?.notes || '-'}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        onClick={() => handleEditExpense(expense)}
                        className={styles.editButton}
                        title="Edit expense"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className={styles.deleteButton}
                        title="Delete expense"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.summary}>
        <strong>
          Total: {formatCurrency(expenses.reduce((sum, expense) => sum + (expense?.amount || 0), 0))}
        </strong>
      </div>
    </div>
  );
};

export default ExpenseList;