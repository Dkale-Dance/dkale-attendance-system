import React, { useState, useEffect, useCallback } from 'react';
import { attendanceService } from '../services/AttendanceService';
import ErrorMessage from './ErrorMessage';
import styles from './AttendanceDashboard.module.css';

/**
 * Formats a date string for the date input (YYYY-MM-DD)
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
const formatDateForInput = (date) => {
  return date.toISOString().split('T')[0];
};

const AttendanceDashboard = ({ userRole }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('present');
  
  // Function to fetch attendance data for the selected date
  const fetchAttendanceData = useCallback(async (date) => {
    setLoading(true);
    setError('');
    
    try {
      const data = await attendanceService.getAttendanceSummaryWithStudents(date);
      setAttendanceData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching attendance data:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Load data when the component mounts or when the selected date changes
  useEffect(() => {
    if (userRole === 'admin') {
      fetchAttendanceData(selectedDate);
    }
  }, [userRole, selectedDate, fetchAttendanceData]);
  
  // Handle date change
  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    setSelectedDate(newDate);
  };
  
  // Handle status change for a single student
  const handleStatusChange = async (studentId, newStatus) => {
    try {
      setError('');
      await attendanceService.markAttendance(selectedDate, studentId, newStatus);
      
      // Update the local state to avoid a full reload
      setAttendanceData(attendanceData.map(student => 
        student.id === studentId 
          ? {
              ...student,
              attendance: { 
                status: newStatus, 
                timestamp: new Date() 
              }
            } 
          : student
      ));
    } catch (err) {
      setError(err.message);
      console.error('Error updating attendance status:', err);
    }
  };
  
  // Handle checkbox selection for bulk actions
  const handleCheckboxChange = (studentId) => {
    setSelectedStudents(prevSelected => {
      if (prevSelected.includes(studentId)) {
        return prevSelected.filter(id => id !== studentId);
      } else {
        return [...prevSelected, studentId];
      }
    });
  };
  
  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectedStudents.length === attendanceData.length) {
      // If all are selected, unselect all
      setSelectedStudents([]);
    } else {
      // Otherwise, select all
      setSelectedStudents(attendanceData.map(student => student.id));
    }
  };
  
  // Apply bulk status change
  const applyBulkAction = async () => {
    if (selectedStudents.length === 0) {
      setError('No students selected');
      return;
    }
    
    try {
      setError('');
      await attendanceService.bulkMarkAttendance(selectedDate, selectedStudents, bulkStatus);
      
      // Update the local state to avoid a full reload
      setAttendanceData(attendanceData.map(student => 
        selectedStudents.includes(student.id) 
          ? {
              ...student,
              attendance: { 
                status: bulkStatus, 
                timestamp: new Date() 
              }
            } 
          : student
      ));
      
      // Clear the selection after applying
      setSelectedStudents([]);
    } catch (err) {
      setError(err.message);
      console.error('Error applying bulk action:', err);
    }
  };
  
  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return date.toLocaleTimeString();
  };
  
  // Only admin can access the attendance dashboard
  if (userRole !== 'admin') {
    return (
      <div className={styles.unauthorized} data-testid="unauthorized-message">
        <p>You don't have permission to access the attendance dashboard.</p>
      </div>
    );
  }
  
  return (
    <div className={styles['attendance-dashboard']} data-testid="attendance-dashboard">
      <h1>Attendance Dashboard</h1>
      
      <div className={styles['dashboard-header']}>
        <div className={styles['date-controls']}>
          <label htmlFor="date-picker">Select Date:</label>
          <input
            id="date-picker"
            type="date"
            value={formatDateForInput(selectedDate)}
            onChange={handleDateChange}
            className={styles['date-picker']}
            data-testid="date-picker"
          />
        </div>
      </div>
      
      {error && <ErrorMessage message={error} />}
      
      {loading ? (
        <div className={styles.loading} data-testid="loading-indicator">
          Loading attendance data...
        </div>
      ) : (
        <>
          <div className={styles['bulk-actions']} data-testid="bulk-actions">
            <label htmlFor="bulk-status-select">Bulk Action:</label>
            <select
              id="bulk-status-select"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className={styles['bulk-status-select']}
              data-testid="bulk-status-select"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </select>
            <button
              onClick={applyBulkAction}
              disabled={selectedStudents.length === 0}
              className={styles['apply-button']}
              data-testid="apply-bulk-action"
            >
              Apply to {selectedStudents.length} selected
            </button>
          </div>
          
          <table className={styles['attendance-table']} data-testid="attendance-table">
            <thead>
              <tr>
                <th className={styles['checkbox-header']}>
                  <input
                    type="checkbox"
                    checked={selectedStudents.length === attendanceData.length && attendanceData.length > 0}
                    onChange={handleSelectAll}
                    className={styles.checkbox}
                    data-testid="select-all-checkbox"
                  />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>No students found</td>
                </tr>
              ) : (
                attendanceData.map(student => (
                  <tr key={student.id} data-testid={`student-row-${student.id}`}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleCheckboxChange(student.id)}
                        className={styles.checkbox}
                        data-testid={`student-checkbox-${student.id}`}
                      />
                    </td>
                    <td>{`${student.firstName || ''} ${student.lastName || ''}`}</td>
                    <td>{student.email}</td>
                    <td>{student.enrollmentStatus}</td>
                    <td>
                      <select
                        value={student.attendance?.status || ''}
                        onChange={(e) => handleStatusChange(student.id, e.target.value)}
                        className={`${styles['attendance-select']} ${student.attendance?.status ? styles[student.attendance.status] : ''}`}
                        data-testid={`attendance-select-${student.id}`}
                      >
                        <option value="" disabled>-- Select --</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="excused">Excused</option>
                      </select>
                      {student.attendance?.timestamp && (
                        <span className={styles.timestamp}>
                          Last updated: {formatTimestamp(student.attendance.timestamp)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default AttendanceDashboard;