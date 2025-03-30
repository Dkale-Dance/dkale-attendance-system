import React, { useState, useEffect, useRef } from 'react';
import { reportService } from '../services/ReportService';
import ErrorMessage from './ErrorMessage';
import styles from './Reports.module.css';

// Format currency helper function
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

const FinancialReports = ({ userRole }) => {
  // State for report data and UI controls
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('monthly'); // 'monthly', 'cumulative', 'visualization'
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [cumulativeReport, setCumulativeReport] = useState(null);
  const [visualizationData, setVisualizationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 8, 1), // September 1st (month is 0-indexed, so 8 = September)
    endDate: new Date()
  });

  // Refs for chart rendering (would use actual chart library in production)
  const trendsChartRef = useRef(null);
  const distributionChartRef = useRef(null);
  const feeBreakdownChartRef = useRef(null);
  const collectionRateChartRef = useRef(null);

  // Load data when component mounts or when active tab/date changes
  useEffect(() => {
    // Only fetch data if user is admin
    if (userRole !== 'admin') return;
    
    const fetchReportData = async () => {
      setLoading(true);
      setError('');
      
      try {
        if (activeTab === 'monthly') {
          // Fetch monthly report for current date
          const monthlyReportData = await reportService.generateDetailedMonthlyFinancialReport(currentDate);
          setMonthlyReport(monthlyReportData);
        }
        
        if (activeTab === 'cumulative') {
          // Fetch cumulative report with date range
          const cumulativeReportData = await reportService.generateCumulativeFinancialReport(dateRange);
          setCumulativeReport(cumulativeReportData);
        }
        
        if (activeTab === 'visualization') {
          // Fetch visualization data
          const visualizationResult = await reportService.getDataForVisualization(dateRange);
          setVisualizationData(visualizationResult);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching report data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [userRole, activeTab, currentDate, dateRange]);

  // Only admin can access reports
  if (userRole !== 'admin') {
    return (
      <div className={styles.unauthorized} data-testid="unauthorized-message">
        <p>You don't have permission to access financial reports.</p>
      </div>
    );
  }

  // Handle month navigation
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Handle date range filter
  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: new Date(value)
    }));
  };

  // Apply date filter (for cumulative and visualization tabs)
  const applyDateFilter = () => {
    // Re-fetch data with new date range
    if (activeTab === 'cumulative') {
      setLoading(true);
      reportService.generateCumulativeFinancialReport(dateRange)
        .then(data => {
          setCumulativeReport(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    } else if (activeTab === 'visualization') {
      setLoading(true);
      reportService.getDataForVisualization(dateRange)
        .then(data => {
          setVisualizationData(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  };

  // Handle export functionality
  const handleExport = (format) => {
    setLoading(true);
    reportService.formatReportForExport(currentDate, format)
      .then(data => {
        // In a real app, this would trigger the actual download based on format
        // For demo purposes, we'll just log the data
        console.log(`Export data (${format}):`, data);
        // Don't use alert in tests
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          alert(`Export to ${format.toUpperCase()} initiated. In a real app, this would download a file.`);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(`Export failed: ${err.message}`);
        setLoading(false);
      });
  };

  // Render month title (e.g., "January 2023") - defined for future use
  // const getMonthTitle = (date) => {
  //   return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  // };

  // Determine payment status class for styling
  const getPaymentStatusClass = (status) => {
    switch (status) {
      case 'paid': return styles.paid;
      case 'partial': return styles.partial;
      case 'pending': return styles.pending;
      default: return '';
    }
  };

  return (
    <div className={styles.reportsContainer} data-testid="financial-reports">
      <h1>Financial Reports</h1>
      
      {error && <ErrorMessage message={error} />}
      
      {/* Tab navigation */}
      <div className={styles.tabs}>
        <button 
          className={activeTab === 'monthly' ? styles.activeTab : ''} 
          onClick={() => setActiveTab('monthly')}
          data-testid="monthly-tab"
        >
          Monthly Report
        </button>
        <button 
          className={activeTab === 'cumulative' ? styles.activeTab : ''} 
          onClick={() => setActiveTab('cumulative')}
          data-testid="cumulative-tab"
        >
          Cumulative Report
        </button>
        <button 
          className={activeTab === 'visualization' ? styles.activeTab : ''} 
          onClick={() => setActiveTab('visualization')}
          data-testid="visualization-tab"
        >
          Visualizations
        </button>
      </div>
      
      {/* Export options */}
      <div className={styles.exportOptions} data-testid="export-options">
        <span>Export:</span>
        <button 
          onClick={() => handleExport('pdf')}
          className={styles.exportButton}
          data-testid="export-pdf-button"
        >
          PDF
        </button>
        <button 
          onClick={() => handleExport('csv')}
          className={styles.exportButton}
          data-testid="export-csv-button"
        >
          CSV
        </button>
        <button 
          onClick={() => handleExport('excel')}
          className={styles.exportButton}
          data-testid="export-excel-button"
        >
          Excel
        </button>
      </div>
      
      {loading ? (
        <div className={styles.loading} data-testid="loading-indicator">
          Loading financial data...
        </div>
      ) : (
        <>
          {/* Monthly Report View */}
          {activeTab === 'monthly' && monthlyReport && (
            <div className={styles.reportSection} data-testid="monthly-report">
              {/* Month navigation */}
              <div className={styles.monthNavigation}>
                <button onClick={() => navigateMonth(-1)}>&lt; Previous</button>
                <h2>{monthlyReport.title}</h2>
                <button onClick={() => navigateMonth(1)}>Next &gt;</button>
              </div>
              
              {/* Financial summary */}
              <div className={styles.summaryCards}>
                <div className={styles.summaryCard}>
                  <h3>Total Fees Charged</h3>
                  <p className={styles.amount}>{formatCurrency(monthlyReport.summary.totalFeesCharged)}</p>
                </div>
                <div className={styles.summaryCard}>
                  <h3>Total Payments Received</h3>
                  <p className={styles.amount}>{formatCurrency(monthlyReport.summary.totalPaymentsReceived)}</p>
                </div>
                <div className={styles.summaryCard}>
                  <h3>Fees Collected</h3>
                  <p className={styles.amount}>{formatCurrency(monthlyReport.summary.feesCollected)}</p>
                </div>
                <div className={styles.summaryCard}>
                  <h3>Pending Fees</h3>
                  <p className={styles.amount}>{formatCurrency(monthlyReport.summary.pendingFees)}</p>
                </div>
                <div className={styles.summaryCard}>
                  <h3>Fees In Payment Process</h3>
                  <p className={styles.amount}>{formatCurrency(monthlyReport.summary.feesInPaymentProcess)}</p>
                </div>
              </div>
              
              {/* Fee type breakdown */}
              <div className={styles.feeTypeBreakdown} data-testid="fee-type-breakdown">
                <h3>Fee Type Breakdown</h3>
                <div className={styles.feeTypeCards}>
                  <div className={styles.feeTypeCard}>
                    <h4>Absence Fees</h4>
                    <p>{formatCurrency(monthlyReport.feeBreakdown.byType.absence)}</p>
                  </div>
                  <div className={styles.feeTypeCard}>
                    <h4>Late Fees</h4>
                    <p>{formatCurrency(monthlyReport.feeBreakdown.byType.late)}</p>
                  </div>
                  <div className={styles.feeTypeCard}>
                    <h4>No Shoes Fees</h4>
                    <p>{formatCurrency(monthlyReport.feeBreakdown.byType.noShoes)}</p>
                  </div>
                  <div className={styles.feeTypeCard}>
                    <h4>Not in Uniform Fees</h4>
                    <p>{formatCurrency(monthlyReport.feeBreakdown.byType.notInUniform)}</p>
                  </div>
                </div>
              </div>
              
              {/* Student details table */}
              <div className={styles.studentDetailsSection}>
                <h3>Student Payment Details</h3>
                <table className={styles.studentTable}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Fees Charged</th>
                      <th>Payments Made</th>
                      <th>Balance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyReport.studentDetails.map(student => (
                      <tr key={student.id} className={getPaymentStatusClass(student.paymentStatus)}>
                        <td>{student.name}</td>
                        <td>{student.email}</td>
                        <td>{formatCurrency(student.feesCharged)}</td>
                        <td>{formatCurrency(student.paymentsMade)}</td>
                        <td>{formatCurrency(student.balance)}</td>
                        <td>{student.paymentStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Cumulative Report View */}
          {activeTab === 'cumulative' && cumulativeReport && (
            <div className={styles.reportSection} data-testid="cumulative-report">
              <h2>{cumulativeReport.title}</h2>
              
              {/* Date range filter */}
              <div className={styles.dateRangeFilter} data-testid="date-range-filter">
                <div className={styles.filterInputs}>
                  <div className={styles.dateInput}>
                    <label htmlFor="startDate">Start Date:</label>
                    <input 
                      id="startDate"
                      type="date"
                      value={dateRange.startDate.toISOString().substring(0, 10)}
                      onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                      data-testid="start-date-input"
                    />
                  </div>
                  <div className={styles.dateInput}>
                    <label htmlFor="endDate">End Date:</label>
                    <input 
                      id="endDate"
                      type="date" 
                      value={dateRange.endDate.toISOString().substring(0, 10)}
                      onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                      data-testid="end-date-input"
                    />
                  </div>
                  <button 
                    onClick={applyDateFilter}
                    className={styles.filterButton}
                    data-testid="apply-filter-button"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
              
              {/* Grand totals */}
              <div className={styles.grandTotals}>
                <h3>Grand Totals</h3>
                <div className={styles.summaryCards}>
                  <div className={styles.summaryCard}>
                    <h4>Total Fees Charged</h4>
                    <p className={styles.amount}>{formatCurrency(cumulativeReport.totals.totalFeesCharged)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Total Payments Received</h4>
                    <p className={styles.amount}>{formatCurrency(cumulativeReport.totals.totalPaymentsReceived)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Fees Collected</h4>
                    <p className={styles.amount}>{formatCurrency(cumulativeReport.totals.feesCollected)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Pending Fees</h4>
                    <p className={styles.amount}>{formatCurrency(cumulativeReport.totals.pendingFees)}</p>
                  </div>
                </div>
              </div>
              
              {/* Fee type breakdown */}
              <div className={styles.feeTypeBreakdown}>
                <h3>Fee Type Breakdown</h3>
                <div className={styles.feeTypeCards}>
                  <div className={styles.feeTypeCard}>
                    <h4>Absence</h4>
                    <p>{formatCurrency(cumulativeReport.feeBreakdown.absence)}</p>
                  </div>
                  <div className={styles.feeTypeCard}>
                    <h4>Late</h4>
                    <p>{formatCurrency(cumulativeReport.feeBreakdown.late)}</p>
                  </div>
                  <div className={styles.feeTypeCard}>
                    <h4>No Shoes</h4>
                    <p>{formatCurrency(cumulativeReport.feeBreakdown.noShoes)}</p>
                  </div>
                  <div className={styles.feeTypeCard}>
                    <h4>Not in Uniform</h4>
                    <p>{formatCurrency(cumulativeReport.feeBreakdown.notInUniform)}</p>
                  </div>
                </div>
              </div>
              
              {/* Monthly breakdown */}
              <div className={styles.monthlyBreakdown}>
                <h3>Monthly Breakdown</h3>
                <table className={styles.monthlyTable}>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Fees Charged</th>
                      <th>Payments Received</th>
                      <th>Collected</th>
                      <th>Pending</th>
                      <th>Collection Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cumulativeReport.monthlyReports.map((month, index) => {
                      const collectionRate = month.summary.totalFeesCharged > 0
                        ? (month.summary.feesCollected / month.summary.totalFeesCharged) * 100
                        : 0;
                      
                      return (
                        <tr key={index}>
                          <td>{month.period.displayName}</td>
                          <td>{formatCurrency(month.summary.totalFeesCharged)}</td>
                          <td>{formatCurrency(month.summary.totalPaymentsReceived)}</td>
                          <td>{formatCurrency(month.summary.feesCollected)}</td>
                          <td>{formatCurrency(month.summary.pendingFees)}</td>
                          <td>{collectionRate.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Year-to-date summary */}
              <div className={styles.ytdSummary}>
                <h3>Year-to-Date Summary ({cumulativeReport.yearToDate && cumulativeReport.yearToDate.year ? cumulativeReport.yearToDate.year : new Date().getFullYear()})</h3>
                <div className={styles.summaryCards}>
                  <div className={styles.summaryCard}>
                    <h4>Total Fees</h4>
                    <p>{formatCurrency(cumulativeReport.yearToDate && cumulativeReport.yearToDate.totalFeesCharged ? cumulativeReport.yearToDate.totalFeesCharged : 0)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Total Payments</h4>
                    <p>{formatCurrency(cumulativeReport.yearToDate && cumulativeReport.yearToDate.totalPaymentsReceived ? cumulativeReport.yearToDate.totalPaymentsReceived : 0)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Collection Rate</h4>
                    <p>{cumulativeReport.yearToDate && cumulativeReport.yearToDate.collectionRate ? cumulativeReport.yearToDate.collectionRate.toFixed(1) : '0.0'}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Visualization View */}
          {activeTab === 'visualization' && visualizationData && (
            <div className={styles.visualizationSection} data-testid="visualization-section">
              <h2>Financial Data Visualization</h2>
              
              {/* Date range filter (same as in cumulative report) */}
              <div className={styles.dateRangeFilter}>
                <div className={styles.filterInputs}>
                  <div className={styles.dateInput}>
                    <label htmlFor="vizStartDate">Start Date:</label>
                    <input 
                      id="vizStartDate"
                      type="date"
                      value={dateRange.startDate.toISOString().substring(0, 10)}
                      onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                    />
                  </div>
                  <div className={styles.dateInput}>
                    <label htmlFor="vizEndDate">End Date:</label>
                    <input 
                      id="vizEndDate"
                      type="date" 
                      value={dateRange.endDate.toISOString().substring(0, 10)}
                      onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={applyDateFilter}
                    className={styles.filterButton}
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
              
              {/* Chart containers */}
              <div className={styles.chartsContainer}>
                {/* Trend chart */}
                <div className={styles.chartCard} data-testid="trend-chart">
                  <h3>Month-to-Month Fee Collection Trends</h3>
                  <div className={styles.chartPlaceholder} ref={trendsChartRef}>
                    <p>Line chart showing month-to-month trends would render here.</p>
                    <div className={styles.chartLegend}>
                      <span className={styles.feesCharged}>Fees Charged</span>
                      <span className={styles.paymentsReceived}>Payments Received</span>
                    </div>
                    <div className={styles.chartInfo}>
                      <p>Months: {visualizationData.trends.labels.join(', ')}</p>
                      <p>Fees Charged: {visualizationData.trends.feesCharged.map(v => formatCurrency(v)).join(', ')}</p>
                      <p>Payments Received: {visualizationData.trends.paymentsReceived.map(v => formatCurrency(v)).join(', ')}</p>
                    </div>
                  </div>
                </div>
                
                {/* Payment status distribution */}
                <div className={styles.chartCard} data-testid="distribution-chart">
                  <h3>Payment Status Distribution</h3>
                  <div className={styles.chartPlaceholder} ref={distributionChartRef}>
                    <p>Pie chart showing payment status distribution would render here.</p>
                    <div className={styles.chartInfo}>
                      <p>Collected: {formatCurrency(visualizationData.distribution.data[0])}</p>
                      <p>Pending: {formatCurrency(visualizationData.distribution.data[1])}</p>
                      <p>In Process: {formatCurrency(visualizationData.distribution.data[2])}</p>
                    </div>
                  </div>
                </div>
                
                {/* Fee type breakdown */}
                <div className={styles.chartCard} data-testid="fee-breakdown-chart">
                  <h3>Fee Type Breakdown</h3>
                  <div className={styles.chartPlaceholder} ref={feeBreakdownChartRef}>
                    <p>Bar chart showing fee breakdown by type would render here.</p>
                    <div className={styles.chartInfo}>
                      <p>Absence: {formatCurrency(visualizationData.feeBreakdown.data[0])}</p>
                      <p>Late: {formatCurrency(visualizationData.feeBreakdown.data[1])}</p>
                      <p>No Shoes: {formatCurrency(visualizationData.feeBreakdown.data[2])}</p>
                      <p>Not in Uniform: {formatCurrency(visualizationData.feeBreakdown.data[3])}</p>
                    </div>
                  </div>
                </div>
                
                {/* Collection rate */}
                <div className={styles.chartCard} data-testid="collection-rate-chart">
                  <h3>Collection Rate Percentage Over Time</h3>
                  <div className={styles.chartPlaceholder} ref={collectionRateChartRef}>
                    <p>Line chart showing collection rate percentage would render here.</p>
                    <div className={styles.chartInfo}>
                      <p>Months: {visualizationData.collectionRate.labels.join(', ')}</p>
                      <p>Collection Rates: {visualizationData.collectionRate.data.map(v => v + '%').join(', ')}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={styles.chartNote}>
                <p>Note: In a production application, actual charts would be rendered using a library like Chart.js or Recharts.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FinancialReports;