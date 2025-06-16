import React, { useState, useEffect, useCallback } from 'react';
import { budgetService } from '../services/BudgetService';
import ErrorMessage from './ErrorMessage';
import styles from './StudentList.module.css';
import { 
  BUDGET_LABELS, 
  BUDGET_COLORS, 
  formatCurrency, 
  formatPercentage, 
  DATE_RANGE_PRESETS 
} from '../constants/budgetConstants';

const BudgetSummary = ({ refreshTrigger }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
    endDate: new Date() // Today
  });
  const [selectedPreset, setSelectedPreset] = useState('thisMonth');

  const loadBudgetSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const budgetSummary = await budgetService.calculateBudgetSummary(
        dateRange.startDate,
        dateRange.endDate
      );
      
      setSummary(budgetSummary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadBudgetSummary();
  }, [loadBudgetSummary, refreshTrigger]);

  const handlePresetChange = (preset) => {
    setSelectedPreset(preset);
    const now = new Date();
    let startDate, endDate;

    switch (preset) {
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date();
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisQuarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        endDate = new Date();
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date();
        break;
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        return; // Custom range - don't update dates
    }

    setDateRange({ startDate, endDate });
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: new Date(value)
    }));
    setSelectedPreset('custom');
  };

  if (loading) {
    return <div className={styles.loading}>{BUDGET_LABELS.LOADING}</div>;
  }

  if (!summary) {
    return <div className={styles.noData}>No budget data available.</div>;
  }

  const revenueBreakdown = summary.getRevenueBreakdown();

  return (
    <div className={styles.listContainer}>
      <div className={styles.header}>
        <h3>Budget Summary</h3>
        
        {/* Date Range Selector */}
        <div className={styles.filterContainer}>
          <div className={styles.datePresets}>
            <label htmlFor="datePreset">Period:</label>
            <select
              id="datePreset"
              value={selectedPreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className={styles.filterSelect}
            >
              {DATE_RANGE_PRESETS.map(preset => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
          
          {selectedPreset === 'custom' && (
            <div className={styles.customDateRange}>
              <input
                type="date"
                value={dateRange.startDate.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className={styles.dateInput}
              />
              <span>to</span>
              <input
                type="date"
                value={dateRange.endDate.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className={styles.dateInput}
              />
            </div>
          )}
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard} style={{ borderColor: BUDGET_COLORS.FEE_REVENUE }}>
          <h4>{BUDGET_LABELS.FEE_REVENUE}</h4>
          <p className={styles.amount} style={{ color: BUDGET_COLORS.FEE_REVENUE }}>
            {formatCurrency(summary.feeRevenue)}
          </p>
          <small>{formatPercentage(revenueBreakdown.feePercentage)} of total revenue</small>
        </div>

        <div className={styles.summaryCard} style={{ borderColor: BUDGET_COLORS.CONTRIBUTION_REVENUE }}>
          <h4>{BUDGET_LABELS.CONTRIBUTION_REVENUE}</h4>
          <p className={styles.amount} style={{ color: BUDGET_COLORS.CONTRIBUTION_REVENUE }}>
            {formatCurrency(summary.contributionRevenue)}
          </p>
          <small>{formatPercentage(revenueBreakdown.contributionPercentage)} of total revenue</small>
        </div>

        <div className={styles.summaryCard} style={{ borderColor: BUDGET_COLORS.EXPENSE }}>
          <h4>{BUDGET_LABELS.TOTAL_EXPENSES}</h4>
          <p className={styles.amount} style={{ color: BUDGET_COLORS.EXPENSE }}>
            {formatCurrency(summary.totalExpenses)}
          </p>
        </div>

        <div className={styles.summaryCard} style={{ 
          borderColor: summary.isPositive() ? BUDGET_COLORS.NET_POSITIVE : BUDGET_COLORS.NET_NEGATIVE 
        }}>
          <h4>{BUDGET_LABELS.NET_BUDGET}</h4>
          <p className={styles.amount} style={{ 
            color: summary.isPositive() ? BUDGET_COLORS.NET_POSITIVE : BUDGET_COLORS.NET_NEGATIVE 
          }}>
            {formatCurrency(summary.getNetBudget())}
          </p>
          <small>{summary.isPositive() ? 'Surplus' : 'Deficit'}</small>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className={styles.section}>
        <h4>{BUDGET_LABELS.REVENUE_BREAKDOWN}</h4>
        <div className={styles.breakdownContainer}>
          <div className={styles.totalRevenue}>
            <h5>{BUDGET_LABELS.TOTAL_REVENUE}: {formatCurrency(summary.getTotalRevenue())}</h5>
          </div>
          
          <div className={styles.revenueBar}>
            <div 
              className={styles.feeRevenueSegment}
              style={{ 
                width: `${revenueBreakdown.feePercentage}%`,
                backgroundColor: BUDGET_COLORS.FEE_REVENUE
              }}
              title={`Fee Revenue: ${formatCurrency(summary.feeRevenue)} (${formatPercentage(revenueBreakdown.feePercentage)})`}
            />
            <div 
              className={styles.contributionRevenueSegment}
              style={{ 
                width: `${revenueBreakdown.contributionPercentage}%`,
                backgroundColor: BUDGET_COLORS.CONTRIBUTION_REVENUE
              }}
              title={`Contribution Revenue: ${formatCurrency(summary.contributionRevenue)} (${formatPercentage(revenueBreakdown.contributionPercentage)})`}
            />
          </div>
          
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <span 
                className={styles.legendColor}
                style={{ backgroundColor: BUDGET_COLORS.FEE_REVENUE }}
              />
              Fee Revenue ({formatPercentage(revenueBreakdown.feePercentage)})
            </div>
            <div className={styles.legendItem}>
              <span 
                className={styles.legendColor}
                style={{ backgroundColor: BUDGET_COLORS.CONTRIBUTION_REVENUE }}
              />
              Contribution Revenue ({formatPercentage(revenueBreakdown.contributionPercentage)})
            </div>
          </div>
        </div>
      </div>

      {/* Period Information */}
      <div className={styles.periodInfo}>
        <p>
          <strong>Period:</strong> {dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()}
        </p>
        <p>
          <strong>Report Generated:</strong> {summary.generatedAt.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default BudgetSummary;