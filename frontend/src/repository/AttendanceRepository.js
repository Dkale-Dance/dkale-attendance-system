import { getFirestore, doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import app from "../lib/firebase/config/config";

export class AttendanceRepository {
  constructor() {
    try {
      this.db = getFirestore(app);
    } catch (error) {
      console.error("Error initializing Firestore:", error);
      // For tests, provide a mock db
      this.db = {};
    }
    this.collectionName = "attendance";
  }

  /**
   * Formats a date as YYYY-MM-DD for use as a document ID
   * @param {Date} date - The date to format
   * @returns {string} Formatted date string
   */
  formatDateForDocId(date) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Fetches attendance records for a specific date
   * @param {Date} date - The date to get attendance for
   * @returns {Promise<Object>} Attendance data keyed by student ID
   */
  async getAttendanceByDate(date) {
    try {
      const dateStr = this.formatDateForDocId(date);
      const attendanceRef = doc(this.db, this.collectionName, dateStr);
      const docSnap = await getDoc(attendanceRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      
      return {};
    } catch (error) {
      console.error("Error fetching attendance:", error);
      throw new Error(`Failed to fetch attendance: ${error.message}`);
    }
  }

  /**
   * Updates attendance for a specific student on a given date
   * @param {Date} date - The date of attendance
   * @param {string} studentId - The student's ID
   * @param {string} status - Attendance status ('present', 'absent', 'late', 'excused')
   * @returns {Promise<void>}
   */
  async updateAttendance(date, studentId, status) {
    try {
      const dateStr = this.formatDateForDocId(date);
      const attendanceRef = doc(this.db, this.collectionName, dateStr);
      
      // Create update data with the current timestamp
      const updateData = {
        [studentId]: {
          status,
          timestamp: Timestamp.fromDate(new Date())
        }
      };
      
      // Use setDoc with merge option to update without overwriting existing data
      await setDoc(attendanceRef, updateData, { merge: true });
    } catch (error) {
      console.error("Error updating attendance:", error);
      throw new Error(`Failed to update attendance: ${error.message}`);
    }
  }

  /**
   * Updates attendance for multiple students on a given date
   * @param {Date} date - The date of attendance
   * @param {string[]} studentIds - Array of student IDs
   * @param {string} status - Attendance status ('present', 'absent', 'late', 'excused')
   * @returns {Promise<void>}
   */
  async bulkUpdateAttendance(date, studentIds, status) {
    try {
      const dateStr = this.formatDateForDocId(date);
      const attendanceRef = doc(this.db, this.collectionName, dateStr);
      
      // Create update data for all students
      const now = new Date();
      const updateData = studentIds.reduce((acc, studentId) => {
        acc[studentId] = {
          status,
          timestamp: Timestamp.fromDate(now)
        };
        return acc;
      }, {});
      
      // Use setDoc with merge option to update without overwriting other students' data
      await setDoc(attendanceRef, updateData, { merge: true });
    } catch (error) {
      console.error("Error bulk updating attendance:", error);
      throw new Error(`Failed to bulk update attendance: ${error.message}`);
    }
  }
}

// Export a default instance
export const attendanceRepository = new AttendanceRepository();