import React, { useState, useEffect } from 'react';
import { reportService } from '../services/ReportService';
import ErrorMessage from './ErrorMessage';
import styles from './StudentManagement.module.css'; // Reusing existing styles

const PublicDashboard = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load student data when component mounts
  useEffect(() => {
    const fetchStudentData = async () => {
      setLoading(true);
      setError('');
      
      try {
        const studentData = await reportService.getPublicDashboardData();
        setStudents(studentData);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching student data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudentData();
  }, []);

  // Load detailed student information when a student is selected
  useEffect(() => {
    const fetchStudentDetails = async () => {
      if (!selectedStudent) return;
      
      setLoading(true);
      setError('');
      
      try {
        const details = await reportService.getStudentFinancialDetails(selectedStudent);
        setStudentDetails(details);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching student details:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudentDetails();
  }, [selectedStudent]);

  // Handle student selection
  const handleSelectStudent = (studentId) => {
    setSelectedStudent(studentId);
  };

  // Clear selection and go back to the student list
  const handleBackToList = () => {
    setSelectedStudent(null);
    setStudentDetails(null);
  };

  // Format currency values
  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  // Format date values
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString();
  };

  // Render the student details view
  const renderStudentDetails = () => {
    if (!studentDetails) return null;
    
    return (
      <div className={styles['student-details']} data-testid="student-details">
        <button 
          onClick={handleBackToList}
          className={styles['back-button']}
          data-testid="back-to-list"
        >
          ← Back to List
        </button>
        
        <h2>{studentDetails.student.name}</h2>
        <p className={styles['student-info']}>Email: {studentDetails.student.email}</p>
        
        <div className={styles['financial-summary']}>
          <div className={styles['summary-item']}>
            <h3>Total Fees</h3>
            <p>{formatCurrency(studentDetails.financialSummary.totalFeesCharged)}</p>
          </div>
          <div className={styles['summary-item']}>
            <h3>Payments Made</h3>
            <p>{formatCurrency(studentDetails.financialSummary.totalPaymentsMade)}</p>
          </div>
          <div className={styles['summary-item']}>
            <h3>Current Balance</h3>
            <p className={
              (studentDetails.financialSummary.calculatedBalance || studentDetails.financialSummary.currentBalance) > 0 
                ? styles['negative-balance'] 
                : styles['positive-balance']
            }>
              {formatCurrency(studentDetails.financialSummary.calculatedBalance || studentDetails.financialSummary.currentBalance)}
            </p>
          </div>
        </div>
        
        {/* Payment History Section */}
        <div className={styles['history-section']} data-testid="payment-history">
          <h3>Payment History</h3>
          {studentDetails.paymentHistory.length === 0 ? (
            <p>No payment records found.</p>
          ) : (
            <table className={styles['history-table']}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {studentDetails.paymentHistory.map(payment => (
                  <tr key={payment.id}>
                    <td>{formatDate(payment.date)}</td>
                    <td>{formatCurrency(payment.amount)}</td>
                    <td>{payment.paymentMethod === 'cash' ? 'Cash' : 'Card'}</td>
                    <td>{payment.notes || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Fee History Section */}
        <div className={styles['history-section']} data-testid="fee-history">
          <h3>Fee History</h3>
          {studentDetails.feeHistory.length === 0 ? (
            <p>No fee records found.</p>
          ) : (
            <table className={styles['history-table']}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Fee Amount</th>
                </tr>
              </thead>
              <tbody>
                {studentDetails.feeHistory
                  .filter(fee => fee.fee > 0) // Only show entries with fees
                  .map((fee, index) => {
                    // Generate reasons based on attributes
                    let reason = fee.status === 'absent' ? 'Absence' : '';
                    
                    if (fee.attributes) {
                      if (fee.attributes.late) reason = reason ? `${reason}, Late` : 'Late';
                      if (fee.attributes.noShoes) reason = reason ? `${reason}, No Shoes` : 'No Shoes';
                      if (fee.attributes.notInUniform) reason = reason ? `${reason}, Not In Uniform` : 'Not In Uniform';
                    }
                    
                    return (
                      <tr key={index}>
                        <td>{formatDate(fee.date)}</td>
                        <td>{fee.status}</td>
                        <td>{reason || 'N/A'}</td>
                        <td>{formatCurrency(fee.fee)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  // Render the student list view
  const renderStudentList = () => {
    return (
      <div className={styles['student-list-container']} data-testid="student-list">
        <h2>Enrolled Students</h2>
        
        {students.length === 0 ? (
          <p>No students found.</p>
        ) : (
          <table className={styles['student-table']}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Total Fees</th>
                <th>Payments Made</th>
                <th>Current Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.enrollmentStatus}</td>
                  <td>{formatCurrency(student.financialSummary.totalFees)}</td>
                  <td>{formatCurrency(student.financialSummary.totalPayments)}</td>
                  <td className={
                    (student.financialSummary.calculatedBalance || student.financialSummary.currentBalance) > 0 
                      ? styles['negative-balance'] 
                      : styles['positive-balance']
                  }>
                    {formatCurrency(student.financialSummary.calculatedBalance || student.financialSummary.currentBalance)}
                  </td>
                  <td>
                    <button 
                      onClick={() => handleSelectStudent(student.id)}
                      className={styles['view-details-button']}
                      data-testid={`view-details-${student.id}`}
                    >
                      View Details
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

  return (
    <div className={styles['public-dashboard']} data-testid="public-dashboard">
      <div className={styles['dashboard-header']}>
        <h1>Student Financial Dashboard</h1>
        <p className={styles['dashboard-description']}>
          This dashboard provides information about student fees, payments, and current balances.
        </p>
      </div>
      
      {error && <ErrorMessage message={error} />}
      
      {loading ? (
        <div className={styles.loading} data-testid="loading-indicator">
          Loading data...
        </div>
      ) : (
        <>
          {selectedStudent ? renderStudentDetails() : renderStudentList()}
        </>
      )}
    </div>
  );
};

export default PublicDashboard;