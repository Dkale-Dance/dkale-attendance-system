/**
 * Utility functions for date handling throughout the application
 * 
 * Handles date formatting and ensures consistent display of dates across components
 * while accounting for timezone differences between Firestore (UTC-5) and local time.
 */

/**
 * Formats a date as YYYY-MM-DD for use as a document ID in Firestore
 * Ensures consistent date representation across timezones by using local date components
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDateForDocId = (date) => {
  if (!date) return null;
  
  let dateObj;
  
  // Special handling for YYYY-MM-DD strings to avoid timezone issues
  if (typeof date === 'string' && date.includes('-')) {
    const [year, month, day] = date.split('-').map(Number);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      dateObj = new Date(year, month - 1, day, 12, 0, 0); // Set to noon to avoid day shifts
    } else {
      dateObj = new Date(date);
    }
  } else {
    dateObj = new Date(date);
  }
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Formats a date as YYYY-MM-DD for use in date input elements
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string for input elements
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  
  return formatDateForDocId(date);
};

/**
 * Formats a date for display in the UI using locale-specific formatting
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string for display
 */
export const formatDateForDisplay = (date) => {
  if (!date) return 'N/A';
  
  let dateObj;
  
  if (typeof date === 'string' && date.includes('-')) {
    // If it's a YYYY-MM-DD format string, parse it directly to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    dateObj = new Date(year, month - 1, day, 12, 0, 0); // Set to noon to avoid any day shifts
  } else {
    // Otherwise create a date object
    dateObj = new Date(date);
  }
  
  // Use toLocaleDateString for consistent display
  return dateObj.toLocaleDateString();
};

/**
 * Converts a Firestore Timestamp to a JavaScript Date object
 * Firestore stores timestamps in UTC-5, this function ensures proper conversion
 * @param {Object} timestamp - Firestore Timestamp object
 * @returns {Date} JavaScript Date object
 */
export const timestampToDate = (timestamp) => {
  if (!timestamp || typeof timestamp.toDate !== 'function') return null;
  
  try {
    // Convert Firestore timestamp to JavaScript Date
    return timestamp.toDate();
  } catch (error) {
    console.error("Error converting timestamp to date:", error);
    return null;
  }
};

/**
 * Creates a date object from year, month, and day
 * Used to create consistent dates regardless of timezone
 * @param {number} year - The year
 * @param {number} month - The month (1-12)
 * @param {number} day - The day of the month
 * @returns {Date} A new date object
 */
export const createDateFromComponents = (year, month, day) => {
  // Month in Date constructor is 0-indexed, so subtract 1
  return new Date(year, month - 1, day);
};

/**
 * Parses a date string in YYYY-MM-DD format
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Date} The parsed date object
 */
export const parseDateString = (dateStr) => {
  if (!dateStr) return null;
  
  try {
    // Check if it's in YYYY-MM-DD format
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return createDateFromComponents(year, month, day);
    } 
    // Try to parse any date string format
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch (error) {
    console.error("Error parsing date string:", error);
    return null;
  }
};

/**
 * Normalizes a date for comparison, ensuring consistent handling regardless of input format
 * @param {Date|string} date - Date to normalize
 * @returns {Date|null} Normalized date object or null if invalid
 */
const normalizeDate = (date) => {
  if (!date) return null;
  
  try {
    let normalizedDate;
    
    // If it's already a Date object
    if (date instanceof Date) {
      normalizedDate = date;
    } 
    // If it's a string in YYYY-MM-DD format
    else if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split('-').map(Number);
      normalizedDate = new Date(year, month - 1, day); // Month is 0-indexed
    }
    // Any other format
    else {
      normalizedDate = new Date(date);
    }
    
    // Check if date is valid
    if (isNaN(normalizedDate.getTime())) {
      return null;
    }
    
    return normalizedDate;
  } catch (error) {
    console.error("Error normalizing date:", error);
    return null;
  }
};

/**
 * Compares two dates for equality (ignoring time)
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} True if dates represent the same day
 */
export const areDatesEqual = (date1, date2) => {
  const d1 = normalizeDate(date1);
  const d2 = normalizeDate(date2);
  
  if (!d1 || !d2) return false;
  
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * Gets today's date with time set to midnight
 * @returns {Date} Today's date at midnight
 */
export const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Safely adds the specified number of days to a date
 * @param {Date|string} date - The starting date
 * @param {number} days - Number of days to add (can be negative)
 * @returns {Date} A new date with the days added
 */
export const addDays = (date, days) => {
  if (!date) return null;
  
  // Normalize the input date
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) return null;
  
  // Create a new date object to avoid modifying the original
  const result = new Date(normalizedDate);
  
  // Add the specified number of days
  result.setDate(result.getDate() + days);
  
  return result;
};

/**
 * Safely adds the specified number of months to a date, handling month-end edge cases
 * @param {Date|string} date - The starting date
 * @param {number} months - Number of months to add (can be negative)
 * @returns {Date} A new date with the months added
 */
export const addMonths = (date, months) => {
  if (!date) return null;
  
  // Normalize the input date
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) return null;
  
  // Create a new date object to avoid modifying the original
  const result = new Date(normalizedDate);
  
  // Get the original day of the month before we make changes
  const originalDay = result.getDate();
  
  // Get the current month and year
  const currentMonth = result.getMonth();
  const currentYear = result.getFullYear();
  
  // Calculate the target month and year
  let targetMonth = currentMonth + months;
  let targetYear = currentYear;
  
  // Handle overflow and underflow of months
  if (targetMonth > 11) {
    targetYear += Math.floor(targetMonth / 12);
    targetMonth = targetMonth % 12;
  } else if (targetMonth < 0) {
    // For negative months, we need to adjust the year and month calculation
    const yearsToSubtract = Math.ceil(Math.abs(targetMonth) / 12);
    targetYear -= yearsToSubtract;
    targetMonth = 12 + (targetMonth % 12);
    // If targetMonth is 12 after calculation, set it to 0 (January)
    if (targetMonth === 12) targetMonth = 0;
  }
  
  // Set the new month and year first
  result.setFullYear(targetYear, targetMonth, 1);
  
  // Get the last day of the target month
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  
  // Set the day to either the original day or the last day of the month if the original day doesn't exist
  result.setDate(Math.min(originalDay, lastDay));
  
  return result;
};