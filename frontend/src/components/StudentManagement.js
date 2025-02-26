// StudentManagement.js
import React, { useState } from 'react';
import StudentForm from './StudentForm';
import StudentList from './StudentList';
import { studentService } from '../services/StudentService';
import { authService } from '../services/AuthService';
import ErrorMessage from './ErrorMessage';
import styles from './StudentManagement.module.css';

const StudentManagement = ({ userRole }) => {
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Only admin can access student management
  if (userRole !== 'admin') {
    return (
      <div className={styles.unauthorized} data-testid="unauthorized-message">
        <p>You don't have permission to access student management.</p>
      </div>
    );
  }

  const handleUpdateStudent = async (formData) => {
    try {
      if (selectedStudent) {
        // Update existing student
        await studentService.updateStudent(selectedStudent.id, formData);
        setSelectedStudent(null);
        setIsEditing(false);
      } else {
        // Create a new user with student role
        const { email, firstName, lastName } = formData;
        const password = "tempPassword123"; // In a real app, generate a random password or implement invitation flow
        
        // Register the user with Firebase Auth
        const user = await authService.register(email, password);
        
        // Update the user profile with student details
        await studentService.initializeStudentProfile(user.uid, {
          firstName,
          lastName
        });
      }
      
      setError('');
      
      // Force refresh of the student list
      const event = new CustomEvent('refreshStudents');
      window.dispatchEvent(event);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setSelectedStudent(null);
    setIsEditing(false);
  };

  return (
    <div className={styles['student-management']} data-testid="student-management">
      <h1>Student Management</h1>
      
      {error && <ErrorMessage message={error} />}
      
      {isEditing ? (
        <div data-testid="edit-student-form">
          <h2>{selectedStudent ? 'Edit Student' : 'Add New Student'}</h2>
          <StudentForm 
            student={selectedStudent}
            onSubmit={handleUpdateStudent} 
            buttonText={selectedStudent ? "Update Student" : "Add Student"}
            isAdminView={true}
          />
          <button 
            onClick={handleCancelEdit}
            data-testid="cancel-button"
            className={styles['cancel-button']}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button 
          onClick={() => setIsEditing(true)}
          data-testid="add-student-button"
        >
          Add New Student
        </button>
      )}
      
      <StudentList onSelectStudent={handleSelectStudent} />
    </div>
  );
};

export default StudentManagement;