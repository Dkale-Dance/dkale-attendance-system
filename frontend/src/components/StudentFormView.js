// StudentFormView.js
import React, { useState } from 'react';
import StudentForm from './StudentForm';
import PaymentList from './PaymentList';
import ErrorMessage from './ErrorMessage';
import { studentService } from '../services/StudentService';
import { authService } from '../services/AuthService';
import { paymentService } from '../services/PaymentService';
import styles from './StudentFormView.module.css';

// This component is solely responsible for managing the add/edit student form
const StudentFormView = ({ selectedStudent, onSuccess, onCancel }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'payments'

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
      ) : (
        <>
          <PaymentList studentId={selectedStudent.id} />
          
          <div className={styles.buttons}>
            <button 
              onClick={() => setActiveTab('details')}
              className={styles['back-button']}
            >
              Back to Details
            </button>
          </div>
        </>
      )}
      
      {loading && <div className="loading">Processing...</div>}
    </div>
  );
};

export default StudentFormView;