import React, { useState, useEffect } from 'react';
import { reportService } from '../services/ReportService';
import ErrorMessage from './ErrorMessage';
import styles from './StudentManagement.module.css'; // Reusing existing styles

const AttendanceReports = ({ userRole }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load data when component mounts or when selected month changes
  useEffect(() => {
    // Only fetch data if user is admin
    if (userRole !== 'admin') return;
    
    const fetchReportData = async () => {
      setLoading(true);
      setError('');
      
      try {
        const reportData = await reportService.generateMonthlyAttendanceReport(selectedMonth);
        setReport(reportData);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching attendance report:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [selectedMonth, userRole]);
  
  // Only admin can access reports
  if (userRole !== 'admin') {
    return (
      <div className={styles.unauthorized} data-testid="unauthorized-message">
        <p>You don't have permission to access attendance reports.</p>
      </div>
    );
  }

  // Format a date as YYYY-MM
  const formatDateForInput = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  // Handle month change
  const handleMonthChange = (e) => {
    const [year, month] = e.target.value.split('-').map(Number);
    const newDate = new Date(year, month - 1, 1);
    setSelectedMonth(newDate);
  };

  // Format percentage values
  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className={styles['student-management']} data-testid="attendance-reports">
      <h1>Attendance Reports</h1>
      
      {error && <ErrorMessage message={error} />}
      
      <div className={styles['dashboard-header']}>
        <div className={styles['date-controls']}>
          <label htmlFor="month-picker">Select Month:</label>
          <input
            id="month-picker"
            type="month"
            value={formatDateForInput(selectedMonth)}
            onChange={handleMonthChange}
            className={styles['date-picker']}
            data-testid="month-picker"
          />
        </div>
      </div>
      
      {loading ? (
        <div className={styles.loading} data-testid="loading-indicator">
          Loading attendance data...
        </div>
      ) : report ? (
        <>
          <div className={styles['report-section']} data-testid="attendance-summary">
            <h2>{report.title}</h2>
            
            <div className={styles['summary-stats']}>
              <div className={styles['stat-card']}>
                <h3>Overall Attendance Rate</h3>
                <p className={styles['stat-value']}>{formatPercentage(report.summary.attendanceRate)}</p>
              </div>
              
              <div className={styles['stat-card']}>
                <h3>School Days</h3>
                <p className={styles['stat-value']}>{report.summary.totalDays}</p>
              </div>
              
              <div className={styles['stat-card']}>
                <h3>Absences</h3>
                <p className={styles['stat-value']}>{report.summary.absentCount}</p>
              </div>
              
              <div className={styles['stat-card']}>
                <h3>Medical Absences</h3>
                <p className={styles['stat-value']}>{report.summary.medicalAbsenceCount}</p>
              </div>
            </div>
            
            {/* Attendance Issues Summary */}
            <div className={styles['report-details']} data-testid="attendance-issues">
              <h3>Common Attendance Issues</h3>
              <div className={styles['breakdown-section']}>
                <ul>
                  <li>Late Arrivals: {report.summary.lateCount} occurrences</li>
                  <li>No Shoes: {report.summary.noShoesCount} occurrences</li>
                  <li>Not In Uniform: {report.summary.notInUniformCount} occurrences</li>
                </ul>
              </div>
            </div>
            
            {/* Per-Student Attendance Table */}
            <div className={styles['report-details']} data-testid="student-attendance">
              <h3>Student Attendance Rates</h3>
              <table className={styles['student-table']}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Attendance Rate</th>
                    <th>Present Days</th>
                    <th>Absent Days</th>
                    <th>Late Arrivals</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(report.summary.byStudent)
                    .sort((a, b) => {
                      // First sort by student name (alphabetically)
                      const nameA = a[1].studentName.toLowerCase();
                      const nameB = b[1].studentName.toLowerCase();
                      return nameA.localeCompare(nameB);
                    }) // Sort alphabetically by student name
                    .map(([studentId, stats]) => (
                      <tr key={studentId}>
                        <td>{stats.studentName}</td>
                        <td 
                          className={
                            stats.attendanceRate < 70 
                              ? styles['low-attendance'] 
                              : stats.attendanceRate >= 95 
                                ? styles['perfect-attendance'] 
                                : ''
                          }
                        >
                          {formatPercentage(stats.attendanceRate)}
                        </td>
                        <td>{stats.present}</td>
                        <td>{stats.absent}</td>
                        <td>{stats.late}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className={styles['no-data']} data-testid="no-data">
          <p>No attendance data available for the selected month.</p>
        </div>
      )}
    </div>
  );
};

export default AttendanceReports;