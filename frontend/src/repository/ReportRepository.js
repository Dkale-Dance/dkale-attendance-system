import { getFirestore, collection, query, where, getDocs, Timestamp, orderBy } from "firebase/firestore";
import app from "../lib/firebase/config/config";

export class ReportRepository {
  constructor() {
    try {
      this.db = getFirestore(app);
    } catch (error) {
      console.error("Error initializing Firestore:", error);
      // For tests, provide a mock db
      this.db = {};
    }
    this.paymentsCollection = "payments";
    this.attendanceCollection = "attendance";
    this.usersCollection = "users";
  }

  /**
   * Get all students with their payment and balance information
   * @returns {Promise<Array>} Array of student objects with financial data
   */
  async getAllStudentsFinancialData() {
    try {
      // Query all students
      const usersRef = collection(this.db, this.usersCollection);
      const studentsQuery = query(usersRef, where("role", "==", "student"));
      const studentSnapshot = await getDocs(studentsQuery);
      
      const students = studentSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      
      return students;
    } catch (error) {
      console.error("Error getting students financial data:", error);
      throw new Error(`Failed to get students financial data: ${error.message}`);
    }
  }

  /**
   * Get all payments for a specific month
   * @param {Date} monthDate - Any date within the month to get data for
   * @returns {Promise<Array>} Array of payment objects in the month
   */
  async getMonthlyPayments(monthDate) {
    try {
      const date = new Date(monthDate);
      // First day of the month
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      // First day of the next month
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      
      const paymentsRef = collection(this.db, this.paymentsCollection);
      const q = query(
        paymentsRef,
        where("date", ">=", Timestamp.fromDate(startDate)),
        where("date", "<=", Timestamp.fromDate(endDate)),
        orderBy("date", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Ensure date is a proper Date object
        let date = data.date;
        if (date && typeof date.toDate === 'function') {
          date = date.toDate();
        } else if (date) {
          date = new Date(date);
        }
        
        return {
          ...data,
          id: doc.id,
          date: date
        };
      });
    } catch (error) {
      console.error("Error getting monthly payments:", error);
      throw new Error(`Failed to get monthly payments: ${error.message}`);
    }
  }

  /**
   * Get all fees charged for a specific month
   * @param {Date} monthDate - Any date within the month to get data for
   * @returns {Promise<Array>} Array of attendance objects with fee data in the month
   */
  async getMonthlyFeesCharged(monthDate) {
    try {
      const date = new Date(monthDate);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      // Get all attendance records for the month
      const attendanceRef = collection(this.db, this.attendanceCollection);
      const querySnapshot = await getDocs(attendanceRef);
      
      // Filter records that fall within the month
      const monthlyAttendance = [];
      
      for (const doc of querySnapshot.docs) {
        const dateStr = doc.id; // Format should be YYYY-MM-DD
        const recordDate = new Date(dateStr);
        
        if (recordDate >= startOfMonth && recordDate <= endOfMonth) {
          monthlyAttendance.push({
            date: recordDate,
            data: doc.data()
          });
        }
      }
      
      return monthlyAttendance;
    } catch (error) {
      console.error("Error getting monthly fees charged:", error);
      throw new Error(`Failed to get monthly fees charged: ${error.message}`);
    }
  }

  /**
   * Get attendance data for a specific month
   * @param {Date} monthDate - Any date within the month to get data for
   * @returns {Promise<Array>} Array of attendance objects in the month
   */
  async getMonthlyAttendance(monthDate) {
    try {
      const date = new Date(monthDate);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      // Get all attendance records for the month
      const attendanceRef = collection(this.db, this.attendanceCollection);
      const querySnapshot = await getDocs(attendanceRef);
      
      // Filter records that fall within the month
      const monthlyAttendance = [];
      
      for (const doc of querySnapshot.docs) {
        const dateStr = doc.id; // Format should be YYYY-MM-DD
        const recordDate = new Date(dateStr);
        
        if (recordDate >= startOfMonth && recordDate <= endOfMonth) {
          monthlyAttendance.push({
            date: recordDate,
            id: doc.id,
            records: doc.data()
          });
        }
      }
      
      return monthlyAttendance;
    } catch (error) {
      console.error("Error getting monthly attendance:", error);
      throw new Error(`Failed to get monthly attendance: ${error.message}`);
    }
  }

  /**
   * Get all payments made by a specific student
   * @param {string} studentId - The student's ID 
   * @returns {Promise<Array>} Array of payment objects for the student
   */
  async getStudentPaymentHistory(studentId) {
    try {
      const paymentsRef = collection(this.db, this.paymentsCollection);
      const q = query(
        paymentsRef,
        where("studentId", "==", studentId),
        orderBy("date", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Ensure date is a proper Date object
        let date = data.date;
        if (date && typeof date.toDate === 'function') {
          date = date.toDate();
        } else if (date) {
          date = new Date(date);
        }
        
        return {
          ...data,
          id: doc.id,
          date: date
        };
      });
    } catch (error) {
      console.error("Error getting student payment history:", error);
      throw new Error(`Failed to get student payment history: ${error.message}`);
    }
  }

  /**
   * Get all attendance records for a specific student
   * @param {string} studentId - The student's ID
   * @returns {Promise<Array>} Array of attendance records for the student
   */
  async getStudentAttendanceHistory(studentId) {
    try {
      const attendanceRef = collection(this.db, this.attendanceCollection);
      const querySnapshot = await getDocs(attendanceRef);
      
      // Filter records containing the student's ID
      const attendanceHistory = [];
      
      for (const doc of querySnapshot.docs) {
        const dateStr = doc.id; // Format should be YYYY-MM-DD
        const data = doc.data();
        
        // Check if this date's attendance contains data for our student
        if (data && data[studentId]) {
          attendanceHistory.push({
            date: new Date(dateStr),
            id: doc.id,
            record: data[studentId]
          });
        }
      }
      
      // Sort by date, most recent first
      return attendanceHistory.sort((a, b) => b.date - a.date);
    } catch (error) {
      console.error("Error getting student attendance history:", error);
      throw new Error(`Failed to get student attendance history: ${error.message}`);
    }
  }
}

// Export a default instance
export const reportRepository = new ReportRepository();