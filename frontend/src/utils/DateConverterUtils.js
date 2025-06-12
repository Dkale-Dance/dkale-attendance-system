import { Timestamp } from "firebase/firestore";

/**
 * Utility class for date conversion operations
 */
export class DateConverterUtils {
  /**
   * Converts various date formats to JavaScript Date object
   * @param {Date|Timestamp|string|number} date - Date to convert
   * @returns {Date} JavaScript Date object
   */
  static convertToDate(date) {
    if (!date) {
      return null;
    }
    
    if (date && typeof date.toDate === 'function') {
      return date.toDate();
    }
    
    if (date instanceof Date) {
      return date;
    }
    
    return new Date(date);
  }

  /**
   * Converts various date formats to Firestore Timestamp
   * @param {Date|Timestamp|string|number} date - Date to convert
   * @returns {Timestamp} Firestore Timestamp
   */
  static convertToTimestamp(date) {
    if (!date) {
      return null;
    }
    
    // Check if it's already a Timestamp (has toDate method)
    if (date && typeof date.toDate === 'function') {
      return date;
    }
    
    if (date instanceof Date) {
      return Timestamp.fromDate(date);
    }
    
    return Timestamp.fromDate(new Date(date));
  }
}