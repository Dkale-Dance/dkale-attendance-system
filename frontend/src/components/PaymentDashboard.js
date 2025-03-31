// PaymentDashboard.js
import React, { useState, useEffect } from 'react';
import PaymentForm from './PaymentForm';
import PaymentList from './PaymentList';
import ErrorMessage from './ErrorMessage';
import { useLocation } from 'react-router-dom';
import styles from './StudentManagement.module.css'; // Reusing the existing management styles

// Fallback for tests
const useLocationSafe = () => {
  try {
    return useLocation();
  } catch (e) {
    return { pathname: '/payments', search: '' };
  }
};

const PaymentDashboard = ({ userRole }) => {
  const [error] = useState('');
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' or 'form'
  const [refreshKey, setRefreshKey] = useState(0); // For forcing re-render of payment list
  const [pendingPayment, setPendingPayment] = useState(null);
  const location = useLocationSafe();

  // Check for URL params and pending payments when component mounts
  useEffect(() => {
    // Check URL parameters for action=pay
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'pay') {
      // Switch to payment form view
      setViewMode('form');
      
      // Check for pending payment data in sessionStorage
      const pendingPaymentData = sessionStorage.getItem('pendingPayment');
      if (pendingPaymentData) {
        try {
          const paymentData = JSON.parse(pendingPaymentData);
          setPendingPayment(paymentData);
          
          // Clear the pending payment from sessionStorage
          sessionStorage.removeItem('pendingPayment');
        } catch (err) {
          console.error('Error parsing pending payment data:', err);
        }
      }
    }
  }, [location]);

  const handlePaymentSuccess = () => {
    // Force refresh of the payment list after successful payment
    setRefreshKey(prevKey => prevKey + 1);
    
    // Clear any pending payment data
    setPendingPayment(null);
  };

  // Listen for custom event to refresh payments
  useEffect(() => {
    // Only set up the event listener if the user is an admin
    if (userRole === 'admin') {
      const handleRefreshPayments = () => {
        setRefreshKey(prevKey => prevKey + 1);
      };

      window.addEventListener('refreshPayments', handleRefreshPayments);
      
      return () => {
        window.removeEventListener('refreshPayments', handleRefreshPayments);
      };
    }
  }, [userRole]);

  // Only admin can access payment management
  if (userRole !== 'admin') {
    return (
      <div className={styles.unauthorized} data-testid="unauthorized-message">
        <p>You don't have permission to access payment management.</p>
      </div>
    );
  }

  return (
    <div className={styles['student-management']} data-testid="payment-dashboard">
      <h1>Payment Management</h1>
      
      {error && <ErrorMessage message={error} />}
      
      <div className={styles['view-controls']}>
        <button
          onClick={() => setViewMode('dashboard')}
          className={viewMode === 'dashboard' ? styles['active-button'] : ''}
          data-testid="view-dashboard-button"
        >
          Dashboard
        </button>
        <button
          onClick={() => setViewMode('form')}
          className={viewMode === 'form' ? styles['active-button'] : ''}
          data-testid="view-form-button"
        >
          Record Payment
        </button>
      </div>
      
      <div className={styles['content-container']}>
        {viewMode === 'form' ? (
          <PaymentForm 
            onSuccess={handlePaymentSuccess} 
            pendingPayment={pendingPayment}
          />
        ) : (
          <div key={refreshKey}>
            <PaymentList />
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentDashboard;