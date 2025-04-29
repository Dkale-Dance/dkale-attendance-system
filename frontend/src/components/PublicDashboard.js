import React, { useState, useEffect } from 'react';
import { reportService } from '../services/ReportService';
import { paymentService } from '../services/PaymentService';
import ErrorMessage from './ErrorMessage';
import { useNavigate } from 'react-router-dom';
import './PublicDashboard.css'; // Using the new CSS file

// Fallback for tests
const useNavigateSafe = () => {
  try {
    return useNavigate();
  } catch (e) {
    return jest.fn();
  }
};

// Utility function to determine balance class based on amount
const getBalanceClass = (balance) => {
  if (balance > 0) {
    return "negative-balance";
  } else if (balance < 0) {
    return "positive-balance";
  }
  return "zero-balance";
};

// Utility function to get payment status badge class
const getPaymentStatusClass = (status) => {
  switch (status) {
    case 'paid':
      return "status-enrolled";
    case 'partial':
      return "status-pending";
    case 'unpaid':
      return "status-inactive";
    default:
      return "status-inactive";
  }
};

// Utility function to get fee amount class based on payment status
const getFeeAmountClass = (paymentStatus) => {
  switch (paymentStatus) {
    case 'paid':
      return "fee-paid";
    case 'partial':
      return "fee-partial";
    case 'unpaid':
      return "negative-balance";
    default:
      return "negative-balance";
  }
};

const PublicDashboard = ({ userRole }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAllFees, setShowAllFees] = useState(false);
  const navigate = useNavigateSafe();
  
  // Handle fee payment - navigate to the payment form with prefilled data
  const handlePayFee = (fee) => {
    if (!studentDetails || !selectedStudent) return;
    
    // Create the payment data
    const paymentData = {
      studentId: selectedStudent,
      amount: fee.paymentStatus === 'unpaid' ? fee.fee : fee.remainingAmount,
      feeId: fee.id || null,
      feeDate: fee.date,
      notes: `Payment for ${formatDate(fee.date)} - ${fee.status === 'absent' ? 'Absence' : ''}`
    };
    
    // Store the data in sessionStorage for the PaymentForm to retrieve
    sessionStorage.setItem('pendingPayment', JSON.stringify(paymentData));
    
    // Navigate to the payment dashboard
    navigate('/payments?action=pay');
  };

  // Handle payment deletion
  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment? This will increase the student\'s balance.')) {
      return;
    }
    
    try {
      setLoading(true);
      await paymentService.deletePayment(paymentId);
      
      // Refresh student details after deletion
      if (selectedStudent) {
        const details = await reportService.getStudentFinancialDetails(selectedStudent);
        setStudentDetails(details);
      }
      
      alert('Payment deleted successfully');
    } catch (err) {
      setError(`Failed to delete payment: ${err.message}`);
      console.error('Error deleting payment:', err);
    } finally {
      setLoading(false);
    }
  };
  
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
        setShowAllFees(false); // Reset to only show unpaid fees when a new student is selected
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

  // Toggle between showing all fees or only unpaid fees
  const toggleFeeDisplay = () => {
    setShowAllFees(!showAllFees);
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

  // Calculate unpaid fees count
  const getUnpaidFeesCount = () => {
    if (!studentDetails) return 0;
    return studentDetails.feeHistory.filter(fee => fee.fee > 0 && (fee.paymentStatus === 'unpaid' || fee.paymentStatus === 'partial')).length;
  };

  // Render the student details view
  const renderStudentDetails = () => {
    if (!studentDetails) return null;
    
    // Calculate the balance for styling
    const balance = studentDetails.financialSummary.calculatedBalance || studentDetails.financialSummary.currentBalance;
    const balanceClass = getBalanceClass(balance);
    
    // Filter fees based on showAllFees flag
    const feesToDisplay = studentDetails.feeHistory
      .filter(fee => fee.fee > 0) // Only show entries with fees
      .filter(fee => showAllFees || fee.paymentStatus === 'unpaid' || fee.paymentStatus === 'partial');
    
    const unpaidFeesCount = getUnpaidFeesCount();
    const totalFeesCount = studentDetails.feeHistory.filter(fee => fee.fee > 0).length;
    
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
                  {userRole === 'admin' && <th>Actions</th>}
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
                    {userRole === 'admin' && (
                      <td>
                        <button 
                          onClick={() => handleDeletePayment(payment.id)}
                          className="delete-button"
                          data-testid={`delete-payment-${payment.id}`}
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Fee History Section */}
        <div className="history-section" data-testid="fee-history">
          <div className="section-header">
            <h3>Fee History</h3>
            <div className="section-actions">
              {showAllFees ? (
                <span className="section-counter">Showing all {totalFeesCount} fees</span>
              ) : (
                <span className="section-counter">Showing {unpaidFeesCount} unpaid fees</span>
              )}
              <button 
                onClick={toggleFeeDisplay}
                className="toggle-view-button"
              >
                {showAllFees ? 'Show Unpaid Only' : 'View All Fees'}
              </button>
            </div>
          </div>
          
          {feesToDisplay.length === 0 ? (
            <p>{showAllFees ? 'No fee records found.' : 'No unpaid fees.'}</p>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Fee Amount</th>
                  <th>Payment Status</th>
                  <th>Remaining</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {feesToDisplay.map((fee, index) => {
                  // Generate reasons based on attributes or use payment notes for synthetic entries
                  let reason = '';
                  
                  if (fee.isSynthetic && fee.notes) {
                    // For synthetic entries (payments without attendance records), use the payment notes
                    reason = fee.notes || 'Payment without attendance record';
                  } else {
                    // For regular entries, generate reason from attendance status and attributes
                    reason = fee.status === 'absent' ? 'Absence' : '';
                    
                    if (fee.attributes) {
                      if (fee.attributes.late) reason = reason ? `${reason}, Late` : 'Late';
                      if (fee.attributes.noShoes) reason = reason ? `${reason}, No Shoes` : 'No Shoes';
                      if (fee.attributes.notInUniform) reason = reason ? `${reason}, Not In Uniform` : 'Not In Uniform';
                    }
                  }
                  
                  return (
                    <tr key={index} className={`fee-row fee-status-${fee.paymentStatus}`}>
                      <td>{formatDate(fee.date)}</td>
                      <td>
                        {fee.isSynthetic ? (
                          <span className="status-badge status-special">
                            Payment Only
                          </span>
                        ) : (
                          <span className={`status-badge status-${fee.status === 'absent' ? 'inactive' : 'enrolled'}`}>
                            {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                          </span>
                        )}
                      </td>
                      <td>{reason || 'N/A'}</td>
                      <td className={getFeeAmountClass(fee.paymentStatus)}>{formatCurrency(fee.fee)}</td>
                      <td>
                        <span className={`status-badge ${getPaymentStatusClass(fee.paymentStatus)}`}>
                          {fee.paymentStatus.charAt(0).toUpperCase() + fee.paymentStatus.slice(1)}
                        </span>
                      </td>
                      <td>
                        {fee.paymentStatus === 'unpaid' ? 
                          <span className="negative-balance">{formatCurrency(fee.fee)}</span> :
                          fee.paymentStatus === 'partial' ? 
                            <span className="negative-balance">{formatCurrency(fee.remainingAmount)}</span> :
                            <span className="paid-amount">$0.00</span>
                        }
                      </td>
                      <td>
                        {(fee.paymentStatus === 'unpaid' || fee.paymentStatus === 'partial') && userRole === 'admin' && (
                          <button 
                            onClick={() => handlePayFee(fee)}
                            className="pay-button"
                            data-testid={`pay-fee-${index}`}
                          >
                            Pay
                          </button>
                        )}
                      </td>
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
                const balanceClass = getBalanceClass(balance);
                
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