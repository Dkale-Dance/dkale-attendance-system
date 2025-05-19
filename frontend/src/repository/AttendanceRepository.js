import { getFirestore, doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import app from "../lib/firebase/config/config";
import { formatDateForDocId } from "../utils/DateUtils";

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
   * Removes a fee record (attendance record) for a specific student and date
   * Used by the PublicDashboard to allow admins to delete fee entries
   * @param {Date} date - The date of the fee/attendance record to remove
   * @param {string} studentId - The student's ID
   * @returns {Promise<Object|null>} The removed record or null if not found
   */
  async removeFeeRecord(date, studentId) {
    try {
      // This is the same as removeAttendance but with a different name
      // to clarify its purpose in the fee-related context
      return this.removeAttendance(date, studentId);
    } catch (error) {
      console.error("Error removing fee record:", error);
      throw new Error(`Failed to remove fee record: ${error.message}`);
    }
  }

  /**
   * Fetches attendance records for a specific date
   * @param {Date} date - The date to get attendance for
   * @returns {Promise<Object>} Attendance data keyed by student ID
   */
  async getAttendanceByDate(date) {
    try {
      const dateStr = formatDateForDocId(date);
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
   * Gets a single attendance record for a specific student and date
   * @param {Date} date - The date of attendance
   * @param {string} studentId - The student's ID
   * @returns {Promise<Object|null>} Attendance record or null if not found
   */
  async getAttendanceRecord(date, studentId) {
    try {
      const attendanceData = await this.getAttendanceByDate(date);
      // Ensure we always return the complete record structure even if some properties are missing
      const record = attendanceData[studentId] || null;
      
      // If record exists but doesn't have attributes, add an empty attributes object
      if (record && !record.attributes) {
        record.attributes = {};
      }
      
      return record;
    } catch (error) {
      console.error("Error fetching attendance record:", error);
      throw new Error(`Failed to fetch attendance record: ${error.message}`);
    }
  }

  /**
   * Updates attendance for a specific student on a given date
   * @param {Date} date - The date of attendance
   * @param {string} studentId - The student's ID
   * @param {string} status - Attendance status ('present', 'absent', 'late', 'medicalAbsence', 'holiday')
   * @returns {Promise<void>}
   */
  async updateAttendance(date, studentId, status) {
    try {
      const dateStr = formatDateForDocId(date);
      const attendanceRef = doc(this.db, this.collectionName, dateStr);
      
      // Create update data with the current timestamp
      const updateData = {
        [studentId]: {
          status,
          timestamp: Timestamp.fromDate(new Date()),
          attributes: {} // Default empty attributes
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
   * @param {string} status - Attendance status ('present', 'absent', 'late', 'medicalAbsence', 'holiday')
   * @returns {Promise<void>}
   */
  async bulkUpdateAttendance(date, studentIds, status) {
    try {
      const dateStr = formatDateForDocId(date);
      const attendanceRef = doc(this.db, this.collectionName, dateStr);
      
      // Create update data for all students
      const now = new Date();
      const updateData = studentIds.reduce((acc, studentId) => {
        acc[studentId] = {
          status,
          timestamp: Timestamp.fromDate(now),
          attributes: {} // Default empty attributes
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
  
  /**
   * Updates attendance with specific attributes for a student
   * @param {Date} date - The date of attendance
   * @param {string} studentId - The student's ID
   * @param {string} status - Attendance status ('present', 'absent', 'late', 'medicalAbsence', 'holiday')
   * @param {Object} attributes - Attributes like { noShoes: true, notInUniform: true }
   * @returns {Promise<void>}
   */
  async updateAttendanceWithAttributes(date, studentId, status, attributes) {
    try {
      const dateStr = formatDateForDocId(date);
      const attendanceRef = doc(this.db, this.collectionName, dateStr);
      
      // Create update data with attributes
      const updateData = {
        [studentId]: {
          status,
          timestamp: Timestamp.fromDate(new Date()),
          attributes
        }
      };
      
      // Use setDoc with merge option
      await setDoc(attendanceRef, updateData, { merge: true });
    } catch (error) {
      console.error("Error updating attendance with attributes:", error);
      throw new Error(`Failed to update attendance with attributes: ${error.message}`);
    }
  }
  
  /**
   * Updates attendance with attributes for multiple students
   * @param {Date} date - The date of attendance
   * @param {string[]} studentIds - Array of student IDs
   * @param {string} status - Attendance status ('present', 'absent', 'late', 'medicalAbsence', 'holiday')
   * @param {Object} attributes - Attributes like { noShoes: true, notInUniform: true }
   * @returns {Promise<void>}
   */
  async bulkUpdateAttendanceWithAttributes(date, studentIds, status, attributes) {
    try {
      const dateStr = formatDateForDocId(date);
      const attendanceRef = doc(this.db, this.collectionName, dateStr);
      
      // Create update data for all students with attributes
      const now = new Date();
      const updateData = studentIds.reduce((acc, studentId) => {
        acc[studentId] = {
          status,
          timestamp: Timestamp.fromDate(now),
          attributes
        };
        return acc;
      }, {});
      
      // Use setDoc with merge option
      await setDoc(attendanceRef, updateData, { merge: true });
    } catch (error) {
      console.error("Error bulk updating attendance with attributes:", error);
      throw new Error(`Failed to bulk update attendance with attributes: ${error.message}`);
    }
  }

  /**
   * Removes attendance record for a specific student on a given date
   * @param {Date} date - The date of attendance
   * @param {string} studentId - The student's ID
   * @returns {Promise<void>}
   */
  async removeAttendance(date, studentId) {
    try {
      const dateStr = formatDateForDocId(date);
      const attendanceRef = doc(this.db, this.collectionName, dateStr);
      
      // Get the current attendance data
      const docSnap = await getDoc(attendanceRef);
      
      if (!docSnap.exists()) {
        // No attendance record exists for this date
        return;
      }
      
      const attendanceData = docSnap.data();
      
      // Check if the student has an attendance record for this date
      if (!attendanceData[studentId]) {
        // No attendance record for this student on this date
        return;
      }
      
      // Create an updated object without the student's record
      const { [studentId]: removedRecord, ...updatedAttendance } = attendanceData;
      
      // Update the document to remove the student's record
      await setDoc(attendanceRef, updatedAttendance);
      
      return removedRecord; // Return the removed record for reference
    } catch (error) {
      console.error("Error removing attendance:", error);
      throw new Error(`Failed to remove attendance: ${error.message}`);
    }
  }
}

// Export a default instance
export const attendanceRepository = new AttendanceRepository();