// StudentList.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { studentService } from '../services/StudentService';
import ErrorMessage from './ErrorMessage';
import styles from './StudentList.module.css';

const StudentList = ({ onSelectStudent }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      let studentData;
      
      if (filterStatus === 'All') {
        // Use the new method that provides calculated balances
        studentData = await studentService.getAllStudentsWithBalances();
      } else {
        // For filtered views, we still need to get with balances
        const filteredStudents = await studentService.getStudentsByStatus(filterStatus);
        
        // Now calculate balances for these students
        studentData = await Promise.all(
          filteredStudents.map(async (student) => {
            try {
              // Use ReportService directly to calculate accurate balances
              const { reportService } = await import('../services/ReportService');
              const balanceInfo = await reportService.calculateStudentBalance(student.id);
              
              return {
                ...student,
                calculatedBalance: balanceInfo.calculatedBalance,
                totalFees: balanceInfo.totalFeesCharged,
                totalPayments: balanceInfo.totalPaymentsMade
              };
            } catch (error) {
              console.error(`Error calculating balance for student ${student.id}:`, error);
              return student;
            }
          })
        );
      }
      
      setStudents(studentData || []);
    } catch (err) {
      setError(err.message);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchStudents();
    
    // Event listener for refreshing students
    const refreshHandler = () => fetchStudents();
    window.addEventListener('refreshStudents', refreshHandler);
    
    return () => window.removeEventListener('refreshStudents', refreshHandler);
  }, [fetchStudents]);

  const handleRemoveStudent = async (studentId) => {
    try {
      await studentService.removeStudent(studentId);
      // Refresh the list after removal
      fetchStudents();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (studentId, newStatus) => {
    try {
      await studentService.changeEnrollmentStatus(studentId, newStatus);
      // Update the local state to avoid a full reload
      setStudents(students.map(student => 
        student.id === studentId ? {...student, enrollmentStatus: newStatus} : student
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  // Calculate role counts for enrolled students
  const roleCounts = useMemo(() => {
    const enrolledStudents = students.filter(student => 
      student.enrollmentStatus === 'Enrolled'
    );
    
    return {
      totalEnrolled: enrolledStudents.length,
      leads: enrolledStudents.filter(student => !student.danceRole || student.danceRole === 'Lead').length,
      follows: enrolledStudents.filter(student => student.danceRole === 'Follow').length
    };
  }, [students]);

  if (loading) {
    return <div data-testid="loading-message">Loading students...</div>;
  }

  return (
    <div className={styles['student-list']} data-testid="student-list">
      <h2>Students</h2>
      
      <div className={styles['filter-controls']}>
        <label htmlFor="status-filter">Filter by Status:</label>
        <select 
          id="status-filter" 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          data-testid="status-filter"
        >
          <option value="All">All Students</option>
          <option value="Enrolled">Enrolled</option>
          <option value="Inactive">Inactive</option>
          <option value="Pending Payment">Pending Payment</option>
          <option value="Removed">Removed</option>
        </select>
      </div>
      
      {filterStatus === 'Enrolled' || filterStatus === 'All' ? (
        <div className={styles['role-summary']} data-testid="role-summary">
          <h3>Enrollment Summary</h3>
          <p>Total Enrolled Students: {roleCounts.totalEnrolled}</p>
          <p>Leads: {roleCounts.leads}</p>
          <p>Follows: {roleCounts.follows}</p>
        </div>
      ) : null}
      
      {error && <ErrorMessage message={error} />}
      
      {Array.isArray(students) && students.length === 0 ? (
        <p data-testid="no-students-message">No students found.</p>
      ) : (
        <table data-testid="students-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Dance Role</th>
              <th>Status</th>
              <th>Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(students) && students.map(student => (
              <tr key={student.id} data-testid={`student-row-${student.id}`}>
                <td>{`${student.firstName || ''} ${student.lastName || ''}`}</td>
                <td>{student.email}</td>
                <td>{student.danceRole || 'Lead'}</td>
                <td>
                  <select
                    value={student.enrollmentStatus || 'Pending Payment'}
                    onChange={(e) => handleStatusChange(student.id, e.target.value)}
                    data-testid={`status-select-${student.id}`}
                  >
                    <option value="Enrolled">Enrolled</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending Payment">Pending Payment</option>
                    <option value="Removed">Removed</option>
                  </select>
                </td>
                <td>
                  ${student.calculatedBalance !== undefined 
                    ? student.calculatedBalance.toFixed(2) 
                    : (student.balance || 0).toFixed(2)}
                </td>
                <td className={styles['button-container']}>
                  {onSelectStudent && (
                    <button
                      onClick={() => onSelectStudent(student)}
                      data-testid={`edit-button-${student.id}`}
                      title="Edit student information"
                    >
                      Edit
                    </button>
                  )}
                  <button 
                    onClick={() => handleRemoveStudent(student.id)}
                    disabled={(student.calculatedBalance !== undefined 
                      ? student.calculatedBalance > 0 
                      : (student.balance || 0) > 0)}
                    title={(student.calculatedBalance !== undefined 
                      ? student.calculatedBalance > 0 
                      : (student.balance || 0) > 0)
                      ? "Cannot remove student with balance" 
                      : "Remove student"}
                    data-testid={`remove-button-${student.id}`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StudentList;