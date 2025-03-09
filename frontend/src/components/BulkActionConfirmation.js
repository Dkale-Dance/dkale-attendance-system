import React from 'react';
import { attendanceService } from '../services/AttendanceService';
import styles from './AttendanceDashboard.module.css';

const BulkActionConfirmation = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  status, 
  attributes, 
  studentCount,
  studentsWithStatus 
}) => {
  if (!isOpen) return null;
  
  // Calculate total fee
  const feePerStudent = attendanceService.calculateAttendanceFee(status, attributes);
  const totalFee = feePerStudent * studentCount;
  
  // Find students who will have their status changed
  const changedStudents = studentsWithStatus.filter(s => s.attendance?.status !== status);
  
  // Get status display name for UI
  const getStatusDisplayName = (status) => {
    const statusMap = {
      'present': 'Present',
      'absent': 'Absent ($5)',
      'medicalAbsence': 'Medical Absence',
      'holiday': 'Holiday'
    };
    return statusMap[status] || status;
  };
  
  // Since bulk actions now only have status, we don't need to display attributes in the summary
  const getAttributesList = () => {
    return 'None (status only)';
  };
  
  // Fee impact is "high" if over $10
  const feeImpactClass = totalFee > 10 ? styles.high : '';
  
  return (
    <div className={styles['confirmation-dialog']}>
      <div className={styles['confirmation-content']}>
        <h2 className={styles['confirmation-title']}>Confirm Bulk Update</h2>
        
        <div className={styles['confirmation-summary']}>
          <p>You are about to update attendance for <strong>{studentCount}</strong> students:</p>
          
          <ul>
            <li><strong>Status:</strong> {getStatusDisplayName(status)}</li>
            <li><strong>Attributes:</strong> {getAttributesList()}</li>
          </ul>
          
          {changedStudents.length > 0 && (
            <>
              <p><strong>{changedStudents.length}</strong> students will have their status changed:</p>
              <ul>
                {changedStudents.slice(0, 5).map(student => (
                  <li key={student.id}>
                    {student.firstName} {student.lastName}: {' '}
                    {student.attendance?.status ? getStatusDisplayName(student.attendance.status) : 'None'} → {getStatusDisplayName(status)}
                  </li>
                ))}
                {changedStudents.length > 5 && <li>...and {changedStudents.length - 5} more</li>}
              </ul>
            </>
          )}
          
          {totalFee > 0 && (
            <div className={`${styles['fee-impact']} ${feeImpactClass}`}>
              <div>Fee Breakdown:</div>
              <ul className={styles['fee-breakdown']}>
                {status === 'absent' && <li>Absent: $5.00 per student</li>}
                <li><strong>Total fee impact: ${totalFee.toFixed(2)} (${feePerStudent.toFixed(2)} × {studentCount} students)</strong></li>
              </ul>
            </div>
          )}
        </div>
        
        <div className={styles['confirmation-buttons']}>
          <button className={styles['cancel-button']} onClick={onClose}>
            Cancel
          </button>
          <button className={styles['confirm-button']} onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionConfirmation;