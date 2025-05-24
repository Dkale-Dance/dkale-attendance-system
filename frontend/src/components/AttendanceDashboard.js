import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { attendanceService } from '../services/AttendanceService';
import { attendanceDashboardService } from '../services/AttendanceDashboardService';
import StudentAttendanceRow from './StudentAttendanceRow';
import BulkActionConfirmation from './BulkActionConfirmation';
import ErrorMessage from './ErrorMessage';
import styles from './AttendanceDashboard.module.css';
import { formatDateForInput } from '../utils/DateUtils';

const AttendanceDashboard = ({ userRole }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('present');
  // We no longer need bulk attributes as per the new design
  const [recentlyUpdated, setRecentlyUpdated] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  // Instead of tracking an unsubscribe function in state, we'll use a ref
  const unsubscribeRef = React.useRef(null);
  
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
  
  // Set up real-time listener for attendance updates
  useEffect(() => {
    if (userRole !== 'admin') return;
    
    // Clean up previous listener if it exists
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    const dateStr = formatDateForInput(selectedDate);
    const db = getFirestore();
    const attendanceRef = doc(db, 'attendance', dateStr);
    
    // Set up new listener
    const newUnsubscribe = onSnapshot(
      attendanceRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const newAttendanceData = docSnapshot.data();
          
          // Update attendanceData with real-time data
          setAttendanceData(prevData => {
            const updatedData = prevData.map(student => {
              const newAttendance = newAttendanceData[student.id];
              
              // If attendance has changed, mark as recently updated
              if (newAttendance && 
                  (!student.attendance || 
                    student.attendance.status !== newAttendance.status ||
                    JSON.stringify(student.attendance.attributes) !== JSON.stringify(newAttendance.attributes))) {
                setRecentlyUpdated(prev => ({
                  ...prev,
                  [student.id]: true
                }));
                
                // Clear the "recently updated" flag after 5 seconds
                setTimeout(() => {
                  setRecentlyUpdated(prev => ({
                    ...prev,
                    [student.id]: false
                  }));
                }, 5000);
              }
              
              return {
                ...student,
                attendance: newAttendance || null
              };
            });
            
            return updatedData;
          });
        }
      },
      (error) => {
        console.error("Error listening to attendance updates:", error);
      }
    );
    
    // Store the unsubscribe function in our ref instead of state
    unsubscribeRef.current = newUnsubscribe;
    
    // Cleanup on unmount or when date changes
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [selectedDate, userRole]); // Removed unsubscribe from dependencies
  
  // Load data when the component mounts or when the selected date changes
  useEffect(() => {
    if (userRole === 'admin') {
      fetchAttendanceData(selectedDate);
    }
  }, [userRole, selectedDate, fetchAttendanceData]);
  
  // Handle date change
  const handleDateChange = (e) => {
    // The value from the date input comes in YYYY-MM-DD format in local timezone
    // By using Date constructor directly, it treats the string as UTC, causing the offset issue
    // Instead, we'll parse the components to create a date in local timezone
    const [year, month, day] = e.target.value.split('-').map(Number);
    // Create date with local timezone (months are 0-indexed in JavaScript)
    const newDate = new Date(year, month - 1, day, 12, 0, 0);
    setSelectedDate(newDate);
  };
  
  // Handle status change for a single student
  const handleStatusChange = async (studentId, newStatus, attributes = {}) => {
    try {
      setError('');
      await attendanceService.updateAttendanceWithFee(selectedDate, studentId, newStatus, attributes);
      
      // Real-time listener will update the UI
    } catch (err) {
      setError(err.message);
      console.error('Error updating attendance status:', err);
    }
  };
  
  // Handle attribute change for a single student
  const handleAttributeChange = async (studentId, status, attributes) => {
    try {
      setError('');
      await attendanceService.updateAttendanceWithFee(selectedDate, studentId, status, attributes);
      
      // Real-time listener will update the UI
    } catch (err) {
      setError(err.message);
      console.error('Error updating attendance attributes:', err);
    }
  };
  
  // Handle removing attendance for a single student
  const handleRemoveAttendance = async (studentId) => {
    try {
      setError('');
      await attendanceService.removeAttendanceWithFeeAdjustment(selectedDate, studentId);
      
      // Real-time listener will update the UI
    } catch (err) {
      setError(err.message);
      console.error('Error removing attendance:', err);
    }
  };
  
  // Handle checkbox selection for bulk actions
  const handleStudentSelect = (studentId) => {
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
  
  // Bulk attributes are no longer needed with the new design
  
  // Show confirmation dialog for bulk action
  const handleShowBulkConfirmation = () => {
    if (selectedStudents.length === 0) {
      setError('No students selected');
      return;
    }
    
    setShowConfirmation(true);
  };
  
  // Apply bulk status change with fee
  const applyBulkAction = async () => {
    if (selectedStudents.length === 0) {
      setError('No students selected');
      return;
    }
    
    try {
      setError('');
      
      // Update attendance status first
      await attendanceService.bulkUpdateAttendanceWithFee(
        selectedDate, 
        selectedStudents, 
        bulkStatus, 
        {} // Empty attributes for bulk update since we're only setting status
      );
      
      // If changing to holiday status, process holiday payment adjustments
      if (bulkStatus === 'holiday') {
        try {
          console.log(`Processing holiday payment adjustments for ${selectedDate.toLocaleDateString()}`);
          
          // Add a small delay and process only once per date
          const dateKey = selectedDate.toDateString();
          if (window.holidayProcessingInProgress?.[dateKey]) {
            console.log('Holiday processing already in progress for this date, skipping...');
            return;
          }
          
          // Mark as processing
          if (!window.holidayProcessingInProgress) window.holidayProcessingInProgress = {};
          window.holidayProcessingInProgress[dateKey] = true;
          
          try {
            const result = await attendanceDashboardService.retroactivelyProcessHoliday(
              selectedDate, 
              `Manual Holiday - ${selectedDate.toLocaleDateString()}`
            );
            
            console.log('Holiday payment processing result:', result);
            
            if (result.totalCreditsIssued > 0) {
              setError(`Holiday status applied. Processed $${result.totalCreditsIssued} in payment credits for ${result.paymentAdjustments.length} payments.`);
            }
          } finally {
            // Clear processing flag after completion
            delete window.holidayProcessingInProgress[dateKey];
          }
        } catch (holidayError) {
          console.error('Error processing holiday payments:', holidayError);
          // Don't fail the entire operation if holiday processing fails
          setError(`Attendance updated to holiday, but payment processing had issues: ${holidayError.message}`);
        }
      }
      
      // Real-time listener will update the UI
      
      // Clear the selection after applying
      setSelectedStudents([]);
      setShowConfirmation(false);
    } catch (err) {
      setError(err.message);
      console.error('Error applying bulk action:', err);
    }
  };
  
  // Get selected students with their attendance data
  const selectedStudentsWithData = useMemo(() => {
    return attendanceData.filter(student => selectedStudents.includes(student.id));
  }, [attendanceData, selectedStudents]);
  
  // Calculate role counts for present students
  const roleCounts = useMemo(() => {
    const presentStudents = attendanceData.filter(student => 
      student.attendance?.status === 'present'
    );
    
    return {
      totalPresent: presentStudents.length,
      leads: presentStudents.filter(student => student.danceRole === 'Lead').length,
      follows: presentStudents.filter(student => student.danceRole === 'Follow').length,
      unknown: presentStudents.filter(student => !student.danceRole).length
    };
  }, [attendanceData]);
  
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
            <div>
              <label htmlFor="bulk-status-select">Bulk Action:</label>
              <select
                id="bulk-status-select"
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className={styles['bulk-status-select']}
                data-testid="bulk-status-select"
              >
                <option value="present">Present</option>
                <option value="absent">Absent ($5)</option>
                <option value="medicalAbsence">Medical Absence</option>
                <option value="holiday">Holiday</option>
              </select>
            </div>
            
            <button
              onClick={handleShowBulkConfirmation}
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
                <th>Dance Role</th>
                <th>Attendance & Fee Attributes</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center' }}>No students found</td>
                </tr>
              ) : (
                attendanceData.map(student => (
                  <StudentAttendanceRow
                    key={student.id}
                    student={student}
                    date={selectedDate}
                    onStatusChange={handleStatusChange}
                    onAttributeChange={handleAttributeChange}
                    onSelect={handleStudentSelect}
                    onRemove={handleRemoveAttendance}
                    isSelected={selectedStudents.includes(student.id)}
                    recentlyUpdated={recentlyUpdated[student.id]}
                  />
                ))
              )}
            </tbody>
          </table>
          
          <BulkActionConfirmation
            isOpen={showConfirmation}
            onClose={() => setShowConfirmation(false)}
            onConfirm={applyBulkAction}
            status={bulkStatus}
            attributes={{}} // Empty attributes for bulk action
            studentCount={selectedStudents.length}
            studentsWithStatus={selectedStudentsWithData}
          />
        </>
      )}
    </div>
  );
};

export default AttendanceDashboard;