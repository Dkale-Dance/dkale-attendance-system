import React, { useState, useRef, useEffect } from 'react';
import styles from './StudentForm.module.css';

/**
 * An accessible form for managing student information
 * Implements WCAG 2.1 AA compliance with proper ARIA attributes, focus management,
 * keyboard navigation, and error handling.
 */
const AccessibleStudentForm = ({ student = {}, onSubmit, onCancel, buttonText = 'Save' }) => {
  // Form state that will be updated as the user types
  const [formData, setFormData] = useState({
    firstName: student.firstName || '',
    lastName: student.lastName || '',
    email: student.email || '',
    phoneNumber: student.phoneNumber || '',
    enrollmentStatus: student.enrollmentStatus || 'Pending Payment',
    emergencyContact: {
      name: student.emergencyContact?.name || '',
      relation: student.emergencyContact?.relation || '',
      phone: student.emergencyContact?.phone || '',
    }
  });
  
  // For tracking validation errors
  const [errors, setErrors] = useState({});
  
  // Status message for screen readers
  const [statusMessage, setStatusMessage] = useState('');

  // Refs for focus management
  const firstNameRef = useRef(null);
  const formRef = useRef(null);
  
  // Focus the first input when the form loads
  useEffect(() => {
    // Short timeout to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      if (firstNameRef.current) {
        firstNameRef.current.focus();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handler for form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested emergencyContact fields
    if (name.startsWith('emergency')) {
      const emergencyField = name.split('_')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [emergencyField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field when user edits it
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Validate the form data
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Phone number format validation
    if (formData.phoneNumber && !/^\d{3}-\d{3}-\d{4}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please use format: 555-123-4567';
    }
    
    // Set errors and return validity status
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handler for form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Process form data to match expected format
      const studentData = {
        ...formData,
        id: student.id || null
      };
      
      // Call the submit handler from props
      onSubmit(studentData);
      
      // Set a status message for screen readers
      setStatusMessage('Student information saved successfully');
      
      // Clear the message after it's been announced
      setTimeout(() => {
        setStatusMessage('');
      }, 5000);
    } else {
      // Focus the first field with an error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField && formRef.current) {
        const errorElement = formRef.current.querySelector(`#${firstErrorField}`);
        if (errorElement) {
          errorElement.focus();
        }
      }
      
      // Set an error status for screen readers
      setStatusMessage('There were errors in the form. Please correct them and try again.');
    }
  };
  
  // Generate a unique error ID for associating inputs with error messages
  const getErrorId = (fieldName) => `${fieldName}-error`;
  
  // Get aria-describedby attribute, combining any format hints and error messages
  const getDescribedBy = (fieldName, formatId = null) => {
    const ids = [];
    
    if (formatId) {
      ids.push(formatId);
    }
    
    if (errors[fieldName]) {
      ids.push(getErrorId(fieldName));
    }
    
    return ids.length > 0 ? ids.join(' ') : undefined;
  };
  
  return (
    <div className={styles.formContainer}>
      <h2 id="form-title">Student Information</h2>
      
      {/* Status region for screen reader announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        className={styles.srOnly}
      >
        {statusMessage}
      </div>
      
      <form 
        ref={formRef}
        onSubmit={handleSubmit} 
        className={styles.studentForm}
        aria-labelledby="form-title"
        noValidate
      >
        <div className={styles.formGroup}>
          <label htmlFor="firstName">
            First Name <span className={styles.requiredIndicator}>*</span>
          </label>
          <input
            id="firstName"
            ref={firstNameRef}
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleChange}
            aria-required="true"
            aria-invalid={errors.firstName ? 'true' : 'false'}
            aria-describedby={getDescribedBy('firstName')}
          />
          {errors.firstName && (
            <div 
              id={getErrorId('firstName')} 
              className={styles.errorMessage}
              role="alert"
            >
              {errors.firstName}
            </div>
          )}
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="lastName">
            Last Name <span className={styles.requiredIndicator}>*</span>
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleChange}
            aria-required="true"
            aria-invalid={errors.lastName ? 'true' : 'false'}
            aria-describedby={getDescribedBy('lastName')}
          />
          {errors.lastName && (
            <div 
              id={getErrorId('lastName')} 
              className={styles.errorMessage}
              role="alert"
            >
              {errors.lastName}
            </div>
          )}
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="email">
            Email <span className={styles.requiredIndicator}>*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            aria-required="true"
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={getDescribedBy('email')}
          />
          {errors.email && (
            <div 
              id={getErrorId('email')} 
              className={styles.errorMessage}
              role="alert"
            >
              {errors.email}
            </div>
          )}
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="phoneNumber">Phone Number</label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={handleChange}
            aria-invalid={errors.phoneNumber ? 'true' : 'false'}
            aria-describedby={getDescribedBy('phoneNumber', 'phone-format')}
          />
          <div id="phone-format" className={styles.formatHint}>
            Format: 555-123-4567
          </div>
          {errors.phoneNumber && (
            <div 
              id={getErrorId('phoneNumber')} 
              className={styles.errorMessage}
              role="alert"
            >
              {errors.phoneNumber}
            </div>
          )}
        </div>
        
        <fieldset className={styles.fieldset} aria-describedby="emergency-contact-description">
          <legend>Emergency Contact</legend>
          <div id="emergency-contact-description" className={styles.srOnly}>
            Please provide emergency contact information
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="emergency_name">Name</label>
            <input
              id="emergency_name"
              name="emergency_name"
              type="text"
              value={formData.emergencyContact.name}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="emergency_relation">Relationship</label>
            <input
              id="emergency_relation"
              name="emergency_relation"
              type="text"
              value={formData.emergencyContact.relation}
              onChange={handleChange}
              placeholder="Parent, Guardian, etc."
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="emergency_phone">Phone</label>
            <input
              id="emergency_phone"
              name="emergency_phone"
              type="tel"
              value={formData.emergencyContact.phone}
              onChange={handleChange}
            />
          </div>
        </fieldset>
        
        <div className={styles.formGroup}>
          <label htmlFor="enrollmentStatus">Enrollment Status</label>
          <select
            id="enrollmentStatus"
            name="enrollmentStatus"
            value={formData.enrollmentStatus}
            onChange={handleChange}
          >
            <option value="Pending Payment">Pending Payment</option>
            <option value="Enrolled">Enrolled</option>
            <option value="Inactive">Inactive</option>
            <option value="Removed">Removed</option>
          </select>
        </div>
        
        <div className={styles.formActions}>
          <button 
            type="button" 
            onClick={onCancel}
            className={styles.secondaryButton}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className={styles.primaryButton}
          >
            {buttonText}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccessibleStudentForm;