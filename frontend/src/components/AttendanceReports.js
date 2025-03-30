import React, { useState, useEffect } from 'react';
import { reportService } from '../services/ReportService';
import ErrorMessage from './ErrorMessage';
import './AttendanceReports.css'; // Using dedicated CSS file

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
      <div className="unauthorized" data-testid="unauthorized-message">
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
    <div className="attendance-reports" data-testid="attendance-reports">
      <div className="attendance-header">
        <h1>Attendance Reports</h1>
        <p>Track student attendance rates and identify attendance issues</p>
      </div>
      
      {error && <ErrorMessage message={error} />}
      
      <div className="date-controls">
        <label htmlFor="month-picker">Select Month:</label>
        <input
          id="month-picker"
          type="month"
          value={formatDateForInput(selectedMonth)}
          onChange={handleMonthChange}
          className="date-picker"
          data-testid="month-picker"
        />
      </div>
      
      {loading ? (
        <div className="loading" data-testid="loading-indicator">
          <div className="spinner"></div>
          Loading attendance data...
        </div>
      ) : report ? (
        <>
          <div className="report-section" data-testid="attendance-summary">
            <h2>{report.title}</h2>
            
            <div className="summary-stats">
              <div className="stat-card">
                <h3>Overall Attendance Rate</h3>
                <p className="stat-value">{formatPercentage(report.summary.attendanceRate)}</p>
              </div>
              
              <div className="stat-card">
                <h3>School Days</h3>
                <p className="stat-value">{report.summary.totalDays}</p>
              </div>
              
              <div className="stat-card">
                <h3>Holiday Days</h3>
                <p className="stat-value">{report.summary.holidayCount}</p>
              </div>
              
              <div className="stat-card">
                <h3>Enrolled Students</h3>
                <p className="stat-value">{report.summary.enrolledStudentCount}</p>
              </div>
              
              <div className="stat-card">
                <h3>Absences</h3>
                <p className="stat-value">{report.summary.absentCount}</p>
              </div>
              
              <div className="stat-card">
                <h3>Medical Absences</h3>
                <p className="stat-value">{report.summary.medicalAbsenceCount}</p>
              </div>
            </div>
            
            {/* Attendance Issues Summary */}
            <div className="report-details" data-testid="attendance-issues">
              <h3>Common Attendance Issues</h3>
              <div className="breakdown-section">
                <ul>
                  <li>
                    <span className="issue-name">Late Arrivals</span>
                    <span className="issue-count">{report.summary.lateCount}</span>
                  </li>
                  <li>
                    <span className="issue-name">No Shoes</span>
                    <span className="issue-count">{report.summary.noShoesCount}</span>
                  </li>
                  <li>
                    <span className="issue-name">Not In Uniform</span>
                    <span className="issue-count">{report.summary.notInUniformCount}</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Per-Student Attendance Table */}
            <div className="report-details" data-testid="student-attendance">
              <h3>Student Attendance Rates</h3>
              <div className="info-banner">
                {report.summary.holidayCount > 0 && (
                  <p>• Holidays ({report.summary.holidayCount} days) are not counted in attendance rates calculations.</p>
                )}
                <p>• Medical absences are counted as absences but are considered excused.</p>
              </div>
              <table className="student-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Attendance Rate</th>
                    <th>Present Days</th>
                    <th>Absent Days</th>
                    <th>Medical Absences</th>
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
                    .map(([studentId, stats]) => {
                      // Determine attendance rate class and styling
                      let attendanceClass = '';
                      let fillClass = '';
                      let fillWidth = `${stats.attendanceRate}%`;
                      
                      if (stats.attendanceRate < 70) {
                        attendanceClass = 'low-attendance';
                        fillClass = 'fill-low';
                      } else if (stats.attendanceRate >= 95) {
                        attendanceClass = 'perfect-attendance';
                        fillClass = 'fill-high';
                      } else {
                        fillClass = 'fill-medium';
                      }
                      
                      return (
                        <tr key={studentId}>
                          <td className="student-name">{stats.studentName}</td>
                          <td>
                            <span className={`status-badge ${stats.enrollmentStatus === 'Enrolled' ? 'status-enrolled' : 'status-pending'}`}>
                              {stats.enrollmentStatus}
                            </span>
                          </td>
                          <td>
                            <div className="attendance-indicator">
                              <span className={attendanceClass}>{formatPercentage(stats.attendanceRate)}</span>
                              <div className="attendance-bar">
                                <div 
                                  className={`attendance-fill ${fillClass}`} 
                                  style={{ width: fillWidth }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td>{stats.present}</td>
                          <td>{stats.absent}</td>
                          <td>{stats.medicalAbsence}</td>
                          <td>{stats.late}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="no-data" data-testid="no-data">
          <p>No attendance data available for the selected month.</p>
        </div>
      )}
    </div>
  );
};

export default AttendanceReports;