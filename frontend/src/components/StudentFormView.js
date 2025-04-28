// StudentFormView.js
import React, { useState, useEffect, useCallback } from 'react';
import StudentForm from './StudentForm';
import PaymentList from './PaymentList';
import ErrorMessage from './ErrorMessage';
import { studentService } from '../services/StudentService';
import { authService } from '../services/AuthService';
import { paymentService } from '../services/PaymentService';
import { reportService } from '../services/ReportService';
import styles from './StudentFormView.module.css';

// This component is solely responsible for managing the add/edit student form
// It also shows payment history using the paymentService for existing students
const StudentFormView = ({ selectedStudent, onSuccess, onCancel }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'payments', 'manage-inactive'
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [balanceInfo, setBalanceInfo] = useState(null);
  const [clearReason, setClearReason] = useState('');

  // Use paymentService to fetch payment history when switching to payments tab
  const fetchPaymentHistory = useCallback(async (studentId) => {
    if (studentId && activeTab === 'payments') {
      try {
        const result = await paymentService.getPaymentsByStudent(studentId);
        if (result && result.payments) {
          setPaymentHistory(result.payments);
        }
      } catch (err) {
        setError('Failed to load payment history: ' + err.message);
      }
    }
  }, [activeTab]);

  // Fetch student balance information for inactive management
  const fetchBalanceInfo = useCallback(async (studentId) => {
    if (studentId && activeTab === 'manage-inactive') {
      try {
        const info = await reportService.calculateStudentBalance(studentId);
        setBalanceInfo(info);
      } catch (err) {
        setError('Failed to load balance information: ' + err.message);
      }
    }
  }, [activeTab]);

  // Fetch payment history or balance info when tab changes or student changes
  useEffect(() => {
    if (selectedStudent) {
      fetchPaymentHistory(selectedStudent.id);
      fetchBalanceInfo(selectedStudent.id);
    }
  }, [activeTab, selectedStudent, fetchPaymentHistory, fetchBalanceInfo]);

  const handleSubmitForm = async (formData) => {
    setError('');
    setLoading(true);
    
    try {
      if (selectedStudent) {
        // Update existing student
        await studentService.updateStudent(selectedStudent.id, formData);
        setLoading(false);
        onSuccess();
        return;
      }
      
      // Create a new user with student role
      const { email, firstName, lastName } = formData;
      const password = "tempPassword123"; // In a real app, generate a random password or implement invitation flow
      
      // First create auth account
      const user = await authService.registerStudent(email, password);
      
      // Initialize the student profile
      await studentService.initializeStudentProfile(user.uid, {
        firstName,
        lastName,
        email
      });
      
      setLoading(false);
      onSuccess();
    } catch (err) {
      console.error("Student creation error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Handle clearing the student balance
  const handleClearBalance = async () => {
    if (!selectedStudent) return;
    
    if (!clearReason.trim()) {
      setError('Please provide a reason for clearing the balance');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await studentService.clearStudentBalance(selectedStudent.id, clearReason);
      
      // Refresh balance info
      const info = await reportService.calculateStudentBalance(selectedStudent.id);
      setBalanceInfo(info);
      
      // Clear the reason field
      setClearReason('');
      
      // Show success message
      alert('Balance has been cleared successfully');
    } catch (err) {
      setError('Failed to clear balance: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles['form-view']} data-testid="student-form-view">
      <h2>{selectedStudent ? 'Edit Student' : 'Add New Student'}</h2>
      
      {error && <ErrorMessage message={error} />}
      
      {selectedStudent && (
        <div className={styles['tabs']}>
          <button 
            className={activeTab === 'details' ? styles['active-tab'] : ''}
            onClick={() => setActiveTab('details')}
            data-testid="details-tab"
          >
            Student Details
          </button>
          <button 
            className={activeTab === 'payments' ? styles['active-tab'] : ''}
            onClick={() => setActiveTab('payments')}
            data-testid="payments-tab"
          >
            Payment History
          </button>
          {selectedStudent.enrollmentStatus === 'Inactive' && (
            <button 
              className={activeTab === 'manage-inactive' ? styles['active-tab'] : styles['warning-tab']}
              onClick={() => setActiveTab('manage-inactive')}
              data-testid="inactive-tab"
            >
              Manage Inactive
            </button>
          )}
        </div>
      )}
      
      {activeTab === 'details' ? (
        <>
          <StudentForm 
            student={selectedStudent}
            onSubmit={handleSubmitForm} 
            buttonText={selectedStudent ? "Update Student" : "Add Student"}
            isAdminView={true}
            disabled={loading}
          />
          
          <div className={styles.buttons}>
            <button 
              onClick={onCancel}
              data-testid="cancel-button"
              className={styles['cancel-button']}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </>
      ) : activeTab === 'payments' ? (
        <>
          {/* We can either use studentId directly or pass our pre-fetched payment history */}
          {paymentHistory.length > 0 ? (
            <div className={styles['payment-history']}>
              <p>Payment history loaded: {paymentHistory.length} records found</p>
              <PaymentList studentId={selectedStudent.id} />
            </div>
          ) : (
            <PaymentList studentId={selectedStudent.id} />
          )}
          
          <div className={styles.buttons}>
            <button 
              onClick={() => setActiveTab('details')}
              className={styles['back-button']}
            >
              Back to Details
            </button>
          </div>
        </>
      ) : activeTab === 'manage-inactive' && selectedStudent.enrollmentStatus === 'Inactive' ? (
        <>
          <div className={styles['inactive-management']} data-testid="inactive-management">
            <h3>Inactive Student Management</h3>
            
            <div className={styles['inactive-section']}>
              <p>This student is currently marked as <strong>Inactive</strong>.</p>
              <p>When a student is inactive:</p>
              <ul>
                <li>Their balance is frozen (no new fees are calculated)</li>
                <li>They do not appear on attendance dashboards or public displays</li>
                <li>Their existing balance is preserved in case they return</li>
              </ul>
            </div>
            
            <div className={styles['inactive-section']}>
              <h4>Current Balance Information</h4>
              {balanceInfo ? (
                <div className={styles['frozen-details']}>
                  <p><strong>Frozen Fees Total:</strong> ${selectedStudent.frozenFeesTotal?.toFixed(2) || "0.00"}</p>
                  <p><strong>Frozen Balance:</strong> ${selectedStudent.frozenBalance?.toFixed(2) || balanceInfo.calculatedBalance.toFixed(2)}</p>
                  <p><strong>Frozen Date:</strong> {selectedStudent.frozenAt ? new Date(selectedStudent.frozenAt).toLocaleDateString() : "Not set"}</p>
                </div>
              ) : (
                <p>Loading balance information...</p>
              )}
            </div>
            
            {(balanceInfo && balanceInfo.calculatedBalance > 0) ? (
              <div className={styles['inactive-section']}>
                <h4>Clear Balance</h4>
                <p>Use this option to clear the student's balance if they will not be returning.</p>
                <div>
                  <label htmlFor="clear-reason">Reason for clearing balance:</label>
                  <input
                    type="text"
                    id="clear-reason"
                    value={clearReason}
                    onChange={(e) => setClearReason(e.target.value)}
                    className={styles['reason-input']}
                    placeholder="e.g., Student moved away, Balance forgiven"
                    data-testid="clear-reason-input"
                  />
                </div>
                <button 
                  onClick={handleClearBalance}
                  className={styles['action-button']}
                  data-testid="clear-balance-button"
                  disabled={loading || !clearReason.trim()}
                >
                  Clear Balance
                </button>
              </div>
            ) : (
              <div className={styles['inactive-section']}>
                <p>This student has no outstanding balance to clear.</p>
              </div>
            )}
          </div>
          
          <div className={styles.buttons}>
            <button 
              onClick={() => setActiveTab('details')}
              className={styles['back-button']}
            >
              Back to Details
            </button>
          </div>
        </>
      ) : null}
      
      {loading && <div className="loading">Processing...</div>}
    </div>
  );
};

export default StudentFormView;