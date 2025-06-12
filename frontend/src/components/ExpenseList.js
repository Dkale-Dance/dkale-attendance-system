import React, { useState, useEffect } from 'react';
import { expenseService } from '../services/ExpenseService';
import ErrorMessage from './ErrorMessage';
import styles from './StudentList.module.css';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

const ExpenseList = ({ refreshTrigger, onExpenseDeleted }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const loadExpenses = async () => {
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
  };

  useEffect(() => {
    loadExpenses();
  }, [filter, refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await expenseService.deleteExpense(expenseId);
      setExpenses(expenses.filter(expense => expense.id !== expenseId));
      
      if (onExpenseDeleted) {
        onExpenseDeleted(expenseId);
      }
    } catch (err) {
      setError(`Failed to delete expense: ${err.message}`);
    }
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'supplies', label: 'Supplies' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'administrative', label: 'Administrative' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'other', label: 'Other' }
  ];

  if (loading) {
    return <div className={styles.loading}>Loading expenses...</div>;
  }

  return (
    <div className={styles.listContainer}>
      <div className={styles.header}>
        <h3>Expenses</h3>
        <div className={styles.filterContainer}>
          <label htmlFor="categoryFilter">Filter by category:</label>
          <select
            id="categoryFilter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={styles.filterSelect}
          >
            {categories.map(cat => (
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
          {filter === 'all' ? 'No expenses found.' : `No expenses found in ${filter} category.`}
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
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(expense => (
                <tr key={expense.id}>
                  <td>{new Date(expense.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`${styles.category} ${styles[expense.category]}`}>
                      {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                    </span>
                  </td>
                  <td>{expense.description}</td>
                  <td className={styles.amount}>{formatCurrency(expense.amount)}</td>
                  <td>{expense.notes || '-'}</td>
                  <td>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className={styles.deleteButton}
                      title="Delete expense"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.summary}>
        <strong>
          Total: {formatCurrency(expenses.reduce((sum, expense) => sum + expense.amount, 0))}
        </strong>
      </div>
    </div>
  );
};

export default ExpenseList;