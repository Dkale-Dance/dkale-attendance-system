import React, { useMemo, useCallback, memo } from 'react';
import styles from './StudentList.module.css';

/**
 * Optimized individual student row component
 * Memoized to prevent unnecessary re-renders when other rows change
 */
const StudentRow = memo(({ student, onClick }) => {
  // Format the balance as currency
  const formattedBalance = useMemo(() => {
    return `$${student.balance?.toFixed(2) || '0.00'}`;
  }, [student.balance]);
  
  // Status badge styling based on enrollment status
  const statusClass = useMemo(() => {
    switch (student.enrollmentStatus) {
      case 'Enrolled':
        return `${styles.statusBadge} ${styles.statusEnrolled}`;
      case 'Inactive':
        return `${styles.statusBadge} ${styles.statusInactive}`;
      case 'Pending Payment':
        return `${styles.statusBadge} ${styles.statusPending}`;
      case 'Removed':
        return `${styles.statusBadge} ${styles.statusRemoved}`;
      default:
        return styles.statusBadge;
    }
  }, [student.enrollmentStatus]);
  
  // Handler for row click
  const handleClick = useCallback(() => {
    onClick(student);
  }, [onClick, student]);
  
  return (
    <tr 
      className={styles.studentRow} 
      onClick={handleClick}
      data-testid={`student-row-${student.id}`}
    >
      <td className={styles.nameCell}>
        {student.firstName} {student.lastName}
      </td>
      <td>
        <span className={statusClass}>
          {student.enrollmentStatus}
        </span>
      </td>
      <td className={styles.balanceCell}>
        {formattedBalance}
      </td>
    </tr>
  );
});

// Set display name for debugging
StudentRow.displayName = 'StudentRow';

/**
 * Pagination control component
 * Memoized to prevent re-renders when student data changes
 */
const PaginationControls = memo(({ currentPage, totalPages, onPageChange }) => {
  // Memoize pagination text
  const paginationText = useMemo(() => {
    return `Page ${currentPage} of ${totalPages}`;
  }, [currentPage, totalPages]);
  
  // Memoize handlers to prevent recreation on each render
  const handlePrevious = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);
  
  const handleNext = useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, onPageChange]);
  
  return (
    <div className={styles.pagination}>
      <button
        className={styles.paginationButton}
        onClick={handlePrevious}
        disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        Previous
      </button>
      <span className={styles.paginationText} aria-live="polite">
        {paginationText}
      </span>
      <button
        className={styles.paginationButton}
        onClick={handleNext}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
});

// Set display name for debugging
PaginationControls.displayName = 'PaginationControls';

/**
 * Main OptimizedStudentList component
 * Implements performance optimizations using React hooks
 */
const OptimizedStudentList = ({ 
  students, 
  currentPage, 
  totalPages, 
  onStudentClick, 
  onPageChange 
}) => {
  // Memoize the student click handler to prevent recreation on each render
  const handleStudentClick = useCallback((student) => {
    onStudentClick(student);
  }, [onStudentClick]);
  
  // Memoize the student rows to avoid recreating them on every render
  const studentRows = useMemo(() => {
    return students.map(student => (
      <StudentRow
        key={student.id}
        student={student}
        onClick={handleStudentClick}
      />
    ));
  }, [students, handleStudentClick]);
  
  // Empty state message when no students are available
  const emptyState = useMemo(() => {
    return (
      <tr>
        <td colSpan="3" className={styles.emptyState}>
          No students found.
        </td>
      </tr>
    );
  }, []);
  
  return (
    <div className={styles.studentListContainer}>
      <table className={styles.studentTable}>
        <thead>
          <tr>
            <th className={styles.nameHeader}>Name</th>
            <th className={styles.statusHeader}>Status</th>
            <th className={styles.balanceHeader}>Balance</th>
          </tr>
        </thead>
        <tbody>
          {students.length > 0 ? studentRows : emptyState}
        </tbody>
      </table>
      
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

// Export memoized version of the component to prevent unnecessary rerenders
export default memo(OptimizedStudentList);