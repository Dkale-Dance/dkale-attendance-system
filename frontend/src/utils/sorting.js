/**
 * Utility functions for consistent sorting throughout the application
 */

/**
 * Sort students alphabetically by first name in a case-insensitive manner
 * @param {Array} students - Array of student objects with firstName and lastName properties
 * @returns {Array} - Sorted array of students
 */
export const sortStudentsByFirstName = (students) => {
  if (!students || !Array.isArray(students)) {
    return [];
  }
  
  return [...students].sort((a, b) => {
    // Handle missing first names gracefully
    const firstNameA = (a.firstName || '').toLowerCase();
    const firstNameB = (b.firstName || '').toLowerCase();
    
    return firstNameA.localeCompare(firstNameB);
  });
};

/**
 * Sort any array of objects with a name property (such as formatted names like "First Last")
 * @param {Array} items - Array of objects with a name property
 * @returns {Array} - Sorted array of items
 */
export const sortByName = (items) => {
  if (!items || !Array.isArray(items)) {
    return [];
  }
  
  return [...items].sort((a, b) => {
    // Handle missing names gracefully
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    
    return nameA.localeCompare(nameB);
  });
};