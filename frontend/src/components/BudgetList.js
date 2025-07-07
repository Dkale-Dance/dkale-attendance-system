import React, { useState, useEffect, useCallback } from 'react';
import { budgetService } from '../services/BudgetService';
import ErrorMessage from './ErrorMessage';
import styles from './StudentList.module.css';
import { 
  BUDGET_LABELS, 
  BUDGET_TYPE_OPTIONS, 
  BUDGET_STATUS_OPTIONS,
  FEE_TYPES,
  formatCurrency 
} from '../constants/budgetConstants';
import { BUDGET_TYPES, BUDGET_STATUS } from '../models/BudgetModels';

const BudgetList = ({ refreshTrigger, onEntryDeleted, budgetType, title }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    budgetType: budgetType || 'all',
    status: 'all'
  });

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      let entriesData;
      if (filters.budgetType === 'all') {
        entriesData = await budgetService.getAllBudgetEntries();
      } else {
        entriesData = await budgetService.getBudgetEntriesByType(filters.budgetType);
      }
      
      // Filter by status if not 'all'
      if (filters.status !== 'all') {
        entriesData = entriesData.filter(entry => entry.status === filters.status);
      }
      
      setEntries(entriesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries, refreshTrigger]);

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm(BUDGET_LABELS.CONFIRM_DELETE)) {
      return;
    }

    try {
      await budgetService.deleteBudgetEntry(entryId);
      setEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
      
      if (onEntryDeleted) {
        onEntryDeleted(entryId);
      }
    } catch (err) {
      setError(`${BUDGET_LABELS.DELETE_FAILED} ${err.message}`);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getBudgetTypeLabel = (type) => {
    switch (type) {
      case BUDGET_TYPES.FEE_REVENUE:
        return 'Fee Revenue';
      case BUDGET_TYPES.CONTRIBUTION_REVENUE:
        return 'Contribution Revenue';
      case BUDGET_TYPES.EXPENSE:
        return 'Expense';
      default:
        return type;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case BUDGET_STATUS.COMPLETED:
        return styles.statusCompleted;
      case BUDGET_STATUS.PENDING:
        return styles.statusPending;
      case BUDGET_STATUS.ACTIVE:
        return styles.statusActive;
      case BUDGET_STATUS.INACTIVE:
        return styles.statusInactive;
      default:
        return '';
    }
  };

  const getFeeTypeLabel = (feeType) => {
    const feeTypeObj = FEE_TYPES.find(type => type.value === feeType);
    return feeTypeObj ? feeTypeObj.label : feeType;
  };

  if (loading) {
    return <div className={styles.loading}>{BUDGET_LABELS.LOADING}</div>;
  }

  return (
    <div className={styles.listContainer}>
      <div className={styles.header}>
        <h3>{title || 'Budget Entries'}</h3>
        
        <div className={styles.filterContainer}>
          {!budgetType && (
            <div className={styles.filterGroup}>
              <label htmlFor="budgetTypeFilter">{BUDGET_LABELS.FILTER_BY_TYPE}</label>
              <select
                id="budgetTypeFilter"
                value={filters.budgetType}
                onChange={(e) => handleFilterChange('budgetType', e.target.value)}
                className={styles.filterSelect}
              >
                {BUDGET_TYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className={styles.filterGroup}>
            <label htmlFor="statusFilter">{BUDGET_LABELS.FILTER_BY_STATUS}</label>
            <select
              id="statusFilter"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className={styles.filterSelect}
            >
              {BUDGET_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {entries.length === 0 ? (
        <div className={styles.noData}>
          {filters.budgetType === 'all' && filters.status === 'all' 
            ? BUDGET_LABELS.NO_ENTRIES 
            : 'No entries found matching the selected filters.'}
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Details</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id}>
                  <td>{entry?.date ? new Date(entry.date).toLocaleDateString() : '-'}</td>
                  <td>
                    <span className={`${styles.budgetType} ${styles[entry?.budgetType?.replace('_', '')]}`}>
                      {getBudgetTypeLabel(entry?.budgetType)}
                    </span>
                  </td>
                  <td>{entry?.description || '-'}</td>
                  <td className={styles.amount}>{formatCurrency(entry?.amount || 0)}</td>
                  <td>
                    {entry?.budgetType === BUDGET_TYPES.FEE_REVENUE && (
                      <div>
                        <div><strong>Fee Type:</strong> {getFeeTypeLabel(entry?.feeType)}</div>
                        <div><strong>Student:</strong> {entry?.studentId || 'N/A'}</div>
                      </div>
                    )}
                    {entry?.budgetType === BUDGET_TYPES.CONTRIBUTION_REVENUE && (
                      <div>
                        <div><strong>Contributor:</strong> {entry?.contributorName}</div>
                        <div><strong>Expected:</strong> {formatCurrency(entry?.expectedAmount || 0)}</div>
                        {entry?.amount < entry?.expectedAmount && (
                          <div style={{ color: '#F59E0B' }}>
                            <strong>Remaining:</strong> {formatCurrency((entry?.expectedAmount || 0) - (entry?.amount || 0))}
                          </div>
                        )}
                      </div>
                    )}
                    {entry?.budgetType === BUDGET_TYPES.EXPENSE && (
                      <div>
                        <div><strong>Category:</strong> {entry?.category}</div>
                        {entry?.notes && <div><strong>Notes:</strong> {entry.notes}</div>}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(entry?.status)}`}>
                      {entry?.status || 'Unknown'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className={styles.deleteButton}
                      title="Delete entry"
                    >
                      {BUDGET_LABELS.DELETE}
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
          Total: {formatCurrency(entries.reduce((sum, entry) => sum + (entry?.amount || 0), 0))}
        </strong>
        <span className={styles.count}>
          ({entries.length} {entries.length === 1 ? 'entry' : 'entries'})
        </span>
      </div>
    </div>
  );
};

export default BudgetList;