import React, { useState, useEffect, useCallback } from 'react';
import { budgetService } from '../services/BudgetService';
import ErrorMessage from './ErrorMessage';
import styles from './StudentList.module.css';
import { 
  BUDGET_LABELS, 
  DEFAULT_CONTRIBUTION_AMOUNT,
  formatCurrency 
} from '../constants/budgetConstants';

const ContributorStatusList = ({ refreshTrigger }) => {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expectedAmount, setExpectedAmount] = useState(DEFAULT_CONTRIBUTION_AMOUNT);
  const [filter, setFilter] = useState('all'); // 'all', 'complete', 'partial', 'overpaid'

  const loadContributors = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const contributorStatuses = await budgetService.getAllContributorStatuses(expectedAmount);
      
      // Apply filter
      let filteredContributors = contributorStatuses;
      switch (filter) {
        case 'complete':
          filteredContributors = contributorStatuses.filter(c => c.isComplete && !c.isOverpaid);
          break;
        case 'partial':
          filteredContributors = contributorStatuses.filter(c => !c.isComplete);
          break;
        case 'overpaid':
          filteredContributors = contributorStatuses.filter(c => c.isOverpaid);
          break;
        default:
          // 'all' - no filtering
          break;
      }
      
      setContributors(filteredContributors);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [expectedAmount, filter]);

  useEffect(() => {
    loadContributors();
  }, [refreshTrigger, expectedAmount, filter, loadContributors]);

  const getStatusLabel = (contributor) => {
    if (contributor.isOverpaid) {
      return 'Overpaid';
    }
    if (contributor.isComplete) {
      return 'Complete';
    }
    return 'Partial';
  };

  const getStatusClass = (contributor) => {
    if (contributor.isOverpaid) {
      return styles.statusOverpaid;
    }
    if (contributor.isComplete) {
      return styles.statusComplete;
    }
    return styles.statusPartial;
  };

  const getTotalStats = () => {
    const stats = {
      totalContributors: contributors.length,
      completePayments: contributors.filter(c => c.isComplete && !c.isOverpaid).length,
      partialPayments: contributors.filter(c => !c.isComplete).length,
      overpayments: contributors.filter(c => c.isOverpaid).length,
      totalReceived: contributors.reduce((sum, c) => sum + c.totalPaid, 0),
      totalExpected: contributors.reduce((sum, c) => sum + c.expectedAmount, 0),
      totalRemaining: contributors.reduce((sum, c) => sum + c.remainingAmount, 0)
    };
    return stats;
  };

  const stats = getTotalStats();

  if (loading) {
    return <div className={styles.loading}>{BUDGET_LABELS.LOADING}</div>;
  }

  return (
    <div className={styles.listContainer}>
      <div className={styles.header}>
        <h3>Contributor Payment Status</h3>
        
        <div className={styles.filterContainer}>
          <div className={styles.filterGroup}>
            <label htmlFor="expectedAmountInput">Expected Amount:</label>
            <input
              id="expectedAmountInput"
              type="number"
              value={expectedAmount}
              onChange={(e) => setExpectedAmount(parseFloat(e.target.value) || DEFAULT_CONTRIBUTION_AMOUNT)}
              min="0"
              step="0.01"
              className={styles.amountInput}
            />
          </div>
          
          <div className={styles.filterGroup}>
            <label htmlFor="statusFilter">Filter:</label>
            <select
              id="statusFilter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Contributors</option>
              <option value="complete">Complete Payments</option>
              <option value="partial">Partial Payments</option>
              <option value="overpaid">Overpayments</option>
            </select>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Summary Stats */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <h4>Total Contributors</h4>
          <p className={styles.statNumber}>{stats.totalContributors}</p>
        </div>
        <div className={styles.statCard}>
          <h4>Complete</h4>
          <p className={styles.statNumber} style={{ color: '#10B981' }}>{stats.completePayments}</p>
        </div>
        <div className={styles.statCard}>
          <h4>Partial</h4>
          <p className={styles.statNumber} style={{ color: '#F59E0B' }}>{stats.partialPayments}</p>
        </div>
        <div className={styles.statCard}>
          <h4>Overpaid</h4>
          <p className={styles.statNumber} style={{ color: '#EF4444' }}>{stats.overpayments}</p>
        </div>
        <div className={styles.statCard}>
          <h4>Total Received</h4>
          <p className={styles.statAmount}>{formatCurrency(stats.totalReceived)}</p>
        </div>
        <div className={styles.statCard}>
          <h4>Total Expected</h4>
          <p className={styles.statAmount}>{formatCurrency(stats.totalExpected)}</p>
        </div>
        <div className={styles.statCard}>
          <h4>Remaining</h4>
          <p className={styles.statAmount} style={{ color: '#F59E0B' }}>{formatCurrency(stats.totalRemaining)}</p>
        </div>
      </div>

      {contributors.length === 0 ? (
        <div className={styles.noData}>
          {filter === 'all' 
            ? 'No contributors found.' 
            : `No contributors found with ${filter} payment status.`}
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Contributor</th>
                <th>Expected Amount</th>
                <th>Total Paid</th>
                <th>Remaining</th>
                <th>Status</th>
                <th>Payment Count</th>
                <th>Last Payment</th>
              </tr>
            </thead>
            <tbody>
              {contributors.map(contributor => (
                <tr key={contributor.contributorId}>
                  <td>
                    <div>
                      <div className={styles.contributorName}>
                        {contributor.payments?.[0]?.contributorName || contributor.contributorId}
                      </div>
                      <div className={styles.contributorId}>
                        ID: {contributor.contributorId}
                      </div>
                    </div>
                  </td>
                  <td className={styles.amount}>
                    {formatCurrency(contributor.expectedAmount)}
                  </td>
                  <td className={styles.amount}>
                    {formatCurrency(contributor.totalPaid)}
                  </td>
                  <td className={styles.amount}>
                    {contributor.remainingAmount > 0 ? (
                      <span style={{ color: '#F59E0B' }}>
                        {formatCurrency(contributor.remainingAmount)}
                      </span>
                    ) : contributor.overpaidAmount > 0 ? (
                      <span style={{ color: '#EF4444' }}>
                        +{formatCurrency(contributor.overpaidAmount)}
                      </span>
                    ) : (
                      <span style={{ color: '#10B981' }}>$0.00</span>
                    )}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(contributor)}`}>
                      {getStatusLabel(contributor)}
                    </span>
                  </td>
                  <td>
                    {contributor.paymentHistory?.length || 0} payment{contributor.paymentHistory?.length !== 1 ? 's' : ''}
                  </td>
                  <td>
                    {contributor.paymentHistory?.length > 0 ? (
                      <div>
                        <div>{new Date(contributor.paymentHistory[0].date).toLocaleDateString()}</div>
                        <div className={styles.lastPaymentAmount}>
                          {formatCurrency(contributor.paymentHistory[0].amount)}
                        </div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.summary}>
        <div>
          <strong>Collection Rate: </strong>
          {stats.totalExpected > 0 
            ? `${((stats.totalReceived / stats.totalExpected) * 100).toFixed(1)}%`
            : '0%'
          }
        </div>
        <div>
          <strong>Outstanding: </strong>
          {formatCurrency(stats.totalRemaining)}
        </div>
      </div>
    </div>
  );
};

export default ContributorStatusList;