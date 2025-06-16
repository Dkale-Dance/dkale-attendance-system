import React, { useState, useEffect } from 'react';
import { budgetService } from '../services/BudgetService';
import { studentService } from '../services/StudentService';
import ErrorMessage from './ErrorMessage';
import styles from './StudentForm.module.css';
import { BUDGET_LABELS, DEFAULT_CONTRIBUTION_AMOUNT } from '../constants/budgetConstants';

const ContributionRevenueForm = ({ onEntryCreated, currentUser }) => {
  const [formData, setFormData] = useState({
    contributorName: '',
    contributorId: '',
    amount: DEFAULT_CONTRIBUTION_AMOUNT,
    expectedAmount: DEFAULT_CONTRIBUTION_AMOUNT,
    date: new Date().toISOString().split('T')[0],
    description: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Load enrolled students on component mount
  useEffect(() => {
    const loadEnrolledStudents = async () => {
      try {
        setLoadingStudents(true);
        const students = await studentService.getStudentsByStatus('Enrolled');
        setEnrolledStudents(students);
      } catch (error) {
        console.error('Error loading enrolled students:', error);
      } finally {
        setLoadingStudents(false);
      }
    };
    
    loadEnrolledStudents();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStudentSelect = (e) => {
    const studentId = e.target.value;
    const selectedStudent = enrolledStudents.find(student => student.id === studentId);
    
    if (selectedStudent) {
      setFormData(prev => ({
        ...prev,
        contributorId: selectedStudent.id,
        contributorName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        description: `Monthly contribution from ${selectedStudent.firstName} ${selectedStudent.lastName}`
      }));
    } else {
      // Clear contributor data if no student selected
      setFormData(prev => ({
        ...prev,
        contributorId: '',
        contributorName: '',
        description: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.contributorId) {
        throw new Error('Please select a student as contributor');
      }

      const contributionData = {
        contributorName: formData.contributorName,
        contributorId: formData.contributorId,
        amount: parseFloat(formData.amount),
        expectedAmount: parseFloat(formData.expectedAmount),
        date: new Date(formData.date),
        description: formData.description || `Contribution from ${formData.contributorName}`,
        adminId: currentUser?.uid || 'unknown-admin'
      };

      const newEntry = await budgetService.createContributionRevenue(contributionData);
      
      if (onEntryCreated) {
        onEntryCreated(newEntry);
      }

      // Reset form
      setFormData({
        contributorName: '',
        contributorId: '',
        amount: DEFAULT_CONTRIBUTION_AMOUNT,
        expectedAmount: DEFAULT_CONTRIBUTION_AMOUNT,
        date: new Date().toISOString().split('T')[0],
        description: '',
        notes: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isPartialPayment = formData.amount && formData.expectedAmount && 
    parseFloat(formData.amount) < parseFloat(formData.expectedAmount);
  
  const isOverpayment = formData.amount && formData.expectedAmount && 
    parseFloat(formData.amount) > parseFloat(formData.expectedAmount);

  return (
    <div className={styles.formContainer}>
      <h3>{BUDGET_LABELS.ADD_CONTRIBUTION}</h3>
      
      {error && <ErrorMessage message={error} />}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="contributorSelect">{BUDGET_LABELS.CONTRIBUTOR_LABEL}</label>
          {loadingStudents ? (
            <div className={styles.loading}>Loading enrolled students...</div>
          ) : (
            <select
              id="contributorSelect"
              value={formData.contributorId}
              onChange={handleStudentSelect}
              required
              className={styles.input}
            >
              <option value="">Select a student...</option>
              {enrolledStudents.map(student => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName} ({student.email})
                </option>
              ))}
            </select>
          )}
        </div>

        {formData.contributorName && (
          <div className={styles.formGroup}>
            <label>Selected Contributor:</label>
            <div className={styles.selectedContributor}>
              <strong>{formData.contributorName}</strong>
              <small>ID: {formData.contributorId}</small>
            </div>
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="expectedAmount">{BUDGET_LABELS.EXPECTED_AMOUNT_LABEL}</label>
          <input
            type="number"
            id="expectedAmount"
            name="expectedAmount"
            value={formData.expectedAmount}
            onChange={handleInputChange}
            required
            min="0"
            step="0.01"
            className={styles.input}
            placeholder="70.00"
          />
          <small>This can be different from the standard $70 if needed</small>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="amount">{BUDGET_LABELS.AMOUNT_LABEL}</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            required
            min="0"
            step="0.01"
            className={styles.input}
            placeholder="70.00"
          />
          {isPartialPayment && (
            <small style={{ color: '#F59E0B' }}>
              Partial payment - ${(formData.expectedAmount - formData.amount).toFixed(2)} remaining
            </small>
          )}
          {isOverpayment && (
            <small style={{ color: '#EF4444' }}>
              Overpayment - ${(formData.amount - formData.expectedAmount).toFixed(2)} over expected amount
            </small>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="date">{BUDGET_LABELS.DATE_LABEL}</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">{BUDGET_LABELS.DESCRIPTION_LABEL}</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className={styles.input}
            rows="3"
            placeholder="Description will be auto-generated or you can customize it"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="notes">{BUDGET_LABELS.NOTES_LABEL}</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            className={styles.input}
            rows="2"
            placeholder="Additional notes (optional)"
          />
        </div>

        <div className={styles.buttonGroup}>
          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Adding...' : BUDGET_LABELS.CREATE}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContributionRevenueForm;