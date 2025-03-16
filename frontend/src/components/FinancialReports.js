import React, { useState, useEffect } from 'react';
import { reportService } from '../services/ReportService';
import ErrorMessage from './ErrorMessage';
import styles from './StudentManagement.module.css'; // Reusing existing styles

const FinancialReports = ({ userRole }) => {
  const [cumulativeReport, setCumulativeReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load data when component mounts
  useEffect(() => {
    // Only fetch data if user is admin
    if (userRole !== 'admin') return;
    
    const fetchReportData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Fetch only the cumulative report
        const cumulativeReportData = await reportService.generateCumulativeFinancialReport();
        setCumulativeReport(cumulativeReportData);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching report data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [userRole]);
  
  // Only admin can access reports
  if (userRole !== 'admin') {
    return (
      <div className={styles.unauthorized} data-testid="unauthorized-message">
        <p>You don't have permission to access financial reports.</p>
      </div>
    );
  }

  // Format currency values
  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className={styles['student-management']} data-testid="financial-reports">
      <h1>Outstanding Student Balances</h1>
      
      {error && <ErrorMessage message={error} />}
      
      {loading ? (
        <div className={styles.loading} data-testid="loading-indicator">
          Loading financial data...
        </div>
      ) : (
        <>
          {cumulativeReport && (
            <div className={styles['report-section']} data-testid="cumulative-report">
              <table className={styles['student-table']}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Outstanding Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {cumulativeReport.studentBalances.map(student => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td className={student.balance > 0 ? styles['negative-balance'] : ''}>
                        {formatCurrency(student.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FinancialReports;