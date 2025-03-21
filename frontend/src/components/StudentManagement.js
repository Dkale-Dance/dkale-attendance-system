// StudentManagement.js
import React, { useState } from 'react';
import StudentList from './StudentList';
import StudentFormView from './StudentFormView';
import ErrorMessage from './ErrorMessage';
import styles from './StudentManagement.module.css';

const StudentManagement = ({ userRole }) => {
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'form'
  
  // Only admin can access student management
  if (userRole !== 'admin') {
    return (
      <div className={styles.unauthorized} data-testid="unauthorized-message">
        <p>You don't have permission to access student management.</p>
      </div>
    );
  }

  // Reset error when switching views
  const switchToListView = () => {
    setError('');
    setViewMode('list');
    setSelectedStudent(null);
  };

  const switchToFormView = (student = null) => {
    setError('');
    setViewMode('form');
    setSelectedStudent(student);
  };

  const handleFormSuccess = () => {
    // Form was successfully submitted, go back to list view
    switchToListView();
    
    // Force refresh of the student list
    const event = new CustomEvent('refreshStudents');
    window.dispatchEvent(event);
  };

  const handleSelectStudent = (student) => {
    switchToFormView(student);
  };

  return (
    <div className={styles['student-management']} data-testid="student-management">
      <h1>Student Management</h1>
      
      {error && <ErrorMessage message={error} />}
      
      {viewMode === 'form' ? (
        // Show the form view
        <StudentFormView 
          selectedStudent={selectedStudent}
          onSuccess={handleFormSuccess}
          onCancel={switchToListView}
        />
      ) : (
        // Show the list view
        <>
          <div className={styles['button-container']}>
            <button 
              onClick={() => switchToFormView()}
              data-testid="add-student-button"
              className={styles['add-button']}
            >
              Add New Student
            </button>
          </div>
          
          <StudentList onSelectStudent={handleSelectStudent} />
        </>
      )}
    </div>
  );
};

export default StudentManagement;