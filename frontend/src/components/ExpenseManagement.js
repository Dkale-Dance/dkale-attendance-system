import React, { useState } from 'react';
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';
import styles from './StudentManagement.module.css';

const ExpenseManagement = ({ userRole, currentUser }) => {
  const [activeTab, setActiveTab] = useState('list');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (userRole !== 'admin') {
    return (
      <div className={styles.unauthorized}>
        <p>You don't have permission to manage expenses.</p>
      </div>
    );
  }

  const handleExpenseCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('list');
  };

  const handleExpenseDeleted = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className={styles.managementContainer}>
      <h2>Expense Management</h2>
      
      <div className={styles.tabs}>
        <button
          className={activeTab === 'list' ? styles.activeTab : ''}
          onClick={() => setActiveTab('list')}
        >
          View Expenses
        </button>
        <button
          className={activeTab === 'add' ? styles.activeTab : ''}
          onClick={() => setActiveTab('add')}
        >
          Add Expense
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'list' && (
          <ExpenseList
            refreshTrigger={refreshTrigger}
            onExpenseDeleted={handleExpenseDeleted}
          />
        )}
        {activeTab === 'add' && (
          <ExpenseForm
            onExpenseCreated={handleExpenseCreated}
            onCancel={() => setActiveTab('list')}
            currentUser={currentUser}
          />
        )}
      </div>
    </div>
  );
};

export default ExpenseManagement;