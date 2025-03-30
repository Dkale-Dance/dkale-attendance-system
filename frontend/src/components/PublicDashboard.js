import React, { useState, useEffect } from 'react';
import { reportService } from '../services/ReportService';
import ErrorMessage from './ErrorMessage';
import './PublicDashboard.css'; // Using the new CSS file

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
    
    // Calculate the balance for styling
    const balance = studentDetails.financialSummary.calculatedBalance || studentDetails.financialSummary.currentBalance;
    let balanceClass = "zero-balance";
    if (balance > 0) {
      balanceClass = "negative-balance";
    } else if (balance < 0) {
      balanceClass = "positive-balance";
    }
    
    return (
      <div className="student-details" data-testid="student-details">
        <button 
          onClick={handleBackToList}
          className="back-button"
          data-testid="back-to-list"
        >
          ← Back to List
        </button>
        
        <h2>{studentDetails.student.name}</h2>
        <p className="student-info">
          <strong>Email:</strong> {studentDetails.student.email}
        </p>
        
        <div className="financial-summary">
          <div className="summary-item">
            <h3>Total Fees</h3>
            <p>{formatCurrency(studentDetails.financialSummary.totalFeesCharged)}</p>
          </div>
          <div className="summary-item">
            <h3>Payments Made</h3>
            <p>{formatCurrency(studentDetails.financialSummary.totalPaymentsMade)}</p>
          </div>
          <div className="summary-item">
            <h3>Current Balance</h3>
            <p className={balanceClass}>
              {formatCurrency(balance)}
            </p>
          </div>
        </div>
        
        {/* Payment History Section */}
        <div className="history-section" data-testid="payment-history">
          <h3>Payment History</h3>
          {studentDetails.paymentHistory.length === 0 ? (
            <p>No payment records found.</p>
          ) : (
            <table className="history-table">
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
                    <td>
                      {payment.paymentMethod === 'cash' ? 
                        <span className="status-badge status-enrolled">Cash</span> : 
                        <span className="status-badge status-pending">Card</span>
                      }
                    </td>
                    <td>{payment.notes || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Fee History Section */}
        <div className="history-section" data-testid="fee-history">
          <h3>Fee History</h3>
          {studentDetails.feeHistory.length === 0 ? (
            <p>No fee records found.</p>
          ) : (
            <table className="history-table">
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
                        <td>
                          <span className={`status-badge status-${fee.status === 'absent' ? 'inactive' : 'enrolled'}`}>
                            {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                          </span>
                        </td>
                        <td>{reason || 'N/A'}</td>
                        <td className="negative-balance">{formatCurrency(fee.fee)}</td>
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
      <div className="student-list-container" data-testid="student-list">
        <h2>Enrolled Students</h2>
        
        {students.length === 0 ? (
          <p>No students found.</p>
        ) : (
          <table className="student-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Current Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => {
                const balance = student.financialSummary.calculatedBalance || student.financialSummary.currentBalance;
                let balanceClass = "zero-balance";
                if (balance > 0) {
                  balanceClass = "negative-balance";
                } else if (balance < 0) {
                  balanceClass = "positive-balance";
                }
                
                return (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>
                      <span className={`status-badge status-${student.enrollmentStatus?.toLowerCase()}`}>
                        {student.enrollmentStatus}
                      </span>
                    </td>
                    <td className={balanceClass}>
                      {formatCurrency(balance)}
                    </td>
                    <td>
                      <button 
                        onClick={() => handleSelectStudent(student.id)}
                        className="view-details-button"
                        data-testid={`view-details-${student.id}`}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  return (
    <div className="public-dashboard" data-testid="public-dashboard">
      <div className="dashboard-header">
        <h1>Student Financial Dashboard</h1>
        <p className="dashboard-description">
          This dashboard provides information about student fees, payments, and current balances.
        </p>
      </div>
      
      {error && <ErrorMessage message={error} />}
      
      {loading ? (
        <div className="loading" data-testid="loading-indicator">
          <div className="spinner"></div>
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