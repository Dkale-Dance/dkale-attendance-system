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
    this.maxFetchLimit = 1000; // Maximum number of documents to fetch in one query
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
   * Get all payments within a specified date range
   * @param {Date} startDate - Start date of the range (inclusive)
   * @param {Date} endDate - End date of the range (inclusive)
   * @returns {Promise<Array>} Array of payment objects in the date range
   */
  async getPaymentsByDateRange(startDate, endDate) {
    try {
      // Ensure dates are proper Date objects
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Set end date to end of day
      end.setHours(23, 59, 59, 999);
      
      const paymentsRef = collection(this.db, this.paymentsCollection);
      const q = query(
        paymentsRef,
        where("date", ">=", Timestamp.fromDate(start)),
        where("date", "<=", Timestamp.fromDate(end)),
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
      console.error("Error getting payments by date range:", error);
      throw new Error(`Failed to get payments by date range: ${error.message}`);
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
  
  /**
   * Get attendance records for a specific month filtered by fee type
   * @param {Date} monthDate - Any date within the month to get data for
   * @param {string} feeType - The type of fee to filter by ('late', 'noShoes', 'notInUniform', 'absent', 'all')
   * @returns {Promise<Array>} Array of attendance records with the specified fee type
   */
  async getAttendanceByMonthAndFeeType(monthDate, feeType = 'all') {
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
        const allData = doc.data();
        
        if (recordDate >= startOfMonth && recordDate <= endOfMonth) {
          // For each attendance day, filter students by fee type
          const studentRecords = {};
          
          for (const [studentId, record] of Object.entries(allData)) {
            // Filter by fee type
            if (feeType === 'all') {
              studentRecords[studentId] = record;
            } else if (feeType === 'absent' && record.status === 'absent') {
              studentRecords[studentId] = record;
            } else if (['late', 'noShoes', 'notInUniform'].includes(feeType) && 
                      record.attributes && record.attributes[feeType]) {
              studentRecords[studentId] = record;
            }
          }
          
          // Only add days with matching records
          if (Object.keys(studentRecords).length > 0) {
            monthlyAttendance.push({
              date: recordDate,
              id: doc.id,
              studentRecords
            });
          }
        }
      }
      
      // Sort by date
      return monthlyAttendance.sort((a, b) => a.date - b.date);
    } catch (error) {
      console.error(`Error getting attendance by month and fee type (${feeType}):`, error);
      throw new Error(`Failed to get attendance by month and fee type: ${error.message}`);
    }
  }
  
  /**
   * Get attendance data organized by month for visualization
   * @param {number} year - The year to get data for
   * @returns {Object} Object with attendance data organized by month
   */
  async getMonthlyAttendanceForVisualization(year) {
    try {
      const startOfYear = new Date(year, 0, 1); // January 1
      const endOfYear = new Date(year, 11, 31, 23, 59, 59); // December 31
      
      // Get all attendance records for the year
      const attendanceRef = collection(this.db, this.attendanceCollection);
      const querySnapshot = await getDocs(attendanceRef);
      
      // Create object to store attendance by month
      const attendanceByMonth = {};
      
      // Initialize array for each month (0-11)
      for (let i = 0; i < 12; i++) {
        attendanceByMonth[i] = [];
      }
      
      // Filter and organize records by month
      for (const doc of querySnapshot.docs) {
        const dateStr = doc.id; // Format should be YYYY-MM-DD
        const recordDate = new Date(dateStr);
        
        if (recordDate >= startOfYear && recordDate <= endOfYear) {
          const month = recordDate.getMonth();
          
          attendanceByMonth[month].push({
            date: recordDate,
            id: doc.id,
            records: doc.data()
          });
        }
      }
      
      // Sort each month's records by date
      for (let month = 0; month < 12; month++) {
        attendanceByMonth[month].sort((a, b) => a.date - b.date);
      }
      
      return attendanceByMonth;
    } catch (error) {
      console.error(`Error getting monthly attendance for visualization (${year}):`, error);
      throw new Error(`Failed to get monthly attendance for visualization: ${error.message}`);
    }
  }
  
  /**
   * Get payments data organized by month for visualization
   * @param {number} year - The year to get data for
   * @returns {Object} Object with payment data organized by month
   */
  async getPaymentsByMonthForVisualization(year) {
    try {
      const startOfYear = new Date(year, 0, 1); // January 1
      const endOfYear = new Date(year, 11, 31, 23, 59, 59); // December 31
      
      // Get all payments for the year
      const paymentsRef = collection(this.db, this.paymentsCollection);
      const q = query(
        paymentsRef,
        where("date", ">=", Timestamp.fromDate(startOfYear)),
        where("date", "<=", Timestamp.fromDate(endOfYear))
      );
      
      const querySnapshot = await getDocs(q);
      
      // Create object to store payments by month
      const paymentsByMonth = {};
      
      // Initialize array for each month (0-11)
      for (let i = 0; i < 12; i++) {
        paymentsByMonth[i] = [];
      }
      
      // Organize payments by month
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        
        // Ensure date is a proper Date object
        let date = data.date;
        if (date && typeof date.toDate === 'function') {
          date = date.toDate();
        } else if (date) {
          date = new Date(date);
        }
        
        const month = date.getMonth();
        
        paymentsByMonth[month].push({
          ...data,
          id: doc.id,
          date: date
        });
      }
      
      return paymentsByMonth;
    } catch (error) {
      console.error(`Error getting payments by month for visualization (${year}):`, error);
      throw new Error(`Failed to get payments by month for visualization: ${error.message}`);
    }
  }
}

// Export a default instance
export const reportRepository = new ReportRepository();