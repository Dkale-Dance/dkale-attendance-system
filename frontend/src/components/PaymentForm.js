// PaymentForm.js
import React, { useState, useEffect } from 'react';
import { paymentService } from '../services/PaymentService';
import { studentService } from '../services/StudentService';
import ErrorMessage from './ErrorMessage';
import { auth } from '../lib/firebase/config/config';
import styles from './StudentForm.module.css'; // Reusing the existing form styles

const PaymentForm = ({ onSuccess, onCancel }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    notes: ''
  });

  // Fetch students when component mounts
  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        const allStudents = await studentService.getAllStudents();
        // Sort students by name
        const sortedStudents = allStudents.sort((a, b) => 
          `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
        );
        setStudents(sortedStudents);
      } catch (err) {
        setError(`Failed to load students: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'amount' ? parseFloat(value) || '' : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      // Get the current admin user's ID
      const adminId = auth.currentUser?.uid;
      if (!adminId) {
        throw new Error("Administrator authentication required");
      }
      
      // Add adminId to payment data
      const paymentData = {
        ...formData,
        adminId,
        date: new Date(formData.date)
      };
      
      // Record the payment
      const result = await paymentService.recordPayment(paymentData);
      
      // Show success message
      const student = students.find(s => s.id === formData.studentId);
      const studentName = student ? `${student.firstName} ${student.lastName}` : 'Student';
      
      setSuccess(`Payment of $${formData.amount} recorded for ${studentName}. New balance: $${result.updatedStudent.balance}`);
      
      // Reset form (except date)
      setFormData({
        studentId: '',
        amount: '',
        date: formData.date,
        paymentMethod: 'cash',
        notes: ''
      });
      
      // Notify parent component of success
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const getSelectedStudent = () => {
    return students.find(student => student.id === formData.studentId);
  };

  return (
    <div className={styles['student-form']} data-testid="payment-form">
      <h2>Record Payment</h2>
      
      {loading ? (
        <p>Loading students...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className={styles['form-group']}>
            <label htmlFor="studentId">Student</label>
            <select
              id="studentId"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              required
              data-testid="payment-student-select"
            >
              <option value="">Select a student</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName} - Balance: ${student.balance || 0}
                </option>
              ))}
            </select>
          </div>
          
          {formData.studentId && (
            <div className={styles['student-info']}>
              <p>
                <strong>Current Balance:</strong> ${getSelectedStudent()?.balance || 0}
              </p>
            </div>
          )}
          
          <div className={styles['form-group']}>
            <label htmlFor="amount">Amount ($)</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              required
              data-testid="payment-amount-input"
              placeholder="0.00"
            />
          </div>
          
          <div className={styles['form-group']}>
            <label htmlFor="date">Payment Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              data-testid="payment-date-input"
            />
          </div>
          
          <div className={styles['form-group']}>
            <label htmlFor="paymentMethod">Payment Method</label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              required
              data-testid="payment-method-select"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>
          </div>
          
          <div className={styles['form-group']}>
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              data-testid="payment-notes-input"
              placeholder="Add any notes about this payment"
              rows="3"
            />
          </div>
          
          <div className={styles['form-actions']}>
            <button 
              type="submit" 
              data-testid="payment-submit-button"
              disabled={!formData.studentId || !formData.amount}
            >
              Record Payment
            </button>
            
            {onCancel && (
              <button 
                type="button" 
                onClick={onCancel}
                data-testid="payment-cancel-button"
                className={styles['secondary-button']}
              >
                Cancel
              </button>
            )}
          </div>
          
          {error && <ErrorMessage message={error} />}
          {success && <div className={styles['success-message']} data-testid="payment-success-message">{success}</div>}
        </form>
      )}
    </div>
  );
};

export default PaymentForm;