/**
 * Shared formatting utilities to maintain consistency across the application
 */

/**
 * Formats a number as USD currency
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  // Handle invalid values
  if (amount == null || Number.isNaN(amount) || !Number.isFinite(amount)) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Formats a date in a user-friendly format
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check for invalid date
  if (Number.isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(dateObj);
};

/**
 * Formats a date with time
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check for invalid date
  if (Number.isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
};

/**
 * Formats a percentage value
 * @param {number} value - The decimal value to format as percentage
 * @param {number} digits - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, digits = 1) => {
  // Handle invalid values
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return 'N/A';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
};

/**
 * Formats a number with thousands separators
 * @param {number} value - The number to format
 * @param {number} digits - Number of decimal places (default: 0)
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, digits = 0) => {
  // Handle invalid values
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return 'N/A';
  }
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
};

/**
 * Truncates text to a specified length with ellipsis
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || typeof text !== 'string') return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Capitalizes the first letter of each word
 * @param {string} text - The text to capitalize
 * @returns {string} Capitalized text
 */
export const capitalizeWords = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text.replace(/\b\w/g, l => l.toUpperCase());
};