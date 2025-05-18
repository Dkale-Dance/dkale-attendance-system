import React, { useState, useEffect } from 'react';
import { attendanceService } from '../services/AttendanceService';
import styles from './AttendanceDashboard.module.css';

const StudentAttendanceRow = ({ 
  student, 
  date, 
  onStatusChange, 
  onAttributeChange,
  onSelect,
  onRemove,
  isSelected,
  recentlyUpdated
}) => {
  const [status, setStatus] = useState(student.attendance?.status || '');
  const [attributes, setAttributes] = useState(student.attendance?.attributes || {});
  const [fee, setFee] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Set initial values when props change
  useEffect(() => {
    setStatus(student.attendance?.status || '');
    setAttributes(student.attendance?.attributes || {});
  }, [student.attendance]);
  
  // Calculate fee whenever status or attributes change
  useEffect(() => {
    if (status) {
      const calculatedFee = attendanceService.calculateAttendanceFee(status, attributes);
      setFee(calculatedFee);
    } else {
      setFee(0);
    }
  }, [status, attributes]);
  
  // Handle status change
  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    
    // Preserve existing attributes when changing status
    onStatusChange(student.id, newStatus, attributes);
  };
  
  // Handle attribute change
  const handleAttributeChange = (attributeName) => {
    const newAttributes = {
      ...attributes,
      [attributeName]: !attributes[attributeName]
    };
    
    // If falsy, remove the property
    if (!newAttributes[attributeName]) {
      delete newAttributes[attributeName];
    }
    
    setAttributes(newAttributes);
    onAttributeChange(student.id, status, newAttributes);
  };
  
  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return date.toLocaleTimeString();
  };
  
  // Determine fee display class
  const getFeeDisplayClass = () => {
    if (fee === 0) return styles.free;
    if (fee <= 2) return styles.low;
    return styles.high;
  };
  
  // Toggle expanded state (for mobile view)
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Determine if fee attributes should be disabled
  const areFeeAttributesDisabled = status === 'absent' || status === 'medicalAbsence' || status === 'holiday';
  
  return (
    <tr 
      className={`${styles['student-row']} ${styles['student-row-expandable']}`}
      data-testid={`student-row-${student.id}`}
    >
      <td>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(student.id)}
          className={styles.checkbox}
          data-testid={`student-checkbox-${student.id}`}
        />
      </td>
      <td onClick={toggleExpanded}>
        {`${student.firstName || ''} ${student.lastName || ''}`}
        {recentlyUpdated && (
          <span className={styles['realtime-indicator']} title="Recently updated"></span>
        )}
      </td>
      <td onClick={toggleExpanded}>{student.email}</td>
      <td onClick={toggleExpanded}>{student.danceRole || 'Lead'}</td>
      <td>
        <div className={styles['attendance-section']}>
          {/* Primary Status */}
          <div className={styles['status-container']}>
            <label htmlFor={`status-${student.id}`}>Status:</label>
            <select
              id={`status-${student.id}`}
              value={status}
              onChange={handleStatusChange}
              className={`${styles['attendance-select']} ${status ? styles[status] : ''}`}
              data-testid={`attendance-select-${student.id}`}
            >
              <option value="" disabled>-- Select --</option>
              <option value="present">Present</option>
              <option value="absent">Absent ($5)</option>
              <option value="medicalAbsence">Medical Absence</option>
              <option value="holiday">Holiday</option>
            </select>
          </div>
          
          {/* Fee Attributes */}
          {status && (
            <div className={styles['attributes-container']}>
              <div className={styles['attribute-header']}>Fee Attributes:</div>
              
              <div className={`${styles['attribute-checkbox']} ${areFeeAttributesDisabled ? styles.disabled : ''}`}>
                <input
                  type="checkbox"
                  id={`late-${student.id}`}
                  checked={attributes.late || false}
                  onChange={() => !areFeeAttributesDisabled && handleAttributeChange('late')}
                  disabled={areFeeAttributesDisabled}
                  data-testid={`late-checkbox-${student.id}`}
                />
                <label htmlFor={`late-${student.id}`}>Late ($1)</label>
              </div>
              
              <div className={`${styles['attribute-checkbox']} ${areFeeAttributesDisabled ? styles.disabled : ''}`}>
                <input
                  type="checkbox"
                  id={`noShoes-${student.id}`}
                  checked={attributes.noShoes || false}
                  onChange={() => !areFeeAttributesDisabled && handleAttributeChange('noShoes')}
                  disabled={areFeeAttributesDisabled}
                  data-testid={`noShoes-checkbox-${student.id}`}
                />
                <label htmlFor={`noShoes-${student.id}`}>No Shoes ($1)</label>
              </div>
              
              <div className={`${styles['attribute-checkbox']} ${areFeeAttributesDisabled ? styles.disabled : ''}`}>
                <input
                  type="checkbox"
                  id={`notInUniform-${student.id}`}
                  checked={attributes.notInUniform || false}
                  onChange={() => !areFeeAttributesDisabled && handleAttributeChange('notInUniform')}
                  disabled={areFeeAttributesDisabled}
                  data-testid={`notInUniform-checkbox-${student.id}`}
                />
                <label htmlFor={`notInUniform-${student.id}`}>Not in Uniform ($1)</label>
              </div>
              
              {/* Fee Display */}
              {fee > 0 && (
                <div className={`${styles['fee-display']} ${getFeeDisplayClass()}`}>
                  Fee: ${fee.toFixed(2)}
                </div>
              )}
            </div>
          )}
          
          {areFeeAttributesDisabled && status === 'absent' && (
            <div className={styles['fee-note']}>
              Absent: Fixed $5 fee (attributes ignored)
            </div>
          )}
          
          {areFeeAttributesDisabled && (status === 'medicalAbsence' || status === 'holiday') && (
            <div className={styles['fee-note']}>
              No fees for this status (attributes ignored)
            </div>
          )}
          
          {student.attendance?.timestamp && (
            <div className={styles['attendance-actions']}>
              <span className={styles.timestamp}>
                Last updated: {formatTimestamp(student.attendance.timestamp)}
              </span>
              <button 
                className={styles['remove-button']} 
                onClick={() => onRemove && onRemove(student.id)}
                data-testid={`remove-attendance-${student.id}`}
                title="Remove this attendance record"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

export default StudentAttendanceRow;