// StudentFormView.js
import React, { useState } from 'react';
import StudentForm from './StudentForm';
import ErrorMessage from './ErrorMessage';
import { studentService } from '../services/StudentService';
import { authService } from '../services/AuthService';
import styles from './StudentFormView.module.css';

// This component is solely responsible for managing the add/edit student form
const StudentFormView = ({ selectedStudent, onSuccess, onCancel }) => {
  const [error, setError] = useState('');

  const handleSubmitForm = async (formData) => {
    try {
      if (selectedStudent) {
        // Update existing student
        await studentService.updateStudent(selectedStudent.id, formData);
      } else {
        // Create a new user with student role
        const { email, firstName, lastName } = formData;
        const password = "tempPassword123"; // In a real app, generate a random password or implement invitation flow
        
        // Register the student using the admin-safe method that won't affect current session
        const user = await authService.registerStudent(email, password);
        
        // Update the user profile with student details
        await studentService.initializeStudentProfile(user.uid, {
          firstName,
          lastName
        });
      }
      
      setError('');
      
      // Call the success callback (which should redirect back to list view)
      onSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles['form-view']} data-testid="student-form-view">
      <h2>{selectedStudent ? 'Edit Student' : 'Add New Student'}</h2>
      
      {error && <ErrorMessage message={error} />}
      
      <StudentForm 
        student={selectedStudent}
        onSubmit={handleSubmitForm} 
        buttonText={selectedStudent ? "Update Student" : "Add Student"}
        isAdminView={true}
      />
      
      <div className={styles.buttons}>
        <button 
          onClick={onCancel}
          data-testid="cancel-button"
          className={styles['cancel-button']}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default StudentFormView;