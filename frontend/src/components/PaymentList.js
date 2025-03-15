// PaymentList.js
import React, { useState, useEffect } from 'react';
import { paymentService } from '../services/PaymentService';
import ErrorMessage from './ErrorMessage';
import styles from './StudentList.module.css'; // Reusing the student list styles

const PaymentList = ({ studentId }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Optional date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);

  // Function to format date for display
  const formatDate = (dateObj) => {
    if (!dateObj) return 'No date';
    
    let date;
    // Handle Firestore timestamp objects
    if (dateObj && typeof dateObj.toDate === 'function') {
      date = dateObj.toDate();
    } else if (dateObj instanceof Date) {
      date = dateObj;
    } else {
      // Try to convert strings or timestamps to Date objects
      date = new Date(dateObj);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date encountered:', dateObj);
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Fetch payments when component mounts or filters change
  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true);
        let result;
        
        if (studentId) {
          // Get payments for a specific student
          result = await paymentService.getPaymentsByStudent(studentId);
          setPayments(result.payments);
        } else if (isFiltering && startDate && endDate) {
          // Get payments within date range
          const start = new Date(startDate);
          const end = new Date(endDate);
          // Set end date to end of day
          end.setHours(23, 59, 59, 999);
          
          result = await paymentService.getPaymentsByDateRange(start, end);
          setPayments(result);
        } else {
          // Get all payments
          result = await paymentService.getAllPayments();
          setPayments(result);
        }
      } catch (err) {
        setError(`Failed to load payments: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, [studentId, isFiltering, startDate, endDate]);

  const handleFilter = (e) => {
    e.preventDefault();
    setIsFiltering(true);
  };

  const clearFilter = () => {
    setIsFiltering(false);
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className={styles['student-list']} data-testid="payment-list">
      <h2>{studentId ? 'Student Payment History' : 'All Payments'}</h2>
      
      {!studentId && (
        <div className={styles['filter-controls']}>
          <form onSubmit={handleFilter}>
            <div className={styles['filter-inputs']}>
              <div>
                <label htmlFor="startDate">From:</label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-testid="payment-start-date"
                />
              </div>
              
              <div>
                <label htmlFor="endDate">To:</label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  data-testid="payment-end-date"
                />
              </div>
              
              <div className={styles['filter-actions']}>
                <button 
                  type="submit" 
                  disabled={!startDate || !endDate}
                  data-testid="payment-filter-button"
                >
                  Filter
                </button>
                
                {isFiltering && (
                  <button 
                    type="button" 
                    onClick={clearFilter}
                    data-testid="payment-clear-filter-button"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}
      
      {error && <ErrorMessage message={error} />}
      
      {loading ? (
        <p>Loading payments...</p>
      ) : payments.length === 0 ? (
        <p>No payments found.</p>
      ) : (
        <table className={styles['data-table']} data-testid="payments-table">
          <thead>
            <tr>
              <th>Date</th>
              {!studentId && <th>Student</th>}
              <th>Amount</th>
              <th>Payment Method</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id} data-testid={`payment-row-${payment.id}`}>
                <td>{formatDate(payment.date)}</td>
                {!studentId && (
                  <td>
                    {payment.studentName || payment.studentId}
                  </td>
                )}
                <td>${payment.amount.toFixed(2)}</td>
                <td>{payment.paymentMethod === 'cash' ? 'Cash' : 'Card'}</td>
                <td>{payment.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PaymentList;